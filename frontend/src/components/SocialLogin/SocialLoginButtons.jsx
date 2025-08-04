// frontend/src/components/SocialLogin/SocialLoginButtons.jsx
import React, { useState, useCallback } from 'react';
import {
  VStack,
  Button,
  Text,
  HStack,
  Icon,
  useToast,
  Spinner,
  Box,
  Divider,
} from '@chakra-ui/react';
import { GoogleLogin } from '@react-oauth/google';
import { FaGoogle, FaFacebook, FaExclamationTriangle } from 'react-icons/fa';
import oauthService from '../../services/oauthService';
import environment from '../../config/environment';
import { translations } from '../../constants';

const SocialLoginButtons = ({
  onGoogleSuccess,
  onFacebookSuccess,
  onError,
  language,
  isLoading: parentLoading = false,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState({
    google: false,
    facebook: false,
  });
  const toast = useToast();

  const showError = useCallback((message) => {
    toast({
      title: translations[language].error || 'Lỗi',
      description: message,
      status: 'error',
      duration: 4000,
      isClosable: true,
    });
    onError?.(message);
  }, [toast, language, onError]);

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      showError('Invalid Google response');
      return;
    }

    setIsLoading(prev => ({ ...prev, google: true }));

    try {
      await onGoogleSuccess(credentialResponse);
    } catch (error) {
      console.error('Google login error:', error);
      showError(error.message || 'Google login failed');
    } finally {
      setIsLoading(prev => ({ ...prev, google: false }));
    }
  }, [onGoogleSuccess, showError]);

  const handleGoogleError = useCallback((error) => {
    console.error('Google login error:', error);
    showError('Google login failed. Please try again.');
  }, [showError]);

  const handleFacebookLogin = useCallback(async () => {
    setIsLoading(prev => ({ ...prev, facebook: true }));

    try {
      const result = await oauthService.loginWithFacebook();
      await onFacebookSuccess(result);
    } catch (error) {
      console.error('Facebook login error:', error);
      showError(error.message || 'Facebook login failed');
    } finally {
      setIsLoading(prev => ({ ...prev, facebook: false }));
    }
  }, [onFacebookSuccess, showError]);

  const isAnyLoading = parentLoading || isLoading.google || isLoading.facebook;

  if (!environment.GOOGLE_CLIENT_ID && !environment.FACEBOOK_APP_ID) {
    return (
      <Box textAlign="center" p={4}>
        <HStack justify="center" spacing={2} mb={2}>
          <Icon as={FaExclamationTriangle} color="orange.400" />
          <Text fontSize="sm" color="orange.400">
            {translations[language].socialLoginNotConfigured || 
             'Social login not configured'}
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {translations[language].contactAdmin || 
           'Please contact administrator'}
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} width="100%">
      <Text fontSize="sm" color="gray.400" textAlign="center">
        {translations[language].orLoginWith}
      </Text>

      {/* Google Login */}
      {environment.GOOGLE_CLIENT_ID && (
        <Box width="100%">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            logo_alignment="center"
            width="100%"
            disabled={disabled || isAnyLoading}
            useOneTap={false}
            auto_select={false}
            context="signin"
          />
          {isLoading.google && (
            <HStack justify="center" mt={2}>
              <Spinner size="sm" color="blue.500" />
              <Text fontSize="sm" color="gray.500">
                {translations[language].signingInWithGoogle || 'Signing in with Google...'}
              </Text>
            </HStack>
          )}
        </Box>
      )}

      {/* Facebook Login */}
      {environment.FACEBOOK_APP_ID && (
        <Box width="100%">
          <Button
            leftIcon={isLoading.facebook ? <Spinner size="sm" /> : <FaFacebook />}
            colorScheme="facebook"
            variant="outline"
            size="md"
            width="100%"
            onClick={handleFacebookLogin}
            isDisabled={disabled || isAnyLoading}
            isLoading={isLoading.facebook}
            loadingText={translations[language].signingInWithFacebook || 'Signing in...'}
            _hover={{ 
              bg: 'facebook.50', 
              borderColor: 'facebook.300',
              transform: 'translateY(-1px)'
            }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
            borderColor="gray.300"
            color="blue.500"
            bg="white"
            fontWeight="medium"
          >
            {!isLoading.facebook && (
              translations[language].loginWithFacebook
            )}
          </Button>
        </Box>
      )}

      {/* Loading overlay */}
      {isAnyLoading && (
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          bottom={0} 
          bg="blackAlpha.100" 
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1}
        >
          <VStack spacing={2}>
            <Spinner color="blue.500" />
            <Text fontSize="sm" color="gray.600">
              {translations[language].authenticating || 'Authenticating...'}
            </Text>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default SocialLoginButtons;