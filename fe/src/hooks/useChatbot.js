import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import chatbotApi from '../api/chatbotApi';
import filesApi from '../api/filesApi';

const useChatbot = (initialConversationId = null) => {
  const [messages, setMessages] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(initialConversationId);
  const [pendingRequestConversationId, setPendingRequestConversationId] = useState(null);
  const abortControllerRef = useRef(null);
  const queryClient = useQueryClient();

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, conversationId }) => filesApi.uploadFile(file, conversationId),
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  // Fetch conversation history if conversationId exists
  const { data: conversationData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['conversation', currentConversationId],
    queryFn: () => chatbotApi.getConversation(currentConversationId),
    enabled: !!currentConversationId,
    retry: false, // Don't retry on 404
    onError: (error) => {
      console.error('Error loading conversation:', error);
      if (error.response?.status === 404) {
        // Conversation doesn't exist anymore, reset to start fresh
        setCurrentConversationId(null);
        setMessages([]);
        console.log('Conversation not found, starting fresh');
      } else {
        toast.error('Không thể tải lịch sử cuộc hội thoại');
      }
    },
  });

  // Initialize a new conversation if needed
  const createConversationMutation = useMutation({
    mutationFn: chatbotApi.createConversation,
    onSuccess: (data) => {
      setCurrentConversationId(data.conversation_id);
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
      toast.error('Không thể tạo cuộc hội thoại mới');
    },
  });

  // Send message mutation with conversation isolation
  const sendMessageMutation = useMutation({
    mutationFn: (data) => {
      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      return chatbotApi.sendMessage({
        ...data,
        signal: abortController.signal
      });
    },
    onMutate: (variables) => {
      // Set pending request conversation ID
      setPendingRequestConversationId(variables.conversation_id || currentConversationId);
    },
    onSuccess: (data, variables) => {
      // Check if this response belongs to the current conversation
      const responseConversationId = data.conversation_id;
      const requestConversationId = variables.conversation_id || currentConversationId;
      
      // Only add message if response is for the currently active conversation
      if (responseConversationId === currentConversationId || 
          (!currentConversationId && requestConversationId === pendingRequestConversationId)) {
        
        // Update conversation ID if it's new
        if (!currentConversationId && data.conversation_id) {
          setCurrentConversationId(data.conversation_id);
        }

        const aiMessage = {
          id: Date.now().toString(),
          sender: 'ai',
          content: data.response,
          sources: data.sources || [],
          timestamp: data.timestamp || new Date().toISOString(),
        };
        
        setMessages((prev) => [...prev, aiMessage]);
      }
      
      // Clear pending request and abort controller
      setPendingRequestConversationId(null);
      abortControllerRef.current = null;
      
      // Always invalidate the conversation query for the response conversation
      if (data.conversation_id) {
        queryClient.invalidateQueries(['conversation', data.conversation_id]);
      }
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setPendingRequestConversationId(null);
      abortControllerRef.current = null;
      
      // Only show specific auth errors, not generic send message errors
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      // Removed the generic "Gửi tin nhắn thất bại" toast as requested
    },
  });

  // Update messages when conversation data changes
  useEffect(() => {
    if (conversationData && conversationData.messages) {
      // Convert backend message format to frontend format
      const formattedMessages = conversationData.messages.map(msg => ({
        id: msg.id || Date.now().toString(),
        sender: msg.role === 'user' ? 'user' : 'ai',
        content: msg.content,
        sources: msg.sources || [],
        timestamp: msg.timestamp
      }));
      setMessages(formattedMessages);
    }
  }, [conversationData]);

  // Send message handler
  const sendMessage = useCallback((content) => {
    if (!content.trim()) return;

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Send to API
    sendMessageMutation.mutate({
      message: content,
      conversation_id: currentConversationId,
      use_rag: true
    });
  }, [currentConversationId, sendMessageMutation]);

  // Upload document handler - integrated with backend RAG system
  const uploadDocument = useCallback(async (file) => {
    if (!file) return;
    
    try {
      // Create preview URL for images
      let previewUrl = null;
      if (file.type?.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }
      
      // Add user message with file attachment immediately
      const fileMessage = {
        id: Date.now().toString(),
        sender: 'user',
        content: '', // No text content, just file
        attachments: [{
          name: file.name,
          type: file.type,
          size: file.size,
          previewUrl: previewUrl
        }],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fileMessage]);
      
      // Show loading toast
      const loadingToastId = toast.loading(`Đang upload "${file.name}"...`);
      
      // Upload file using mutation
      const response = await uploadMutation.mutateAsync({ 
        file, 
        conversationId: currentConversationId 
      });
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      toast.success(`Tải lên "${file.name}" thành công!`);
      
      // Add system message to chat
      const systemMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        content: `📄 Đã lưu tài liệu "${file.name}" thành công. Bạn có thể đặt câu hỏi về nội dung tài liệu.`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, systemMessage]);
      
      return response;
    } catch (error) {
      // Handle upload error
      console.error('Upload error:', error);
      
      let errorMessage = 'Có lỗi xảy ra khi tải lên tài liệu';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Add error message to chat
      const errorSystemMessage = {
        id: Date.now().toString(),
        sender: 'system',
        content: `❌ Lỗi khi tải lên "${file.name}": ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, errorSystemMessage]);
      
      throw error;
    }
  }, [currentConversationId, uploadMutation]);

  // Switch to a different conversation
  const switchConversation = useCallback((conversationId) => {
    // Cancel any pending request if switching conversations
    if (sendMessageMutation.isPending && pendingRequestConversationId !== conversationId) {
      // Abort the HTTP request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      sendMessageMutation.reset();
      setPendingRequestConversationId(null);
    }
    
    setCurrentConversationId(conversationId);
    setMessages([]);
  }, [sendMessageMutation, pendingRequestConversationId]);

  // Start a new conversation
  const startNewConversation = useCallback(() => {
    // Cancel any pending request when starting new conversation
    if (sendMessageMutation.isPending) {
      // Abort the HTTP request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      sendMessageMutation.reset();
      setPendingRequestConversationId(null);
    }
    
    setCurrentConversationId(null);
    setMessages([]);
  }, [sendMessageMutation]);

  // Create and switch to new conversation
  const createAndSwitchConversation = useCallback(() => {
    createConversationMutation.mutate();
  }, [createConversationMutation]);

  // Calculate loading state - only show loading for current conversation
  const isLoadingForCurrentConversation = sendMessageMutation.isPending && 
    (pendingRequestConversationId === currentConversationId || 
     (!currentConversationId && pendingRequestConversationId === null));

  return {
    messages,
    sendMessage,
    uploadDocument,
    switchConversation,
    startNewConversation,
    createAndSwitchConversation,
    conversationId: currentConversationId,
    isLoading: isLoadingForCurrentConversation || isLoadingHistory,
    isUploading: uploadMutation.isPending,
  };
};

export default useChatbot;
