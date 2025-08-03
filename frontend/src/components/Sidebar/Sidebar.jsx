// src/components/Sidebar/Sidebar.jsx
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import {
  FaPlus,
  FaTrash,
  FaUser,
  FaSignOutAlt,
  FaHistory,
  FaChevronDown,
} from 'react-icons/fa';
import { translations } from '../../constants';
import ConversationList from './ConversationList';

const Sidebar = ({
  isOpen,
  onClose,
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  user,
  language,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="sm">
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <FaHistory />
            <Text>{translations[language].chatHistory || "Lịch sử chat"}</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          <VStack h="full" spacing={0}>
            {/* New Chat Button */}
            <Box w="full" p={4} borderBottomWidth="1px" borderColor={borderColor}>
              <Button
                leftIcon={<FaPlus />}
                colorScheme="blue"
                variant="outline"
                w="full"
                onClick={onNewConversation}
                size="sm"
              >
                {translations[language].newChat || "Cuộc trò chuyện mới"}
              </Button>
            </Box>

            {/* Conversations List */}
            <Box flex="1" w="full" overflowY="auto">
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelectConversation={onSelectConversation}
                onDeleteConversation={onDeleteConversation}
                language={language}
              />
            </Box>

            {/* User Menu */}
            {user && (
              <Box w="full" p={4} borderTopWidth="1px" borderColor={borderColor}>
                <Menu>
                  <MenuButton as={Button} variant="ghost" w="full" p={2}>
                    <HStack spacing={3} w="full">
                      <Avatar size="sm" name={user.name} src={user.avatar} />
                      <VStack align="start" spacing={0} flex="1">
                        <Text fontSize="sm" fontWeight="medium" isTruncated maxW="150px">
                          {user.name}
                        </Text>
                        <Text fontSize="xs" color="gray.500" isTruncated maxW="150px">
                          {user.email}
                        </Text>
                      </VStack>
                      <FaChevronDown size="12px" />
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem icon={<FaUser />}>
                      {translations[language].profile || "Hồ sơ"}
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem icon={<FaSignOutAlt />} color="red.500">
                      {translations[language].logout || "Đăng xuất"}
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default Sidebar;