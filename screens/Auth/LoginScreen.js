// screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, Image, TouchableOpacity, Icon } from 'react-native';
import { Button } from 'react-native-elements';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { MOBILE_SERVER_URL } from '@env';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    console.log('Attempting login with:', { email, password });
    try {
      const response = await fetch(`${MOBILE_SERVER_URL}api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        console.log('Login successful! Token:', data.accessToken);
        console.log('User data:', password);
        await signIn(data.accessToken);
      } else {
        Alert.alert('Login Failed', data.message || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Could not connect to the server. Please try again later.');
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  }

  return (
    <>
      <View style={{ backgroundColor: '#fff', height: 140, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 20 }}>
        <Text style={styles.title}>ELS_Learning_App</Text>
      </View>
      <View style={styles.container}>
        <Image
          source={require('../../assets/ELS_logo.png')}
          style={styles.logo}
          resizeMode='contain'
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
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
        <Button title="Login" buttonStyle={{ backgroundColor: '#4CC2FF', width: 200 }} titleStyle={{ color: '#333' }} onPress={handleLogin} />
        <Text style={{ color: 'white', marginTop: 20 }}>Don't you have an Account ? <Text style={{ color: 'red' }} onPress={() => navigation.replace('Signup')}>Sign up</Text> </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  logo: {
    width: '75%',
    height: '35%',
    borderRadius: 18,
    marginBottom: 30,
  },

  passwordContainer: {
    width: '100%',
  },
});