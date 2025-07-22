import api from './api';

/**
 * Flashcard Service
 * Handles all flashcard-related API calls
 */
class FlashcardService {
  /**
   * Get all flashcard sets with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.order - Sort order (asc/desc)
   * @param {string} params.sortBy - Sort field
   * @param {string} params.search - Search term
   * @param {string} params.userId - User ID (optional)
   * @returns {Promise<Object>} Flashcard sets response
   */
  async getFlashcardSets(params = {}) {
    return api.get('/api/flashcard-sets', { params });
  }

  /**
   * Get flashcard set by ID
   * @param {string} setId - Flashcard set ID
   * @returns {Promise<Object>} Flashcard set details response
   */
  async getFlashcardSetById(setId) {
    return api.get(`/api/flashcard-sets/${setId}`);
  }

  /**
   * Create new flashcard set
   * @param {Object} setData - Flashcard set data
   * @returns {Promise<Object>} Create response
   */
  async createFlashcardSet(setData) {
    return api.post('/api/flashcard-sets', setData);
  }

  /**
   * Update flashcard set
   * @param {string} setId - Flashcard set ID
   * @param {Object} setData - Updated flashcard set data
   * @returns {Promise<Object>} Update response
   */
  async updateFlashcardSet(setId, setData) {
    return api.patch(`/api/flashcard-sets/${setId}`, setData);
  }

  /**
   * Delete flashcard set
   * @param {string} setId - Flashcard set ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteFlashcardSet(setId) {
    return api.delete(`/api/flashcard-sets/${setId}`);
  }

  /**
   * Get user's flashcard sets
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User's flashcard sets response
   */
  async getUserFlashcardSets(userId, params = {}) {
    return api.get(`/api/flashcard-sets/${userId}/user`, { params });
  }

  /**
   * Get flashcards for a specific set
   * @param {string} flashcardSetId - Flashcard set ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.order - Sort order (asc/desc)
   * @param {string} params.sortBy - Sort field
   * @param {string} params.search - Search term
   * @returns {Promise<Object>} Flashcards response
   */
  async getFlashcards(flashcardSetId, params = {}) {
    return api.get(`/api/flashcards/${flashcardSetId}/flashcard-set`, { params });
  }

  /**
   * Get flashcard by ID
   * @param {string} flashcardId - Flashcard ID
   * @returns {Promise<Object>} Flashcard details response
   */
  async getFlashcard(flashcardId) {
    return api.get(`/api/flashcards/${flashcardId}`);
  }

  /**
   * Create new flashcard
   * @param {Object} flashcardData - Flashcard data
   * @returns {Promise<Object>} Create response
   */
  async createFlashcard(flashcardData) {
    return api.post('/api/flashcards', flashcardData);
  }

  /**
   * Update flashcard
   * @param {string} flashcardId - Flashcard ID
   * @param {Object} flashcardData - Updated flashcard data
   * @returns {Promise<Object>} Update response
   */
  async updateFlashcard(flashcardId, flashcardData) {
    return api.patch(`/api/flashcards/${flashcardId}`, flashcardData);
  }

  /**
   * Delete flashcard
   * @param {string} flashcardId - Flashcard ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteFlashcard(flashcardId) {
    return api.delete(`/api/flashcards/${flashcardId}`);
  }
}

export default new FlashcardService(); 