# Custom Dark Mode Implementation

This document describes the comprehensive dark mode implementation for the QBot chatbot application.

## Overview

The dark mode system provides a seamless theme switching experience with:
- Custom theme configuration
- Persistent theme preference storage
- Smooth transitions between light and dark modes
- Theme-aware components throughout the application
- Multiple toggle variants (icon, button, switch)

## Architecture

### 1. Theme Configuration (`src/theme/index.js`)

The theme system extends Chakra UI's default theme with:

- **Custom Color Palette**: Brand colors and dark/light variants
- **Component Overrides**: Dark mode styles for buttons, inputs, modals, etc.
- **Global Styles**: Body background, text colors, and transitions
- **Semantic Tokens**: Consistent color naming across components

```javascript
// Example semantic tokens
'bg-primary': {
  default: 'white',
  _dark: 'gray.800',
},
'text-primary': {
  default: 'gray.800',
  _dark: 'white',
}
```

### 2. Theme Context (`src/contexts/ThemeContext.jsx`)

Provides centralized theme management with:

- **Theme State**: Current color mode and toggle functions
- **Theme-Aware Values**: Pre-computed colors for different modes
- **Utility Functions**: Helper methods for theme-dependent styling
- **Persistent Storage**: Automatic saving/loading of theme preference

### 3. Theme Toggle Component (`src/components/ThemeToggle/ThemeToggle.jsx`)

Flexible toggle component with multiple variants:

- **Icon Variant**: Simple sun/moon icon button
- **Button Variant**: Button with icon and optional label
- **Switch Variant**: Toggle switch with visual indicators

## Implementation Details

### Theme Provider Setup

```javascript
// main.jsx
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'
import theme from './theme'
import ThemeProvider from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
```

### Using Theme in Components

```javascript
// Component example
import { useTheme } from '../../contexts/ThemeContext';

const MyComponent = () => {
  const { 
    bgPrimary, 
    textPrimary, 
    isDark, 
    toggleColorMode 
  } = useTheme();

  return (
    <Box bg={bgPrimary} color={textPrimary}>
      {/* Component content */}
    </Box>
  );
};
```

### Theme Toggle Usage

```javascript
// Different toggle variants
<ThemeToggle variant="icon" size="sm" />
<ThemeToggle variant="button" showLabel />
<ThemeToggle variant="switch" showLabel />
```

## Features

### 1. Persistent Theme Storage
- Theme preference saved to localStorage
- Automatic restoration on app reload
- Syncs across browser tabs

### 2. Smooth Transitions
- CSS transitions for color changes
- Prevents flash of unstyled content
- Configurable transition duration

### 3. Component Integration
- All major components support dark mode
- Consistent styling across the application
- Theme-aware hover and focus states

### 4. Accessibility
- Proper ARIA labels for toggle buttons
- Keyboard navigation support
- High contrast ratios in both modes

## Customization

### Adding New Theme Colors

```javascript
// In theme/index.js
const colors = {
  // Add custom colors
  custom: {
    50: '#f0f9ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  }
};

// Use in semantic tokens
const semanticTokens = {
  colors: {
    'custom-bg': {
      default: 'custom.50',
      _dark: 'custom.900',
    }
  }
};
```

### Creating Theme-Aware Components

```javascript
const CustomComponent = () => {
  const { getThemeColor } = useTheme();
  
  const customBg = getThemeColor('blue.50', 'blue.900');
  
  return <Box bg={customBg}>Content</Box>;
};
```

### Component Style Overrides

```javascript
// In theme/index.js
const components = {
  CustomComponent: {
    baseStyle: {
      _dark: {
        bg: 'gray.800',
        color: 'white',
      }
    }
  }
};
```

## File Structure

```
src/
├── theme/
│   └── index.js              # Main theme configuration
├── contexts/
│   └── ThemeContext.jsx      # Theme context and provider
├── components/
│   └── ThemeToggle/
│       └── ThemeToggle.jsx   # Toggle component
└── constants/
    └── index.js              # Theme-related translations
```

## Integration Points

### 1. Header Component
- Theme toggle in navigation bar
- Theme-aware logo and text colors

### 2. Welcome Screen
- Theme toggle in top navigation
- Consistent styling with main app

### 3. Chat Interface
- Theme-aware message bubbles
- Dark mode optimized input fields
- Consistent sidebar styling

### 4. Modals and Overlays
- Dark mode support for all modals
- Proper backdrop colors
- Theme-aware form elements

## Best Practices

### 1. Use Semantic Tokens
```javascript
// Good
<Box bg="bg-primary" color="text-primary" />

// Avoid
<Box bg={isDark ? 'gray.800' : 'white'} />
```

### 2. Consistent Color Usage
- Use the theme context for all color decisions
- Avoid hardcoded colors in components
- Test both light and dark modes

### 3. Accessibility Considerations
- Ensure sufficient contrast ratios
- Test with screen readers
- Provide clear visual feedback

## Testing

### Manual Testing Checklist
- [ ] Theme toggle works in all locations
- [ ] Theme preference persists across sessions
- [ ] All components render correctly in both modes
- [ ] Transitions are smooth and consistent
- [ ] No flash of unstyled content on load

### Automated Testing
```javascript
// Example test
describe('Theme Toggle', () => {
  it('should toggle between light and dark modes', () => {
    // Test implementation
  });
});
```

## Browser Support

- Modern browsers with CSS custom properties support
- Graceful degradation for older browsers
- Tested on Chrome, Firefox, Safari, Edge

## Performance Considerations

- Minimal runtime overhead
- CSS-based transitions for smooth performance
- Efficient re-rendering with React context

## Troubleshooting

### Common Issues

1. **Theme not persisting**: Check localStorage permissions
2. **Flash of unstyled content**: Ensure ColorModeScript is included
3. **Components not updating**: Verify theme context usage

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('chakra-ui-color-mode-debug', 'true');
```

## Future Enhancements

- System theme detection
- Multiple theme variants
- Theme scheduling (auto dark mode at night)
- Custom theme builder interface
- Theme export/import functionality

## Contributing

When adding new components:
1. Use theme context for colors
2. Test in both light and dark modes
3. Follow existing naming conventions
4. Update this documentation if needed