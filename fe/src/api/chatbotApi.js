import axiosClient from './axiosClient';

export const chatbotApi = {
  /**
   * Send a chat message to the backend
   * 
   * @param {Object} data - The message data
   * @param {string} data.message - The user's message text
   * @param {string} data.conversation_id - Optional conversation ID for context
   * @param {boolean} data.use_rag - Whether to use RAG system (default: true)
   * @param {AbortSignal} data.signal - Optional abort signal for cancellation
   * @returns {Promise<Object>} - The AI response
   */
  sendMessage: async (data) => {
    const response = await axiosClient.post('/api/v1/chat/message', {
      message: data.message,
      conversation_id: data.conversation_id || null,
      use_rag: data.use_rag !== false // default to true
    }, {
      signal: data.signal // Pass abort signal to axios
    });
    return response.data;
  },

  /**
   * Get conversation history
   * 
   * @param {string} conversationId - The conversation ID
   * @returns {Promise<Object>} - Conversation history
   */
  getConversation: async (conversationId) => {
    const response = await axiosClient.get(`/api/v1/chat/conversation/${conversationId}`);
    return response.data;
  },

  /**
   * Get all user conversations
   * 
   * @returns {Promise<Object>} - List of conversations
   */
  getConversations: async () => {
    const response = await axiosClient.get('/api/v1/chat/conversations');
    return response.data;
  },

  /**
   * Create a new conversation
   * 
   * @returns {Promise<Object>} - New conversation data
   */
  createConversation: async () => {
    const response = await axiosClient.post('/api/v1/chat/conversation');
    return response.data;
  },

  /**
   * Delete a conversation
   * 
   * @param {string} conversationId - The conversation ID to delete
   * @returns {Promise<Object>} - Delete response
   */
  deleteConversation: async (conversationId) => {
    const response = await axiosClient.delete(`/api/v1/chat/conversation/${conversationId}`);
    return response.data;
  },

  /**
   * Update conversation title
   * 
   * @param {string} conversationId - The conversation ID
   * @param {string} title - The new title
   * @returns {Promise<Object>} - Update response
   */
  updateConversationTitle: async (conversationId, title) => {
    const response = await axiosClient.put(`/api/v1/chat/conversation/${conversationId}/title`, {
      title
    });
    return response.data;
  }
};

export default chatbotApi;
