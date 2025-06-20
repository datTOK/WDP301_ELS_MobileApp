import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchAndSetUserProfile = useCallback(async (token) => {
    try {
      console.log('AuthContext: Attempting to fetch user profile for ID and full user data...');
      const response = await fetch('http://localhost:4000/api/auth/me', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.user && data.user._id) {
        console.log('AuthContext: User profile fetched successfully. User ID:', data.user._id);
        await AsyncStorage.setItem('userId', data.user._id);
        setUserId(data.user._id);
        return data.user._id; 
      } else {
        console.error('AuthContext: Failed to fetch user profile or _id was missing:', data.message);
        throw new Error(data.message || 'Failed to get user profile after login.');
      }
    } catch (error) {
      console.error('AuthContext: Error in fetchAndSetUserProfile:', error);
      Alert.alert('Authentication Error', 'Could not retrieve user details. Please log in again.');
      // Important: If profile fetch fails, clear token and userId to force re-login
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      setUserToken(null);
      setUserId(null);
      throw error; // Re-throw to propagate the error
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('AuthContext: Checking authentication status...');
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('userToken');
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('AuthContext: Token retrieved:', token ? 'Found' : 'Not Found');
        console.log('AuthContext: Stored User ID:', storedUserId ? storedUserId : 'Not Found');
        setUserToken(token);
        if (token && !storedUserId) {
          console.log('AuthContext: Token found but no UserId. Fetching profile to get UserId...');
          await fetchAndSetUserProfile(token); 
        } else {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('AuthContext: Failed to retrieve user token from AsyncStorage:', error);
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
        setUserToken(null);
        setUserId(null);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Authentication check complete. IsLoading set to false.');
      }
    };

    checkAuthStatus();
  }, [fetchAndSetUserProfile]);

  useEffect(() => {
    console.log('AuthContext: userToken state changed to:', userToken ? 'LOGGED_IN' : 'LOGGED_OUT');
    console.log('AuthContext: userId state changed to:', userId || 'NULL');
  }, [userToken, userId]);

  const authContext = useMemo(
    () => ({
      userToken,
      userId,
      isLoading,
      fetchAndSetUserProfile,

      signIn: async (token) => {
        console.log('AuthContext: Signing in...');
        try {
          await AsyncStorage.setItem('userToken', token);
          setUserToken(token);
          await fetchAndSetUserProfile(token); 
          console.log('AuthContext: User signed in successfully.');
          console.log(token);
        } catch (error) {
          console.error('AuthContext: Error setting token during signIn:', error);
          Alert.alert('Login Error', 'Failed to save login session. Please try again.');
        }
      },
      signOut: async () => {
        console.log('AuthContext: Initiating signOut...');
        try {
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('userId');
          setUserToken(null);
          setUserId(null);
          console.log('AuthContext: SignOut complete. userToken set to null.');
        } catch (error) {
          console.error('AuthContext: Error removing token during signOut:', error);
          Alert.alert('Logout Error', 'Failed to clear login session. Please try again.');
        }
      },
      signUp: async (token) => {
        console.log('AuthContext: Signing up...');
        try {
          await AsyncStorage.setItem('userToken', token);
          setUserToken(token);
          await fetchAndSetUserProfile(token);
          console.log('AuthContext: User signed up and logged in successfully.');
        } catch (error) {
          console.error('AuthContext: Error setting token during signUp:', error);
          Alert.alert('Signup Error', 'Failed to save signup session. Please try again.');
        }
      },
    }),
    [userToken, isLoading, userId, fetchAndSetUserProfile] 
  );

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};