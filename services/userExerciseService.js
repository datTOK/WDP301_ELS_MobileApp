import api from './api';

/**
 * User Exercise Service
 * Handles all user exercise-related API calls
 */
class UserExerciseService {
  /**
   * Submit exercise answer
   * @param {Object} submissionData - Exercise submission data
   * @param {string} submissionData.id - Exercise ID
   * @param {string} submissionData.answer - User's answer
   * @returns {Promise<Object>} Exercise submission response
   */
  async submitExercise(submissionData) {
    return api.post('/api/user-exercises/submission', submissionData);
  }

  /**
   * Get user exercises with pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.lessonId - Filter by lesson ID
   * @param {string} params.status - Filter by exercise status
   * @returns {Promise<Object>} User exercises response
   */
  async getUserExercises(params = {}) {
    return api.get('/api/user-exercises', { params });
  }

  /**
   * Get user exercise by ID
   * @param {string} userExerciseId - User exercise ID
   * @returns {Promise<Object>} User exercise details response
   */
  async getUserExerciseById(userExerciseId) {
    return api.get(`/api/user-exercises/${userExerciseId}`);
  }

  /**
   * Get user exercise by exercise ID
   * @param {string} exerciseId - Exercise ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User exercise response
   */
  async getUserExerciseByExerciseId(exerciseId, params = {}) {
    return api.get(`/api/user-exercises/${exerciseId}/exercise`, { params });
  }

  /**
   * Create user exercise
   * @param {Object} exerciseData - User exercise data
   * @returns {Promise<Object>} User exercise creation response
   */
  async createUserExercise(exerciseData) {
    return api.post('/api/user-exercises', exerciseData);
  }

  /**
   * Update user exercise
   * @param {string} userExerciseId - User exercise ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} User exercise update response
   */
  async updateUserExercise(userExerciseId, updateData) {
    return api.put(`/api/user-exercises/${userExerciseId}`, updateData);
  }
}

export default new UserExerciseService(); 