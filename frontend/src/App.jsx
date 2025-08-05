// frontend/src/App.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Flex,
  useDisclosure,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  VStack,
  Text,
} from '@chakra-ui/react';

// Components
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import ChatHeader from './components/ChatbotHeader/ChatbotHeader';
import ChatArea from './components/ChatArea/ChatArea';
import ChatInput from './components/ChatInput/ChatInput';
import Sidebar from './components/Sidebar/Sidebar';

// Hooks and Constants
import { useChatbotAPI } from './hooks/useChatbotAPI';
import { useAuth } from './hooks/useAuth';
import { useChatHistory } from './hooks/useChatHistory';
import { translations, chatbotConfig } from './constants';

// Loading component
const LoadingScreen = ({ message = "Loading..." }) => (
  <Center minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
    <VStack spacing={4}>
      <Spinner size="xl" color="blue.500" thickness="4px" />
      <Text fontSize="lg" color="gray.600">{message}</Text>
    </VStack>
  </Center>
);

function App() {
  // States
  const [showWelcome, setShowWelcome] = useState(true);
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'vi'
    return localStorage.getItem('language') || 'vi';
  });
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  
  // Hooks
  const { isOpen: isSidebarDisclosed, onOpen: openSidebar, onClose: closeSidebar } = useDisclosure();
  const toast = useToast();
  const { isLoading: isApiLoading, sendMessage, checkHealth } = useChatbotAPI(language);
  
  // Auth hook
  const {
    user,
    isLoading: isAuthLoading,
    isInitialized: isAuthInitialized,
    login,
    register,
    logout,
    socialLogin
  } = useAuth();

  // Chat history hook
  const {
    conversations,
    currentConversation,
    messages,
    isLoading: isChatLoading,
    createNewConversation,
    selectConversation,
    addMessage,
    updateConversationTitle,
    deleteConversation,
    loadConversations
  } = useChatHistory(user?.id);

  // Memoized loading state
  const isLoading = useMemo(() => 
    isApiLoading || isAuthLoading || isChatLoading,
    [isApiLoading, isAuthLoading, isChatLoading]
  );

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Effects
  useEffect(() => {
    if (isAuthInitialized) {
      checkHealth().catch(console.error);
    }
  }, [checkHealth, isAuthInitialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user && isAuthInitialized) {
      loadConversations().catch(console.error);
    }
  }, [user, loadConversations, isAuthInitialized]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, []);

  // Toast utility
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

  // Event handlers
  const handleLanguageChange = useCallback(() => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    
    /*showToast(
      translations[newLang].languageChanged || "Language changed",
      `${translations[newLang].languageSwitch} → ${language === 'vi' ? 'English' : 'Tiếng Việt'}`,
      "info"
    );*/
  }, [language]);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
    
    // Create new conversation for authenticated users
    if (user && !currentConversation) {
      createNewConversation().catch(console.error);
    }
  }, [user, currentConversation, createNewConversation]);

  const handleLogin = useCallback(async (credentials) => {
    try {
      await login(credentials);
      showToast(
        translations[language].loginSuccess || "Login successful!",
        translations[language].welcomeBack || "Welcome back!",
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].loginError || "Login failed",
        error.message,
        "error"
      );
      throw error;
    }
  }, [login, language, showToast]);

  const handleRegister = useCallback(async (formData) => {
    try {
      await register(formData);
      showToast(
        translations[language].registerSuccess || "Registration successful!",
        translations[language].welcomeMessage || "Welcome to our platform!",
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].registerError || "Registration failed",
        error.message,
        "error"
      );
      throw error;
    }
  }, [register, language, showToast]);

  const handleSocialLogin = useCallback(async (provider, credentials) => {
    try {
      await socialLogin(provider, credentials);
      const successMessage = provider === 'google' 
        ? (translations[language].googleLoginSuccess || "Signed in with Google successfully!")
        : (translations[language].facebookLoginSuccess || "Signed in with Facebook successfully!");
      
      showToast(
        translations[language].loginSuccess || "Login successful!",
        successMessage,
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].socialLoginError || "Social login failed",
        error.message,
        "error"
      );
      throw error;
    }
  }, [socialLogin, language, showToast]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowWelcome(true);
      showToast(
        translations[language].logoutSuccess || "Signed out successfully!",
        translations[language].goodbye || "Come back soon!",
        "info"
      );
    } catch (error) {
      console.error('Logout error:', error);
      // Still show success message as user is logged out locally
      showToast(
        translations[language].logoutSuccess || "Signed out successfully!",
        null,
        "info"
      );
    }
  }, [logout, language, showToast]);

  const handleSend = useCallback(async (messageText = inputText) => {
    if (!messageText?.trim()) return;

    const trimmedMessage = messageText.trim();
    
    // Create user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: trimmedMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    addMessage(userMessage);

    // Create loading message
    const loadingMessage = {
      id: `loading-${Date.now()}`,
      text: translations[language].thinking || 'Thinking...',
      sender: 'bot',
      isLoading: true,
      timestamp: new Date().toISOString()
    };
    addMessage(loadingMessage);

    try {
      const response = await sendMessage(trimmedMessage);
      
      // Create bot response message
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: response.response || response.message || 'No response received',
        sender: 'bot',
        audioUrl: response.audio_url,
        timestamp: new Date().toISOString()
      };

      // Replace loading message with bot response
      addMessage(botMessage, loadingMessage.id);

      // Update conversation title for first message
      if (messages.length === 0 && currentConversation) {
        const title = trimmedMessage.length > 30 
          ? trimmedMessage.substring(0, 30) + '...' 
          : trimmedMessage;
        updateConversationTitle(currentConversation.id, title).catch(console.error);
      }
    } catch (error) {
      console.error('Send message error:', error);
      
      // Remove loading message and show error
      addMessage(null, loadingMessage.id);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        text: translations[language].messageError || "Sorry, I couldn't process your message. Please try again.",
        sender: 'bot',
        isError: true,
        timestamp: new Date().toISOString()
      };
      addMessage(errorMessage);
      
      showToast(
        translations[language].messageError || "Message failed",
        error.message,
        "error"
      );
    } finally {
      setInputText('');
    }
  }, [inputText, addMessage, sendMessage, messages.length, currentConversation, updateConversationTitle, language, showToast]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!isLoading && inputText.trim()) {
      handleSend();
    }
  }, [handleSend, isLoading, inputText]);

  const handleNewConversation = useCallback(() => {
    createNewConversation().catch(console.error);
  }, [createNewConversation]);

  const handleSelectConversation = useCallback((conversationId) => {
    selectConversation(conversationId).catch(console.error);
  }, [selectConversation]);

  const handleDeleteConversation = useCallback(async (conversationId) => {
    try {
      await deleteConversation(conversationId);
      showToast(
        translations[language].conversationDeleted || "Conversation deleted",
        null,
        "info"
      );
    } catch (error) {
      showToast(
        translations[language].deleteError || "Failed to delete conversation",
        error.message,
        "error"
      );
    }
  }, [deleteConversation, language, showToast]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Show loading screen while auth is initializing
  if (!isAuthInitialized) {
    return <LoadingScreen message={translations[language].initializing || "Initializing..."} />;
  }

  // Render welcome screen
  if (showWelcome) {
    return (
      <WelcomeScreen
        language={language}
        onStart={handleStartChat}
        onLanguageChange={handleLanguageChange}
        onRegister={handleRegister}
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  // Main chat interface
  return (
    <Flex h="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        user={user}
        language={language}
      />

      {/* Main Chat Area */}
      <Flex flex="1" direction="column" overflow="hidden">
       <ChatHeader
          language={language}
          onLanguageChange={handleLanguageChange}
          onToggleSidebar={toggleSidebar}
          user={user}
          onLogout={handleLogout}
          onLogin={handleLogin}          // Thêm prop này
          onRegister={handleRegister}    // Thêm prop này  
          onSocialLogin={handleSocialLogin} // Thêm prop này
          currentConversation={currentConversation}
          config={chatbotConfig}
        />
        <Box flex="1" overflow="hidden">
          <ChatArea
            messages={messages}
            messagesEndRef={messagesEndRef}
            language={language}
            isLoading={isLoading}
            config={chatbotConfig}
          />
        </Box>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          language={language}
          config={chatbotConfig}
        />
      </Flex>
    </Flex>
  );
}

export default App;