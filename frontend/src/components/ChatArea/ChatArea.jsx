import { Box, VStack } from '@chakra-ui/react';
import MessageBubble from '../MessageBubble/MessageBubble';

const ChatArea = ({ 
  messages, 
  messagesEndRef, 
  language, 
  onPlayAudio, 
  isPlaying, 
  config 
}) => {
  return (
    <Box flex="1" overflowY="auto" p={{ base: 2, md: 5 }}>
      <VStack spacing={{ base: 2, md: 3 }} align="stretch">
        {messages.map((message, idx) => (
          <MessageBubble
            key={idx}
            message={message}
            language={language}
            onPlayAudio={onPlayAudio}
            isPlaying={isPlaying}
            config={config}
          />
        ))}
        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  );
};

export default ChatArea;