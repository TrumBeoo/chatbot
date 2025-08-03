// src/components/ChatArea/EmptyState.jsx
import {
  Box,
  VStack,
  Text,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaRobot, FaLightbulb, FaQuestionCircle, FaCode, FaLanguage } from 'react-icons/fa';
import { translations } from '../../constants';

const SuggestionCard = ({ icon, title, description, onClick }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box
      p={4}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      cursor="pointer"
      _hover={{ bg: hoverBgColor, transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      onClick={onClick}
    >
      <HStack spacing={3}>
        <Icon as={icon} color="blue.500" boxSize={5} />
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium" fontSize="sm">
            {title}
          </Text>
          <Text fontSize="xs" color="gray.600">
            {description}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

const EmptyState = ({ language, config }) => {
  const suggestions = [
    {
      icon: FaQuestionCircle,
      title: translations[language].askQuestion || "Đặt câu hỏi",
      description: translations[language].askQuestionDesc || "Hỏi bất cứ điều gì bạn muốn biết",
    },
    {
      icon: FaLightbulb,
      title: translations[language].getIdeas || "Lấy ý tưởng",
      description: translations[language].getIdeasDesc || "Brainstorm và sáng tạo cùng AI",
    },
    {
      icon: FaCode,
      title: translations[language].helpCoding || "Hỗ trợ lập trình",
      description: translations[language].helpCodingDesc || "Giải quyết vấn đề code",
    },
    {
      icon: FaLanguage,
      title: translations[language].translate || "Dịch thuật",
      description: translations[language].translateDesc || "Dịch văn bản sang nhiều ngôn ngữ",
    },
  ];

  return (
    <VStack
      spacing={8}
      justify="center"
      align="center"
      h="full"
      px={6}
      py={12}
    >
      {/* Bot Avatar */}
      <VStack spacing={4}>
        <Box
          p={6}
          bg="blue.100"
          borderRadius="full"
          color="blue.600"
        >
          <FaRobot size="48px" />
        </Box>
        <VStack spacing={2} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="gray.800">
            {translations[language].welcomeToChat || "Chào mừng đến với QBot"}
          </Text>
          <Text color="gray.600" maxW="md">
            {translations[language].chatDescription || 
             "Tôi là trợ lý AI của bạn. Hãy bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn!"}
          </Text>
        </VStack>
      </VStack>

      {/* Suggestions */}
      <VStack spacing={3} w="full" maxW="2xl">
        <Text fontSize="sm" color="gray.500" mb={2}>
          {translations[language].suggestions || "Gợi ý:"}
        </Text>
        <VStack spacing={3} w="full">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={index}
              icon={suggestion.icon}
              title={suggestion.title}
              description={suggestion.description}
              onClick={() => {
                // Handle suggestion click
                console.log('Suggestion clicked:', suggestion.title);
              }}
            />
          ))}
        </VStack>
      </VStack>
    </VStack>
  );
};

export default EmptyState;