// frontend/src/components/ChatbotHeader/ChatbotHeader.jsx
import React from 'react';
import {
  Box,
  HStack,
  Heading,
  Text,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Badge,
  Flex,
  useColorModeValue,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FaBars,
  FaLanguage,
  FaUser,
  FaSignOutAlt,
  FaRobot,
  FaChevronDown,
} from 'react-icons/fa';
import { translations } from '../../constants';
import AuthModal from '../Auth/AuthModal';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

const ChatHeader = ({
  language,
  onLanguageChange,
  onToggleSidebar,
  user,
  onLogout,
  onLogin,
  onRegister,
  onSocialLogin,
  currentConversation,
  config,
}) => {
  const { headerBg, borderPrimary, textPrimary, textSecondary, isDark } = useTheme();
  
  // Modal controls
  const { isOpen: isAuthModalOpen, onOpen: openAuthModal, onClose: closeAuthModal } = useDisclosure();

  return (
    <>
      <Box
        bg={headerBg}
        borderBottomWidth="1px"
        borderColor={borderPrimary}
        px={4}
        py={3}
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center">
          {/* Left Section */}
          <HStack spacing={4}>
            <IconButton
              icon={<FaBars />}
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            />
            
            <HStack spacing={3}>
              <Box
                p={2}
                bg={isDark ? 'blue.800' : 'blue.100'}
                borderRadius="md"
                color={isDark ? 'blue.300' : 'blue.600'}
              >
                <FaRobot size="20px" />
              </Box>
              <Box>
                <Heading size="md" color={textPrimary}>
                  {config.name}
                </Heading>
                {currentConversation && (
                  <Text fontSize="sm" color={textSecondary} isTruncated maxW="200px">
                    {currentConversation.title || translations[language].newConversation}
                  </Text>
                )}
              </Box>
            </HStack>

            <Badge>
              <HStack>
                
              </HStack>
            </Badge>
          </HStack>

          {/* Right Section */}
          <HStack spacing={3}>
            <ThemeToggle size="sm" />
            
            <Button
              leftIcon={<FaLanguage />}
              onClick={onLanguageChange}
              variant="ghost"
              size="sm"
            >
              {translations[language].languageSwitch}
            </Button>

            {user ? (
              <Menu>
                <MenuButton as={Button} variant="ghost" size="sm">
                  <HStack spacing={2}>
                    <Avatar size="sm" name={user.name} src={user.avatar} />
                    <Text fontSize="sm">{user.name}</Text>
                    <FaChevronDown size="12px" />
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FaUser />}>
                    {translations[language].profile || "Hồ sơ"}
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FaSignOutAlt />} onClick={onLogout} color="red.500">
                    {translations[language].logout || "Đăng xuất"}
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                leftIcon={<FaUser />}
                colorScheme="blue"
                variant="outline"
                size="sm"
                onClick={openAuthModal}
                _hover={{
                  transform: 'translateY(-1px)',
                  boxShadow: 'md'
                }}
                _active={{ transform: 'translateY(0)' }}
                transition="all 0.2s"
              >
                {translations[language].login || "Đăng nhập"}
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onLogin={onLogin}
        onRegister={onRegister}
        onSocialLogin={onSocialLogin}
        language={language}
        initialMode="login"
      />
    </>
  );
};

export default ChatHeader;