// src/components/ChatInput/ChatInput.jsx
import {
  Box,
  Flex,
  Textarea,
  IconButton,
  Tooltip,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaPaperPlane, FaPlus } from 'react-icons/fa';
import { useRef, useEffect } from 'react';
import { translations } from '../../constants';

const ChatInput = ({
  inputText,
  setInputText,
  onSubmit,
  isLoading,
  language,
  config,
  onVoiceClick,
  onExtraClick
}) => {
  const textareaRef = useRef(null);

  const bgColor = useColorModeValue('#f7f7f8', '#1e1e1f');
  const inputBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.700');
  const focusBorderColor = useColorModeValue('#10a37f', '#10a37f');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const canSend = inputText.trim() && !isLoading;

  return (
    <Flex justify="center" px={4} py={4} bg={bgColor}>
      <Box as="form" onSubmit={onSubmit} w="100%" maxW="750px">
      <Flex
  align="center"
  bg="gray.300"
  border="solid"
  borderColor={borderColor}
  borderRadius={{base: "full", md: "3xl"}}
  px={3}
  py={3}
  _focusWithin={{
    borderColor: focusBorderColor,
    boxShadow: `0 0 0 1px ${focusBorderColor}`,
  }}
>
  <Tooltip label="Thêm tiện ích">
    <IconButton
      icon={<FaPlus />}
      size="sm"
      variant="ghost"
      aria-label="more"
      onClick={onExtraClick || (() => console.log("Extra clicked"))}
      borderRadius="full"
      mr={2}
    />
  </Tooltip>

  <Textarea
    ref={textareaRef}
    placeholder={translations[language].inputPlaceholder}
    value={inputText}
    onChange={(e) => setInputText(e.target.value)}
    onKeyDown={handleKeyPress}
    disabled={isLoading}
    resize="none"
    minH="36px"
    mt="20px"
    border="none"
    bg="transparent"
    boxShadow="none"
    fontSize={{md:"20px", base: "13px"}}
    px="10px" 
    py=""
    
    _focus={{ outline: 'none', boxShadow: 'none' }}
    _disabled={{ opacity: 0.6, cursor: 'not-allowed' }}
    flex="1"
  />

  {config?.features?.voiceEnabled && (
    <Tooltip label="Ghi âm" hasArrow>
      <IconButton
        icon={<Image src="/img/voice-chat.png" boxSize="24px" alt="voice" />}
        size="sm"
        variant="ghost"
        aria-label="voice"
        onClick={onVoiceClick || (() => console.log('Voice Click'))}
        borderRadius="full"
        mx={1}
      />
    </Tooltip>
  )}

  <Tooltip label={translations[language].sendMessage || 'Gửi'}>
    <IconButton
      icon={<FaPaperPlane />}
      colorScheme="blue"
      type="submit"
      size="sm"
      isDisabled={!canSend}
      isLoading={isLoading}
      borderRadius="full"
      ml={1}
    />
  </Tooltip>
</Flex>

      </Box>
    </Flex>
  );
};

export default ChatInput;
