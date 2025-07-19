import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { globalStyles } from '../utils/globalStyles';

const { width } = Dimensions.get('window');

const ConfirmationModal = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  confirmButtonStyle,
  cancelButtonStyle,
}) => {
  const { theme } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'alert-circle',
          iconColor: theme.colors.error,
          confirmButtonColor: theme.colors.error,
          confirmButtonHover: '#dc2626',
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: theme.colors.warning,
          confirmButtonColor: theme.colors.warning,
          confirmButtonHover: '#d97706',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle',
          iconColor: theme.colors.info,
          confirmButtonColor: theme.colors.info,
          confirmButtonHover: '#2563eb',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name={variantStyles.icon} 
              size={56} 
              color={variantStyles.iconColor} 
            />
          </View>
          
          <Text style={[styles.title, globalStyles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          
          <Text style={[styles.message, globalStyles.text, { color: theme.colors.textSecondary }]}>
            {message}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: theme.colors.borderDark },
                cancelButtonStyle,
              ]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: variantStyles.confirmButtonColor },
                confirmButtonStyle,
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    // Styles applied via props
  },
  confirmButton: {
    // Styles applied via props
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfirmationModal; 