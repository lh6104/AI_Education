import React, { useState } from "react";
import styled from "styled-components";
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemButton,
  IconButton, 
  Typography, 
  Box,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Tooltip
} from "@mui/material";
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Chat as ChatIcon,
  Close as CloseIcon
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import chatbotApi from "../../api/chatbotApi";

const SidebarContainer = styled.div`
  width: 280px;
  min-width: 280px;
  height: 100%;
  background: #fff;
  border-left: 1px solid rgba(15, 23, 42, 0.1);
  display: flex;
  flex-direction: column;
  color: #1f2937;
  
  @media (max-width: 768px) {
    width: 260px;
    min-width: 260px;
  }
`;

const SidebarHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NewChatButton = styled(Button)`
  && {
    background: #3b82f6;
    color: white;
    text-transform: none;
    border-radius: 8px;
    padding: 8px 16px;
    width: 100%;
    justify-content: flex-start;
    gap: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: #9ca3af;
      color: #6b7280;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
`;

const ConversationsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }
`;

const ConversationItem = styled.div`
  position: relative;
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent'};
  border: ${props => props.isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'};
  
  &:hover {
    background: ${props => props.isActive ? 'rgba(59, 130, 246, 0.15)' : '#f8f9fa'};
    
    .conversation-actions {
      opacity: 1;
      background: linear-gradient(to right, transparent, ${props => props.isActive ? 'rgba(59, 130, 246, 0.15)' : '#f8f9fa'} 30%);
    }
  }
`;

const ConversationButton = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  color: #1f2937;
  text-align: left;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  
  &:hover {
    background: transparent;
  }
`;

const ConversationTitle = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
`;

const ConversationMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const ActionsContainer = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s;
  background: transparent;
  padding-left: 20px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6b7280;
  text-align: center;
`;

const ConversationSidebar = ({ 
  selectedConversationId, 
  onSelectConversation, 
  onNewConversation 
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedConv, setSelectedConv] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatbotApi.getConversations,
    refetchOnWindowFocus: false
  });

  // Create new conversation
  const createMutation = useMutation({
    mutationFn: chatbotApi.createConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['conversations']);
      onNewConversation(data.conversation_id);
      toast.success("Tạo cuộc hội thoại mới thành công");
    },
    onError: (error) => {
      console.error("Error creating conversation:", error);
      toast.error("Không thể tạo cuộc hội thoại mới");
    }
  });

  // Update conversation title
  const updateTitleMutation = useMutation({
    mutationFn: ({ conversationId, title }) => 
      chatbotApi.updateConversationTitle(conversationId, title),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      setEditDialog(false);
      toast.success("Cập nhật tên cuộc hội thoại thành công");
    },
    onError: (error) => {
      console.error("Error updating conversation title:", error);
      toast.error("Không thể cập nhật tên cuộc hội thoại");
    }
  });

  // Delete conversation
  const deleteMutation = useMutation({
    mutationFn: chatbotApi.deleteConversation,
    onSuccess: (data, deletedConversationId) => {
      queryClient.invalidateQueries(['conversations']);
      // Check if the deleted conversation is the currently active one
      if (deletedConversationId === selectedConversationId) {
        onSelectConversation(null);
      }
      // Removed toast notification for cleaner UX
    },
    onError: (error) => {
      console.error("Error deleting conversation:", error);
      // Removed toast notification for cleaner UX
    }
  });

  const handleMenuOpen = (event, conversation) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedConv(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedConv(null);
  };

  const handleEdit = () => {
    setNewTitle(selectedConv?.title || "");
    setEditDialog(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedConv) {
      deleteMutation.mutate(selectedConv.id);
    }
    handleMenuClose();
  };

  const handleSaveTitle = () => {
    if (selectedConv && newTitle.trim()) {
      updateTitleMutation.mutate({
        conversationId: selectedConv.id,
        title: newTitle.trim()
      });
    }
  };

  const handleCreateNewChat = () => {
    // Reset to new conversation state
    onNewConversation(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return "Hôm qua";
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  return (
    <>
      <SidebarContainer>
        <SidebarHeader>
          <NewChatButton
            onClick={handleCreateNewChat}
            disabled={selectedConversationId === null}
            startIcon={<AddIcon />}
          >
            Cuộc hội thoại mới
          </NewChatButton>
        </SidebarHeader>

        <ConversationsContainer>
          {isLoading ? (
            <Box p={2}>
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Đang tải...
              </Typography>
            </Box>
          ) : conversations.length === 0 ? (
            <EmptyState>
              <ChatIcon sx={{ fontSize: 48, mb: 2, color: '#6b7280' }} />
              <Typography variant="body2" sx={{ color: '#6b7280' }}>
                Chưa có cuộc hội thoại nào
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                Tạo cuộc hội thoại mới để bắt đầu
              </Typography>
            </EmptyState>
          ) : (
            conversations.map((conversation) => (
              <ConversationItem 
                key={conversation.id}
                isActive={conversation.id === selectedConversationId}
              >
                <ConversationButton
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <ChatIcon sx={{ fontSize: 16, flexShrink: 0, color: '#6b7280' }} />
                  <Box flex={1} overflow="hidden">
                    <ConversationTitle>
                      {conversation.title || "Cuộc hội thoại mới"}
                    </ConversationTitle>
                    <ConversationMeta>
                      {conversation.message_count > 0 
                        ? `${conversation.message_count} tin nhắn • ${formatDate(conversation.updated_at)}`
                        : formatDate(conversation.created_at)
                      }
                    </ConversationMeta>
                  </Box>
                </ConversationButton>
                
                <ActionsContainer className="conversation-actions">
                  <Tooltip title="Tùy chọn">
                    <IconButton
                      size="small"
                      sx={{ color: '#6b7280' }}
                      onClick={(e) => handleMenuOpen(e, conversation)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ActionsContainer>
              </ConversationItem>
            ))
          )}
        </ConversationsContainer>
      </SidebarContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#fff',
            color: '#1f2937',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 35
          }
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          Đổi tên
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: '#ef4444' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Edit Title Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={() => setEditDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#fff',
            color: '#1f2937',
            border: '1px solid rgba(15, 23, 42, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 35
          }
        }}
        sx={{
          '& .MuiBackdrop-root': {
            zIndex: 32
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Đổi tên cuộc hội thoại
          <IconButton onClick={() => setEditDialog(false)} sx={{ color: '#6b7280' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nhập tên mới..."
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                color: '#1f2937',
                '& fieldset': {
                  borderColor: 'rgba(15, 23, 42, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(15, 23, 42, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82f6',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialog(false)}
            sx={{ color: '#6b7280' }}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleSaveTitle}
            disabled={!newTitle.trim() || updateTitleMutation.isPending}
            variant="contained"
            sx={{ 
              backgroundColor: '#3b82f6',
              '&:hover': {
                backgroundColor: '#2563eb'
              }
            }}
          >
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConversationSidebar;

