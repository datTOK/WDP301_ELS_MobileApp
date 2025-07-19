// screens/Auth/LoginScreen.js
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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { theme } = useTheme();
  const { showError, showSuccess } = useToast();
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

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login({ email, password });
      const result = apiUtils.parseResponse(response);
      
      if (result.data?.accessToken) {
        try {
          await signIn(result.data.accessToken);
          showSuccess('Login successful!');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        } catch (authError) {
          showError('Failed to save login session. Please try again.');
        }
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

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Logging in..." />;
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
          onPress={() => navigation.navigate('GuestHome')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          <Text style={localStyles.backButtonText}>Home</Text>
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.bodyText}>
            Sign in to continue your English learning journey
          </Text>
        </Animated.View>

        {/* Login Form */}
        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={localStyles.centeredHeading}>Login</Text>
          
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
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={localStyles.forgotPasswordButton}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={localStyles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Sign Up Section */}
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Don't have an account?{' '}
            <Text 
              style={localStyles.linkText}
              onPress={() => navigation.navigate('Signup')}
            >
              Sign up here
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const localStyles = StyleSheet.create({
  headerNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    zIndex: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
    color: '#ededed',
  },
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
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    color: '#4CC2FF',
  },
  linkText: {
    color: '#4CC2FF',
    fontFamily: 'Mulish-Bold',
  },
});