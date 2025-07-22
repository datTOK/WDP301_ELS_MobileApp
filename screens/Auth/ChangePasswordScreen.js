import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { authService, apiUtils } from '../../services';
import LoadingSpinner from '../../components/LoadingSpinner';
import { createGlobalStyles } from '../../utils/globalStyles';

const ChangePasswordScreen = ({ navigation }) => {
  const { userToken, signOut } = useContext(AuthContext);
  const { theme } = useTheme();
  const { showError, showSuccess, showWarning } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showError('New password and confirm new password do not match.');
      return;
    }

    // Check password requirements based on backend validation
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
    const isLengthValid = newPassword.length >= 8 && newPassword.length <= 50;

    if (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
      showError('Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number, 1 symbol, and be between 8-50 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword({
        oldPassword: currentPassword,
        newPassword: newPassword,
      });

      const result = apiUtils.parseResponse(response);

      if (result.data) {
        showSuccess('Password changed successfully! Please log in again with your new password.');
        
        // Clear all form data
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        
        // Log out user and clear all data after a short delay
        setTimeout(async () => {
          try {
            // Sign out which clears tokens and user data
            await signOut();
            
            // The AppNavigator will automatically switch to AuthStackScreen
            // when userToken becomes null, so we don't need to navigate manually
          } catch (error) {
            console.error('Error during logout after password change:', error);
            // Force sign out even if there's an error
            await signOut();
          }
        }, 2000);
      } else {
        showError(result.message || 'Failed to change password. Please try again.');
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Change Password</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Password Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Current Password</Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.colors.surfaceBackground,
            borderColor: theme.colors.borderColor 
          }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your current password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>New Password</Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.colors.surfaceBackground,
            borderColor: theme.colors.borderColor 
          }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter your new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm New Password Input */}
        <View style={styles.inputSection}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirm New Password</Text>
          <View style={[styles.inputContainer, { 
            backgroundColor: theme.colors.surfaceBackground,
            borderColor: theme.colors.borderColor 
          }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Confirm your new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showConfirmNewPassword}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showConfirmNewPassword ? 'eye-off' : 'eye'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={[styles.requirementsCard, { 
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.borderColor 
        }]}>
          <Text style={[styles.requirementsTitle, { color: theme.colors.text }]}>
            Password Requirements
          </Text>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={newPassword.length >= 8 && newPassword.length <= 50 ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={newPassword.length >= 8 && newPassword.length <= 50 ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              Between 8-50 characters long
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={/[a-z]/.test(newPassword) ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              At least 1 lowercase letter
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={/[A-Z]/.test(newPassword) ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              At least 1 uppercase letter
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/\d/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={/\d/.test(newPassword) ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              At least 1 number
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              At least 1 symbol (!@#$%^&*...)
            </Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons 
              name={newPassword === confirmNewPassword && newPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={newPassword === confirmNewPassword && newPassword.length > 0 ? theme.colors.success : theme.colors.textMuted} 
            />
            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
              Passwords match
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleChangePassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <LoadingSpinner size="small" color={theme.colors.buttonText} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
                Change Password
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { 
              backgroundColor: theme.colors.buttonSecondary,
              borderColor: theme.colors.borderColor 
            }]}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.buttonSecondaryText }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1D1D1D',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    marginLeft: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
  },
  requirementsTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginLeft: 8,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
  },
});

export default ChangePasswordScreen;
