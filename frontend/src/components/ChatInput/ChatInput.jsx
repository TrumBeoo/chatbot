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
import { HiArrowUp } from "react-icons/hi";
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
 const inputRef = useRef(null);
 const textareaRef = useRef(null);



  const bgColor = useColorModeValue('#f7f7f8');
  const inputContainerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const focusBorderColor = useColorModeValue('#10a37f', '#10a37f');
  const textColor = useColorModeValue('black', 'white');
  const placeholderColor = useColorModeValue('gray.500', 'gray.400');

   // Tự động focus khi component mount hoặc gửi xong tin nhắn
  useEffect(() => {
  if (!isLoading) {
    textareaRef.current?.focus();
  }
}, [isLoading]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        
        onSubmit(); // hoặc tùy logic gửi
        setInputText('');

        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      };



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const canSend = inputText.trim() && !isLoading;

  return (
    <Flex justify="center" px={0} py={5} bg={bgColor}>
      <Box as="form" onSubmit={onSubmit} w="100%" maxW="700px">
        <Flex
          align="center"
         
          bg={inputContainerBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius={{ base: "3xl", md: "3xl" }}
          px={3}
          py={{ md: "15px", base: "5px" }}
          boxShadow="sm"
          _focusWithin={{
            borderColor: focusBorderColor,
            boxShadow: `0 0 0 1px ${focusBorderColor}`,
          }}
          _hover={{
            borderColor: focusBorderColor,
          }}
          transition="all 0.2s"
        >
         <Tooltip label={translations[language].addExtension}>
            <IconButton
              icon={<FaPlus />}
              size="sm"
              variant="ghost"
              aria-label="more"
              onClick={onExtraClick || (() => console.log("Extra clicked"))}
              borderRadius="full"
              mr={2}
              color={textColor}
              _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
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
              rows={1}
              variant="unstyled"
              minH="36px"
              maxH="200px"
              border="none"
              bg="transparent"
              boxShadow="none"
              fontSize={{ md: "15px", base: "15px" }}
              px="10px"
              py="10px" //căn padding giữa
              color={textColor}
              _placeholder={{ color: placeholderColor }}
              _focus={{ outline: 'none', boxShadow: 'none' }}
              _disabled={{ opacity: 0.6, cursor: 'text' }}
              flex="1"
            />


          {config?.features?.voiceEnabled && (
            <Tooltip label={translations[language].voiceAssistant}>
              <IconButton
                icon={<Image src="/img/voice-chat.png" boxSize="30px" alt="voice" />}
                size="sm"
                variant="ghost"
                aria-label="voice"
                onClick={onVoiceClick || (() => console.log('Voice Click'))}
                borderRadius="full"
                mx={1}
                _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
              />
            </Tooltip>
          )}

          <Tooltip label={translations[language].sendMessage}>
            <IconButton
               icon={<HiArrowUp />}
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