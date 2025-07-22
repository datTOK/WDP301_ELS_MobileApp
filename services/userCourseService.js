import api from './api';

/**
 * User Course Service
 * Handles all user course-related API calls
 * Follows backend API routes and frontend web patterns
 */
class UserCourseService {
  /**
   * Create user course (enroll in course)
   * Backend route: POST /api/user-courses
   * @param {Object} enrollmentData - Enrollment data
   * @param {string} enrollmentData.userId - User ID
   * @param {string} enrollmentData.courseId - Course ID
   * @returns {Promise<Object>} Enrollment response
   */
  async createUserCourse(enrollmentData) {
    const response = await api.post('/api/user-courses', enrollmentData);
    return response.data;
  }

  /**
   * Enroll in course (alias for createUserCourse)
   * @param {string} userId - User ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Enrollment response
   */
  async enrollCourse(userId, courseId) {
    return this.createUserCourse({ userId, courseId });
  }

  /**
   * Get user courses by user ID
   * Backend route: GET /api/user-courses/:id/user (id = userId)
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} User courses response
   */
  async getUserCoursesByUserId(userId, params = {}) {
    const response = await api.get(`/api/user-courses/${userId}/user`, { params });
    return response.data;
  }

  /**
   * Get user course by course ID
   * Backend route: GET /api/user-courses/:id/course (id = courseId)
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User course response
   */
  async getUserCourseByCourseId(courseId, params = {}) {
    const response = await api.get(`/api/user-courses/${courseId}/course`, { params });
    return response.data;
  }

  /**
   * Get user course by ID
   * Backend route: GET /api/user-courses/:id (id = userCourseId)
   * @param {string} userCourseId - User course ID
   * @returns {Promise<Object>} User course response
   */
  async getUserCourseById(userCourseId) {
    const response = await api.get(`/api/user-courses/${userCourseId}`);
    return response.data.data;
  }

  /**
   * Update user course
   * Backend route: PUT /api/user-courses/:id (id = userCourseId)
   * @param {string} userCourseId - User course ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} User course update response
   */
  async updateUserCourse(userCourseId, updateData) {
    const response = await api.put(`/api/user-courses/${userCourseId}`, updateData);
    return response.data;
  }

  /**
   * Delete user course
   * Backend route: DELETE /api/user-courses/:id
   * @param {string} userCourseId - User course ID
   * @returns {Promise<Object>} User course deletion response
   */
  async deleteUserCourse(userCourseId) {
    const response = await api.delete(`/api/user-courses/${userCourseId}`);
    return response.data;
  }

  /**
   * Get all user courses by user ID (alias with large page size)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} All user courses
   */
  async getAllUserCourses(userId) {
    const response = await this.getUserCoursesByUserId(userId, { size: 1000 });
    return response.data || [];
  }

  /**
   * Get user courses (alias for getUserCoursesByUserId)
   * Maintains backward compatibility with existing mobile app code
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User courses response
   */
  async getUserCourses(userId, params = {}) {
    return this.getUserCoursesByUserId(userId, params);
  }
}

export default new UserCourseService(); 