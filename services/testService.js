import api from './api';

/**
 * Test Service
 * Handles all test-related API calls
 * Updated to match backend API routes and frontend web patterns
 */
class TestService {
  /**
   * Get tests by course ID
   * Backend route: GET /api/tests/:id/course (id = courseId)
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Course tests response
   */
  async getTestsByCourseId(courseId, params = {}) {
    return (await api.get(`/api/tests/${courseId}/course`, { params })).data;
  }

  /**
   * Get tests by lesson ID
   * Backend route: GET /api/tests/lesson/:id (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lesson tests response
   */
  async getTestsByLessonId(lessonId, params = {}) {
    return (await api.get(`/api/tests/lesson/${lessonId}`, { params })).data;
  }

  /**
   * Get test by ID
   * Backend route: GET /api/tests/:id (id = testId)
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Test details response
   */
  async getTestById(testId) {
    return (await api.get(`/api/tests/${testId}`)).data;
  }

  /**
   * Submit test answers
   * Backend route: POST /api/tests/:id/submission (id = testId)
   * @param {string} testId - Test ID
   * @param {Object} submissionData - Test submission data
   * @returns {Promise<Object>} Test submission response
   */
  async submitTest(testId, submissionData) {
    return (await api.post(`/api/tests/${testId}/submission`, submissionData)).data;
  }

  /**
   * Create test (Admin only)
   * Backend route: POST /api/tests
   * @param {Object} testData - Test data
   * @returns {Promise<Object>} Test creation response
   */
  async createTest(testData) {
    return (await api.post('/api/tests', testData)).data;
  }

  /**
   * Update test (Admin only)
   * Backend route: PATCH /api/tests/:id
   * @param {string} testId - Test ID
   * @param {Object} testData - Updated test data
   * @returns {Promise<Object>} Test update response
   */
  async updateTest(testId, testData) {
    return (await api.patch(`/api/tests/${testId}`, testData)).data;
  }

  /**
   * Delete test (Admin only)
   * Backend route: DELETE /api/tests/:id
   * @param {string} testId - Test ID
   * @returns {Promise<Object>} Test deletion response
   */
  async deleteTest(testId) {
    return (await api.delete(`/api/tests/${testId}`)).data;
  }
}

export default new TestService(); 