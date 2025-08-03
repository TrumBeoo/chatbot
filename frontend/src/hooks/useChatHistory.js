// src/hooks/useChatHistory.js
import { useState, useCallback, useEffect } from 'react';
import chatbotAPI  from '../services/api';

export const useChatHistory = (userId) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations when userId changes
  const loadConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await chatbotAPI.getChatHistory(userId);
      setConversations(response.conversations || []);
      
      // Auto-select the most recent conversation
      if (response.conversations && response.conversations.length > 0) {
        const mostRecent = response.conversations[0];
        setCurrentConversation(mostRecent);
        setMessages(mostRecent.messages || []);
      }
    } catch (error) {
      setError(error.message);
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Create new conversation
  const createNewConversation = useCallback(async () => {
    if (!userId) return;

    const newConversation = {
      id: `temp-${Date.now()}`,
      title: 'New Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      message_count: 0,
      messages: [],
    };

    setCurrentConversation(newConversation);
    setMessages([]);
    setConversations(prev => [newConversation, ...prev]);
  }, [userId]);

  // Select conversation
  const selectConversation = useCallback(async (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setCurrentConversation(conversation);
    setMessages(conversation.messages || []);

    // Load messages if not already loaded
    if (!conversation.messages && userId) {
      setIsLoading(true);
      try {
        const response = await chatbotAPI.getChatHistory(userId, 1, 50, conversationId);
        const loadedMessages = response.messages || [];
        setMessages(loadedMessages);
        
        // Update conversation in state
        setConversations(prev =>
          prev.map(c =>
            c.id === conversationId
              ? { ...c, messages: loadedMessages }
              : c
          )
        );
      } catch (error) {
        console.error('Failed to load conversation messages:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [conversations, userId]);

  // Add message to current conversation
  const addMessage = useCallback((message, removeMessageId = null) => {
    if (!message && !removeMessageId) return;

    setMessages(prev => {
      let updated = [...prev];
      
      // Remove message if specified
      if (removeMessageId) {
        updated = updated.filter(m => m.id !== removeMessageId);
      }
      
      // Add new message if provided
      if (message) {
        updated = [...updated, message];
      }
      
      return updated;
    });

    // Update conversation's updated_at and message_count
    if (currentConversation) {
      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversation.id
            ? {
                ...c,
                updated_at: new Date().toISOString(),
                message_count: messages.length + (message ? 1 : 0) - (removeMessageId ? 1 : 0),
                messages: message ? [...(c.messages || []), message] : c.messages?.filter(m => m.id !== removeMessageId),
              }
            : c
        )
      );
    }
  }, [currentConversation, messages.length]);

  // Update conversation title
  const updateConversationTitle = useCallback(async (conversationId, title) => {
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId
          ? { ...c, title, updated_at: new Date().toISOString() }
          : c
      )
    );

    if (currentConversation?.id === conversationId) {
      setCurrentConversation(prev => ({ ...prev, title }));
    }

    // Save to backend if not a temporary conversation
    if (userId && !conversationId.startsWith('temp-')) {
      try {
        await chatbotAPI.updateConversation(conversationId, { title });
      } catch (error) {
        console.error('Failed to update conversation title:', error);
      }
    }
  }, [currentConversation, userId]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId) => {
    try {
      if (userId && !conversationId.startsWith('temp-')) {
        await chatbotAPI.deleteConversation(conversationId);
      }

      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (currentConversation?.id === conversationId) {
        const remaining = conversations.filter(c => c.id !== conversationId);
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }, [userId, currentConversation, conversations, selectConversation]);

  // Save conversation to backend
  const saveConversation = useCallback(async () => {
    if (!userId || !currentConversation || currentConversation.id.startsWith('temp-')) {
      return;
    }

    try {
      await chatbotAPI.saveChatHistory(userId, {
        conversationId: currentConversation.id,
        messages: messages,
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }, [userId, currentConversation, messages]);

  // Auto-save when messages change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (messages.length > 0 && currentConversation && !currentConversation.id.startsWith('temp-')) {
        saveConversation();
      }
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(saveTimer);
  }, [messages, currentConversation, saveConversation]);

  return {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    loadConversations,
    createNewConversation,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    saveConversation,
  };
};