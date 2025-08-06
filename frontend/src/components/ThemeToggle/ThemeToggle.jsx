// frontend/src/components/ThemeToggle/ThemeToggle.jsx
import React from 'react';
import {
  IconButton,
  Button,
  HStack,
  Text,
  useColorMode,
  Tooltip,
  Box,
} from '@chakra-ui/react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = ({ 
  variant = 'icon', // 'icon', 'button', 'switch'
  size = 'md',
  showLabel = false,
  label,
  ...props 
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isDark } = useTheme();

  const toggleLabel = label || (isDark ? 'Light Mode' : 'Dark Mode');
  const icon = isDark ? <FaSun /> : <FaMoon />;

  if (variant === 'button') {
    return (
      <Button
        leftIcon={icon}
        onClick={toggleColorMode}
        variant="ghost"
        size={size}
        {...props}
      >
        {showLabel && toggleLabel}
      </Button>
    );
  }

  if (variant === 'switch') {
    return (
      <HStack spacing={3} {...props}>
        <FaSun color={isDark ? 'gray' : 'orange'} />
        <Box
          as="button"
          onClick={toggleColorMode}
          w="50px"
          h="24px"
          bg={isDark ? 'brand.500' : 'gray.300'}
          borderRadius="full"
          position="relative"
          transition="all 0.2s"
          _focus={{ boxShadow: 'outline' }}
        >
          <Box
            w="20px"
            h="20px"
            bg="white"
            borderRadius="full"
            position="absolute"
            top="2px"
            left={isDark ? '28px' : '2px'}
            transition="all 0.2s"
            boxShadow="sm"
          />
        </Box>
        <FaMoon color={isDark ? 'blue' : 'gray'} />
        {showLabel && (
          <Text fontSize="sm" color="text-secondary">
            {toggleLabel}
          </Text>
        )}
      </HStack>
    );
  }

  // Default icon variant
  return (
    <Tooltip label={toggleLabel} placement="bottom">
      <IconButton
        icon={icon}
        onClick={toggleColorMode}
        variant="ghost"
        size={size}
        aria-label={toggleLabel}
        color={isDark ? 'yellow.400' : 'gray.600'}
        _hover={{
          color: isDark ? 'yellow.300' : 'gray.800',
          transform: 'scale(1.1)',
        }}
        transition="all 0.2s"
        {...props}
      />
    </Tooltip>
  );
};

export default ThemeToggle;