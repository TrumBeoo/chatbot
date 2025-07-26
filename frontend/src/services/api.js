import environment from '../config/environment';

// src/services/api.js
class ChatbotAPI {
  constructor(baseURL = environment.API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Specific chatbot methods
  async sendMessage(message, language = 'vi') {
    return this.post('/chat', { message, language });
  }

  async getAudio(audioPath) {
    return `${this.baseURL}${audioPath}`;
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health');
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  // Get chat history (nếu backend support)
  async getChatHistory(sessionId) {
    return this.get(`/chat/history/${sessionId}`);
  }

  // Clear chat history
  async clearChatHistory(sessionId) {
    return this.delete(`/chat/history/${sessionId}`);
  }

  // Update settings
  async updateSettings(settings) {
    return this.post('/settings', settings);
  }

  // User Register
async register(data) {
  return this.post('/register', data);
}

// User Login
async login(data) {
  return this.post('/login', data);
}

}

// Create singleton instance
const chatbotAPI = new ChatbotAPI();

// Export specific methods for easier importing
export const {
  sendMessage,
  getAudio,
  healthCheck,
  getChatHistory,
  clearChatHistory,
  updateSettings,
  register,
  login
} = chatbotAPI;


// Export the class and instance
export { ChatbotAPI };
export default chatbotAPI;