// src/components/ChatArea/ChatArea.jsx
import {
  Box,
  VStack,
  Center,
  Text,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import MessageBubble from '../MessageBubble/MessageBubble';
import EmptyState from './EmptyState';
import { translations } from '../../constants';

const ChatArea = ({
  messages,
  messagesEndRef,
  language,
  isLoading,
  config,
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box
      flex="1"
      overflowY="auto"
      bg={bgColor}
      position="relative"
    >
      {messages.length === 0 ? (
        <EmptyState language={language} config={config} />
      ) : (
        <VStack
          spacing={6}
          align="stretch"
          py={6}
          px={4}
          maxW="4xl"
          mx="auto"
        >
          {messages.map((message, idx) => (
            <MessageBubble
              key={message.id || idx}
              message={message}
              language={language}
              config={config}
            />
          ))}
          
          {isLoading && (
            <Center py={4}>
              <VStack spacing={2}>
                <Spinner color="blue.500" />
                <Text fontSize="sm" color="gray.500">
                  {translations[language].thinking || "Đang suy nghĩ..."}
                </Text>
              </VStack>
            </Center>
          )}
          
          <div ref={messagesEndRef} />
        </VStack>
      )}
    </Box>
  );
};

export default ChatArea;