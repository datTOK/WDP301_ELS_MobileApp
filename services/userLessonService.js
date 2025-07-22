import api from './api';

/**
 * User Lesson Service
 * Handles all user lesson-related API calls
 * Follows backend API routes and frontend web patterns
 */
class UserLessonService {
  /**
   * Create user lesson
   * Backend route: POST /api/user-lessons
   * @param {Object} userLessonData - User lesson data
   * @param {string} userLessonData.userId - User ID
   * @param {string} userLessonData.lessonId - Lesson ID
   * @param {string} userLessonData.status - Lesson status
   * @returns {Promise<Object>} User lesson creation response
   */
  async createUserLesson(userLessonData) {
    const response = await api.post('/api/user-lessons', userLessonData);
    return response.data;
  }

  /**
   * Get user lessons by user ID
   * Backend route: GET /api/user-lessons/:id/user (id = userId)
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} User lessons response
   */
  async getUserLessonsByUserId(userId, params = {}) {
    const response = await api.get(`/api/user-lessons/${userId}/user`, { params });
    return response.data;
  }

  /**
   * Get user lesson by lesson ID
   * Backend route: GET /api/user-lessons/:id/lesson (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} User lesson response
   */
  async getUserLessonByLessonId(lessonId) {
    const response = await api.get(`/api/user-lessons/${lessonId}/lesson`);
    return response.data;
  }

  /**
   * Get user lesson by ID
   * Backend route: GET /api/user-lessons/:id (id = userLessonId)
   * @param {string} userLessonId - User lesson ID
   * @returns {Promise<Object>} User lesson response
   */
  async getUserLessonById(userLessonId) {
    const response = await api.get(`/api/user-lessons/${userLessonId}`);
    return response.data.data;
  }

  /**
   * Update user lesson
   * Backend route: PATCH /api/user-lessons/:id (id = userLessonId)
   * @param {string} userLessonId - User lesson ID
   * @param {Object} updateData - Update data
   * @param {string} updateData.status - Updated lesson status
   * @returns {Promise<Object>} User lesson update response
   */
  async updateUserLesson(userLessonId, updateData) {
    const response = await api.patch(`/api/user-lessons/${userLessonId}`, updateData);
    return response.data;
  }

  /**
   * Update user lesson status (convenience method)
   * @param {string} userLessonId - User lesson ID
   * @param {string} status - New status ("not-started" | "in-progress" | "completed")
   * @returns {Promise<Object>} User lesson update response
   */
  async updateUserLessonStatus(userLessonId, status) {
    return this.updateUserLesson(userLessonId, { status });
  }

  /**
   * Delete user lesson (Admin only - not typically used)
   * Backend route: DELETE /api/user-lessons/:id
   * @param {string} userLessonId - User lesson ID
   * @returns {Promise<Object>} User lesson deletion response
   */
  async deleteUserLesson(userLessonId) {
    const response = await api.delete(`/api/user-lessons/${userLessonId}`);
    return response.data;
  }

  /**
   * Get all user lessons by user ID (alias with large page size)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} All user lessons
   */
  async getAllUserLessons(userId) {
    const response = await this.getUserLessonsByUserId(userId, { size: 1000 });
    return response.data || [];
  }
}

export default new UserLessonService(); 