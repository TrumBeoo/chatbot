import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Flex,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';

// Components
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import ChatHeader from './components/ChatbotHeader/ChatbotHeader';
import ChatArea from './components/ChatArea/ChatArea';
import ChatInput from './components/ChatInput/ChatInput';
import Sidebar from './components/Sidebar/Sidebar';

// Hooks and Constants
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useChatbotAPI } from './hooks/useChatbotAPI';
import { useAuth } from './hooks/useAuth';
import { useChatHistory } from './hooks/useChatHistory';
import { translations, chatbotConfig } from './constants';

function App() {
  // States
  const [showWelcome, setShowWelcome] = useState(true);
  const [language, setLanguage] = useState('vi');
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  
  // Hooks
  const { isOpen: isSidebarDisclosed, onOpen: openSidebar, onClose: closeSidebar } = useDisclosure();
  const toast = useToast();
  const { isPlaying, playAudio, pauseAudio, playWelcomeSound } = useAudioPlayer();
  const { isLoading: isApiLoading, sendMessage, checkHealth } = useChatbotAPI(language);
  
  // Auth hook
  const {
    user,
    isLoading: isAuthLoading,
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

  // Combined loading state
  const isLoading = isApiLoading || isAuthLoading || isChatLoading;

  // Effects
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // Utility functions
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const showToast = useCallback((title, description, status) => {
    toast({
      title,
      description,
      status,
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // Event handlers
  const handleLanguageChange = useCallback(() => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
  }, [language]);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
    if (user && !currentConversation) {
      createNewConversation();
    }
  }, [user, currentConversation, createNewConversation]);

  const handleLogin = useCallback(async (credentials) => {
    try {
      await login(credentials);
      showToast(
        translations[language].loginSuccess || "Đăng nhập thành công!",
        null,
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].loginError || "Đăng nhập thất bại",
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
        translations[language].registerSuccess || "Đăng ký thành công!",
        null,
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].registerError || "Đăng ký thất bại",
        error.message,
        "error"
      );
      throw error;
    }
  }, [register, language, showToast]);

  const handleSocialLogin = useCallback(async (provider, credentials) => {
    try {
      await socialLogin(provider, credentials);
      showToast(
        translations[language].loginSuccess || "Đăng nhập thành công!",
        null,
        "success"
      );
    } catch (error) {
      showToast(
        translations[language].socialLoginError || "Đăng nhập thất bại",
        error.message,
        "error"
      );
      throw error;
    }
  }, [socialLogin, language, showToast]);

  const handleLogout = useCallback(() => {
    logout();
    setShowWelcome(true);
    showToast(
      translations[language].logoutSuccess || "Đăng xuất thành công!",
      null,
      "info"
    );
  }, [logout, language, showToast]);

  const handleSend = useCallback(async (messageText = inputText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    // Add user message
    addMessage(userMessage);

    // Add loading message
    const loadingMessage = {
      id: `loading-${Date.now()}`,
      text: '...',
      sender: 'bot',
      isLoading: true,
      timestamp: new Date().toISOString()
    };
    addMessage(loadingMessage);

    try {
      const data = await sendMessage(messageText);
      
      // Remove loading message and add bot response
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: data.response,
        sender: 'bot',
        audioUrl: data.audio_url,
        timestamp: new Date().toISOString()
      };

      addMessage(botMessage, loadingMessage.id);

      // Update conversation title if it's the first message
      if (messages.length === 0 && currentConversation) {
        const title = messageText.length > 30 
          ? messageText.substring(0, 30) + '...' 
          : messageText;
        updateConversationTitle(currentConversation.id, title);
      }
    } catch (error) {
      // Remove loading message on error
      addMessage(null, loadingMessage.id);
      showToast(
        translations[language].messageError || "Gửi tin nhắn thất bại",
        error.message,
        "error"
      );
    } finally {
      setInputText('');
    }
  }, [inputText, addMessage, sendMessage, messages.length, currentConversation, updateConversationTitle, language, showToast]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    handleSend();
  }, [handleSend]);

  const handlePlayAudio = useCallback((audioUrl) => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioUrl);
    }
  }, [isPlaying, playAudio, pauseAudio]);

  const handleNewConversation = useCallback(() => {
    createNewConversation();
  }, [createNewConversation]);

  const handleSelectConversation = useCallback((conversationId) => {
    selectConversation(conversationId);
  }, [selectConversation]);

  const handleDeleteConversation = useCallback((conversationId) => {
    deleteConversation(conversationId);
  }, [deleteConversation]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Render welcome screen
  if (showWelcome) {
    return (
      <WelcomeScreen
        language={language}
        onStart={handleStartChat}
        onLanguageChange={handleLanguageChange}
        playWelcomeSound={playWelcomeSound}
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
    <Flex h="100vh" bg="gray.50">
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
          currentConversation={currentConversation}
          config={chatbotConfig}
        />

        <Box flex="1" overflow="hidden">
          <ChatArea
            messages={messages}
            messagesEndRef={messagesEndRef}
            language={language}
            onPlayAudio={handlePlayAudio}
            isPlaying={isPlaying}
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