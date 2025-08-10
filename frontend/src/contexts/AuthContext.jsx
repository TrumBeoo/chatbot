import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated on app load
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const userData = await authService.verifyToken(savedToken);
          setUser(userData);
          setToken(savedToken);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authService.register(name, email, password);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await authService.googleLogin(googleToken);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Google login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Google login failed' 
      };
    }
  };

  const facebookLogin = async (facebookToken) => {
    try {
      const response = await authService.facebookLogin(facebookToken);
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('token', response.token);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Facebook login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Facebook login failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    // Clear any other user-related data from localStorage
    localStorage.removeItem('currentConversationId');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData, token);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        error: error.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    facebookLogin,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};