import React, { createContext, useState, useEffect, useMemo, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('AuthContext: Checking authentication status...');
      try {
        const token = await AsyncStorage.getItem('userToken');
        console.log('AuthContext: Token retrieved:', token ? 'Found' : 'Not Found');
        setUserToken(token);
      } catch (error) {
        console.error('AuthContext: Failed to retrieve user token from AsyncStorage:', error);
        await AsyncStorage.removeItem('userToken');
        setUserToken(null);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Authentication check complete. IsLoading set to false.');
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    console.log('AuthContext: userToken state changed to:', userToken ? 'LOGGED_IN' : 'LOGGED_OUT');
  }, [userToken]);

  const authContext = useMemo(
    () => ({
      userToken,
      isLoading, 

      signIn: async (token) => {
        console.log('AuthContext: Signing in...');
        try {
          await AsyncStorage.setItem('userToken', token);
          setUserToken(token);
          console.log('AuthContext: User signed in successfully.');
          console.log(userToken);
        } catch (error) {
          console.error('AuthContext: Error setting token during signIn:', error);
          Alert.alert('Login Error', 'Failed to save login session. Please try again.');
        }
      },
      signOut: async () => {
        console.log('AuthContext: Initiating signOut...');
        try {
          await AsyncStorage.removeItem('userToken');
          setUserToken(null);
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
          console.log('AuthContext: User signed up and logged in successfully.');
        } catch (error) {
          console.error('AuthContext: Error setting token during signUp:', error);
          Alert.alert('Signup Error', 'Failed to save signup session. Please try again.');
        }
      },
    }),
    [userToken, isLoading] 
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