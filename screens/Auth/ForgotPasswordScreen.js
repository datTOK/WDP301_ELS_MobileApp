import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { authService, apiUtils } from '../../services';
import LoadingSpinner from '../../components/LoadingSpinner';
import { createGlobalStyles } from '../../utils/globalStyles';

const ForgotPasswordScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { showError, showSuccess } = useToast();
  const globalStyles = createGlobalStyles(theme);

  // State management
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [pinSent, setPinSent] = useState(false);
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const hiddenInputRef = useRef(null);

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePinChange = (value) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to 6 digits
    const limitedValue = numericValue.slice(0, 6);
    
    // Split into individual digits and pad with empty strings
    const newPin = limitedValue.split('').concat(Array(6 - limitedValue.length).fill(''));
    setPin(newPin);
  };

  const handleResendPin = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      await authService.forgotPassword(email);
      showSuccess('PIN resent to your email');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message || 'Failed to resend PIN. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // Password requirement check functions
  const checkPasswordRequirements = (password) => {
    return {
      length: password.length >= 8 && password.length <= 50,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,50}$/.test(password);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    
    // Show password requirements when user starts typing
    if (value.length > 0) {
      setShowPasswordRequirements(true);
    } else {
      setShowPasswordRequirements(false);
    }
  };

  const handleVerifyPin = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      showError('Please enter the complete 6-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      await authService.confirmResetPasswordPin(email, pinString);
      showSuccess('PIN verified successfully!');
      setPinVerified(true);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message || 'Invalid PIN. Please try again.');
      // Clear PIN on error
      setPin(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validatePassword(password)) {
      showError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        newPassword: password,
      });
      showSuccess('Password reset successfully! Please log in with your new password.');
      navigation.navigate('Login');
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const errors = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Invalid email address';
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      showSuccess('Password reset PIN sent to your email.');
      setPinSent(true);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message || 'Failed to send reset PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Forgot Password
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {!pinSent ? (
            <>
              {/* Email Input */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Email Address
                </Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.surfaceBackground,
                  borderColor: errors.email ? theme.colors.error : theme.colors.borderColor 
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={theme.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.email && (
                  <Text style={[styles.errorText, { color: theme.colors.error }]}>
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" color={theme.colors.buttonText} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
                      Send PIN
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.secondaryButton, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.borderColor 
                  }]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : pinVerified ? (
            <>
              {/* Success Message */}
              <View style={styles.successSection}>
                <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                <Text style={[styles.successText, { color: theme.colors.success }]}>
                  PIN verified successfully
                </Text>
                <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]}>
                  Enter your new password
                </Text>
              </View>

              {/* New Password */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  New Password
                </Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.surfaceBackground,
                  borderColor: theme.colors.borderColor 
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Enter new password"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={handlePasswordChange}
                    onFocus={() => password.length > 0 && setShowPasswordRequirements(true)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Requirements */}
              {showPasswordRequirements && (
                <View style={[styles.requirementsCard, { 
                  backgroundColor: theme.colors.cardBackground,
                  borderColor: theme.colors.borderColor 
                }]}>
                  <Text style={[styles.requirementsTitle, { color: theme.colors.text }]}>
                    Password Requirements
                  </Text>
                  {(() => {
                    const requirements = checkPasswordRequirements(password);
                    return (
                      <>
                        <View style={styles.requirementItem}>
                          <Ionicons 
                            name={requirements.length ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={requirements.length ? theme.colors.success : theme.colors.textMuted} 
                          />
                          <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                            Between 8-50 characters long
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons 
                            name={requirements.lowercase ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={requirements.lowercase ? theme.colors.success : theme.colors.textMuted} 
                          />
                          <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                            At least 1 lowercase letter
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons 
                            name={requirements.uppercase ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={requirements.uppercase ? theme.colors.success : theme.colors.textMuted} 
                          />
                          <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                            At least 1 uppercase letter
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons 
                            name={requirements.number ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={requirements.number ? theme.colors.success : theme.colors.textMuted} 
                          />
                          <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                            At least 1 number
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons 
                            name={requirements.symbol ? 'checkmark-circle' : 'ellipse-outline'} 
                            size={16} 
                            color={requirements.symbol ? theme.colors.success : theme.colors.textMuted} 
                          />
                          <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                            At least 1 symbol (!@#$%^&*...)
                          </Text>
                        </View>
                      </>
                    );
                  })()}
                </View>
              )}

              {/* Confirm Password */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Confirm New Password
                </Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: theme.colors.surfaceBackground,
                  borderColor: theme.colors.borderColor 
                }]}>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={theme.colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton, 
                    { 
                      backgroundColor: theme.colors.primary,
                      opacity: (!validatePassword(password) || password !== confirmPassword) ? 0.5 : 1
                    }
                  ]}
                  onPress={handleResetPassword}
                  disabled={isLoading || !validatePassword(password) || password !== confirmPassword}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" color={theme.colors.buttonText} />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
                      Reset Password
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.secondaryButton, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.borderColor 
                  }]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Success Message */}
              <View style={styles.successSection}>
                <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
                <Text style={[styles.successText, { color: theme.colors.success }]}>
                  PIN sent successfully
                </Text>
                <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]}>
                  Enter the 6-digit PIN from your email
                </Text>
                <Text style={[styles.emailText, { color: theme.colors.primary }]}>
                  {email}
                </Text>
              </View>

              {/* PIN Input */}
              <View style={styles.pinSection}>
                <TouchableOpacity
                  style={styles.pinInputContainer}
                  onPress={() => {
                    // Focus the hidden input when user taps anywhere in the PIN area
                    if (hiddenInputRef.current) {
                      hiddenInputRef.current.focus();
                    }
                  }}
                  activeOpacity={1}
                >
                  <TextInput
                    ref={hiddenInputRef}
                    style={[
                      styles.hiddenPinInput,
                      { color: theme.colors.text }
                    ]}
                    value={pin.join('')}
                    onChangeText={handlePinChange}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus={true}
                    placeholder="Enter 6-digit PIN"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                  <View style={styles.pinContainer}>
                    {pin.map((digit, index) => (
                      <View
                        key={index}
                        style={[
                          styles.pinBox,
                          { 
                            backgroundColor: theme.colors.surfaceBackground,
                            borderColor: theme.colors.borderColor,
                          }
                        ]}
                      >
                        <Text style={[
                          styles.pinDigit,
                          { color: theme.colors.text }
                        ]}>
                          {digit}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryButton, 
                      { 
                        backgroundColor: theme.colors.buttonSecondary,
                        borderColor: theme.colors.borderColor,
                        flex: 1,
                        marginRight: 8
                      }
                    ]}
                    onPress={handleResendPin}
                    disabled={isResending || resendCooldown > 0}
                    activeOpacity={0.8}
                  >
                    {isResending ? (
                      <LoadingSpinner size="small" color={theme.colors.buttonSecondaryText} />
                    ) : (
                      <Text style={[styles.secondaryButtonText, { color: theme.colors.buttonSecondaryText }]}>
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend PIN'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryButton, 
                      { 
                        backgroundColor: theme.colors.primary,
                        flex: 1,
                        marginLeft: 8,
                        opacity: pin.join('').length !== 6 ? 0.5 : 1
                      }
                    ]}
                    onPress={handleVerifyPin}
                    disabled={isLoading || pin.join('').length !== 6}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <LoadingSpinner size="small" color={theme.colors.buttonText} />
                    ) : (
                      <Text style={[styles.primaryButtonText, { color: theme.colors.buttonText }]}>
                        Verify PIN
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.secondaryButton, { 
                    backgroundColor: 'transparent',
                    borderColor: theme.colors.borderColor 
                  }]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                    Back to Login
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
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
  errorText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginTop: 8,
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  successText: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    textAlign: 'center',
  },
  pinSection: {
    marginBottom: 32,
  },
  pinInputContainer: {
    alignItems: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  hiddenPinInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  pinBox: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigit: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
  },
  requirementsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
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
  buttonRow: {
    flexDirection: 'row',
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

export default ForgotPasswordScreen; 