// frontend/src/components/SocialLogin/SocialLoginButtons.jsx
import React, { useCallback } from 'react';
import {
  VStack,
  Button,
  Text,
  HStack,
  Icon,
  useToast,
  Box,
} from '@chakra-ui/react';
import { FaGoogle, FaFacebook, FaExclamationTriangle } from 'react-icons/fa';
import { translations } from '../../constants';

const SocialLoginButtons = ({
  onGoogleSuccess,
  onFacebookSuccess,
  onError,
  language,
  onLanguageChange,
  isLoading: parentLoading = false,
  disabled = false,
}) => {
  const toast = useToast();

  const showError = useCallback((message) => {
    toast({
      title: translations[language].error || 'Lỗi',
      description: message,
      status: 'info',
      duration: 4000,
      isClosable: true,
    });
    onError?.(message);
  }, [toast, language, onError]);

  const handleDisabledClick = useCallback(() => {
    showError('API functionality has been disabled');
  }, [showError]);

  // Since APIs are disabled, show disabled state
  return (
    <VStack spacing={3} width="100%">
      <Text fontSize="sm" color="gray.400" textAlign="center">
        {translations[language].orUseEmail || 'or use email'}
      </Text>

      <Box textAlign="center" p={4}>
        <HStack justify="center" spacing={2} mb={2}>
          <Icon as={FaExclamationTriangle} color="orange.400" />
          <Text fontSize="sm" color="orange.400">
            {translations[language].socialLoginNotConfigured || 
             'Social login not configured'}
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          API functionality has been disabled
        </Text>
      </Box>

      {/* Disabled Google Login Button */}
      <Button
        width="100%"
        size="lg"
        variant="outline"
        borderColor="gray.300"
        fontFamily="Inter"
        bg="gray.100"
        color="gray.400"
        fontWeight="medium"
        isDisabled={true}
        onClick={handleDisabledClick}
        leftIcon={
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt='Google'
            width="25"
            height="20"
            style={{ marginRight: 3, opacity: 0.5 }}
          />
        }
      >
        {translations[language].loginWithGoogle} (Disabled)
      </Button>

      {/* Disabled Facebook Login Button */}
      <Button
        leftIcon={
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
            alt="Facebook"
            width="25"
            height="20"
            style={{ opacity: 0.5 }}
          />
        }
        variant="outline"
        size="lg"
        width="100%"
        onClick={handleDisabledClick}
        isDisabled={true}
        borderColor="gray.300"
        color="gray.400"
        bg="gray.100"
        fontWeight="medium"
      >
        {translations[language].loginWithFacebook} (Disabled)
      </Button>
    </VStack>
  );
};

export default SocialLoginButtons;