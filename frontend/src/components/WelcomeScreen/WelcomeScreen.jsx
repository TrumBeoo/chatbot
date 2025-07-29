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

// Add Google Client ID to your environment config
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id";
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;

// Constants remain the same
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
  onSocialLogin // Add this new prop for social authentication
}) => {
  // State
  const [showGreeting, setShowGreeting] = useState(false);
  const [authMode, setAuthMode] = useState(AUTH_MODES.LOGIN);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  
  // Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
      playWelcomeSound();
    }, 1000);

    return () => clearTimeout(timer);
  }, [playWelcomeSound]);

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
    if (authMode === AUTH_MODES.REGISTER) {
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
    playWelcomeSound();
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
    }
  }, [authMode, formData, validateForm, onRegister, onLogin, language, showToast, onClose, resetForm]);

  const handleSocialLogin = useCallback((provider) => {
    // Implement social login logic here
    console.log(`Login with ${provider}`);
  }, []);

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
          />
        </FormControl>
      )}
    </VStack>
  ), [authMode, formData, handleInputChange, language]);

  // In your WelcomeScreen component, make sure the Google success handler is correct:
const handleGoogleSuccess = useCallback(async (credentialResponse) => {
  try {
    console.log('Google login success:', credentialResponse);
    
    // Call the parent component's social login handler
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

  
  // Thay thế các function liên quan đến Facebook
const initializeFacebookSDK = useCallback(() => {
  return new Promise((resolve, reject) => {
    // Check if Facebook SDK is already loaded
    if (window.FB) {
      resolve();
      return;
    }

    // Validate Facebook App ID
    if (!FACEBOOK_APP_ID) {
      reject(new Error('Facebook App ID not configured'));
      return;
    }

    // Load Facebook SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v19.0' // Latest stable version
        });
        
        // Check login status after init
        window.FB.getLoginStatus((response) => {
          console.log('Facebook login status:', response.status);
          resolve();
        });
        
      } catch (error) {
        reject(new Error('Failed to initialize Facebook SDK'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Facebook SDK script'));
    };
    
    document.body.appendChild(script);
  });
}, []);

const handleFacebookLogin = useCallback(async () => {
  try {
    showToast(
      translations[language].loading || "Đang xử lý...",
      null,
      "info"
    );

    // Initialize Facebook SDK
    await initializeFacebookSDK();

    // Perform Facebook login
    window.FB.login(async (response) => {
      try {
        console.log('Facebook login response:', response);
        
        if (!response.authResponse) {
          throw new Error('Facebook login was cancelled or failed');
        }

        const { accessToken, userID } = response.authResponse;
        
        if (!accessToken || !userID) {
          throw new Error('Invalid Facebook authentication response');
        }

        // Get additional user info
        window.FB.api('/me', { fields: 'name,email,picture.type(large)' }, async (userInfo) => {
          try {
            console.log('Facebook user info:', userInfo);
            
            // Call backend for authentication
            await onSocialLogin('facebook', {
              accessToken: accessToken,
              userID: userID,
              userInfo: userInfo // Send additional user info
            });
            
            showToast(
              translations[language].loginSuccess || "Đăng nhập thành công!",
              null,
              "success"
            );
            
            onClose();
            
          } catch (error) {
            console.error('Backend authentication error:', error);
            showToast(
              translations[language].socialLoginError || "Đăng nhập thất bại",
              error.message,
              "error"
            );
          }
        });
        
      } catch (error) {
        console.error('Facebook login processing error:', error);
        showToast(
          translations[language].socialLoginError || "Đăng nhập Facebook thất bại",
          error.message,
          "error"
        );
      }
    }, { 
      scope: 'email,public_profile',
      return_scopes: true 
    });
    
  } catch (error) {
    console.error('Facebook SDK initialization error:', error);
    showToast(
      translations[language].socialLoginError || "Lỗi khởi tạo Facebook SDK",
      error.message || "Vui lòng kiểm tra cấu hình Facebook App ID",
      "error"
    );
  }
}, [onSocialLogin, language, showToast, onClose, initializeFacebookSDK]);

// Cập nhật renderSocialButtons function
const renderSocialButtons = useCallback(() => (
  <VStack spacing={3} width="100%">
    {/* Google Login Button */}
    {GOOGLE_CLIENT_ID && (
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="outline"
        size="large"
        text="signin_with"
        shape="rectangular"
        logo_alignment="left"
        width="100%"
      />
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
        isDisabled={!FACEBOOK_APP_ID}
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
), [handleGoogleSuccess, handleGoogleError, handleFacebookLogin, language]);
  /*const renderSocialButtons = useCallback(() => (
    <VStack spacing={2} width="100%">
      <Button
        leftIcon={<FaGoogle />}
        colorScheme="red"
        variant="outline"
        size="md"
        width="100%"
        onClick={() => handleSocialLogin('google')}
        _hover={{ bg: 'red.50', color: 'red.500' }}
      >
        {translations[language].loginWithGoogle || "Đăng nhập với Google"}
      </Button>

 
      
      <Button
        leftIcon={<FaFacebook />}
        colorScheme="facebook"
        variant="outline"
        size="md"
        width="100%"
        onClick={() => handleSocialLogin('facebook')}
        _hover={{ bg: 'blue.50', color: 'blue.500' }}
      >
        {translations[language].loginWithFacebook || "Đăng nhập với Facebook"}
      </Button>
    </VStack>
  ), [handleSocialLogin, language]);*/

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
              {translations[language].languageSwitch}
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
               {translations[language].login || "Đăng nhập"}
             </Button>
           ) : (
             <HStack spacing={2}>
               <Text fontSize="sm" opacity={0.8}>
                 {translations[language].welcome || "Xin chào"}, {user.name}!
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
                 {translations[language].logout || "Đăng xuất"}
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
               {translations[language].welcomeGreeting}
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
             {translations[language].welcomeDescription}
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
             {translations[language].tryButton || "Dùng thử"}
           </Button>

           {/* Login/Register prompt for non-users */}
           {!user && (
             <Text fontSize="sm" opacity={0.7} textAlign="center">
               {translations[language].loginPrompt || "Đăng nhập để lưu lịch sử chat"}
               <Button
                 variant="link"
                 color="blue.300"
                 fontSize="sm"
                 ml={1}
                 onClick={onOpen}
                 _hover={{ color: 'blue.100' }}
               >
                 {translations[language].loginNow || "Đăng nhập ngay"}
               </Button>
             </Text>
           )}
         </VStack>
       </VStack>
     </Container>

     {/* Auth Modal */}
     <Modal isOpen={isOpen} onClose={onClose} size="md">
       <ModalOverlay backdropFilter="blur(10px)" />
       <ModalContent bg="gray.800" color="white">
         <ModalHeader textAlign="center">
           {authMode === AUTH_MODES.LOGIN 
             ? (translations[language].login || "Đăng nhập")
             : (translations[language].register || "Đăng ký")
           }
         </ModalHeader>
         <ModalCloseButton />
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
               >
                 {authMode === AUTH_MODES.LOGIN 
                   ? (translations[language].login || "Đăng nhập")
                   : (translations[language].register || "Đăng ký")
                 }
               </Button>

               <Divider />

               {/* Social Login */}
               {renderSocialButtons()}

               <Text fontSize="sm" textAlign="center" opacity={0.8}>
                 {authMode === AUTH_MODES.LOGIN 
                   ? (translations[language].noAccount || "Chưa có tài khoản?")
                   : (translations[language].hasAccount || "Đã có tài khoản?")
                 }
                 <Button
                   variant="link"
                   color="blue.300"
                   fontSize="sm"
                   ml={1}
                   onClick={switchAuthMode}
                   _hover={{ color: 'blue.100' }}
                 >
                   {authMode === AUTH_MODES.LOGIN 
                     ? (translations[language].registerNow || "Đăng ký ngay")
                     : (translations[language].loginNow || "Đăng nhập ngay")
                   }
                 </Button>
               </Text>
             </VStack>
           </form>
         </ModalBody>
       </ModalContent>
     </Modal>
   </Box>
   </GoogleOAuthProvider>
 );
};

export default WelcomeScreen;