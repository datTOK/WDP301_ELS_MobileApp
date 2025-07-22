import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CustomToast = ({ 
  visible, 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  position = 'top' 
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
      cardBackground: '#2B2B2B',
      borderColor: '#1D1D1D',
      text: '#ededed',
      textMuted: '#AAAAAA',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#4CC2FF',
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
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after duration
      if (duration > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  const getToastStyles = () => {
    const baseStyles = {
      borderWidth: 1,
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.success,
          borderColor: currentTheme.colors.success,
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.error,
          borderColor: currentTheme.colors.error,
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.warning,
          borderColor: currentTheme.colors.warning,
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          backgroundColor: currentTheme.colors.info,
          borderColor: currentTheme.colors.info,
        };
    }
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#ffffff' };
      case 'error':
        return { icon: 'close-circle', color: '#ffffff' };
      case 'warning':
        return { icon: 'warning', color: '#ffffff' };
      case 'info':
      default:
        return { icon: 'information-circle', color: '#ffffff' };
    }
  };

  const { icon, color } = getIconAndColor();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        getToastStyles(),
        {
          transform: [{ translateY: slideAnim }],
          top: position === 'top' ? 50 : undefined,
          bottom: position === 'bottom' ? 50 : undefined,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        
        <Text style={[styles.message, { 
          color: '#ffffff',
          fontFamily: currentTheme.typography?.fontFamily?.regular || 'Mulish-Regular',
          fontSize: currentTheme.typography?.fontSize?.sm || 14,
          lineHeight: 20,
        }]}>
          {message}
        </Text>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={hideToast}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons 
            name="close" 
            size={16} 
            color="#ffffff" 
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default CustomToast; 