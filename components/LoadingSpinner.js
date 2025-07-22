import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LoadingSpinner = ({ 
  size = 'large', 
  color, 
  text, 
  containerStyle, 
  textStyle,
  fullScreen = false 
}) => {
  // Try to get theme, but provide fallbacks if not available
  let theme;
  let hasTheme = false;
  
  try {
    const themeContext = useTheme();
    if (themeContext && themeContext.theme) {
      theme = themeContext.theme;
      hasTheme = true;
    }
  } catch (error) {
    // Theme context not available
  }
  
  // Fallback theme values
  const fallbackTheme = {
    colors: {
      primary: '#4CC2FF',
      background: '#202020',
      textSecondary: '#AAAAAA',
    },
    typography: {
      fontFamily: {
        regular: 'Mulish-Regular',
      },
      fontSize: {
        sm: 14,
      },
    }
  };
  
  const currentTheme = hasTheme ? theme : fallbackTheme;
  const spinnerColor = color || currentTheme.colors.primary;
  const defaultText = fullScreen ? 'Loading application...' : 'Loading...';

  const SpinnerContent = () => (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={[
          styles.text, 
          { 
            color: currentTheme.colors.textSecondary,
            fontFamily: currentTheme.typography?.fontFamily?.regular || 'Mulish-Regular',
            fontSize: currentTheme.typography?.fontSize?.sm || 14,
          },
          textStyle
        ]}>
          {text}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, { backgroundColor: currentTheme.colors.background }]}>
        <SpinnerContent />
      </View>
    );
  }

  return <SpinnerContent />;
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 10,
    textAlign: 'center',
  },
});

export default LoadingSpinner; 