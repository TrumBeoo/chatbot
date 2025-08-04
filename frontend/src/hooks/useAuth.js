// frontend/src/hooks/useAuth.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import chatbotAPI from '../services/api';
import { translations } from '../constants';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const toast = useToast();
  const initializationAttempted = useRef(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      
      const savedUser = localStorage.getItem('user');
      const authToken = localStorage.getItem('authToken');
      
      if (savedUser && authToken) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Verify token is still valid
          chatbotAPI.healthCheck()
            .then(() => {
              console.log('Auth state restored successfully');
            })
            .catch(() => {
              console.warn('Stored auth token is invalid, clearing auth state');
              logout();
            });
        } catch (error) {
          console.error('Failed to parse saved user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
        }
      }
      
      setIsInitialized(true);
    }
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (isInitialized) {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
  }, [user, isInitialized]);

  const showToast = useCallback((title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: status === 'error' ? 5000 : 3000,
      isClosable: true,
      position: 'top',
    });
  }, [toast]);

  const login = useCallback(async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Email and password are required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatbotAPI.login(credentials);
      
      if (response.user) {
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    if (!userData?.name || !userData?.email || !userData?.password) {
      throw new Error('Name, email, and password are required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatbotAPI.register(userData);
      
      if (response.user) {
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const socialLogin = useCallback(async (provider, credentials) => {
    if (!provider || !credentials) {
      throw new Error('Provider and credentials are required');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await chatbotAPI.socialLogin(provider, credentials);
      
      if (response.user) {
        setUser(response.user);
      } else {
        throw new Error('Invalid response from server');
      }
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await chatbotAPI.logout();
    } catch (error) {
      console.warn('Logout request failed:', error);
      // Continue with local logout
    } finally {
      setUser(null);
      setError(null);
      setIsLoading(false);
      
      // Clear all auth-related data
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    if (!updatedUser) {
      throw new Error('Updated user data is required');
    }
    
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUser,
      updated_at: new Date().toISOString()
    }));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user session is still valid
  const validateSession = useCallback(async () => {
    if (!user) return false;
    
    try {
      const response = await chatbotAPI.get('/api/auth/validate');
      return response.valid === true;
    } catch (error) {
      console.warn('Session validation failed:', error);
      logout();
      return false;
    }
  }, [user, logout]);

  return {
    user,
    isLoading,
    error,
    isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    socialLogin,
    logout,
    updateUser,
    clearError,
    validateSession,
  };
};