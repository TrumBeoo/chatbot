import {
  Box,
  HStack,
  Input,
  Button,
  IconButton,
  Image,
} from '@chakra-ui/react';
import { translations } from '../../constants';

const ChatInput = ({ 
  inputText, 
  setInputText, 
  onSubmit, 
  isLoading, 
  language, 
  config 
}) => {
  return (
    <Box borderTop="1px solid #ccc" p={{ base: 2, md: 3 }} bg="whiteAlpha.800">
      <form onSubmit={onSubmit}>
        <HStack spacing={2} align="center">
          <Input
            placeholder={translations[language].inputPlaceholder}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            bg="blackAlpha.300"
            disabled={isLoading}
            borderRadius="full"
            borderColor="gray.300"
            fontSize={{ base: 'md', md: 'xl' }}
            _focus={{
              borderColor: `${config.theme.primary}.400`,
              boxShadow: `0 0 0 3px ${config.theme.primary}20`,
            }}
          />
          {config.features.voiceEnabled && (
            <IconButton
              icon={<Image src="img/voice-chat.png" boxSize="35px" />}
              size="md"
              variant="link"
              title="voice-icon"
              aria-label="voice-icon"
            />
          )}

          <Button
            type="submit"
            variant="link"
            colorScheme={config.theme.primary}
            aria-label="send"
          >
            <Image src="img/send_.png" boxSize="33px" />
          </Button>
        </HStack>
      </form>
    </Box>
  );
};

export default ChatInput;