import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { createGlobalStyles } from '../../utils/globalStyles';
import LoadingSpinner from '../../components/LoadingSpinner';
import { authService, apiUtils } from '../../services';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signUp } = useAuth();
  const { theme } = useTheme();
  const { showError, showSuccess, showWarning } = useToast();
  const styles = createGlobalStyles(theme);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

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
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    // Check password requirements based on backend validation
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLengthValid = password.length >= 8 && password.length <= 50;

    if (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
      showError('Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 number, 1 symbol, and be between 8-50 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      const result = apiUtils.parseResponse(response);
      
      if (result.data) {
        showSuccess('Account created successfully! Please log in.');
        // Navigate to login screen after successful registration
        navigation.navigate('Login');
      } else {
        showError('Invalid response from server');
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Creating account..." />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Back to Home Button */}
      <View style={localStyles.headerNav}>
        <TouchableOpacity
          style={localStyles.backButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          <Text style={localStyles.backButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, localStyles.centeredContainer]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo and Header */}
        <Animated.View 
          style={[
            localStyles.headerSection,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: logoScale }
              ],
            }
          ]}
        >
          <Text style={localStyles.elsLogo}>ELS</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.bodyText}>
            Join ELS to start your English learning journey
          </Text>
        </Animated.View>

        {/* Signup Form */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={localStyles.centeredHeading}>Sign Up</Text>
          
          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Password</Text>
            <View style={localStyles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={localStyles.eyeIcon}
                onPress={togglePasswordVisibility}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={localStyles.inputContainer}>
            <Text style={localStyles.label}>Confirm Password</Text>
            <View style={localStyles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!confirmPasswordVisible}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={localStyles.eyeIcon}
                onPress={toggleConfirmPasswordVisibility}
              >
                <Ionicons
                  name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View style={[localStyles.requirementsCard, { 
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.borderColor 
          }]}>
            <Text style={[localStyles.requirementsTitle, { color: theme.colors.text }]}>
              Password Requirements
            </Text>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={password.length >= 8 && password.length <= 50 ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={password.length >= 8 && password.length <= 50 ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                Between 8-50 characters long
              </Text>
            </View>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={/[a-z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/[a-z]/.test(password) ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                At least 1 lowercase letter
              </Text>
            </View>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={/[A-Z]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/[A-Z]/.test(password) ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                At least 1 uppercase letter
              </Text>
            </View>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={/\d/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/\d/.test(password) ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                At least 1 number
              </Text>
            </View>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                At least 1 symbol (!@#$%^&*...)
              </Text>
            </View>
            <View style={localStyles.requirementItem}>
              <Ionicons 
                name={password === confirmPassword && password.length > 0 ? 'checkmark-circle' : 'ellipse-outline'} 
                size={16} 
                color={password === confirmPassword && password.length > 0 ? theme.colors.success : theme.colors.textMuted} 
              />
              <Text style={[localStyles.requirementText, { color: theme.colors.textSecondary }]}>
                Passwords match
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login Section */}
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Already have an account?{' '}
            <Text 
              style={localStyles.linkText}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in here
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  centeredContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  elsLogo: {
    fontSize: 48,
    fontFamily: 'Mulish-Bold',
    color: '#4CC2FF',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  centeredHeading: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    color: '#ededed',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    marginBottom: 8,
    color: '#ededed',
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
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
  linkText: {
    color: '#4CC2FF',
    fontFamily: 'Mulish-Bold',
  },
  headerNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
    color: '#ededed',
  },
});