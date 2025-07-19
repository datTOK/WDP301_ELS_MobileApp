import api from './api';

/**
 * Membership Service
 * Handles all membership-related API calls
 */
class MembershipService {
  /**
   * Get all memberships with pagination and search
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.size - Items per page (default: 5)
   * @param {string} params.order - Sort order: 'asc' or 'desc' (default: 'asc')
   * @param {string} params.sortBy - Sort field: 'date', 'name', etc. (default: 'date')
   * @param {string} params.search - Search term (default: '')
   * @returns {Promise<Object>} Memberships list response
   */
  async getMemberships(params = {}) {
    const queryParams = {
      page: params.page || 1,
      size: params.size || 10,
      order: params.order || 'asc',
      sortBy: params.sortBy || 'date',
      search: params.search || ''
    };
    return api.get('/api/memberships', { params: queryParams });
  }

  /**
   * Get membership by ID
   * @param {string} membershipId - Membership ID
   * @returns {Promise<Object>} Membership details response
   */
  async getMembershipById(membershipId) {
    return api.get(`/api/memberships/${membershipId}`);
  }

  /**
   * Create a new membership (Admin only)
   * @param {Object} membershipData - Membership data
   * @param {string} membershipData.name - Membership name
   * @param {string} membershipData.description - Membership description
   * @param {number} membershipData.price - Membership price
   * @param {number} membershipData.duration - Duration in days
   * @returns {Promise<Object>} Created membership response
   */
  async createMembership(membershipData) {
    return api.post('/api/memberships', membershipData);
  }

  /**
   * Update membership (Admin only)
   * @param {string} membershipId - Membership ID
   * @param {Object} membershipData - Updated membership data
   * @param {string} membershipData.name - Membership name
   * @param {string} membershipData.description - Membership description
   * @param {number} membershipData.price - Membership price
   * @param {number} membershipData.duration - Duration in days
   * @returns {Promise<Object>} Updated membership response
   */
  async updateMembership(membershipId, membershipData) {
    return api.patch(`/api/memberships/${membershipId}`, membershipData);
  }

  /**
   * Delete membership (Admin only)
   * @param {string} membershipId - Membership ID
   * @returns {Promise<Object>} Deleted membership response
   */
  async deleteMembership(membershipId) {
    return api.delete(`/api/memberships/${membershipId}`);
  }
}

export default new MembershipService(); 