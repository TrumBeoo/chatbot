// src/components/ChatArea/EmptyState.jsx
import {
  Box,
  VStack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaRobot } from 'react-icons/fa';
import { translations } from '../../constants';

const EmptyState = ({ language, config }) => {
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const descColor = useColorModeValue('gray.600', 'gray.400');
  const botBgColor = useColorModeValue('blue.100', 'blue.900');
  const botIconColor = useColorModeValue('blue.600', 'blue.300');

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
          bg={botBgColor}
          borderRadius="full"
          color={botIconColor}
        >
          <FaRobot size="48px" />
        </Box>
        <VStack spacing={2} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color={textColor}>
            {translations[language].welcomeToChat || "Chào mừng đến với QBot"}
          </Text>
          <Text color={descColor} maxW="md">
            {translations[language].chatDescription}
          </Text>
        </VStack>
      </VStack>
    </VStack>
  );
};

export default EmptyState;