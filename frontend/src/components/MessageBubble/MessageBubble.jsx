// src/components/MessageBubble/MessageBubble.jsx
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  Spinner,
  useColorModeValue,
  Code,
  Divider,
} from '@chakra-ui/react';
import {
  FaPause,
  FaVolumeUp,
  FaCopy,
  FaThumbsUp,
  FaThumbsDown,
  FaRobot,
  FaUser,
} from 'react-icons/fa';
import { useState } from 'react';
import { translations } from '../../constants';

const MessageBubble = ({ message, language, config }) => {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.sender === 'user';
  
  const bgColor = useColorModeValue(
    isUser ? 'blue.500' : message.isError ? 'red.50' : 'white',
    isUser ? 'blue.600' : message.isError ? 'red.900' : 'gray.800'
  );
  
  const textColor = useColorModeValue(
    isUser ? 'white' : message.isError ? 'red.600' : 'gray.800',
    isUser ? 'white' : message.isError ? 'red.200' : 'white'
  );
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleCopy = async () => {
   try {
     await navigator.clipboard.writeText(message.text);
     setIsCopied(true);
     setTimeout(() => setIsCopied(false), 2000);
   } catch (error) {
     console.error('Failed to copy text:', error);
   }
 };

 const formatMessageText = (text) => {
   // Handle code blocks
   if (text.includes('```')) {
     const parts = text.split('```');
     return parts.map((part, index) => {
       if (index % 2 === 1) {
         return (
           <Code
             key={index}
             display="block"
             whiteSpace="pre-wrap"
             p={3}
             my={2}
             bg="gray.100"
             borderRadius="md"
             fontSize="sm"
           >
             {part}
           </Code>
         );
       }
       return <Text key={index}>{part}</Text>;
     });
   }
   return <Text>{text}</Text>;
 };

 return (
   <HStack
     align="start"
     justify={isUser ? 'flex-end' : 'flex-start'}
     spacing={3}
     w="full"
   >
     {!isUser && (
       <Avatar
         size="sm"
         bg="blue.500"
         icon={<FaRobot color="white" />}
       />
     )}
     
     <VStack align={isUser ? 'flex-end' : 'flex-start'} spacing={2} maxW="70%">
       <Box
         bg={bgColor}
         color={textColor}
         px={4}
         py={3}
         borderRadius="lg"
         borderBottomRightRadius={isUser ? 'sm' : 'lg'}
         borderBottomLeftRadius={isUser ? 'lg' : 'sm'}
         boxShadow="sm"
         border={!isUser ? '1px solid' : 'none'}
         borderColor={borderColor}
         position="relative"
         minW="100px"
       >
         {message.isLoading ? (
           <HStack spacing={2} align="center">
             <Spinner size="sm" color="blue.500" />
             <Text fontSize="sm">{message.text}</Text>
           </HStack>
         ) : (
           <Box fontSize="sm" lineHeight="1.6">
             {formatMessageText(message.text)}
           </Box>
         )}
       </Box>

       {/* Message Actions */}
       {!message.isLoading && !isUser && (
         <HStack spacing={1} opacity={0.7} _hover={{ opacity: 1 }}>
           <IconButton
             icon={isCopied ? <FaThumbsUp /> : <FaCopy />}
             size="xs"
             variant="ghost"
             onClick={handleCopy}
             aria-label={translations[language].copyMessage || 'Copy message'}
             title={isCopied ? 'Copied!' : 'Copy'}
           />
           
           
           <IconButton
             icon={<FaThumbsUp />}
             size="xs"
             variant="ghost"
             aria-label="Like"
           />
           
           <IconButton
             icon={<FaThumbsDown />}
             size="xs"
             variant="ghost"
             aria-label="Dislike"
           />
         </HStack>
       )}
     </VStack>

     {isUser && (
       <Avatar
         size="sm"
         bg="gray.500"
         icon={<FaUser color="white" />}
       />
     )}
   </HStack>
 );
};

export default MessageBubble;