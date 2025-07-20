import React, { createContext, useState, useEffect, useMemo, useContext, useCallback } from 'react';
import SecureStorage, { SECURE_KEYS } from '../utils/secureStorage';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);

  const fetchAndSetUserProfile = useCallback(async (token) => {
    try {
      console.log('AuthContext: Fetching user profile...');
      const result = await authService.getUserProfile(token);

      if (result.success && result.user) {
        console.log('AuthContext: User profile fetched. User ID:', result.user._id);
        await SecureStorage.setUserData(SECURE_KEYS.USER_PROFILE, JSON.stringify(result.user));
        setUser(result.user);
        return result.user; 
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
        const storedUserProfile = await SecureStorage.getUserData(SECURE_KEYS.USER_PROFILE);
        
        console.log('AuthContext: Token found:', !!token);
        console.log('AuthContext: User profile found:', !!storedUserProfile);
        
        setUserToken(token);
        if (token) {
          if (storedUserProfile) {
            // Use stored profile data
            const userData = JSON.parse(storedUserProfile);
            setUser(userData);
            console.log('AuthContext: Using stored user profile');
          } else {
            // Fetch fresh profile data
            console.log('AuthContext: No stored profile, fetching fresh data...');
            try {
              await fetchAndSetUserProfile(token);
            } catch (profileError) {
              console.warn('AuthContext: Failed to fetch profile during auth check, but keeping token:', profileError);
              // Keep the token, profile can be fetched later
            }
          }
        }
      } catch (error) {
        console.error('AuthContext: Failed to retrieve user token:', error);
        await SecureStorage.removeToken();
        await SecureStorage.removeUserData(SECURE_KEYS.USER_PROFILE);
        setUserToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Authentication check complete.');
      }
    };

    checkAuthStatus();
  }, [fetchAndSetUserProfile]);

  useEffect(() => {
    console.log('AuthContext: userToken state:', userToken ? 'LOGGED_IN' : 'LOGGED_OUT');
    console.log('AuthContext: user state:', user ? 'LOADED' : 'NULL');
  }, [userToken, user]);

  const authContext = useMemo(
    () => ({
      userToken,
      user,
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
          await SecureStorage.removeUserData(SECURE_KEYS.USER_PROFILE);
          setUserToken(null);
          setUser(null);
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
    [userToken, isLoading, user, fetchAndSetUserProfile] 
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