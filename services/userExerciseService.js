import api from './api';

/**
 * User Exercise Service
 * Handles all user exercise-related API calls
 * Follows backend API routes and frontend web patterns
 */
class UserExerciseService {
  /**
   * Submit single exercise answer
   * Backend route: POST /api/user-exercises/submission
   * @param {Object} payload - Exercise submission payload
   * @param {string} payload.id - Exercise ID (for DTO validation)
   * @param {string} payload.exerciseId - Exercise ID (for controller)
   * @param {string} payload.answer - User's answer
   * @returns {Promise<Object>} Exercise submission response
   */
  async submitExercise(payload) {
    console.log('Sending exercise submission to API:', payload);
    try {
      const response = await api.post('/api/user-exercises/submission', payload);
      return response.data;
    } catch (error) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      throw error;
    }
  }

  /**
   * Submit multiple exercises for a lesson (batch submission)
   * Backend route: POST /api/lessons/:id/exercises/submission (id = lessonId)
   * @param {string} lessonId - Lesson ID
   * @param {Object} payload - Batch submission payload
   * @param {string} payload.userId - User ID
   * @param {Array} payload.answers - Array of exercise answers
   * @returns {Promise<Object>} Batch submission response
   */
  async submitExercisesForLesson(lessonId, payload) {
    console.log('Sending exercises batch submission to API:', payload);
    try {
      const response = await api.post(`/api/lessons/${lessonId}/exercises/submission`, payload);
      return response.data.submission;
    } catch (error) {
      console.error('API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get user exercises by user ID
   * Backend route: GET /api/user-exercises/:id/user (id = userId)
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @returns {Promise<Object>} User exercises response
   */
  async getUserExercisesByUserId(userId, params = {}) {
    const response = await api.get(`/api/user-exercises/${userId}/user`, { params });
    return response.data.data || [];
  }

  /**
   * Get user exercise by exercise ID
   * Backend route: GET /api/user-exercises/:id/exercise (id = exerciseId)
   * @param {string} exerciseId - Exercise ID
   * @returns {Promise<Object>} User exercise response
   */
  async getUserExerciseByExerciseId(exerciseId) {
    const response = await api.get(`/api/user-exercises/${exerciseId}/exercise`);
    return response.data;
  }

  /**
   * Get user exercise by ID
   * Backend route: GET /api/user-exercises/:id (id = userExerciseId)
   * @param {string} userExerciseId - User exercise ID
   * @returns {Promise<Object>} User exercise response
   */
  async getUserExerciseById(userExerciseId) {
    const response = await api.get(`/api/user-exercises/${userExerciseId}`);
    return response.data;
  }

  /**
   * Get user exercises filtered by lesson ID
   * Helper function that fetches user exercises and filters by lesson
   * @param {string} userId - User ID
   * @param {string} lessonId - Lesson ID to filter by
   * @returns {Promise<Array>} Filtered user exercises
   */
  async getUserExercisesByLessonId(userId, lessonId) {
    try {
      const response = await api.get(`/api/user-exercises/${userId}/user?size=1000`);
      const allUserExercises = response.data.data || [];
      
      return allUserExercises.filter((userExercise) => 
        userExercise.exercise?.lessonId === lessonId
      );
    } catch (error) {
      console.error('Failed to get user exercises by lesson ID:', error);
      return [];
    }
  }

  /**
   * Get all user exercises by user ID (alias with large page size)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} All user exercises
   */
  async getAllUserExercises(userId) {
    return this.getUserExercisesByUserId(userId, { size: 1000 });
  }
}

export default new UserExerciseService(); 