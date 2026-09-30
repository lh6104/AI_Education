import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import { Paper, CircularProgress, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { Menu as MenuIcon, Close as CloseIcon } from "@mui/icons-material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import "../../styles/chatbot.css";

import ChatMessage from "../../components/chatbot/ChatMessage";
import ChatInput from "../../components/chatbot/ChatInput";
import GeminiChatInput from "../../components/chatbot/GeminiChatInput";
import ChatTypingIndicator from "../../components/chatbot/ChatTypingIndicator";
import ConversationSidebar from "../../components/chatbot/ConversationSidebar";
import useChatbot from "../../hooks/useChatbot";
import { getCurrentUser } from "../../api/authApi";

// Main Layout Components
const ChatbotLayout = styled.div`
  display: flex;
  height: calc(100vh - 104px);
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MobileMenuButton = styled(IconButton)`
  && {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 35;
    background: rgba(255, 255, 255, 0.95);
    color: #3b82f6;
    border: 1px solid rgba(15, 23, 42, 0.1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      color: #2563eb;
    }
    
    @media (min-width: 769px) {
      display: none;
    }
  }
`;

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 25;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const SidebarWrapper = styled.div`
  position: relative;
  z-index: 30;
  order: 2;
  
  @media (max-width: 768px) {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    z-index: 30;
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
  position: relative;
  order: 1;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
  color: #1f2937;
  
  @media (max-width: 768px) {
    padding-right: 64px;
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const IconWrapper = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #3b82f6;
`;

const MessagesContainer = styled.div`
  flex: 1;
  min-height: 0;
  padding: 24px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  overflow-anchor: none;
  contain: layout paint;
  max-width: 900px;
  margin: 0 auto;
  
  &.chat-scrollbar {
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
  }
`;

const EmptyStateContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #6b7280;
  text-align: center;
  padding: 40px 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const EmptyStateIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
`;

const EmptyTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 12px 0;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const EmptyDescription = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: #6b7280;
  margin: 0 0 32px 0;
`;

const SuggestionContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 500px;
`;

const Suggestion = styled.button`
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #f9fafb;
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const Chatbot = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { 
    messages, 
    sendMessage, 
    uploadDocument,
    switchConversation,
    startNewConversation,
    createAndSwitchConversation,
    conversationId,
    isLoading,
    isUploading 
  } = useChatbot(selectedConversationId);
  
  const messagesEndRef = useRef(null);

  // Fetch current user info
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (mounted && user?.full_name) {
          setUserName(user.full_name);
        }
      } catch (error) {
        console.error("Failed to get current user:", error);
        // Keep userName as null, will show default greeting
      }
    })();
    return () => (mounted = false);
  }, []);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync conversation ID with hook
  useEffect(() => {
    if (conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
    }
  }, [conversationId, selectedConversationId]);

  const handleSelectConversation = (convId) => {
    setSelectedConversationId(convId);
    switchConversation(convId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleNewConversation = (newConvId) => {
    setSelectedConversationId(newConvId);
    if (newConvId) {
      // Switch to existing conversation
      switchConversation(newConvId);
    } else {
      // Start completely new conversation
      startNewConversation();
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Suggested questions
  const suggestions = [
    "Giải thích khái niệm về mạng neural?",
    "Thuật toán tìm kiếm nhị phân hoạt động như thế nào?",
    "So sánh giữa Python và JavaScript?",
    "Hãy giúp tôi hiểu về machine learning?"
  ];

  return (
    <>
      <ChatbotLayout>
        {/* Mobile Menu Button */}
        {isMobile && (
          <MobileMenuButton onClick={() => setSidebarOpen(true)}>
            <MenuIcon />
          </MobileMenuButton>
        )}

        {/* Main Chat Area */}
        <ChatContainer>
          <Header>
            <HeaderTitle>
              <IconWrapper>
                <SmartToyIcon fontSize="small" />
              </IconWrapper>
              <Title>Trợ giảng AI</Title>
            </HeaderTitle>
          </Header>
          
          <MessagesContainer className="chat-scrollbar">
            {messages.length === 0 ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <SmartToyIcon style={{ fontSize: 40, color: "white" }} />
                </EmptyStateIcon>
                <EmptyTitle>
                  {userName 
                    ? `Xin chào ${userName}! Tôi là trợ giảng AI của bạn`
                    : "Xin chào! Tôi là trợ giảng AI của bạn"
                  }
                </EmptyTitle>
                <EmptyDescription>
                  Tôi sẵn sàng giúp bạn học tập và giải đáp thắc mắc về lập trình, machine learning, 
                  và nhiều chủ đề khác. Hãy bắt đầu bằng cách đặt câu hỏi hoặc chọn gợi ý bên dưới nhé!
                </EmptyDescription>
                
                <SuggestionContainer>
                  {suggestions.map((suggestion, index) => (
                    <Suggestion 
                      key={index} 
                      onClick={() => sendMessage(suggestion)}
                    >
                      {suggestion}
                    </Suggestion>
                  ))}
                </SuggestionContainer>
              </EmptyStateContainer>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    isUser={msg.sender === "user"} 
                    onFollowUpClick={(text) => sendMessage(text)}
                  />
                ))}
                {isLoading && <ChatTypingIndicator />}
                <div ref={messagesEndRef} />
              </>
            )}
          </MessagesContainer>
          
          <GeminiChatInput 
            onSendMessage={sendMessage} 
            onFileUpload={uploadDocument}
            isLoading={isLoading || isUploading}
          />
        </ChatContainer>

        {/* Sidebar */}
        <SidebarWrapper isOpen={sidebarOpen}>
          <ConversationSidebar
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
          />
        </SidebarWrapper>
      </ChatbotLayout>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <SidebarOverlay onClick={() => setSidebarOpen(false)} />
      )}
    </>
  );
};

export default Chatbot;