import api from './api';

/**
 * Achievement Service
 * Handles all achievement-related API calls
 */
class AchievementService {
  /**
   * Get all achievements
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Achievements response
   */
  async getAllAchievements(params = {}) {
    return api.get('/api/achievements', { params });
  }

  /**
   * Get achievement by ID
   * @param {string} achievementId - Achievement ID
   * @returns {Promise<Object>} Achievement details response
   */
  async getAchievementById(achievementId) {
    return api.get(`/api/achievements/${achievementId}`);
  }
}

export default new AchievementService(); 