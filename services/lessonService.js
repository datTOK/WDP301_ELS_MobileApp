import api from './api';

/**
 * Lesson Service
 * Handles all lesson-related API calls
 */
class LessonService {
  /**
   * Get lesson by ID
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Object>} Lesson details response
   */
  async getLessonById(lessonId) {
    return api.get(`/api/lessons/${lessonId}`);
  }

  /**
   * Get lesson grammars
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lesson grammars response
   */
  async getLessonGrammars(lessonId, params = {}) {
    return api.get(`/api/lessons/${lessonId}/grammars`, { params });
  }

  /**
   * Get lesson exercises
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lesson exercises response
   */
  async getLessonExercises(lessonId, params = {}) {
    return api.get(`/api/exercises/${lessonId}/lesson`, { params });
  }

  /**
   * Get lesson vocabulary
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Lesson vocabulary response
   */
  async getLessonVocabulary(lessonId, params = {}) {
    return api.get(`/api/vocabulary/${lessonId}/lesson`, { params });
  }
}

export default new LessonService(); 