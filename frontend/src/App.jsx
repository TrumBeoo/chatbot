// frontend/src/App.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
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
import VoiceInterface from './components/VoiceInterface/VoiceInterface';

// Hooks and Constants
import { translations, chatbotConfig } from './constants';
import { useTheme } from './contexts/ThemeContext';
import { apiService } from './services/api_chat';

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
  // Theme hook
  const { bgSecondary } = useTheme();
  
  // States
  const [showWelcome, setShowWelcome] = useState(true);
  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'vi'
    return localStorage.getItem('language') || 'vi';
  });
  const [inputText, setInputText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  
  // Hooks
  const toast = useToast();

  // Save language preference
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
  }, [language]);

  const handleStartChat = useCallback(() => {
    setShowWelcome(false);
  }, []);

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
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the backend API
      const response = await apiService.sendMessage(trimmedMessage);
      
      if (response.success) {
        // Create bot response message
        const botMessage = {
          id: `bot-${Date.now()}`,
          text: response.message,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        // Handle API error
        const errorMessage = {
          id: `bot-${Date.now()}`,
          text: response.error || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
          sender: 'bot',
          timestamp: new Date().toISOString(),
          isError: true
        };

        setMessages(prev => [...prev, errorMessage]);
        
        showToast(
          'Lỗi kết nối',
          response.error || 'Không thể kết nối đến server',
          'error'
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: `bot-${Date.now()}`,
        text: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);
      
      showToast(
        'Lỗi kết nối',
        'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, language, showToast]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!isLoading && inputText.trim()) {
      handleSend();
    }
  }, [handleSend, isLoading, inputText]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Voice handlers
  const handleVoiceClick = useCallback(() => {
    setIsVoiceOpen(true);
  }, []);

  const handleVoiceClose = useCallback(() => {
    setIsVoiceOpen(false);
  }, []);

  const handleVoiceResult = useCallback((userText, botText) => {
    const u = (userText || '').trim();
    if (!u) return;
    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      text: u,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    // If we already have bot text from voice endpoint, add it directly
    const bot = (botText || '').trim();
    if (bot) {
      const botMessage = {
        id: `bot-${Date.now()}`,
        text: bot,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, botMessage]);
    } else {
      // Fallback: call text chat endpoint
      handleSend(u);
    }
  }, [handleSend]);

  // Render welcome screen
  if (showWelcome) {
    return (
      <WelcomeScreen
        language={language}
        onStart={handleStartChat}
        onLanguageChange={handleLanguageChange}
        // Remove all auth-related props since APIs are disabled
        onRegister={() => showToast('Registration', 'API functionality has been disabled', 'info')}
        onLogin={() => showToast('Login', 'API functionality has been disabled', 'info')}
        onSocialLogin={() => showToast('Social Login', 'API functionality has been disabled', 'info')}
        onLogout={() => showToast('Logout', 'API functionality has been disabled', 'info')}
        user={null} // No user since auth is disabled
      />
    );
  }

  // Main chat interface
  return (
    <Flex h="100vh" bg={bgSecondary}>
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={[]} // Empty since API is disabled
        currentConversation={null}
        onSelectConversation={() => {}}
        onNewConversation={() => {}}
        onDeleteConversation={() => {}}
        user={null} // No user since auth is disabled
        language={language}
      />

      {/* Main Chat Area */}
      <Flex flex="1" direction="column" overflow="hidden">
        <ChatHeader
          language={language}
          onLanguageChange={handleLanguageChange}
          onToggleSidebar={toggleSidebar}
          user={null} // No user since auth is disabled
          // Remove all auth-related props since APIs are disabled
          onLogout={() => showToast('Logout', 'API functionality has been disabled', 'info')}
          onLogin={() => showToast('Login', 'API functionality has been disabled', 'info')}
          onRegister={() => showToast('Registration', 'API functionality has been disabled', 'info')}
          onSocialLogin={() => showToast('Social Login', 'API functionality has been disabled', 'info')}
          currentConversation={null}
          config={chatbotConfig}
        />
        
        {/* Unified layout for both empty and message states - always scrollable */}
        <Flex flex="1" direction="column" overflow="hidden">
          <Box flex="1" overflow="hidden">
            <ChatArea
              messages={messages}
              messagesEndRef={messagesEndRef}
              language={language}
              isLoading={isLoading}
              config={chatbotConfig}
            />
          </Box>
          <Box w="full" px={4} pb={4}>
            <Box maxW="700px" mx="auto">
              <ChatInput
                inputText={inputText}
                setInputText={setInputText}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                language={language}
                config={chatbotConfig}
                onVoiceClick={handleVoiceClick}
              />
            </Box>
          </Box>
        </Flex>
      </Flex>

      {/* Voice Interface Modal */}
      <VoiceInterface
        isOpen={isVoiceOpen}
        onClose={handleVoiceClose}
        onVoiceResult={handleVoiceResult}
        language={language}
      />
    </Flex>
  );
}

export default App;