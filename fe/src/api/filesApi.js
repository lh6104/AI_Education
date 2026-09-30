import axiosClient from './axiosClient';

export const filesApi = {
  /**
   * Upload a file to the system
   * 
   * @param {File} file - The file to upload
   * @param {string} conversationId - The conversation ID to associate file with
   * @param {Function} onProgress - Optional progress callback
   * @returns {Promise<Object>} - Upload response with file info
   */
  uploadFile: async (file, conversationId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversation_id', conversationId);

    const response = await axiosClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Get list of uploaded files
   * 
   * @returns {Promise<Object>} - List of files
   */
  listFiles: async () => {
    const response = await axiosClient.get('/files/list');
    return response.data;
  },

  /**
   * Delete a file
   * 
   * @param {string} fileId - The ID of the file to delete
   * @returns {Promise<Object>} - Delete response
   */
  deleteFile: async (fileId) => {
    const response = await axiosClient.delete(`/files/delete/${fileId}`);
    return response.data;
  },

  /**
   * Search files with text query
   * 
   * @param {string} query - Search query
   * @returns {Promise<Object>} - Search results
   */
  searchFiles: async (query) => {
    const response = await axiosClient.post('/files/search', {
      query
    });
    return response.data;
  },

  /**
   * Test file search functionality
   * 
   * @param {string} query - Test query
   * @returns {Promise<Object>} - Test search results
   */
  testFileSearch: async (query) => {
    const response = await axiosClient.post('/files/test-search', {
      query
    });
    return response.data;
  }
};

export default filesApi;