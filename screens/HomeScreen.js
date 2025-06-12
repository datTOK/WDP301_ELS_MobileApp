// screens/HomeScreen.js
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import React, { useEffect } from 'react';
import TopBar from '../components/Topbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '.././context/AuthContext'; 

export default function HomeScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth(); 

  useEffect(() => {
    console.log('HomeScreen mounted. Navigation prop:', navigation);
  }, [navigation]);

  const handleLogout = async () => {
    console.log('--- Logout Button Pressed! ---');

    console.log('User confirmed logout (simulated). Initiating logout process...');
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      console.log('Retrieved userToken from AsyncStorage:', userToken ? 'Exists' : 'Does NOT Exist');

      if (userToken) { 
        console.log('Making API call to /api/auth/logout with token...');
        const response = await fetch('http://localhost:4000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
        });

        const data = await response.json();
        console.log('API Response Status:', response.status);
        console.log('API Response Body:', data);

        if (response.ok) {
          console.log('Server logout successful!');
          Alert.alert('Success', data.message || 'You have been logged out.');
        } else {
          console.error('Server logout failed (non-2xx status):', data.message || 'Unknown server error');
          Alert.alert('Logout Issue', data.message || 'Server logout failed. You might need to log in again.');
        }
      } else {
        console.warn('No user token found locally to send to server for logout.');
      }

      await signOut();

    } catch (error) {
      console.error('CRITICAL LOGOUT ERROR:', error);
      Alert.alert('Logout Error', 'Could not connect to the server or an unexpected error occurred. Please try again later.');

      await signOut();
    }
  };

  return (
    <View style={styles.container}>
      <TopBar />
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 20 }}>Welcome to Home Screen!</Text>
      <Button
        title="Logout"
        onPress={handleLogout}
        color="#FF4C4C"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});