import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const SECURE_KEYS = {
  USER_TOKEN: 'user_token',
  USER_ID: 'user_id',
  USER_PROFILE: 'user_profile',
};

/**
 * Simple Storage Utility
 * Uses AsyncStorage for all data (simplified for reliability)
 */
class SecureStorage {
  /**
   * Store token
   * @param {string} token - Authentication token
   */
  static async setToken(token) {
    try {
      await AsyncStorage.setItem(SECURE_KEYS.USER_TOKEN, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  /**
   * Get stored token
   * @returns {Promise<string|null>} Token or null
   */
  static async getToken() {
    try {
      return await AsyncStorage.getItem(SECURE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Remove stored token
   */
  static async removeToken() {
    try {
      await AsyncStorage.removeItem(SECURE_KEYS.USER_TOKEN);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  /**
   * Store user data
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   */
  static async setUserData(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting user data ${key}:`, error);
    }
  }

  /**
   * Get user data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Stored data or null
   */
  static async getUserData(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting user data ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove user data
   * @param {string} key - Storage key
   */
  static async removeUserData(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing user data ${key}:`, error);
    }
  }

  /**
   * Clear all stored data
   */
  static async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

export default SecureStorage; 