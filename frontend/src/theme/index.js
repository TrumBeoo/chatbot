  // frontend/src/theme/index.js
import { extendTheme } from '@chakra-ui/react';

// Custom color palette
const colors = {
  brand: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3',
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  dark: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923',
  },
  light: {
    50: '#ffffff',
    100: '#f8f9fa',
    200: '#f1f3f4',
    300: '#e8eaed',
    400: '#dadce0',
    500: '#9aa0a6',
    600: '#5f6368',
    700: '#3c4043',
    800: '#202124',
    900: '#000000',
  }
};

// Component style overrides
const components = {
  Button: {
    variants: {
      solid: {
        _dark: {
          bg: 'brand.600',
          color: 'white',
          _hover: {
            bg: 'brand.700',
          },
        },
      },
      ghost: {
        _dark: {
          color: 'gray.300',
          _hover: {
            bg: 'gray.700',
            color: 'white',
          },
        },
      },
      outline: {
        _dark: {
          borderColor: 'gray.600',
          color: 'gray.300',
          _hover: {
            bg: 'gray.700',
            borderColor: 'gray.500',
          },
        },
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          _dark: {
            borderColor: 'gray.600',
            bg: 'gray.800',
            color: 'white',
            _hover: {
              borderColor: 'gray.500',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
            _placeholder: {
              color: 'gray.400',
            },
          },
        },
      },
    },
  },
  Textarea: {
    variants: {
      outline: {
        _dark: {
          borderColor: 'gray.600',
          bg: 'gray.800',
          color: 'white',
          _hover: {
            borderColor: 'gray.500',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _placeholder: {
            color: 'gray.400',
          },
        },
      },
    },
  },
  Menu: {
    baseStyle: {
      list: {
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.600',
        },
      },
      item: {
        _dark: {
          bg: 'gray.800',
          color: 'white',
          _hover: {
            bg: 'gray.700',
          },
          _focus: {
            bg: 'gray.700',
          },
        },
      },
    },
  },
  Modal: {
    baseStyle: {
      dialog: {
        _dark: {
          bg: 'gray.800',
          color: 'white',
        },
      },
      header: {
        _dark: {
          borderBottomColor: 'gray.600',
        },
      },
      footer: {
        _dark: {
          borderTopColor: 'gray.600',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.600',
        },
      },
    },
  },
  Divider: {
    baseStyle: {
      _dark: {
        borderColor: 'gray.600',
      },
    },
  },
};

// Global styles
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      transition: 'background-color 0.2s, color 0.2s',
    },
    '*::placeholder': {
      color: props.colorMode === 'dark' ? 'gray.400' : 'gray.500',
    },
    '*, *::before, &::after': {
      borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
    },
  }),
};

// Theme configuration
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
  disableTransitionOnChange: false,
};

// Semantic tokens for consistent theming
const semanticTokens = {
  colors: {
    'bg-primary': {
      default: 'white',
      _dark: 'gray.800',
    },
    'bg-secondary': {
      default: 'gray.50',
      _dark: 'gray.900',
    },
    'bg-tertiary': {
      default: 'gray.100',
      _dark: 'gray.700',
    },
    'text-primary': {
      default: 'gray.800',
      _dark: 'white',
    },
    'text-secondary': {
      default: 'gray.600',
      _dark: 'gray.300',
    },
    'text-muted': {
      default: 'gray.500',
      _dark: 'gray.400',
    },
    'border-primary': {
      default: 'gray.200',
      _dark: 'gray.600',
    },
    'border-secondary': {
      default: 'gray.100',
      _dark: 'gray.700',
    },
    'accent-primary': {
      default: 'brand.500',
      _dark: 'brand.400',
    },
    'accent-secondary': {
      default: 'brand.600',
      _dark: 'brand.300',
    },
  },
};

const theme = extendTheme({
  config,
  colors,
  components,
  styles,
  semanticTokens,
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  shadows: {
    outline: '0 0 0 3px rgba(33, 150, 243, 0.6)',
  },
});

export default theme;