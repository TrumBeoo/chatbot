import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import chatbotAPI from '../services/api';
import { translations } from '../constants';

export const useChatbotAPI = (language) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleError = useCallback((error, customMessage) => {
    console.error('API Error:', error);
    setError(error);
    
    toast({
      title: translations[language].error,
      description: customMessage || translations[language].connectionError,
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }, [language, toast]);

  const sendMessage = useCallback(async (message) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatbotAPI.sendMessage(message, language);
      return response;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [language, handleError]);

  const checkHealth = useCallback(async () => {
    try {
      const response = await chatbotAPI.healthCheck();
      return response;
    } catch (error) {
      handleError(error, 'Unable to connect to server');
      return { status: 'error' };
    }
  }, [handleError]);

  const getChatHistory = useCallback(async (sessionId) => {
    setIsLoading(true);
    try {
      const history = await chatbotAPI.getChatHistory(sessionId);
      return history;
    } catch (error) {
      handleError(error, 'Unable to load chat history');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    isLoading,
    error,
    sendMessage,
    checkHealth,
    getChatHistory,
    clearError: () => setError(null),
  };
};