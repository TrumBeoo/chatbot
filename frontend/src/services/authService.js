const API_BASE_URL = 'http://localhost:5000/api/auth';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set authorization header
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Register new user
  async register(name, email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        this.token = data.token;
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        this.token = data.token;
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  // Google login
  async googleLogin(googleToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google login failed');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        this.token = data.token;
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Google login failed');
    }
  }

  // Facebook login
  async facebookLogin(facebookToken) {
    try {
      const response = await fetch(`${API_BASE_URL}/facebook-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: facebookToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Facebook login failed');
      }

      // Store token
      if (data.token) {
        localStorage.setItem('token', data.token);
        this.token = data.token;
      }

      return {
        success: true,
        user: data.user,
        token: data.token,
        message: data.message
      };
    } catch (error) {
      console.error('Facebook login error:', error);
      throw new Error(error.message || 'Facebook login failed');
    }
  }

  // Verify token
  async verifyToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token verification failed');
      }

      return data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error(error.message || 'Token verification failed');
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get profile');
      }

      return data.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error(error.message || 'Failed to get profile');
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      return {
        success: true,
        user: data.user,
        message: data.message
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Logout
  async logout() {
    try {
      // Call logout endpoint (optional, mainly for server-side cleanup)
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('currentConversationId');
      this.token = null;
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Get current token
  getToken() {
    return localStorage.getItem('token');
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
