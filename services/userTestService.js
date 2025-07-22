import api from './api';

/**
 * User Test Service
 * Handles all user test-related API calls
 * Follows backend API routes and frontend web patterns
 */
class UserTestService {
  /**
   * Create user test (Admin only)
   * Backend route: POST /api/user-tests
   * @param {Object} userTestData - User test data
   * @returns {Promise<Object>} User test creation response
   */
  async createUserTest(userTestData) {
    return api.post('/api/user-tests', userTestData);
  }

  /**
   * Get user tests by user ID
   * Backend route: GET /api/user-tests/:id/user (id = userId)
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.courseId - Filter by course ID
   * @param {string} params.status - Filter by test status
   * @returns {Promise<Object>} User test history response
   */
  async getUserTestsByUserId(userId, params = {}) {
    return api.get(`/api/user-tests/${userId}/user`, { params });
  }

  /**
   * Get user test by test ID
   * Backend route: GET /api/user-tests/:id/test (id = testId)
   * @param {string} testId - Test ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User test response
   */
  async getUserTestByTestId(testId, params = {}) {
    return api.get(`/api/user-tests/${testId}/test`, { params });
  }

  /**
   * Get user test by ID
   * Backend route: GET /api/user-tests/:id (id = userTestId)
   * @param {string} userTestId - User test ID
   * @returns {Promise<Object>} User test response
   */
  async getUserTestById(userTestId) {
    return api.get(`/api/user-tests/${userTestId}`);
  }

  /**
   * Get all user tests by user ID (alias for getUserTestsByUserId)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} All user tests response
   */
  async getAllUserTests(userId) {
    return this.getUserTestsByUserId(userId, { size: 1000 });
  }
}

export default new UserTestService(); 