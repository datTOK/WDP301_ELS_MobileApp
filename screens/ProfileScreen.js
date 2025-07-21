import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Button, Avatar } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { authService, userService, apiUtils } from '../services';
import SecureStorage, { SECURE_KEYS } from '../utils/secureStorage';

export default function ProfileScreen({ navigation }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { signOut, user, userToken, fetchAndSetUserProfile } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showInfo } = useToast();
  const styles = createGlobalStyles(theme);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Refresh user profile from API
      await fetchAndSetUserProfile(userToken);
      
      // Note: After fetchAndSetUserProfile, the user state should be updated
      // We'll fetch stats in the separate useEffect that watches for user changes
    } catch (err) {
      console.error('Error in fetchProfileData:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Always fetch profile data when component mounts, but only if we have a token
    if (userToken) {
      fetchProfileData();
    }
  }, [userToken]); // Run when userToken changes

  // Also fetch when user changes (login/logout scenarios)
  useEffect(() => {
    if (user?._id) {
      // Only fetch user stats if we have a user ID
      const fetchUserStats = async () => {
        try {
          const userDetail = await userService.getUserDetailById(user._id);
          setUserStats(userDetail);
        } catch (statsError) {
          console.error('Error fetching user stats:', statsError);
        }
      };
      fetchUserStats();
    }
  }, [user?._id]); // Run when user ID changes

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      await signOut();
      showSuccess('Logged out successfully');
      // Navigation is handled automatically by AppNavigator
    } catch (error) {
      console.error('Logout error:', error);
      showInfo('Logged out successfully');
      // Still logout locally even if API call fails
      await signOut();
      // Navigation is handled automatically by AppNavigator
    }
  };

  const renderProfileSection = () => (
    <Card containerStyle={localStyles.profileCard}>
      <View style={localStyles.profileHeader}>
        <Avatar
          size="large"
          rounded
          icon={{ name: 'person', type: 'material' }}
          containerStyle={localStyles.avatar}
          source={user?.avatar ? { uri: user.avatar } : null}
        />
        <View style={localStyles.profileInfo}>
          <Text style={localStyles.userName}>
            {user?.name || user?.username || 'N/A'}
          </Text>
          <Text style={localStyles.userEmail}>
            {user?.email || 'N/A'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsSection = () => (
    <Card containerStyle={localStyles.statsCard}>
      <Text style={localStyles.statsTitle}>Your Progress</Text>
      
      {/* Main Stats Grid */}
      <View style={localStyles.statsGrid}>
        <View style={localStyles.statItem}>
          <Ionicons name="book-outline" size={24} color="#4CC2FF" />
          <Text style={localStyles.statNumber}>{userStats?.coursesCompleted || 0}</Text>
          <Text style={localStyles.statLabel}>Courses Completed</Text>
        </View>
        <View style={localStyles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#28a745" />
          <Text style={localStyles.statNumber}>{userStats?.testsPassed || 0}</Text>
          <Text style={localStyles.statLabel}>Tests Passed</Text>
        </View>
        <View style={localStyles.statItem}>
          <Ionicons name="trophy-outline" size={24} color="#ffc107" />
          <Text style={localStyles.statNumber}>{userStats?.achievements || 0}</Text>
          <Text style={localStyles.statLabel}>Achievements</Text>
        </View>
      </View>

      {/* Detailed Progress Section */}
      {userStats && (
        <View style={localStyles.detailedProgress}>
          <Text style={localStyles.detailsTitle}>Detailed Progress</Text>
          
          {/* Course Progress */}
          <View style={localStyles.progressItem}>
            <View style={localStyles.progressHeader}>
              <Ionicons name="book" size={20} color="#4CC2FF" />
              <Text style={localStyles.progressTitle}>Course Progress</Text>
            </View>
            <View style={localStyles.progressStats}>
              <Text style={localStyles.progressText}>
                Total Enrolled: {userStats.totalCourses || 0}
              </Text>
              <Text style={localStyles.progressText}>
                Completed: {userStats.coursesCompleted || 0}
              </Text>
              <Text style={localStyles.progressText}>
                In Progress: {(userStats.totalCourses || 0) - (userStats.coursesCompleted || 0)}
              </Text>
            </View>
            {userStats.totalCourses > 0 && (
              <View style={localStyles.progressBar}>
                <View 
                  style={[
                    localStyles.progressFill, 
                    { width: `${((userStats.coursesCompleted || 0) / userStats.totalCourses) * 100}%` }
                  ]} 
                />
              </View>
            )}
            <Text style={localStyles.progressPercentage}>
              {userStats.totalCourses > 0 
                ? `${Math.round(((userStats.coursesCompleted || 0) / userStats.totalCourses) * 100)}% Complete`
                : '0% Complete'
              }
            </Text>
          </View>

          {/* Test Performance */}
          <View style={localStyles.progressItem}>
            <View style={localStyles.progressHeader}>
              <Ionicons name="analytics" size={20} color="#28a745" />
              <Text style={localStyles.progressTitle}>Test Performance</Text>
            </View>
            <View style={localStyles.progressStats}>
              <Text style={localStyles.progressText}>
                Total Tests: {userStats.totalTests || 0}
              </Text>
              <Text style={localStyles.progressText}>
                Passed: {userStats.testsPassed || 0}
              </Text>
              <Text style={localStyles.progressText}>
                Average Score: {userStats.averageScore ? `${userStats.averageScore.toFixed(1)}%` : 'N/A'}
              </Text>
            </View>
            {userStats.totalTests > 0 && (
              <View style={localStyles.progressBar}>
                <View 
                  style={[
                    localStyles.progressFill, 
                    { 
                      width: `${((userStats.testsPassed || 0) / userStats.totalTests) * 100}%`,
                      backgroundColor: '#28a745'
                    }
                  ]} 
                />
              </View>
            )}
            <Text style={localStyles.progressPercentage}>
              {userStats.totalTests > 0 
                ? `${Math.round(((userStats.testsPassed || 0) / userStats.totalTests) * 100)}% Pass Rate`
                : '0% Pass Rate'
              }
            </Text>
          </View>

          {/* Achievement Progress */}
          <View style={localStyles.progressItem}>
            <View style={localStyles.progressHeader}>
              <Ionicons name="medal" size={20} color="#ffc107" />
              <Text style={localStyles.progressTitle}>Achievement Progress</Text>
            </View>
            <View style={localStyles.achievementContainer}>
              <View style={localStyles.achievementStats}>
                <Text style={localStyles.progressText}>
                  Earned: {userStats.achievements || 0}
                </Text>
                <Text style={localStyles.progressText}>
                  Recent: {userStats.recentAchievements || 0} this month
                </Text>
              </View>
              <View style={localStyles.achievementVisual}>
                <View style={localStyles.achievementCircle}>
                  <Text style={localStyles.achievementNumber}>
                    {userStats.achievements || 0}
                  </Text>
                  <Text style={localStyles.achievementLabel}>Total</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </Card>
  );

  const renderActionsSection = () => (
    <Card containerStyle={localStyles.actionsCard}>
      <Text style={localStyles.actionsTitle}>Account Actions</Text>
      <View style={localStyles.actionsList}>
        <TouchableOpacity
          style={localStyles.actionItem}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#4CC2FF" />
          <Text style={localStyles.actionText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.actionItem}
          onPress={() => navigation.navigate('MyCourses')}
        >
          <Ionicons name="book-outline" size={20} color="#28a745" />
          <Text style={localStyles.actionText}>My Courses</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.actionItem}
          onPress={() => navigation.navigate('Achievements')}
        >
          <Ionicons name="trophy-outline" size={20} color="#ffc107" />
          <Text style={localStyles.actionText}>My Achievements</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        <TouchableOpacity
          style={localStyles.actionItem}
          onPress={() => navigation.navigate('Flashcards', { screen: 'MyFlashcardSets' })}
        >
          <Ionicons name="layers-outline" size={20} color="#9c27b0" />
          <Text style={localStyles.actionText}>My Flashcards</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderMembershipSection = () => (
    <Card containerStyle={localStyles.membershipCard}>
      <Text style={localStyles.membershipTitle}>Membership Status</Text>
      <View style={localStyles.membershipContent}>
        <View style={localStyles.membershipIcon}>
          <Ionicons name="star" size={30} color="#ffd700" />
        </View>
        <View style={localStyles.membershipInfo}>
          <Text style={localStyles.membershipStatus}>
            {user?.activeUntil ? 'Premium Member' : 'Free Member'}
          </Text>
          {user?.activeUntil ? (
            <Text style={localStyles.membershipExpiry}>
              Expires: {new Date(user.activeUntil).toLocaleDateString()}
            </Text>
          ) : (
            <Text style={localStyles.membershipUpgrade}>
              Upgrade to Premium for unlimited access
            </Text>
          )}
        </View>
      </View>
      
      {/* Membership Description */}
      <View style={localStyles.membershipDescription}>
        {user?.activeUntil ? (
          <View>
            <Text style={localStyles.descriptionTitle}>Premium Benefits:</Text>
            <View style={localStyles.benefitsList}>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Unlimited access to all courses</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Advanced progress tracking</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Priority customer support</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Exclusive premium content</Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text style={localStyles.descriptionTitle}>Free Plan Features:</Text>
            <View style={localStyles.benefitsList}>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Access to basic courses</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Limited progress tracking</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Community support</Text>
              </View>
              <View style={localStyles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                <Text style={localStyles.benefitText}>Basic achievements</Text>
              </View>
            </View>
            <TouchableOpacity
              style={localStyles.upgradeButton}
              onPress={() => navigation.navigate('Membership')}
            >
              <Text style={localStyles.upgradeButtonText}>Upgrade to Premium</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );

  const renderLogoutSection = () => (
    <Card containerStyle={localStyles.logoutCard}>
      <Button
        title="Logout"
        buttonStyle={localStyles.logoutButton}
        titleStyle={localStyles.logoutButtonText}
        icon={{
          name: 'log-out-outline',
          type: 'ionicon',
          size: 20,
          color: '#fff',
        }}
        onPress={handleLogout}
      />
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  if (!user) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>User profile not available</Text>
        <Button
          title="Retry"
          onPress={fetchProfileData}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchProfileData}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderProfileSection()}
      {renderStatsSection()}
      {renderMembershipSection()}
      {renderActionsSection()}
      {renderLogoutSection()}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  profileCard: {
    borderRadius: 12,
    margin: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#4CC2FF',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    marginBottom: 3,
  },
  userRole: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    color: '#4CC2FF',
  },
  statsCard: {
    borderRadius: 12,
    margin: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    marginVertical: 10,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    marginTop: 2,
  },
  actionsCard: {
    borderRadius: 12,
    margin: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  actionsTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  actionsList: {
    marginTop: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
    color: '#fff',
    marginLeft: 15,
  },
  logoutCard: {
    borderRadius: 12,
    margin: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingVertical: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontFamily: 'Mulish-Bold',
    fontSize: 16,
  },
  membershipCard: {
    borderRadius: 12,
    margin: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
  },
  membershipTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  membershipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  membershipIcon: {
    marginRight: 15,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipStatus: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#ffd700',
  },
  membershipExpiry: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    marginTop: 2,
  },
  membershipUpgrade: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#4CC2FF',
    marginTop: 5,
  },
  membershipDescription: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginBottom: 10,
  },
  benefitsList: {
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    marginLeft: 10,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CC2FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    marginRight: 8,
  },
  detailedProgress: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderColor: '#333',
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginLeft: 10,
  },
  progressStats: {
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    marginBottom: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CC2FF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
    textAlign: 'center',
    marginTop: 5,
  },
  achievementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  achievementStats: {
    flex: 1,
  },
  achievementVisual: {
    width: 100,
    alignItems: 'center',
  },
  achievementCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#4CC2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  achievementNumber: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
  },
  achievementLabel: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    color: '#ccc',
  },
});