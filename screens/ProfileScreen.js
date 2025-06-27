import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext'; 
import { Ionicons } from '@expo/vector-icons'; 
import { Avatar } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true); 
  const [error, setError] = useState(null);
  const { signOut, userToken, userId } = useAuth(); 
  const navigation = useNavigation();

  useEffect(() => {
    if (userToken && userId) {
      fetchUserProfile();
    } else {
      setLoadingProfile(false); 
      setError("No active session found. Please log in.");
    }
  }, [userToken, userId]);

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      if (!userToken || !userId) {
        console.log('ProfileScreen: No user token found, cannot fetch profile.');
        throw new Error('Authentication token is missing. Please log in again.');
      }
      console.log('ProfileScreen: User Token being sent:', userToken);
      console.log('ProfileScreen: User ID being used:', userId);
      console.log('ProfileScreen: Fetching user profile...');
      const response = await fetch('http://localhost:4000/api/auth/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const data = await response.json();
      console.log('ProfileScreen: API response received:', data);

      if (response.ok) {
        setUserData(data.user);
        console.log('ProfileScreen: User data set:', data.user.username);
        console.log('ProfileScreen: User id set:', data.user._id);
      } else {
        const errorMessage = data.message || 'Failed to fetch user data.';
        console.error('ProfileScreen: Failed to fetch user data (server error):', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('ProfileScreen: Error fetching user profile:', err);
      setError(err.message || 'An unexpected error occurred while loading profile.');
      Alert.alert('Profile Error', err.message || 'Could not load profile data.');
    } finally {
      setLoadingProfile(false);
      console.log('ProfileScreen: Profile data fetching complete.');
    }
  };

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

  const handleChangePassword = () => {
    console.log('Change Password button pressed. Navigating to Change Password screen...');
    navigation.navigate('Courses');
  };

  if (loadingProfile) { 
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CC2FF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        {userToken && (
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Tap to Retry</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.logoutButtonSm, { marginTop: 10 }]} onPress={handleLogout}>
          <Text style={styles.logoutButtonTextSm}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No user data available. Please log in.</Text>
        <TouchableOpacity style={styles.logoutButtonSm} onPress={handleLogout}>
          <Text style={styles.logoutButtonTextSm}>Login / Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.warn("Invalid date string for formatting:", dateString);
      return dateString; 
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {/* <Ionicons name="person-circle-outline" size={80} color="#4CC2FF" /> */}
        <Avatar
          size={'large'}
          rounded
          source={userData.avatar ? { uri: userData.avatar } : require('../assets/ELS_logo.png')} />
        <Text style={styles.username}>{userData.username || 'N/A'}</Text>
        <Text style={styles.email}>{userData.email || 'N/A'}</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{userData.email || 'Not provided'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#666" style={styles.icon} />
          <Text style={styles.label}>Member Since:</Text>
          <Text style={styles.value}>{formatDate(userData.createdAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy-outline" size={20} color="#666" style={styles.icon} />
          <Text style={styles.label}>Online Streak:</Text>
          <Text style={styles.value}>{userData.onlineStreak !== undefined ? `${userData.onlineStreak} days` : 'N/A'}</Text>
        </View>
        {userData.role !== undefined && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.icon} />
            <Text style={styles.label}>Role:</Text>
            <Text style={styles.value}>{userData.role === 0 ? 'User' : 'Admin'}</Text>
          </View>
        )}
        {userData.lastOnline && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color="#666" style={styles.icon} />
            <Text style={styles.label}>Last Online:</Text>
            <Text style={styles.value}>{formatDate(userData.lastOnline)}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.passwordButton} onPress={handleChangePassword}>
        <Ionicons name="lock-closed-outline" size={24} color="fff"/>
        <Text style={styles.passwordText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CC2FF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButtonSm: { 
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FF4C4C',
    borderRadius: 8,
  },
  logoutButtonTextSm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 10,
  },
  email: {
    fontSize: 16,
    color: 'black',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 4,
    borderBottomColor: '#333',
    paddingBottom: 10,  
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#aaa',
    width: 120, 
  },
  value: {
    fontSize: 16,
    color: '#fff',
    flexShrink: 1, 
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4C4C',
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  passwordButton: {
    flexDirection: 'row',
    backgroundColor: '#4CC2FF',
    paddingVertical: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  passwordText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  }, 
});