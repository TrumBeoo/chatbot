// frontend/src/components/SocialLogin/SocialLoginButtons.jsx
import React, { useState, useCallback, useRef } from 'react';
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
  Image,
  Flex,
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
  onLanguageChange,
  isLoading: parentLoading = false,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState({
    google: false,
    facebook: false,
  });
  const googleLoginRef = useRef(null);
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

  const handleCustomGoogleClick = useCallback(() => {
    if (googleLoginRef.current) {
      // Find the actual Google button inside the GoogleLogin component
      const googleButton = googleLoginRef.current.querySelector('div[role="button"]');
      if (googleButton) {
        googleButton.click();
      }
    }
  }, []);

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

      {/* Custom Google Login */}
      {environment.GOOGLE_CLIENT_ID && (
        <VStack width="100%" spacing={2}>
          {/* Custom Google Login Button */}
          <Button
            width="100%"
            size="lg"
            variant="outline"
            borderColor="gray.300"
            fontFamily="Inter"
            bg="white"
            color="black"
            fontWeight="medium"
            isDisabled={disabled || isAnyLoading}
            isLoading={isLoading.google}
            loadingText={translations[language].signingInWithGoogle}
            onClick={handleCustomGoogleClick}
            _hover={{ 
              bg: 'gray.300', 
              borderColor: 'gray.400',
              transform: 'translateY(-1px)',
              boxShadow: 'md'
            }}
            _active={{ transform: 'translateY(0)' }}
            transition="all 0.2s"
            leftIcon={
              isLoading.google ? (
                <Spinner size="sm" color="blue.500" />
              ) : (
                <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt='Google'
                width="25"
                height="20"
                style={{ marginRight: 3 }}
        />
              )
            }
          >
            {!isLoading.google && translations[language].loginWithGoogle}
          </Button>

         {/* Hidden Google Login Component */}
          <Box 
            ref={googleLoginRef}
            position="absolute" 
            top={0} 
            left={0} 
            opacity={0} 
            pointerEvents="none" 
            zIndex={-1}
            width="0"
            height="0"
            overflow="hidden"
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              //text="signin_with"
              shape="rectangular"
              logo_alignment="center"
              width="100%"
              disabled={disabled || isAnyLoading}
              useOneTap={false}
              auto_select={false}
              context="signin"
            />
          </Box>

          {isLoading.google && (
            <HStack justify="center" mt={2}>
              <Spinner size="sm" color="blue.500" />
              <Text fontSize="sm" color="gray.500">
                {translations[language].signingInWithGoogle || 'Signing in with Google...'}
              </Text>
            </HStack>
          )}
        </VStack>
      )}

      {/* Facebook Login */}
      {environment.FACEBOOK_APP_ID && (
        <Box width="100%">
          <Button
           leftIcon={
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png"
                  alt="Facebook"
                  width="25"
                  height="20"
                />
              }
            colorScheme="facebook"
            variant="outline"
            size="lg"
            width="100%"
            onClick={handleFacebookLogin}
            isDisabled={disabled || isAnyLoading}
            isLoading={isLoading.facebook}
            loadingText={translations[language].signingInWithFacebook || 'Signing in...'}
           _hover={{ 
              bg: 'gray.300', 
              borderColor: 'gray.400',
              transform: 'translateY(-1px)',
              boxShadow: 'md'
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