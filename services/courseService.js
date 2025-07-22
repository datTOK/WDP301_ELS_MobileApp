import api from './api';

/**
 * Course Service
 * Handles all course-related API calls
 * Updated to match backend API routes and frontend web patterns
 */
class CourseService {
  /**
   * Get all courses with pagination and filters
   * Backend route: GET /api/courses
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
    const response = await api.get('/api/courses', { params });
    return response.data;
  }

  /**
   * Get all courses (alias with large page size)
   * @returns {Promise<Array>} All courses array
   */
  async getAllCourses() {
    const response = await this.getCourses({ size: 1000 });
    return response.data || [];
  }

  /**
   * Get course by ID
   * Backend route: GET /api/courses/:id (id = courseId)
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course details response
   */
  async getCourseById(courseId) {
    const response = await api.get(`/api/courses/${courseId}`);
    return response.data;
  }

  /**
   * Get course details (includes overview and additional data)
   * Backend route: GET /api/courses/:id/details (id = courseId)
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course details response
   */
  async getCourseDetails(courseId) {
    const response = await api.get(`/api/courses/${courseId}/details`);
    return response.data;
  }

  /**
   * Get course lessons
   * Backend route: GET /api/courses/:id/lessons (id = courseId)
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Course lessons response
   */
  async getCourseLessons(courseId, params = {}) {
    const response = await api.get(`/api/courses/${courseId}/lessons`, { params });
    return response.data;
  }

  /**
   * Get all lessons by course ID (alias with large page size)
   * @param {string} courseId - Course ID
   * @returns {Promise<Array>} All lessons for the course
   */
  async getAllLessonsByCourseId(courseId) {
    const response = await this.getCourseLessons(courseId, { size: 1000 });
    return response.data || [];
  }

  /**
   * Create course (Admin only)
   * Backend route: POST /api/courses
   * @param {Object|FormData} courseData - Course data
   * @returns {Promise<Object>} Course creation response
   */
  async createCourse(courseData) {
    const response = await api.post('/api/courses', courseData, {
      headers: courseData instanceof FormData ? 
        { 'Content-Type': 'multipart/form-data' } : 
        { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  /**
   * Update course (Admin only)
   * Backend route: PATCH /api/courses/:id
   * @param {string} courseId - Course ID
   * @param {Object|FormData} courseData - Updated course data
   * @returns {Promise<Object>} Course update response
   */
  async updateCourse(courseId, courseData) {
    const response = await api.patch(`/api/courses/${courseId}`, courseData, {
      headers: courseData instanceof FormData ? 
        { 'Content-Type': 'multipart/form-data' } : 
        { 'Content-Type': 'application/json' }
    });
    return response.data;
  }

  /**
   * Delete course (Admin only)
   * Backend route: DELETE /api/courses/:id
   * @param {string} courseId - Course ID
   * @returns {Promise<Object>} Course deletion response
   */
  async deleteCourse(courseId) {
    const response = await api.delete(`/api/courses/${courseId}`);
    return response.data;
  }
}

export default new CourseService(); 