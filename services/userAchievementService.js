import api from './api';

/**
 * User Achievement Service
 * Handles all user achievement-related API calls
 */
class UserAchievementService {
  /**
   * Get user achievements with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Page size
   * @returns {Promise<Object>} User achievements response
   */
  async getUserAchievements(params = {}) {
    return api.get('/api/user-achievements', { params });
  }

  /**
   * Get user achievement by ID
   * @param {string} userAchievementId - User achievement ID
   * @returns {Promise<Object>} User achievement details response
   */
  async getUserAchievementById(userAchievementId) {
    return api.get(`/api/user-achievements/${userAchievementId}`);
  }

  /**
   * Get user achievements by user ID
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User achievements response
   */
  async getUserAchievementsByUserId(userId, params = {}) {
    return api.get(`/api/user-achievements/${userId}/users`, { params });
  }
}

export default new UserAchievementService(); 