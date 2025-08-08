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
  Textarea,
} from '@chakra-ui/react';
import {
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
  
  // User message colors (keep original bubble design)
  const userBgColor = useColorModeValue('blue.500', 'blue.600');
  const userTextColor = 'white';
  
  // Bot message colors (textarea-like design)
  const botBgColor = useColorModeValue('');
  const botTextColor = useColorModeValue('gray.800', 'gray.100');
  const botBorderColor = useColorModeValue('gray.200', 'gray.600');
  const botHoverBorderColor = useColorModeValue('gray.300', 'gray.500');
  
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
             bg={useColorModeValue('gray.100', 'gray.700')}
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
   return text;
 };

 // Render user message with original bubble design
 if (isUser) {
   return (
     <HStack
       align="start"
       justify="flex-end"
       spacing={3}
       w="full"
       mb={4}
     >
       <VStack align="flex-end" spacing={2} maxW="70%">
         <Box
           bg={userBgColor}
           color={userTextColor}
           px={4}
           py={3}
           borderRadius="lg"
           borderBottomRightRadius="sm"
           boxShadow="sm"
           position="relative"
           minW="100px"
         >
           <Box fontSize="md" lineHeight="1.6">
             {formatMessageText(message.text)}
           </Box>
         </Box>
       </VStack>

      
     </HStack>
   );
 }

 // Render bot message with Claude-like textarea design
 return (
   <VStack spacing={3} w="full" align="stretch" mb={5}>
     <HStack align="start" spacing={3} w="full">
    
       
       <VStack align="stretch" spacing={2} flex="1" maxW="calc(100% - 60px)">
         {message.isLoading ? (
           <Box
             bg={botBgColor}
             border="none"
             borderColor={botBorderColor}
             borderRadius="md"
             p={4}
             minH="100px"
           >
             <HStack spacing={2} align="center">
               <Spinner size="sm" color="blue.500" />
               <Text fontSize="sm" color={botTextColor}>{message.text}</Text>
             </HStack>
           </Box>
         ) : (
           <Box
             bg={botBgColor}
             border="none"
             borderColor={botBorderColor}
             borderRadius="xl"
             p={0}
            
             position="relative"
             _hover={{
               borderColor: botHoverBorderColor
             }}
             transition="border-color 0.2s"
             overflow="hidden"
           >
             {message.text.includes('```') ? (
               <Box fontSize="sm" lineHeight="1.6" color={botTextColor} p={4}>
                 {formatMessageText(message.text)}
               </Box>
             ) : (
               <Text
                  whiteSpace="pre-wrap"
                  color={botTextColor}
                  fontSize="md"
                  lineHeight="1.6"
                  fontFamily="inherit"
                  px={4}
                  py={3}
                >
                  {message.text}
                </Text>

             )}
           </Box>
         )}

         {/* Message Actions */}
         {!message.isLoading && (
           <HStack spacing={1} justify="flex" opacity={1} _hover={{ opacity: 5 }}>
             <IconButton
               icon={isCopied ? <FaThumbsUp /> : <FaCopy />}
               ml="10px"
               size="xs"
               variant="ghost"
               onClick={handleCopy}
               aria-label={translations[language]?.copyMessage || 'Copy message'}
               title={isCopied ? 'Copied!' : 'Copy'}
               color={botTextColor}
               _hover={{
                 bg: useColorModeValue('gray.100', 'gray.700')
               }}
             />
             
             <IconButton
               icon={<FaThumbsUp />}
               size="xs"
               variant="ghost"
               aria-label="Like"
               color={botTextColor}
               _hover={{
                 bg: useColorModeValue('gray.100', 'gray.700')
               }}
             />
             
             <IconButton
               icon={<FaThumbsDown />}
               size="xs"
               variant="ghost"
               aria-label="Dislike"
               color={botTextColor}
               _hover={{
                 bg: useColorModeValue('gray.100', 'gray.700')
               }}
             />
           </HStack>
         )}
       </VStack>
     </HStack>
   </VStack>
 );
};

export default MessageBubble;