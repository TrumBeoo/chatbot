// frontend/src/services/api.js
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
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Enhanced request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    let lastError;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const config = {
          headers: { ...this.defaultHeaders, ...options.headers },
          signal: AbortSignal.timeout(this.timeout),
          ...options,
        };

        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await this.parseErrorResponse(response);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw new APIError(
              errorData.message || `HTTP error! status: ${response.status}`,
              response.status,
              errorData
            );
          }
          
          // Retry on server errors (5xx)
          if (attempt === this.retryAttempts) {
            throw new APIError(
              errorData.message || `HTTP error! status: ${response.status}`,
              response.status,
              errorData
            );
          }
          
          // Wait before retry
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        return await this.parseResponse(response);
      } catch (error) {
        lastError = error;
        
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout');
        }
        
        if (error instanceof TypeError) {
          // Network error, retry if not last attempt
          if (attempt === this.retryAttempts) {
            throw new NetworkError('Network connection failed');
          }
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        // API or other errors, don't retry
        throw error;
      }
    }
    
    throw lastError;
  }

  // Utility method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Parse response based on content type
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return data;
    }
    
    if (contentType && contentType.includes('audio/')) {
      return response.blob();
    }
    
    return await response.text();
  }

  // Parse error response
  async parseErrorResponse(response) {
    try {
      const errorData = await response.json();
      return errorData;
    } catch {
      return { message: response.statusText || 'Unknown error' };
    }
  }

  // HTTP methods with enhanced error handling
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

  // Enhanced authentication methods
  async register(userData) {
    const requiredFields = ['name', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Enhanced email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Please enter a valid email address');
    }
    
    // Enhanced password validation
    if (userData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Name validation
    if (userData.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    
    try {
      const response = await this.post('/api/auth/register', {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password
      });
      
      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific registration errors
        if (error.status === 409) {
          throw new Error('An account with this email already exists');
        } else if (error.status === 400) {
          throw new Error(error.response?.message || 'Invalid registration data');
        }
      }
      throw error;
    }
  }

  async login(credentials) {
    const requiredFields = ['email', 'password'];
    const missingFields = requiredFields.filter(field => !credentials[field]?.toString().trim());
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      throw new Error('Please enter a valid email address');
    }
    
    try {
      const response = await this.post('/api/auth/login', {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password
      });
      
      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        this.addDefaultHeader('Authorization', `Bearer ${response.token}`);
      }
      
      return response;
    } catch (error) {
      if (error instanceof APIError) {
        // Handle specific login errors
        if (error.status === 401) {
          throw new Error('Invalid email or password');
        } else if (error.status === 403) {
          throw new Error('Account is locked or disabled');
        } else if (error.status === 429) {
          throw new Error('Too many login attempts. Please try again later');
        }
      }
      throw error;
    }
  }

  // Enhanced social authentication methods
  async socialLogin(provider, credentials) {
    const validProviders = ['google', 'facebook'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid social login provider: ${provider}`);
    }

    if (!credentials || typeof credentials !== 'object') {
      throw new Error(`${provider} login credentials are required`);
    }

    try {
      const response = await this.post(`/api/auth/${provider}`, credentials);
      
      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        this.addDefaultHeader('Authorization', `Bearer ${response.token}`);
      }
      
      return response;
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 401) {
          throw new Error(`${provider} authentication failed: Invalid credentials`);
        } else if (error.status === 400) {
          throw new Error(`${provider} login error: ${error.response?.message || 'Invalid data'}`);
        } else if (error.status === 409) {
          throw new Error('An account with this email already exists with different login method');
        }
      }
      throw error;
    }
  }

  async googleLogin(googleCredential) {
    if (!googleCredential) {
      throw new Error('Google credential is required');
    }

    return this.socialLogin('google', { credential: googleCredential });
  }

  async facebookLogin(accessToken, userID, userInfo = null) {
    if (!accessToken || !userID) {
      throw new Error('Facebook access token and user ID are required');
    }

    const payload = { 
      accessToken, 
      userID 
    };
    
    // Include additional user info if available
    if (userInfo) {
      payload.userInfo = userInfo;
    }

    return this.socialLogin('facebook', payload);
  }

  // Logout method
  async logout() {
    try {
      // Call logout endpoint if available
      await this.post('/api/auth/logout', {});
    } catch (error) {
      // Continue with local logout even if server logout fails
      console.warn('Server logout failed:', error);
    } finally {
      // Clear local storage and headers
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      this.removeDefaultHeader('Authorization');
    }
  }

  // Chat and messaging methods
  async sendMessage(message, language = 'vi') {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }
    
    if (message.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }
    
    if (message.length > 1000) {
      throw new Error('Message is too long (max 1000 characters)');
    }
    
    return this.post('/api/chat', { 
      message: message.trim(), 
      language,
      timestamp: new Date().toISOString()
    });
  }

  // Health check with enhanced error handling
  async healthCheck() {
    try {
      const response = await this.get('/api/health');
      return { ...response, isHealthy: response.status === 'healthy' };
    } catch (error) {
      console.warn('Health check failed:', error);
      return { 
        status: 'error', 
        message: error.message, 
        isHealthy: false 
      };
    }
  }

  // Chat history methods with better error handling
  async getChatHistory(userId, page = 1, limit = 20, conversationId = null) {
   if (!userId) {
     throw new Error('User ID is required');
   }
   
   if (page < 1 || limit < 1 || limit > 100) {
     throw new Error('Invalid pagination parameters');
   }
   
   const params = { page, limit };
   if (conversationId) {
     params.conversationId = conversationId;
   }
   
   try {
     return await this.get(`/api/chat/history/${userId}`, params);
   } catch (error) {
     if (error instanceof APIError && error.status === 404) {
       // Return empty result for new users
       return { conversations: [], messages: [], total: 0 };
     }
     throw error;
   }
 }

 async saveChatHistory(userId, data) {
   if (!userId || !data) {
     throw new Error('User ID and data are required');
   }
   
   return this.post(`/api/chat/history/${userId}`, {
     ...data,
     timestamp: new Date().toISOString()
   });
 }

 async updateConversation(conversationId, data) {
   if (!conversationId) {
     throw new Error('Conversation ID is required');
   }
   
   return this.put(`/api/conversations/${conversationId}`, {
     ...data,
     updated_at: new Date().toISOString()
   });
 }

 async deleteConversation(conversationId) {
   if (!conversationId) {
     throw new Error('Conversation ID is required');
   }
   
   return this.delete(`/api/conversations/${conversationId}`);
 }

 async createConversation(userId, title = 'New Conversation') {
   if (!userId) {
     throw new Error('User ID is required');
   }
   
   return this.post('/api/conversations', { 
     userId, 
     title,
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString()
   });
 }

 // Utility methods
 addDefaultHeader(key, value) {
   this.defaultHeaders[key] = value;
 }

 removeDefaultHeader(key) {
   delete this.defaultHeaders[key];
 }

 updateBaseURL(newBaseURL) {
   this.baseURL = newBaseURL;
 }

 updateTimeout(newTimeout) {
   if (typeof newTimeout !== 'number' || newTimeout <= 0) {
     throw new Error('Timeout must be a positive number');
   }
   this.timeout = newTimeout;
 }

 // Initialize auth token from localStorage
 initializeAuth() {
   const token = localStorage.getItem('authToken');
   if (token) {
     this.addDefaultHeader('Authorization', `Bearer ${token}`);
   }
 }
}

// Create singleton instance and initialize auth
const chatbotAPI = new ChatbotAPI();
chatbotAPI.initializeAuth();

// Export error classes
export { APIError, NetworkError };

// Export the class and instance
export { ChatbotAPI };
export default chatbotAPI;