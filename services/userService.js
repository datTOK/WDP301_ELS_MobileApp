import api from './api';

/**
 * User Service
 * Handles all user-related API calls
 */
class UserService {
  /**
   * Get user leaderboard
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.period - Time period (week/month/year)
   * @returns {Promise<Object>} User leaderboard response
   */
  async getLeaderboard(params = {}) {
    return api.get('/api/users/leaderboard', { params });
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details response
   */
  async getUserById(userId) {
    return api.get(`/api/users/${userId}`);
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User update data
   * @returns {Promise<Object>} User update response
   */
  async updateUser(userId, userData) {
    return api.patch(`/api/users/${userId}`, userData);
  }

  /**
   * Get all users (admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users response
   */
  async getUsers(params = {}) {
    return api.get('/api/users', { params });
  }
}

export default new UserService(); 