// src/services/api_chat.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get authorization headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  async sendMessage(message, language = null, conversationId = null) {
    try {
      const isAuth = this.isAuthenticated();
      const endpoint = isAuth ? '/chat-authenticated' : '/chat';
      
      const requestBody = { message };
      if (language) requestBody.language = language;
      if (conversationId && isAuth) requestBody.conversation_id = conversationId;

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: isAuth ? this.getAuthHeaders() : { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          message: data.response,
          language: data.language
        };
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error.message || 'Không thể kết nối đến server. Vui lòng thử lại sau.'
      };
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService();
export default apiService;
