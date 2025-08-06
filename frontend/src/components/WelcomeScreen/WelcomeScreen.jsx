// frontend/src/components/WelcomeScreen/WelcomeScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useDisclosure,
  useToast,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  ScaleFade,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaLanguage, FaPlay, FaUser } from 'react-icons/fa';
import Lottie from 'lottie-react';
import chatbotAnimation from '../../animations/chatbot.json';
import { translations } from '../../constants';
import { slideUp, pulse } from '../../styles/animations';
import SocialLoginButtons from '../SocialLogin/SocialLoginButtons';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

// Form validation
const validateForm = (formData, authMode, language) => {
  const errors = {};

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email) {
    errors.email = translations[language].emailRequired || 'Email is required';
  } else if (!emailRegex.test(formData.email)) {
    errors.email = translations[language].invalidEmail || 'Invalid email format';
  }

  // Password validation
  if (!formData.password) {
    errors.password = translations[language].passwordRequired || 'Password is required';
  } else if (formData.password.length < 6) {
    errors.password = translations[language].passwordTooShort || 'Password must be at least 6 characters';
  }

  // Register mode validations
  if (authMode === 'register') {
    if (!formData.name?.trim()) {
      errors.name = translations[language].nameRequired || 'Name is required';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = translations[language].confirmPasswordRequired || 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = translations[language].passwordMismatch || 'Passwords do not match';
    }
  }

  return errors;
};

const WelcomeScreen = ({ 
  language, 
  onStart, 
  onLanguageChange, 
  playWelcomeSound,
  user,
  onLogin,
  onRegister,
  onLogout,
  onSocialLogin
}) => {
  // State management
  const [showGreeting, setShowGreeting] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Color mode values
  const modalBg = useColorModeValue('white', 'gray.800');
  const modalColor = useColorModeValue('gray.800', 'white');

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
      if (playWelcomeSound) {
        playWelcomeSound();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [playWelcomeSound]);

  // Utility functions
  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
    setFormErrors({});
  }, []);

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
  const handleStart = useCallback(() => {
    if (playWelcomeSound) {
      playWelcomeSound();
    }
    setTimeout(() => {
      onStart();
    }, 300);
  }, [onStart, playWelcomeSound]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  const switchAuthMode = useCallback(() => {
    setAuthMode(prevMode => prevMode === 'login' ? 'register' : 'login');
    resetForm();
  }, [resetForm]);

  const handleAuthSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    const errors = validateForm(formData, authMode, language);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'register') {
        await onRegister(formData);
      } else {
        await onLogin(formData);
      }
      
      onClose();
      resetForm();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsLoading(false);
    }
  }, [authMode, formData, language, onRegister, onLogin, onClose, resetForm]);

  // Social login handlers (disabled)
  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    showToast('Google Login', 'API functionality has been disabled', 'info');
  }, [showToast]);

  const handleFacebookSuccess = useCallback(async (facebookData) => {
    showToast('Facebook Login', 'API functionality has been disabled', 'info');
  }, [showToast]);

  const handleSocialLoginError = useCallback((error) => {
    // Do nothing since APIs are disabled
  }, []);

  const handleModalClose = useCallback(() => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  }, [isLoading, onClose, resetForm]);

  // Render form fields
  const renderFormFields = useCallback(() => (
    <VStack spacing={4}>
      {/* Name field for registration */}
      {authMode === 'register' && (
        <FormControl isRequired isInvalid={!!formErrors.name}>
          <FormLabel>{translations[language].name || "Full Name"}</FormLabel>
          <Input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={translations[language].enterName || "Enter your full name"}
            bg={useColorModeValue('gray.50', 'gray.700')}
            border="1px solid"
            borderColor={useColorModeValue('gray.300', 'gray.600')}
            _focus={{ 
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px #3182CE'
            }}
            disabled={isLoading}
            size="md"
          />
          <FormErrorMessage>{formErrors.name}</FormErrorMessage>
        </FormControl>
      )}

      {/* Email field */}
      <FormControl isRequired isInvalid={!!formErrors.email}>
        <FormLabel>{translations[language].email || "Email"}</FormLabel>
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder={translations[language].enterEmail || "Enter your email"}
          bg={useColorModeValue('gray.50', 'gray.700')}
          border="1px solid"
          borderColor={useColorModeValue('gray.300', 'gray.600')}
          _focus={{ 
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px #3182CE'
          }}
          disabled={isLoading}
          size="md"
          w="sm"
        />
        <FormErrorMessage>{formErrors.email}</FormErrorMessage>
      </FormControl>

      {/* Password field */}
      <FormControl isRequired isInvalid={!!formErrors.password}>
        <FormLabel>{translations[language].password || "Password"}</FormLabel>
        <Input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder={translations[language].enterPassword || "Enter your password"}
          bg={useColorModeValue('gray.50', 'gray.700')}
          border="1px solid"
          borderColor={useColorModeValue('gray.300', 'gray.600')}
          _focus={{ 
            borderColor: 'blue.400',
            boxShadow: '0 0 0 1px #3182CE'
          }}
          disabled={isLoading}
          size="md"
        />
        <FormErrorMessage>{formErrors.password}</FormErrorMessage>
      </FormControl>

      {/* Confirm password field for registration */}
      {authMode === 'register' && (
        <FormControl isRequired isInvalid={!!formErrors.confirmPassword}>
          <FormLabel>{translations[language].confirmPassword || "Confirm Password"}</FormLabel>
          <Input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={translations[language].enterConfirmPassword || "Re-enter your password"}
            bg={useColorModeValue('gray.50', 'gray.700')}
            border="1px solid"
            borderColor={useColorModeValue('gray.300', 'gray.600')}
            _focus={{ 
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px #3182CE'
            }}
            disabled={isLoading}
            size="md"
          />
          <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
        </FormControl>
      )}
    </VStack>
  ), [authMode, formData, handleInputChange, language, isLoading, formErrors]);

  // Main content
  return (
    <Box
      minH="100vh"
      bgImage="url('/img/bg.png')" 
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      <Container maxW="container.md" textAlign="center" color="white" px={6}>
        <VStack spacing={8} animation={`${slideUp} 0.8s ease-out`}>
          {/* Top Navigation */}
          <HStack position="absolute" top={4} right={4} spacing={2}>
            <ThemeToggle 
              size="sm"
              bg="blackAlpha.500"
              color="white"
              _hover={{
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
            />
            
            <Button
              leftIcon={<FaLanguage />}
              onClick={onLanguageChange}
              colorScheme="whiteAlpha"
              bg="blackAlpha.500"
              variant="solid"
              size="sm"
              color="white"
              borderColor="whiteAlpha.400"
              _hover={{
                borderColor: 'whiteAlpha.600',
                bg: 'whiteAlpha.200',
                transform: 'translateY(-1px)'
              }}
              _active={{ transform: 'translateY(0)' }}
              transition="all 0.2s"
            >
              {translations[language]?.languageSwitch || "Switch Language"}
            </Button>

            {!user ? (
              <Button
                leftIcon={<FaUser />}
                onClick={onOpen}
                colorScheme="whiteAlpha"
                bg="blackAlpha.500"
                variant="solid"
                size="sm"
                color="white"
                borderColor="whiteAlpha.400"
                _hover={{
                  borderColor: 'whiteAlpha.600',
                  bg: 'whiteAlpha.200',
                  transform: 'translateY(-1px)'
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
              >
                {translations[language]?.login || "Sign In"}
              </Button>
            ) : (
              <HStack spacing={2}>
                <Text fontSize="sm" opacity={0.9} fontWeight="medium">
                  {translations[language]?.welcome || "Welcome"}, {user.name}!
                </Text>
                <Button
                  onClick={onLogout}
                  colorScheme="whiteAlpha"
                  bg="blackAlpha.500"
                  variant="solid"
                  size="sm"
                  color="white"
                  borderColor="whiteAlpha.400"
                  _hover={{
                    borderColor: 'whiteAlpha.600',
                    bg: 'whiteAlpha.200',
                    transform: 'translateY(-1px)'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                >
                  {translations[language]?.logout || "Sign Out"}
                </Button>
              </HStack>
            )}
          </HStack>

          {/* Bot Avatar */}
          <Box mt={-20} position="relative">
            <Lottie 
              animationData={chatbotAnimation}
              loop={true}
              autoplay={true}
              style={{ width: 300, height: 300 }}
            />
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="200px"
              h="200px"
              bg="radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)"
              borderRadius="50%"
              animation={`${pulse} 3s ease-in-out infinite`}
              zIndex={-1}
            />
          </Box>

          {/* Greeting */}
          <ScaleFade in={showGreeting} initialScale={0.9}>
            <Box
              bg="whiteAlpha.200"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              mt={-20}
              p={6}
              px={8}
              border="1px solid"
              borderColor="whiteAlpha.300"
              position="relative"
              maxW="md"
            >
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                mb={2}
              >
                {translations[language]?.welcomeGreeting || "Hello! I'm QBot AI, your travel assistant!"}
              </Text>
              
              <Box
                position="absolute"
                bottom="-10px"
                left="50%"
                transform="translateX(-50%)"
                w="0"
                h="0"
                borderLeft="15px solid transparent"
                borderRight="15px solid transparent"
                borderTop="15px solid"
                borderTopColor="whiteAlpha.200"
              />
            </Box>
          </ScaleFade>

          {/* Description */}
          <Box
            maxW="600px"
            mt={-2}
            animation={`${slideUp} 1.2s ease-out`}
            animationDelay="0.8s"
            animationFillMode="both"
          >
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              opacity={0.9}
              lineHeight="1.6"
              textAlign="center"
              fontWeight="500"
            >
              {translations[language]?.welcomeDescription || 
               "I'll help you discover amazing destinations, find great restaurants, and plan your perfect trip in Quảng Ninh!"}
            </Text>
          </Box>

          {/* Action Buttons */}
          <VStack
            spacing={4}
            animation={`${slideUp} 1.6s ease-out`}
            animationDelay="1.2s"
            animationFillMode="both"
          >
            {/* Try Button */}
            <Button
              size="lg"
              colorScheme="blue"
              bg="blue.500"
              color="white"
              border="2px solid"
              borderColor="blue.400"
              borderRadius="full"
              px={10}
              py={6}
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="bold"
              leftIcon={<FaPlay />}
              onClick={handleStart}
              _hover={{
                bg: 'blue.600',
                borderColor: 'blue.300',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(66, 153, 225, 0.3)',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.3s ease"
              boxShadow="0 4px 15px rgba(66, 153, 225, 0.2)"
            >
              {translations[language]?.tryButton || "Try Now"}
            </Button>

            {/* Login/Register prompt for non-users */}
            {!user && (
              <Text fontSize="sm" opacity={0.8} textAlign="center">
                {translations[language]?.loginPrompt || "Sign in to save your chat history and get personalized recommendations!"}
                <Button
                  variant="link"
                  color="blue"
                  fontSize="sm"
                  ml={2}
                  onClick={onOpen}
                  _hover={{ color: 'blue.50', textDecoration: 'underline' }}
                  fontWeight="medium"
                >
                  {translations[language]?.loginNow || "Sign in now"}
                </Button>
              </Text>
            )}
          </VStack>
        </VStack>
      </Container>

      {/* Enhanced Auth Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleModalClose} 
        size="md" 
        closeOnOverlayClick={!isLoading}
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
        <ModalContent bg={modalBg} color={modalColor} borderRadius="xl" mx={4}>
          <ModalHeader textAlign="center" pb={2}>
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold">
                {authMode === 'login' 
                  ? (translations[language]?.login || "Welcome Back")
                  : (translations[language]?.register || "Create Account")
                }
              </Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {authMode === 'login'
                  ? (translations[language]?.loginSubtitle )
                  : (translations[language]?.registerSubtitle )
                }
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton isDisabled={isLoading} />
          
          <ModalBody pb={6}>
            {/* API Disabled Alert */}
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <AlertDescription>API functionality has been disabled. Authentication is not available.</AlertDescription>
            </Alert>

            <VStack spacing={6}>
              {/* Social Login Buttons (Disabled) */}
              <Box width="100%" position="relative">
                <SocialLoginButtons
                  onGoogleSuccess={handleGoogleSuccess}
                  onFacebookSuccess={handleFacebookSuccess}
                  onError={handleSocialLoginError}
                  language={language}
                  onLanguageChange={onLanguageChange}
                  isLoading={isLoading}
                  disabled={true}
                />
              </Box>

              {/* Divider */}
              <HStack width="100%">
                <Divider />
                <Text fontSize="sm" color="gray.500" px={3} whiteSpace="nowrap">
                  {translations[language]?.orUseEmail || "or use email"}
                </Text>
                <Divider />
              </HStack>

              {/* Email/Password Form (Disabled) */}
              <Box as="form" onSubmit={handleAuthSubmit} width="100%">
                <VStack spacing={4}>
                  {renderFormFields()}

                  <Button
                    type="submit"
                    colorScheme="gray"
                    size="lg"
                    width="100%"
                    mt={4}
                    isDisabled={true}
                    onClick={() => showToast('Authentication', 'API functionality has been disabled', 'info')}
                  >
                    {authMode === 'login' 
                      ? (translations[language]?.signIn || "Sign In")
                      : (translations[language]?.createAccount || "Create Account")
                    } (Disabled)
                  </Button>

                  {/* Switch Auth Mode */}
                  <HStack spacing={1} justify="center" pt={2}>
                    <Text fontSize="sm" color="gray.500">
                      {authMode === 'login' 
                        ? (translations[language]?.noAccount || "Don't have an account?")
                        : (translations[language]?.hasAccount || "Already have an account?")
                      }
                    </Text>
                    <Button
                      variant="link"
                      color="blue.500"
                      fontSize="sm"
                      onClick={switchAuthMode}
                      _hover={{ color: 'blue.600', textDecoration: 'underline' }}
                      isDisabled={isLoading}
                      fontWeight="medium"
                    >
                      {authMode === 'login' 
                        ? (translations[language]?.signUpNow || "Sign up")
                        : (translations[language]?.signInNow || "Sign in")
                      }
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default WelcomeScreen;