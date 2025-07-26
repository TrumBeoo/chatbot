import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { FaPause, FaVolumeUp } from 'react-icons/fa';
import { translations } from '../../constants';

const MessageBubble = ({ message, language, onPlayAudio, isPlaying, config }) => {
  return (
    <Box
      maxW={{ base: '90%', md: '75%' }}
      p={{ base: 2, md: 3 }}
      rounded="lg"
      alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
      bg={message.sender === 'user' ? `${config.theme.primary}.500` : 'white'}
      color={message.sender === 'user' ? 'white' : 'black'}
      boxShadow="md"
      wordBreak="break-word"
      opacity={message.isLoading ? 0.7 : 1}
      border="1px solid"
      borderColor={message.sender === 'user' ? `${config.theme.primary}.500` : 'gray.200'}
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-1px)',
        boxShadow: 'lg',
      }}
    >
      <VStack align="stretch" spacing={2}>
        {message.isLoading ? (
          <HStack spacing={2} align="center">
            <Spinner size="sm" color={`${config.theme.primary}.500`} />
            <Text fontSize={{ base: 'sm', md: 'md' }}>{message.text}</Text>
          </HStack>
        ) : (
          <Text fontSize={{ base: 'sm', md: 'md' }}>{message.text}</Text>
        )}
        
        {/* Audio controls for bot messages */}
        {message.sender === 'bot' && message.audioUrl && config.features.voiceEnabled && (
          <HStack justify="flex-end" spacing={2}>
            <IconButton
              icon={isPlaying ? <FaPause /> : <FaVolumeUp />}
              size="sm"
              variant="ghost"
              colorScheme={config.theme.primary}
              onClick={() => onPlayAudio(message.audioUrl)}
              aria-label={translations[language].playAudio}
              title={isPlaying ? translations[language].pauseAudio : translations[language].playAudio}
            />
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default MessageBubble;