import api, { apiUtils } from './api';

/**
 * Auth Service
 * Handles all authentication-related API calls
 */
class AuthService {
  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    return api.post('/api/auth/login', credentials);
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User full name
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    return api.post('/api/auth/signup', userData);
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Password change response
   */
  async changePassword(passwordData) {
    return api.put('/api/auth/change-password', passwordData);
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset request response
   */
  async forgotPassword(email) {
    return api.post('/api/auth/send-reset-password-pin', { email });
  }

  /**
   * Reset password with token
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.newPassword - New password
   * @returns {Promise<Object>} Password reset response
   */
  async resetPassword(resetData) {
    return api.put('/api/auth/reset-password', resetData);
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    return api.post('/api/auth/logout');
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile response
   */
  async getProfile() {
    return api.get('/api/auth/me');
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Profile update response
   */
  async updateProfile(profileData) {
    return api.patch('/api/users/:id', profileData);
  }

  /**
   * Get user profile with error handling
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} User profile with error handling
   */
  async getUserProfile(token) {
    try {
      const response = await this.getProfile();
      const result = apiUtils.parseResponse(response);
      
      if (result.data?.user && result.data.user._id) {
        return {
          success: true,
          user: result.data.user,
          userId: result.data.user._id
        };
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      return {
        success: false,
        error: errorInfo.message
      };
    }
  }
}

export default new AuthService(); 