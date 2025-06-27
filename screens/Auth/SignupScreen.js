import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSignup = async () => {
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Signup Failed', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Signup Failed', 'Passwords do not match.');
      return;
    }

    console.log('Attempting signup with:', { name, email, password });
    try {
      const response = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      console.log('Signup API Response:', data);

      if (response.ok) {
        Alert.alert('Success', data.message || 'Account created successfully!');
        navigation.replace('Login');
      } else {
        Alert.alert('Signup Failed', data.message || 'An unknown error occurred during signup.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Could not connect to the server. Please try again later.');
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >

      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Register Account</Text>
      </View>

      <View style={styles.whiteBridge} />

      <View style={styles.container}>
        <Image
          source={require('../../assets/ELS_logo.png')}
          style={styles.logo}
          resizeMode='contain'
        />
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#A0A0A0"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#A0A0A0"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <Ionicons
            name={passwordVisible ? 'eye-off' : 'eye'}
            size={24}
            color="#000"
            onPress={togglePasswordVisibility}
            style={{ position: 'absolute', right: 10, top: 15 }} />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#A0A0A0"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <Button
          title="Sign Up"
          buttonStyle={styles.signupButton}
          titleStyle={styles.signupButtonTitle}
          onPress={handleSignup}
          activeOpacity={0.7}
        />
        <View style={styles.loginTextContainer}>
          <Text style={styles.loginText}>Already have an Account ?{' '}</Text>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#fff',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  whiteBridge: {
    backgroundColor: '#fff',
    height: 40,
    width: '100%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  logo: {
    width: '75%',
    height: '25%',
    borderRadius: 18,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  signupButton: {
    backgroundColor: '#4CC2FF',
    width: 200,
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 10,
  },
  signupButtonTitle: {
    color: '#333',
    fontSize: 18,
  },
  loginTextContainer: {
    flexDirection: 'row',
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 16,
  },
  loginLink: {
    color: '#FF4C4C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  passwordContainer: {
    width: '100%',
  },
});