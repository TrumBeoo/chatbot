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
      height="100%"
      minHeight="0"
    >
      {messages.length === 0 ? (
        <Box 
          height="100%" 
          overflowY="auto"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <EmptyState language={language} config={config} />
        </Box>
      ) : (
        <Box height="100%" overflowY="auto">
          <VStack
            spacing={6}
            align="stretch"
            py={6}
            px={4}
            maxW="4xl"
            mx="auto"
            minHeight="100%"
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
                    {translations[language].thinking}
                  </Text>
                </VStack>
              </Center>
            )}
            
            <div ref={messagesEndRef} />
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default ChatArea;