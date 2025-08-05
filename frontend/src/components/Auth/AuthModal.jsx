// frontend/src/components/Auth/AuthModal.jsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SocialLoginButtons from '../SocialLogin/SocialLoginButtons';
import { translations } from '../../constants';
import environment from '../../config/environment';

// Form validation function
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

const AuthModal = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onSocialLogin,
  language,
  initialMode = 'login'
}) => {
  const [authMode, setAuthMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoginError, setSocialLoginError] = useState(null);

  const modalBg = useColorModeValue('white', 'gray.800');
  const modalColor = useColorModeValue('gray.800', 'white');

  const hasConfiguredSocialLogin = useMemo(() => 
    environment.GOOGLE_CLIENT_ID || environment.FACEBOOK_APP_ID,
    []
  );

  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: ''
    });
    setFormErrors({});
    setSocialLoginError(null);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
    setSocialLoginError(null);

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

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    setIsLoading(true);
    setSocialLoginError(null);

    try {
      await onSocialLogin('google', {
        credential: credentialResponse.credential
      });
      
      onClose();
      resetForm();
    } catch (error) {
      setSocialLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [onSocialLogin, onClose, resetForm]);

  const handleFacebookSuccess = useCallback(async (facebookData) => {
    setIsLoading(true);
    setSocialLoginError(null);

    try {
      await onSocialLogin('facebook', {
        accessToken: facebookData.accessToken,
        userID: facebookData.userID,
        userInfo: facebookData.userInfo
      });

      onClose();
      resetForm();
    } catch (error) {
      setSocialLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [onSocialLogin, onClose, resetForm]);

  const handleSocialLoginError = useCallback((error) => {
    setSocialLoginError(error);
  }, []);

  const handleModalClose = useCallback(() => {
    if (!isLoading) {
      onClose();
      resetForm();
    }
  }, [isLoading, onClose, resetForm]);

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

  const content = (
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
                ? (translations[language]?.loginSubtitle || "Sign in to your account")
                : (translations[language]?.registerSubtitle || "Create a new account")
              }
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton isDisabled={isLoading} />
        
        <ModalBody pb={6}>
          {/* Social Login Error Alert */}
          {socialLoginError && (
            <Alert status="error" borderRadius="md" mb={4}>
              <AlertIcon />
              <AlertDescription>{socialLoginError}</AlertDescription>
            </Alert>
          )}

          <VStack spacing={6}>
            {/* Social Login Buttons */}
            {hasConfiguredSocialLogin && (
              <Box width="100%" position="relative">
                <SocialLoginButtons
                  onGoogleSuccess={handleGoogleSuccess}
                  onFacebookSuccess={handleFacebookSuccess}
                  onError={handleSocialLoginError}
                  language={language}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
              </Box>
            )}

            {/* Divider */}
            {hasConfiguredSocialLogin && (
              <HStack width="100%">
                <Divider />
                <Text fontSize="sm" color="gray.500" px={3} whiteSpace="nowrap">
                  {translations[language]?.orUseEmail || "or use email"}
                </Text>
                <Divider />
              </HStack>
            )}

            {/* Email/Password Form */}
            <Box as="form" onSubmit={handleAuthSubmit} width="100%">
              <VStack spacing={4}>
                {renderFormFields()}

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  mt={4}
                  isLoading={isLoading}
                  loadingText={
                    authMode === 'register' 
                      ? (translations[language]?.creatingAccount || "Creating account...")
                      : (translations[language]?.signingIn || "Signing in...")
                  }
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg'
                  }}
                  _active={{ transform: 'translateY(0)' }}
                  transition="all 0.2s"
                >
                  {authMode === 'login' 
                    ? (translations[language]?.signIn || "Sign In")
                    : (translations[language]?.createAccount || "Create Account")
                  }
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
  );

  // Wrap with GoogleOAuthProvider if available
  if (environment.GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={environment.GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
};

export default AuthModal;