import environment from '../config/environment';

// Custom error classes
class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ChatbotAPI {
  constructor(baseURL = environment.API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.timeout = 30000; // 30 seconds
  }

  // Generic request method with enhanced error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      signal: AbortSignal.timeout(this.timeout),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new APIError(
          errorData.message || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }
      
      return await this.parseResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new NetworkError('Request timeout');
      }
      
      if (error instanceof TypeError) {
        throw new NetworkError('Network connection failed');
      }
      
      throw error;
    }
  }

  // Parse response based on content type
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    if (contentType && contentType.includes('audio/')) {
      return response.blob();
    }
    
    return await response.text();
  }

  // Parse error response
  async parseErrorResponse(response) {
    try {
      return await response.json();
    } catch {
      return { message: response.statusText };
    }
  }

  // HTTP methods with validation
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data = {}) {
    this.validateData(data);
    
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}) {
    this.validateData(data);
    
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Data validation
  validateData(data) {
    if (data && typeof data !== 'object') {
      throw new Error('Request data must be an object');
    }
  }

  // Specific chatbot methods
  async sendMessage(message, language = 'vi') {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }
    
    return this.post('/chat/text', { message: message.trim(), language });
  }

  async sendVoiceMessage(audioBlob) {
    if (!audioBlob instanceof Blob) {
      throw new Error('Audio data must be a Blob');
    }
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    return this.request('/chat/voice', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  async textToSpeech(text, language = 'vi') {
    if (!text || typeof text !== 'string') {
      throw new Error('Text must be a non-empty string');
    }
    
    return this.post('/tts', { text: text.trim(), language });
  }

  async speechToText(audioBlob) {
    if (!audioBlob instanceof Blob) {
      throw new Error('Audio data must be a Blob');
    }
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    
    return this.request('/stt', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    });
  }

  // Health and status methods
  async healthCheck() {
    try {
      const response = await this.get('/health');
      return { ...response, isHealthy: response.status === 'healthy' };
    } catch (error) {
      return { 
        status: 'error', 
        message: error.message, 
        isHealthy: false 
      };
    }
  }

  async getAudioStatus() {
    return this.get('/status/audio');
  }

  async getWelcomeMessages() {
    return this.get('/welcome');
  }

  // Chat history methods
  async getChatHistory(userId, page = 1, limit = 20) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    return this.get(`/chat/${userId}`, { page, limit });
  }

  async saveChatHistory(userId, messages) {
    if (!userId || !Array.isArray(messages)) {
      throw new Error('User ID and messages array are required');
    }
    
    return this.post('/chat', { user_id: userId, messages });
  }

  // Authentication methods
  async register(userData) {
    const requiredFields = ['name', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Basic password validation
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    return this.post('/register', {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password
    });
  }

  async login(credentials) {
    const requiredFields = ['email', 'password'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    return this.post('/login', {
      email: credentials.email.toLowerCase().trim(),
      password: credentials.password
    });
  }

  // Utility methods
  getAudioUrl(audioPath) {
    if (!audioPath) {
      throw new Error('Audio path is required');
    }
    
    return `${this.baseURL}${audioPath}`;
  }

  // Method to update base URL (useful for environment switching)
  updateBaseURL(newBaseURL) {
    this.baseURL = newBaseURL;
  }

  // Method to update timeout
  updateTimeout(newTimeout) {
    if (typeof newTimeout !== 'number' || newTimeout <= 0) {
      throw new Error('Timeout must be a positive number');
    }
    
    this.timeout = newTimeout;
  }

  // Method to add custom headers
  addDefaultHeader(key, value) {
    this.defaultHeaders[key] = value;
  }

  // Method to remove custom headers
  removeDefaultHeader(key) {
    delete this.defaultHeaders[key];
  }
}

// Create singleton instance
const chatbotAPI = new ChatbotAPI();

// Export specific methods for easier importing
export const {
  sendMessage,
  sendVoiceMessage,
  textToSpeech,
  speechToText,
  healthCheck,
  getAudioStatus,
  getWelcomeMessages,
  getChatHistory,
  saveChatHistory,
  register,
  login,
  getAudioUrl
} = chatbotAPI;

// Export error classes
export { APIError, NetworkError };

// Export the class and instance
export { ChatbotAPI };
export default chatbotAPI;