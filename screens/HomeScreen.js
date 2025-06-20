// screens/HomeScreen.js
import { Text, View, StyleSheet, Button, Alert, Dimensions, Image } from 'react-native';
import React, { useEffect } from 'react';
import TopBar from '../components/Topbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '.././context/AuthContext';
import Swiper from 'react-native-swiper';
import { Divider } from 'react-native-elements';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const imageUrls = [
      'https://images.pexels.com/photos/5652121/pexels-photo-5652121.jpeg',
      'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg',
      'https://images.pexels.com/photos/6005081/pexels-photo-6005081.jpeg',
    ];

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
      <View style={styles.swiperContainer}>
          <Swiper autoplay autoplayTimeout={60} showsPagination={false} loop>
            {imageUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.swiperImage}
                resizeMode="cover"
              />
            ))}
          </Swiper>
        </View>
      <Divider style={{ backgroundColor: 'white', height: 2, marginTop: 20, width: '80%', alignSelf: 'center' }} />
      <View style={styles.board}>
        <Text style={{ fontSize: 18, fontWeight: 'semibold' }}>Why you should choose our App</Text>
        <View style={styles.miniBoard}>
          <Text style={{ fontSize: 14 }}>ELS is one of the most chosen English learning app in VietNam and continue to grown largely</Text>
        </View>
      </View>
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
  board: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  miniBoard: {
    backgroundColor: '#4CC2FF',
    padding: 20,
    borderRadius: 5,
    marginTop: 5,
  },
    swiperContainer: {
    height: 200,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  swiperImage: {
    width: width - 20,
    height: 200,
    borderRadius: 10,
  },
});