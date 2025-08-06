// frontend/src/contexts/ThemeContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useColorMode, useColorModeValue } from '@chakra-ui/react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { colorMode, toggleColorMode, setColorMode } = useColorMode();
  
  // Load saved theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('chakra-ui-color-mode');
    if (savedTheme && savedTheme !== colorMode) {
      setColorMode(savedTheme);
    }
  }, [setColorMode, colorMode]);

  // Theme-aware values
  const bgPrimary = useColorModeValue('white', 'gray.800');
  const bgSecondary = useColorModeValue('gray.50', 'gray.900');
  const bgTertiary = useColorModeValue('gray.100', 'gray.700');
  const textPrimary = useColorModeValue('gray.800', 'white');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const textMuted = useColorModeValue('gray.500', 'gray.400');
  const borderPrimary = useColorModeValue('gray.200', 'gray.600');
  const borderSecondary = useColorModeValue('gray.100', 'gray.700');
  const accentPrimary = useColorModeValue('brand.500', 'brand.400');
  const accentSecondary = useColorModeValue('brand.600', 'brand.300');

  // Chat-specific theme values
  const chatBg = useColorModeValue('white', 'gray.800');
  const messageBubbleUser = useColorModeValue('brand.500', 'brand.600');
  const messageBubbleBot = useColorModeValue('gray.100', 'gray.700');
  const messageTextUser = useColorModeValue('white', 'white');
  const messageTextBot = useColorModeValue('gray.800', 'gray.100');
  const inputBg = useColorModeValue('white', 'gray.700');
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const headerBg = useColorModeValue('white', 'gray.800');

  // Hover and focus states
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('gray.100', 'gray.600');
  const focusBorder = useColorModeValue('brand.500', 'brand.400');

  // Shadow values
  const shadowSm = useColorModeValue('sm', 'dark-lg');
  const shadowMd = useColorModeValue('md', 'dark-lg');
  const shadowLg = useColorModeValue('lg', 'dark-lg');

  const themeValues = {
    // Core theme functions
    colorMode,
    toggleColorMode,
    setColorMode,
    isDark: colorMode === 'dark',
    isLight: colorMode === 'light',

    // Background colors
    bgPrimary,
    bgSecondary,
    bgTertiary,
    
    // Text colors
    textPrimary,
    textSecondary,
    textMuted,
    
    // Border colors
    borderPrimary,
    borderSecondary,
    
    // Accent colors
    accentPrimary,
    accentSecondary,

    // Chat-specific colors
    chatBg,
    messageBubbleUser,
    messageBubbleBot,
    messageTextUser,
    messageTextBot,
    inputBg,
    sidebarBg,
    headerBg,

    // Interactive states
    hoverBg,
    activeBg,
    focusBorder,

    // Shadows
    shadowSm,
    shadowMd,
    shadowLg,

    // Utility functions
    getThemeColor: (lightColor, darkColor) => 
      useColorModeValue(lightColor, darkColor),
  };

  return (
    <ThemeContext.Provider value={themeValues}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;