import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import SecureStorage, { SECURE_KEYS } from '../utils/secureStorage';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchAndSetUserProfile = useCallback(async (token) => {
    try {
      console.log('AuthContext: Fetching user profile...');
      const result = await authService.getUserProfile(token);

      if (result.success && result.userId) {
        console.log('AuthContext: User profile fetched. User ID:', result.userId);
        await SecureStorage.setUserData(SECURE_KEYS.USER_ID, result.userId);
        setUserId(result.userId);
        return result.userId; 
      } else {
        console.error('AuthContext: Failed to fetch user profile:', result.error);
        throw new Error(result.error || 'Failed to get user profile.');
      }
    } catch (error) {
      console.error('AuthContext: Error in fetchAndSetUserProfile:', error);
      // Don't clear token here - let the calling method handle token management
      throw error;
    }
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('AuthContext: Checking authentication status...');
      setIsLoading(true);
      try {
        const token = await SecureStorage.getToken();
        const storedUserId = await SecureStorage.getUserData(SECURE_KEYS.USER_ID);
        
        console.log('AuthContext: Token found:', !!token);
        console.log('AuthContext: User ID found:', !!storedUserId);
        
        setUserToken(token);
        if (token && !storedUserId) {
          console.log('AuthContext: Token found but no UserId. Fetching profile...');
          try {
            await fetchAndSetUserProfile(token);
          } catch (profileError) {
            console.warn('AuthContext: Failed to fetch profile during auth check, but keeping token:', profileError);
            // Keep the token, profile can be fetched later
          }
        } else {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('AuthContext: Failed to retrieve user token:', error);
        await SecureStorage.removeToken();
        await SecureStorage.removeUserData(SECURE_KEYS.USER_ID);
        setUserToken(null);
        setUserId(null);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Authentication check complete.');
      }
    };

    checkAuthStatus();
  }, [fetchAndSetUserProfile]);

  useEffect(() => {
    console.log('AuthContext: userToken state:', userToken ? 'LOGGED_IN' : 'LOGGED_OUT');
    console.log('AuthContext: userId state:', userId || 'NULL');
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
          await SecureStorage.setToken(token);
          setUserToken(token);
          
          // Try to fetch user profile, but don't fail the login if this fails
          try {
            await fetchAndSetUserProfile(token); 
            console.log('AuthContext: User signed in successfully with profile.');
          } catch (profileError) {
            console.warn('AuthContext: Failed to fetch user profile, but login was successful:', profileError);
            // Keep the token and allow navigation to proceed
            // The profile can be fetched later
          }
        } catch (error) {
          console.error('AuthContext: Error during signIn:', error);
          // Only clear token if the initial token setting failed
          await SecureStorage.removeToken();
          setUserToken(null);
          throw error;
        }
      },

      signOut: async () => {
        console.log('AuthContext: Signing out...');
        try {
          // Call logout API if we have a token
          if (userToken) {
            try {
              await authService.logout();
            } catch (apiError) {
              console.warn('AuthContext: Logout API call failed, continuing with local cleanup:', apiError);
            }
          }
          
          // Clear storage
          await SecureStorage.removeToken();
          await SecureStorage.removeUserData(SECURE_KEYS.USER_ID);
          setUserToken(null);
          setUserId(null);
          console.log('AuthContext: SignOut complete.');
        } catch (error) {
          console.error('AuthContext: Error during signOut:', error);
          throw error;
        }
      },

      signUp: async (token) => {
        console.log('AuthContext: Signing up...');
        try {
          await SecureStorage.setToken(token);
          setUserToken(token);
          await fetchAndSetUserProfile(token);
          console.log('AuthContext: User signed up and logged in successfully.');
        } catch (error) {
          console.error('AuthContext: Error during signUp:', error);
          throw error;
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