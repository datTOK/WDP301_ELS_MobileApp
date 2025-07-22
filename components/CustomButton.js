import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { globalStyles } from '../utils/globalStyles';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    const baseStyles = {
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.borderDark : theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 1,
        };
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
          borderWidth: 1,
        };
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.borderDark : theme.colors.error,
          borderColor: theme.colors.error,
          borderWidth: 1,
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.borderDark : theme.colors.warning,
          borderColor: theme.colors.warning,
          borderWidth: 1,
        };
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: disabled ? theme.colors.borderDark : theme.colors.success,
          borderColor: theme.colors.success,
          borderWidth: 1,
        };
      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          minHeight: 28,
        };
      case 'large':
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          minHeight: 48,
        };
      case 'medium':
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
          minHeight: 36,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    
    switch (variant) {
      case 'primary':
        return '#000000'; // Black text on primary blue
      case 'secondary':
        return theme.colors.text;
      case 'danger':
      case 'warning':
      case 'success':
        return '#ffffff'; // White text on colored backgrounds
      case 'ghost':
        return theme.colors.text;
      default:
        return theme.colors.text;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 16;
      case 'medium':
      default:
        return 14;
    }
  };

  const renderIcon = () => {
    if (!icon || loading) return null;
    
    const iconSize = size === 'small' ? 14 : size === 'large' ? 20 : 16;
    const iconColor = getTextColor();
    
    return (
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={iconColor}
        style={{ 
          marginRight: iconPosition === 'left' ? 8 : 0,
          marginLeft: iconPosition === 'right' ? 8 : 0,
        }}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <ActivityIndicator 
            size="small" 
            color={getTextColor()} 
            style={{ marginRight: 8 }}
          />
          <Text style={[
            globalStyles.text,
            {
              color: getTextColor(),
              fontSize: getTextSize(),
              fontWeight: '600',
            },
            textStyle,
          ]}>
            Loading...
          </Text>
        </>
      );
    }

    if (children) {
      return children;
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <Text style={[
          globalStyles.text,
          {
            color: getTextColor(),
            fontSize: getTextSize(),
            fontWeight: '600',
          },
          textStyle,
        ]}>
          {title}
        </Text>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        getVariantStyles(),
        getSizeStyles(),
        disabled && { opacity: 0.6 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

export default CustomButton; 