import api from './api';

/**
 * Exercise Service
 * Handles all exercise-related API calls
 * Follows backend API routes and frontend web patterns
 */
class ExerciseService {
  /**
   * Get exercise by ID
   * Backend route: GET /api/exercises/:id (id = exerciseId)
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<Object>} Exercise details response
   */
  async getExerciseById(exerciseId) {
    const response = await api.get(`/api/exercises/${exerciseId}`);
    return response.data;
  }

  /**
   * Get exercises by lesson ID
   * Backend route: GET /api/exercises/:id/lesson (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} Exercises response
   */
  async getExercisesByLessonId(lessonId, params = {}) {
    const response = await api.get(`/api/exercises/${lessonId}/lesson`, { params });
    return response.data;
  }

  /**
   * Get all exercises by lesson ID (alias with large page size)
   * @param {string} lessonId - Lesson ID
   * @returns {Promise<Array>} All exercises for the lesson
   */
  async getAllExercisesByLessonId(lessonId) {
    const response = await this.getExercisesByLessonId(lessonId, { size: 1000 });
    return response.data || [];
  }

  /**
   * Create exercise (Admin only)
   * Backend route: POST /api/exercises
   * @param {Object|FormData} exerciseData - Exercise data
   * @returns {Promise<Object>} Exercise creation response
   */
  async createExercise(exerciseData) {
    const response = await api.post('/api/exercises', exerciseData);
    return response.data;
  }

  /**
   * Update exercise (Admin only)
   * Backend route: PATCH /api/exercises/:id
   * @param {string} exerciseId - Exercise ID
   * @param {Object|FormData} exerciseData - Updated exercise data
   * @returns {Promise<Object>} Exercise update response
   */
  async updateExercise(exerciseId, exerciseData) {
    const response = await api.patch(`/api/exercises/${exerciseId}`, exerciseData);
    return response.data;
  }

  /**
   * Delete exercise (Admin only)
   * Backend route: DELETE /api/exercises/:id
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<Object>} Exercise deletion response
   */
  async deleteExercise(exerciseId) {
    const response = await api.delete(`/api/exercises/${exerciseId}`);
    return response.data;
  }
}

export default new ExerciseService(); 