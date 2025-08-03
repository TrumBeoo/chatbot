// src/components/ChatHeader/ChatHeader.jsx
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

const ChatHeader = ({
  language,
  onLanguageChange,
  onToggleSidebar,
  user,
  onLogout,
  currentConversation,
  config,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      bg={bgColor}
      borderBottomWidth="1px"
      borderColor={borderColor}
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
              bg="blue.100"
              borderRadius="md"
              color="blue.600"
            >
              <FaRobot size="20px" />
            </Box>
            <Box>
              <Heading size="md" color="gray.800">
                {config.name}
              </Heading>
              {currentConversation && (
                <Text fontSize="sm" color="gray.500" isTruncated maxW="200px">
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
            >
              {translations[language].login || "Đăng nhập"}
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default ChatHeader;