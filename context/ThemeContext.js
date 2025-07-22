import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// ELS Website-inspired color scheme - Updated to match exact web frontend colors
const lightTheme = {
  colors: {
    // Primary brand color
    primary: '#4CC2FF',
    primaryLight: '#48B2E9',
    primaryDark: '#42A7DC',
    
    // Background colors
    background: '#ffffff',
    cardBackground: '#f8f9fa',
    surfaceBackground: '#ffffff',
    
    // Text colors
    text: '#1a1a1a',
    textSecondary: '#666666',
    textMuted: '#999999',
    
    // Border colors
    borderColor: '#e0e0e0',
    borderColorLight: '#f0f0f0',
    
    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#4CC2FF',
    
    // Interactive colors
    buttonBackground: '#4CC2FF',
    buttonText: '#000000', // Black text on blue buttons like web
    buttonDisabled: '#cccccc',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 3, // Matching web's 3px
    md: 5, // Matching web's 5px
    lg: 8,
    xl: 12,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'Mulish-Regular',
      medium: 'Mulish-Medium',
      semiBold: 'Mulish-SemiBold',
      bold: 'Mulish-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 13, // Matching web's 13px
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28, // Matching web's 28px for titles
    },
  },
};

const darkTheme = {
  colors: {
    // Primary brand color (same as light for consistency)
    primary: '#4CC2FF',
    primaryLight: '#48B2E9',
    primaryDark: '#42A7DC', // Matching web frontend
    
    // Background colors (matching ELS website exactly)
    background: '#202020', // Main background
    cardBackground: '#2B2B2B', // Container background
    surfaceBackground: '#2D2D2D', // Input background
    
    // Text colors (matching ELS website exactly)
    text: '#ededed', // Main text color
    textSecondary: '#CFCFCF', // Secondary text color
    textMuted: '#AAAAAA', // Muted text color
    
    // Border colors (matching ELS website exactly)
    borderColor: '#1D1D1D', // Main border color
    borderColorLight: '#373737', // Lighter border
    
    // Status colors
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#4CC2FF',
    
    // Interactive colors (matching web exactly)
    buttonBackground: '#4CC2FF',
    buttonText: '#000000', // Black text on blue buttons like web
    buttonDisabled: '#373737', // Matching web's disabled button color
    buttonSecondary: '#373737', // Gray button background
    buttonSecondaryText: '#ededed', // White text on gray buttons
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 3, // Matching web's 3px
    md: 5, // Matching web's 5px for buttons and inputs
    lg: 8,
    xl: 12,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'Mulish-Regular',
      medium: 'Mulish-Medium',
      semiBold: 'Mulish-SemiBold',
      bold: 'Mulish-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 13, // Matching web's 13px for small text
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28, // Matching web's 28px for titles
    },
  },
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  // Default to dark mode for ELS app to match web
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Keep dark mode as default to match web frontend
    // setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};