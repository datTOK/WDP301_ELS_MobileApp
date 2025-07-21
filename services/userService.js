import api from './api';

/**
 * User Service
 * Handles all user-related API calls
 */
class UserService {
  /**
   * Get user leaderboard
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of top users to fetch
   * @param {string} params.sortBy - Sort field (points, etc.)
   * @returns {Promise<Object>} User leaderboard response
   */
  async getLeaderboard(params = {}) {
    return api.get('/api/users/leaderboard', { params });
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details response
   */
  async getUserById(userId) {
    return api.get(`/api/users/${userId}`);
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User update data
   * @returns {Promise<Object>} User update response
   */
  async updateUser(userId, userData) {
    return api.patch(`/api/users/${userId}`, userData);
  }

  /**
   * Get all users (admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Users response
   */
  async getUsers(params = {}) {
    return api.get('/api/users', { params });
  }

  /**
   * Get detailed user information including stats
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details response
   */
  async getUserDetailById(userId) {
    try {
      console.log('Getting user details for ID:', userId);
      
      // Get basic user info
      const userResponse = await api.get(`/api/users/${userId}`);
      const user = userResponse.data.user;
      console.log('Basic user info:', user);

      // Initialize user detail object
      const userDetail = { ...user };

      // Try to get additional stats from various endpoints
      const userCoursesResponse = await api.get(`/api/user-courses/${userId}/user`).catch((error) => {
        console.error('Error fetching user courses:', error);
        return { data: null };
      });

      const userTestsResponse = await api.get(`/api/user-tests/${userId}/user`).catch((error) => {
        console.error('Error fetching user tests:', error);
        return { data: null };
      });

      const userAchievementsResponse = await api.get(`/api/user-achievements/${userId}/users`).catch((error) => {
        console.error('Error fetching user achievements:', error);
        return { data: null };
      });

      // Process courses data
      if (userCoursesResponse?.data) {
        const courses = userCoursesResponse.data.data || [];
        userDetail.totalCourses = courses.length;
        userDetail.coursesCompleted = courses.filter(c => c.status === 'completed').length;
        userDetail.coursesInProgress = courses.filter(c => c.status === 'ongoing').length;
        console.log('Total courses:', userDetail.totalCourses);
        console.log('Courses completed:', userDetail.coursesCompleted);
        console.log('Courses in progress:', userDetail.coursesInProgress);
      }

      // Process tests data
      if (userTestsResponse?.data) {
        const tests = userTestsResponse.data.data || [];
        userDetail.totalTests = tests.length;
        userDetail.testsPassed = tests.filter(t => t.status === 'completed' && t.score >= 70).length;
        
        // Calculate average score
        const completedTests = tests.filter(t => t.status === 'completed' && t.score !== undefined);
        if (completedTests.length > 0) {
          const totalScore = completedTests.reduce((sum, test) => sum + (test.score || 0), 0);
          userDetail.averageScore = totalScore / completedTests.length;
        } else {
          userDetail.averageScore = 0;
        }
        
        console.log('Total tests:', userDetail.totalTests);
        console.log('Tests passed:', userDetail.testsPassed);
        console.log('Average score:', userDetail.averageScore);
      }

      // Process achievements data
      if (userAchievementsResponse?.data) {
        const achievements = userAchievementsResponse.data.data || [];
        userDetail.achievements = achievements.length;
        
        // Calculate recent achievements (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        userDetail.recentAchievements = achievements.filter(achievement => {
          const achievementDate = new Date(achievement.createdAt || achievement.dateEarned);
          return achievementDate >= thirtyDaysAgo;
        }).length;
        
        console.log('Total achievements:', userDetail.achievements);
        console.log('Recent achievements:', userDetail.recentAchievements);
      }

      // Set default values for missing stats
      userDetail.totalCourses = userDetail.totalCourses || 0;
      userDetail.coursesCompleted = userDetail.coursesCompleted || 0;
      userDetail.coursesInProgress = userDetail.coursesInProgress || 0;
      userDetail.totalTests = userDetail.totalTests || 0;
      userDetail.testsPassed = userDetail.testsPassed || 0;
      userDetail.averageScore = userDetail.averageScore || 0;
      userDetail.achievements = userDetail.achievements || 0;
      userDetail.recentAchievements = userDetail.recentAchievements || 0;

      console.log('Final user detail object:', userDetail);
      return userDetail;
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Return basic user info if detailed fetch fails
      return user;
    }
  }
}

export default new UserService(); 