import api from './api';

/**
 * Course Service
 * Handles all course-related API calls
 */
class CourseService {
  /**
   * Get all courses with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.order - Sort order (asc/desc)
   * @param {string} params.sortBy - Sort field
   * @param {string} params.search - Search term
   * @param {string} params.level - Course level
   * @param {string} params.category - Course category
   * @returns {Promise<Object>} Courses response
   */
  async getCourses(params = {}) {
    return api.get('/api/courses', { params });
  }

  /**
   * Get course by ID
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course details response
   */
  async getCourseById(courseId) {
    return api.get(`/api/courses/${courseId}`);
  }

  /**
   * Get course details (includes overview)
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course details response
   */
  async getCourseDetails(courseId) {
    return api.get(`/api/courses/${courseId}/details`);
  }

  /**
   * Get course lessons
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Course lessons response
   */
  async getCourseLessons(courseId, params = {}) {
    return api.get(`/api/courses/${courseId}/lessons`, { params });
  }

  /**
   * Get user courses by user ID
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User courses response
   */
  async getUserCourses(userId, params = {}) {
    return api.get(`/api/user-courses/${userId}/user`, { params });
  }

  /**
   * Get user course by course ID
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User course response
   */
  async getUserCourseByCourseId(courseId, params = {}) {
    return api.get(`/api/user-courses/${courseId}/course`, { params });
  }

  /**
   * Create user course (enroll in course)
   * @param {Object} enrollmentData - Enrollment data
   * @returns {Promise<Object>} Enrollment response
   */
  async enrollCourse(enrollmentData) {
    return api.post('/api/user-courses', enrollmentData);
  }
}

export default new CourseService(); 