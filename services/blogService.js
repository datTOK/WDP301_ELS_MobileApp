import api from './api';

/**
 * Blog Service
 * Handles all blog-related API calls
 */
class BlogService {
  /**
   * Get all blogs with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.size - Page size
   * @param {string} params.order - Sort order (asc/desc)
   * @param {string} params.sortBy - Sort field
   * @param {string} params.search - Search term
   * @param {string} params.category - Blog category
   * @returns {Promise<Object>} Blogs response
   */
  async getBlogs(params = {}) {
    return api.get('/api/blogs', { params });
  }

  /**
   * Get blog by ID
   * @param {string} blogId - Blog ID
   * @returns {Promise<Object>} Blog details response
   */
  async getBlogById(blogId) {
    return api.get(`/api/blogs/${blogId}`);
  }
}

export default new BlogService(); 