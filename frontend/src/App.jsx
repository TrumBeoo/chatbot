import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
} from '@chakra-ui/react';

// Components
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import ChatbotHeader from './components/ChatbotHeader/ChatbotHeader';
import ChatArea from './components/ChatArea/ChatArea';
import ChatInput from './components/ChatInput/ChatInput';

// Hooks and Constants
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useChatbotAPI } from './hooks/useChatbotAPI';
import { translations, chatbotConfig } from './constants';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: translations.vi.welcome },
  ]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('vi');
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  const { isPlaying, playAudio, pauseAudio, playWelcomeSound } = useAudioPlayer();
  const { isLoading, sendMessage, checkHealth } = useChatbotAPI(language);

  // Your existing functions remain the same...
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleLanguageChange = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    if (!showWelcome) {
      setMessages((prev) => [
        { sender: 'bot', text: translations[newLang].welcome },
        ...prev.slice(1),
      ]);
    }
  };

  const handleStartChat = () => {
    setShowWelcome(false);
    setMessages([
      { sender: 'bot', text: translations[language].welcome },
    ]);
  };

  // Your existing authentication functions
  const handleRegister = async (formData) => {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Đăng ký thất bại");
    }

    return await response.json();
  };

  const handleLogin = async (formData) => {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Đăng nhập thất bại");
    }

    const data = await response.json();
    setUser(data.user);
    return data;
  };

  // HERE'S THE MISSING FUNCTION - This is what we need to add!
  const handleSocialLogin = async (provider, credentials) => {
  try {
    console.log(`Attempting ${provider} login:`, credentials);
    
    // Make API call to your backend for social authentication
    const response = await fetch(`http://localhost:5000/api/auth/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `Đăng nhập ${provider} thất bại`);
    }

    const data = await response.json();
    setUser(data.user);
    return data;
  } catch (error) {
    console.error(`${provider} login error:`, error);
    
    // If it's a network error (backend endpoint doesn't exist), provide fallback
    if (error.message.includes('404') || error.message.includes('HTTP 404')) {
      console.warn(`Backend ${provider} endpoint not implemented yet, using mock data`);
      
      // Temporary mock user for testing
      const mockUser = {
        id: `${provider}_${Date.now()}`,
        name: provider === 'google' ? 'Google User' : 'Facebook User',
        email: `${provider}user@example.com`,
        provider: provider
      };
      
      setUser(mockUser);
      return { user: mockUser };
    }
    
    // Re-throw other errors
    throw error;
  }
};

  const handleLogout = () => {
    setUser(null);
  };

  // Your existing chat functions remain the same...
  const handleSend = async (messageText = inputText) => {
    if (!messageText.trim()) return;

    const userMessage = { text: messageText, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    const loadingMessage = { text: '...', sender: 'bot', isLoading: true };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const data = await sendMessage(messageText);
      
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
      setMessages((prev) => [...prev, { 
        text: data.response, 
        sender: 'bot',
        audioUrl: data.audio_url 
      }]);
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => !msg.isLoading));
    } finally {
      setInputText('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handlePlayAudio = (audioUrl) => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioUrl);
    }
  };

  // Render the welcome screen with ALL required props
  if (showWelcome) {
    return (
      <WelcomeScreen
        language={language}
        onStart={handleStartChat}
        onLanguageChange={handleLanguageChange}
        playWelcomeSound={playWelcomeSound}
        onRegister={handleRegister}
        onLogin={handleLogin}
        onSocialLogin={handleSocialLogin}  // ✅ This was missing!
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  // Rest of your component remains exactly the same...
  return (
    <Container
      maxW={{ base: '100%', sm: 'container.sm', md: 'container.md' }}
      py={{ base: 4, md: 6 }}
      px={{ base: 2, md: 4 }}
    >
      <ChatbotHeader
        language={language}
        onLanguageChange={handleLanguageChange}
        config={chatbotConfig}
      />

      <Box
        borderWidth={1}
        borderRadius="xl"
        height={{ base: '60vh', sm: '500px' }}
        maxH={{ base: '70vh', md: '450px' }}
        bg="blackAlpha.500"
        boxShadow="inner"
        display="flex"
        flexDirection="column"
      >
        <ChatArea
          messages={messages}
          messagesEndRef={messagesEndRef}
          language={language}
          onPlayAudio={handlePlayAudio}
          isPlaying={isPlaying}
          config={chatbotConfig}
        />

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          language={language}
          config={chatbotConfig}
        />
      </Box>
    </Container>
  );
}

export default App;