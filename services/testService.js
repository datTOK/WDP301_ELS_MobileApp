import api from './api';

/**
 * Test Service
 * Handles all test-related API calls
 */
class TestService {
  /**
   * Get tests for a course
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Course tests response
   */
  async getCourseTests(courseId, params = {}) {
    return api.get(`/api/tests/${courseId}/course`, { params });
  }

  /**
   * Get test by ID
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Test details response
   */
  async getTestById(testId) {
    return api.get(`/api/tests/${testId}`);
  }

  /**
   * Submit test answers
   * @param {string} testId - Test ID
   * @param {Object} answers - Test answers
   * @returns {Promise<Object>} Test submission response
   */
  async submitTest(testId, answers) {
    return api.post(`/api/tests/${testId}/submission`, answers);
  }

  /**
   * Get user tests by user ID
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.courseId - Filter by course ID
   * @param {string} params.status - Filter by test status
   * @returns {Promise<Object>} User test history response
   */
  async getUserTests(userId, params = {}) {
    return api.get(`/api/user-tests/${userId}/user`, { params });
  }

  /**
   * Get user test by test ID
   * @param {string} testId - Test ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User test response
   */
  async getUserTestByTestId(testId, params = {}) {
    return api.get(`/api/user-tests/${testId}/test`, { params });
  }

  /**
   * Create user test
   * @param {Object} testData - Test data
   * @returns {Promise<Object>} User test creation response
   */
  async createUserTest(testData) {
    return api.post('/api/user-tests', testData);
  }
}

export default new TestService(); 