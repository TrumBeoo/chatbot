import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Button,
  Text,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FaLanguage, FaPlay, FaUser, FaUserPlus, FaGoogle, FaFacebook } from 'react-icons/fa';
import Lottie from 'lottie-react';
import chatbotAnimation from '../../animations/chatbot.json';
import { translations } from '../../constants';
import { slideUp, pulse } from '../../styles/animations';

// Environment configuration with fallbacks
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || "";

// Constants
const INITIAL_FORM_STATE = {
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
};

const AUTH_MODES = {
  LOGIN: 'login',
  REGISTER: 'register'
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
  // State
  const [showGreeting, setShowGreeting] = useState(false);
  const [authMode, setAuthMode] = useState(AUTH_MODES.LOGIN);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  
  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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

  // Cleanup Facebook SDK on unmount
  useEffect(() => {
    return () => {
      // Clean up Facebook SDK script if component unmounts
      const fbScript = document.getElementById('facebook-jssdk');
      if (fbScript) {
        fbScript.remove();
      }
    };
  }, []);

  // Utility functions
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
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

  const validateForm = useCallback(() => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast(
        translations[language].invalidEmail || "Email không hợp lệ",
        null,
        "error"
      );
      return false;
    }

    // Password validation
    if (formData.password.length < 6) {
      showToast(
        translations[language].passwordTooShort || "Mật khẩu phải có ít nhất 6 ký tự",
        null,
        "error"
      );
      return false;
    }

    // Confirm password validation for register mode
    if (authMode === AUTH_MODES.REGISTER) {
      if (!formData.name.trim()) {
        showToast(
          translations[language].nameRequired || "Vui lòng nhập họ tên",
          null,
          "error"
        );
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        showToast(
          translations[language].passwordMismatch || "Mật khẩu không khớp",
          null,
          "error"
        );
        return false;
      }
    }

    return true;
  }, [authMode, formData, language, showToast]);

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
  }, []);

  const switchAuthMode = useCallback(() => {
    setAuthMode(prevMode => 
      prevMode === AUTH_MODES.LOGIN ? AUTH_MODES.REGISTER : AUTH_MODES.LOGIN
    );
    resetForm();
  }, [resetForm]);

  const handleAuthSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (authMode === AUTH_MODES.REGISTER) {
        await onRegister(formData);
        showToast(
          translations[language].registerSuccess || "Đăng ký thành công!",
          null,
          "success"
        );
      } else {
        await onLogin(formData);
        showToast(
          translations[language].loginSuccess || "Đăng nhập thành công!",
          null,
          "success"
        );
      }
      
      onClose();
      resetForm();
    } catch (error) {
      const errorTitle = authMode === AUTH_MODES.REGISTER 
        ? (translations[language].registerError || "Đăng ký thất bại")
        : (translations[language].loginError || "Đăng nhập thất bại");
      
      showToast(errorTitle, error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [authMode, formData, validateForm, onRegister, onLogin, language, showToast, onClose, resetForm]);

  // Render form fields
  const renderFormFields = useCallback(() => (
    <VStack spacing={4}>
      {authMode === AUTH_MODES.REGISTER && (
        <FormControl isRequired>
          <FormLabel>{translations[language].name || "Họ tên"}</FormLabel>
          <Input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder={translations[language].enterName || "Nhập họ tên"}
            bg="gray.700"
            border="1px solid"
            borderColor="gray.600"
            _focus={{ borderColor: 'blue.400' }}
            disabled={isLoading}
          />
        </FormControl>
      )}

      <FormControl isRequired>
        <FormLabel>{translations[language].email || "Email"}</FormLabel>
        <Input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder={translations[language].enterEmail || "Nhập email"}
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          _focus={{ borderColor: 'blue.400' }}
          disabled={isLoading}
        />
      </FormControl>

      <FormControl isRequired>
        <FormLabel>{translations[language].password || "Mật khẩu"}</FormLabel>
        <Input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder={translations[language].enterPassword || "Nhập mật khẩu"}
          bg="gray.700"
          border="1px solid"
          borderColor="gray.600"
          _focus={{ borderColor: 'blue.400' }}
          disabled={isLoading}
        />
      </FormControl>

      {authMode === AUTH_MODES.REGISTER && (
        <FormControl isRequired>
          <FormLabel>{translations[language].confirmPassword || "Xác nhận mật khẩu"}</FormLabel>
          <Input
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder={translations[language].enterConfirmPassword || "Nhập lại mật khẩu"}
            bg="gray.700"
            border="1px solid"
            borderColor="gray.600"
            _focus={{ borderColor: 'blue.400' }}
            disabled={isLoading}
          />
        </FormControl>
      )}
    </VStack>
  ), [authMode, formData, handleInputChange, language, isLoading]);

  // Google login handlers
  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    try {
      console.log('Google login success:', credentialResponse);
      
      if (!onSocialLogin) {
        throw new Error('Social login handler not available');
      }
      
      setIsLoading(true);
      
      await onSocialLogin('google', {
        credential: credentialResponse.credential
      });
      
      showToast(
        translations[language].loginSuccess || "Đăng nhập thành công!",
        null,
        "success"
      );
      
      onClose();
    } catch (error) {
      console.error('Google login error:', error);
      showToast(
        translations[language].socialLoginError || "Đăng nhập thất bại",
        error.message,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }, [onSocialLogin, language, showToast, onClose]);

  const handleGoogleError = useCallback((error) => {
    console.error('Google login error:', error);
    showToast(
      translations[language].socialLoginError || "Đăng nhập Google thất bại",
      "Vui lòng thử lại",
      "error"
    );
  }, [language, showToast]);

 const initializeFacebookSDK = useCallback(() => {
  return new Promise((resolve, reject) => {
    // Nếu SDK đã được load và init
    if (window.FB && typeof window.FB.init === 'function') {
      console.log("[Facebook SDK] Đã được load sẵn");
      return resolve();
    }

    if (!FACEBOOK_APP_ID) {
      return reject(new Error('Facebook App ID chưa được cấu hình'));
    }

    // Tránh load trùng script
    if (document.getElementById('facebook-jssdk')) {
      console.warn("[Facebook SDK] Script đã tồn tại. Đợi SDK sẵn sàng...");
      return waitForFbInit(resolve, reject);
    }

    // Tạo script mới
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.FB) {
        return reject(new Error('Tải Facebook SDK thất bại'));
      }

      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: 'v19.0'
        });

        console.log('[Facebook SDK] Khởi tạo thành công');
        resolve();
      } catch (error) {
        console.error('[Facebook SDK] Lỗi khởi tạo:', error);
        reject(new Error('Khởi tạo Facebook SDK thất bại'));
      }
    };

    script.onerror = () => {
      reject(new Error('Không thể tải script Facebook SDK'));
    };

    document.body.appendChild(script);
  });
}, []);

 const getFacebookUserInfo = () => {
  return new Promise((resolve, reject) => {
    window.FB.api('/me', { fields: 'name,email,picture.type(large)' }, (userInfo) => {
      if (!userInfo || userInfo.error) {
        reject(new Error(userInfo?.error?.message || 'Không thể lấy thông tin người dùng'));
      } else {
        resolve(userInfo);
      }
    });
  });
};

const handleFacebookLogin = useCallback(async () => {
  if (!onSocialLogin) {
    showToast(
      translations[language].socialLoginError || "Chức năng đăng nhập chưa sẵn sàng",
      null,
      "error"
    );
    return;
  }

  setIsLoading(true);
  try {
    showToast(
      translations[language].loading || "Đang xử lý...",
      null,
      "info"
    );

    await initializeFacebookSDK();

    const loginResponse = await new Promise((resolve, reject) => {
      window.FB.login((response) => {
        if (response.authResponse) {
          resolve(response.authResponse);
        } else {
          reject(new Error("Người dùng đã huỷ đăng nhập hoặc xảy ra lỗi"));
        }
      }, {
        scope: 'email,public_profile',
        return_scopes: true
      });
    });

    const { accessToken, userID } = loginResponse;

    if (!accessToken || !userID) {
      throw new Error("Facebook authentication không hợp lệ");
    }

    const userInfo = await getFacebookUserInfo();

    await onSocialLogin('facebook', { accessToken, userID, userInfo });

    showToast(
      translations[language].loginSuccess || "Đăng nhập thành công!",
      null,
      "success"
    );

    onClose();
  } catch (error) {
    console.error("Facebook login error:", error);
    showToast(
      translations[language].socialLoginError || "Đăng nhập Facebook thất bại",
      error.message,
      "error"
    );
  } finally {
    setIsLoading(false);
  }
}, [onSocialLogin, language, showToast, onClose, initializeFacebookSDK]);


  // Render social login buttons
  const renderSocialButtons = useCallback(() => (
    <VStack spacing={3} width="100%">
      {/* Google Login Button */}
      {GOOGLE_CLIENT_ID && (
        <Box width="100%">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            logo_alignment="left"
            width="100%"
            disabled={isLoading}
          />
        </Box>
      )}

      {/* Facebook Login Button */}  
      {FACEBOOK_APP_ID && (
        <Button
          leftIcon={<FaFacebook />}
          colorScheme="facebook"
          variant="outline"
          size="lg"
          width="100%"
          onClick={handleFacebookLogin}
          _hover={{ bg: 'blue.50', color: 'blue.500' }}
          borderColor="blue.500"
          color="blue.500"
          isDisabled={isLoading}
          isLoading={isLoading}
        >
          {translations[language].loginWithFacebook || "Đăng nhập với Facebook"}
        </Button>
      )}
      
      {/* Show warning if social login not configured */}
      {(!GOOGLE_CLIENT_ID && !FACEBOOK_APP_ID) && (
        <Text fontSize="sm" color="orange.300" textAlign="center">
          {translations[language].socialLoginNotConfigured || 
           "Đăng nhập xã hội chưa được cấu hình"}
        </Text>
      )}
    </VStack>
  ), [handleGoogleSuccess, handleGoogleError, handleFacebookLogin, language, isLoading]);

  // Only render GoogleOAuthProvider if we have a valid client ID
  const content = (
    <Box
      minH="100vh"
      bgImage="url('img/bg.png')"
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
              }}
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
                }}
              >
                {translations[language]?.login || "Đăng nhập"}
              </Button>
            ) : (
              <HStack spacing={2}>
                <Text fontSize="sm" opacity={0.8}>
                  {translations[language]?.welcome || "Xin chào"}, {user.name}!
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
                  }}
                >
                  {translations[language]?.logout || "Đăng xuất"}
                </Button>
              </HStack>
            )}
          </HStack>

          {/* Bot Avatar */}
          <Box mt={-20}>
            <Lottie 
              animationData={chatbotAnimation}
              loop={true}
              autoplay={true}             
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
          {showGreeting && (
            <Box
              bg="whiteAlpha.200"
              backdropFilter="blur(10px)"
              borderRadius="200px"
              mt={-20}
              p={5}
              px={10}
              border="1px solid"
              borderColor="whiteAlpha.300"
              animation={`${slideUp} 0.6s ease-out`}
              position="relative"
            >
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="bold"
                mb={2}
              >
                {translations[language]?.welcomeGreeting || "Xin chào!"}
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
          )}

          {/* Description */}
          <Box
            maxW="500px"
            mt={-5}
            animation={`${slideUp} 1.2s ease-out`}
            animationDelay="0.8s"
            animationFillMode="both"
          >
            <Text
              fontSize={{ base: 'lg', md: '2xl' }}
              opacity={0.85}
              lineHeight="1.6"
              textAlign="center"
              color="white.900"
              fontWeight="bold"
            >
              {translations[language]?.welcomeDescription || "Chào mừng bạn đến với trợ lý du lịch!"}
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
              colorScheme="whiteAlpha.500"
              bg="blue.500"
              color="white"
              border="2px solid"
              borderColor="whiteAlpha.400"
              borderRadius="full"
              px={8}
              py={6}
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="bold"
              leftIcon={<FaPlay />}
              onClick={handleStart}
              _hover={{
                bg: 'blue.600',
                borderColor: 'whiteAlpha.600',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              }}
              _active={{
                transform: 'translateY(0)',
              }}
              transition="all 0.3s ease"
              boxShadow="0 4px 15px rgba(0,0,0,0.1)"
            >
              {translations[language]?.tryButton || "Dùng thử"}
            </Button>

            {/* Login/Register prompt for non-users */}
            {!user && (
              <Text fontSize="sm" opacity={0.7} textAlign="center">
                {translations[language]?.loginPrompt || "Đăng nhập để lưu lịch sử chat"}
                <Button
                  variant="link"
                  color="blue.300"
                  fontSize="sm"
                  ml={1}
                  onClick={onOpen}
                  _hover={{ color: 'blue.100' }}
                >
                  {translations[language]?.loginNow || "Đăng nhập ngay"}
                </Button>
              </Text>
            )}
          </VStack>
        </VStack>
      </Container>

      {/* Auth Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={!isLoading}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader textAlign="center">
            {authMode === AUTH_MODES.LOGIN 
              ? (translations[language]?.login || "Đăng nhập")
              : (translations[language]?.register || "Đăng ký")
            }
          </ModalHeader>
          <ModalCloseButton isDisabled={isLoading} />
          <ModalBody pb={6}>
            <form onSubmit={handleAuthSubmit}>
              <VStack spacing={4}>
                {renderFormFields()}

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  mt={4}
                  isLoading={isLoading}
                  loadingText={authMode === AUTH_MODES.REGISTER ? "Đang đăng ký..." : "Đang đăng nhập..."}
                >
                  {authMode === AUTH_MODES.LOGIN 
                    ? (translations[language]?.login || "Đăng nhập")
                    : (translations[language]?.register || "Đăng ký")
                  }
                </Button>

                <Divider />

                {/* Social Login */}
                {renderSocialButtons()}

                <Text fontSize="sm" textAlign="center" opacity={0.8}>
                  {authMode === AUTH_MODES.LOGIN 
                    ? (translations[language]?.noAccount || "Chưa có tài khoản?")
                    : (translations[language]?.hasAccount || "Đã có tài khoản?")
                  }
                  <Button
                    variant="link"
                    color="blue.300"
                    fontSize="sm"
                    ml={1}
                    onClick={switchAuthMode}
                    _hover={{ color: 'blue.100' }}
                    isDisabled={isLoading}
                  >
                    {authMode === AUTH_MODES.LOGIN 
                      ? (translations[language]?.registerNow || "Đăng ký ngay")
                      : (translations[language]?.loginNow || "Đăng nhập ngay")
                    }
                  </Button>
                </Text>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );

  // Wrap with GoogleOAuthProvider only if Google Client ID is available
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
};

export default WelcomeScreen;