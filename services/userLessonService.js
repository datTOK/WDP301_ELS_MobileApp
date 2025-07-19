import api from './api';

/**
 * User Lesson Service
 * Handles all user lesson-related API calls
 */
class UserLessonService {
  /**
   * Get user lessons with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.courseId - Filter by course ID
   * @param {string} params.status - Filter by lesson status
   * @returns {Promise<Object>} User lessons response
   */
  async getUserLessons(params = {}) {
    return api.get('/api/user-lessons', { params });
  }

  /**
   * Get user lesson by ID
   * @param {string} userLessonId - User lesson ID
   * @returns {Promise<Object>} User lesson details response
   */
  async getUserLessonById(userLessonId) {
    return api.get(`/api/user-lessons/${userLessonId}`);
  }

  /**
   * Get user lesson by lesson ID
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User lesson response
   */
  async getUserLessonByLessonId(lessonId, params = {}) {
    return api.get(`/api/user-lessons/${lessonId}/lesson`, { params });
  }

  /**
   * Create user lesson
   * @param {Object} lessonData - User lesson data
   * @returns {Promise<Object>} User lesson creation response
   */
  async createUserLesson(lessonData) {
    return api.post('/api/user-lessons', lessonData);
  }

  /**
   * Update user lesson
   * @param {string} userLessonId - User lesson ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} User lesson update response
   */
  async updateUserLesson(userLessonId, updateData) {
    return api.put(`/api/user-lessons/${userLessonId}`, updateData);
  }

  /**
   * Complete user lesson
   * @param {string} userLessonId - User lesson ID
   * @param {Object} completionData - Completion data
   * @returns {Promise<Object>} User lesson completion response
   */
  async completeUserLesson(userLessonId, completionData = {}) {
    return api.put(`/api/user-lessons/${userLessonId}/complete`, completionData);
  }
}

export default new UserLessonService(); 