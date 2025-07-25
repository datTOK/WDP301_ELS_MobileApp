import api from './api';

/**
 * Lesson Service
 * Handles all lesson-related API calls
 * Updated to match backend API routes and frontend web patterns
 */
class LessonService {
  /**
   * Get all lessons (Admin only)
   * Backend route: GET /api/lessons
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} All lessons response
   */
  async getAllLessons(params = {}) {
    const response = await api.get('/api/lessons', { params });
    return response.data.data;
  }

  /**
   * Get lesson by ID
   * Backend route: GET /api/lessons/:id (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} Lesson details response
   */
  async getLessonById(lessonId) {
    const response = await api.get(`/api/lessons/${lessonId}`);
    return response.data.lesson;
  }

  /**
   * Get lessons by course ID
   * Backend route: GET /api/courses/:id/lessons (id = courseId)
   * @param {string} courseId - Course ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Course lessons response
   */
  async getLessonsByCourseId(courseId, params = {}) {
    const response = await api.get(`/api/courses/${courseId}/lessons`, { params });
    return response.data;
  }

  /**
   * Get lesson grammars by lesson ID
   * Backend route: GET /api/lessons/:id/grammars (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Lesson grammars response
   */
  async getLessonGrammars(lessonId, params = {}) {
    const response = await api.get(`/api/lessons/${lessonId}/grammars`, { params });
    return response.data;
  }

  /**
   * Get lesson vocabularies by lesson ID
   * Backend route: GET /api/lessons/:id/vocabularies (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Lesson vocabularies response
   */
  async getLessonVocabularies(lessonId, params = {}) {
    const response = await api.get(`/api/lessons/${lessonId}/vocabularies`, { params });
    return response.data;
  }

  /**
   * Get lesson vocabulary (alias for getLessonVocabularies)
   * Maintains backward compatibility with existing mobile app code
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lesson vocabulary response
   */
  async getLessonVocabulary(lessonId, params = {}) {
    return this.getLessonVocabularies(lessonId, params);
  }

  /**
   * Get lesson exercises by lesson ID
   * Backend route: GET /api/exercises/:id/lesson (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Lesson exercises response
   */
  async getLessonExercises(lessonId, params = {}) {
    const response = await api.get(`/api/exercises/${lessonId}/lesson`, { params });
    return response.data;
  }

  /**
   * Get all exercises by lesson ID (alias with large page size)
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Array>} All exercises for the lesson
   */
  async getAllExercisesByLessonId(lessonId) {
    const response = await this.getLessonExercises(lessonId, { size: 1000 });
    return response.data || [];
  }

  /**
   * Get grammars by lesson ID (with pagination parameters)
   * @param {string} lessonId - Lesson ID
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Page size (default: 10)
   * @returns {Promise<Object>} Grammars response
   */
  async getGrammarsByLessonId(lessonId, page = 1, size = 10) {
    return this.getLessonGrammars(lessonId, { page, size });
  }

  /**
   * Get vocabularies by lesson ID (with pagination parameters)
   * @param {string} lessonId - Lesson ID
   * @param {number} page - Page number (default: 1)
   * @param {number} size - Page size (default: 10)
   * @returns {Promise<Object>} Vocabularies response
   */
  async getVocabulariesByLessonId(lessonId, page = 1, size = 10) {
    return this.getLessonVocabularies(lessonId, { page, size });
  }

  /**
   * Create lesson (Admin only)
   * Backend route: POST /api/lessons
   * @param {Object|FormData} lessonData - Lesson data
   * @returns {Promise<Object>} Lesson creation response
   */
  async createLesson(lessonData) {
    const response = await api.post('/api/lessons', lessonData);
    return response.data.lesson;
  }

  /**
   * Update lesson (Admin only)
   * Backend route: PATCH /api/lessons/:id
   * @param {string} lessonId - Lesson ID
   * @param {Object|FormData} lessonData - Updated lesson data
   * @returns {Promise<Object>} Lesson update response
   */
  async updateLesson(lessonId, lessonData) {
    const response = await api.patch(`/api/lessons/${lessonId}`, lessonData);
    return response.data.lesson;
  }

  /**
   * Delete lesson (Admin only)
   * Backend route: DELETE /api/lessons/:id
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} Lesson deletion response
   */
  async deleteLesson(lessonId) {
    const response = await api.delete(`/api/lessons/${lessonId}`);
    return response.data;
  }
}

export default new LessonService(); 