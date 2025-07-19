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
import { authService, apiUtils } from '../services';

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { signOut } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showInfo } = useToast();
  const styles = createGlobalStyles(theme);

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch profile only (stats API doesn't exist)
      const profileResponse = await authService.getProfile();
      const profileResult = apiUtils.parseResponse(profileResponse);

      if (profileResult.data) {
        setUserProfile(profileResult.data);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

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
      showInfo('Logged out locally');
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
          source={userProfile?.avatar ? { uri: userProfile.avatar } : null}
        />
        <View style={localStyles.profileInfo}>
          <Text style={localStyles.userName}>
            {userProfile?.name || 'User Name'}
          </Text>
          <Text style={localStyles.userEmail}>
            {userProfile?.email || 'user@example.com'}
          </Text>
          <Text style={localStyles.userRole}>
            {userProfile?.role || 'Student'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderStatsSection = () => (
    <Card containerStyle={localStyles.statsCard}>
      <Card.Title style={localStyles.statsTitle}>Your Progress</Card.Title>
      <View style={localStyles.statsGrid}>
        <View style={localStyles.statItem}>
          <Ionicons name="book-outline" size={24} color="#4CC2FF" />
          <Text style={localStyles.statNumber}>{userStats?.coursesCompleted || 0}</Text>
          <Text style={localStyles.statLabel}>Courses</Text>
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
        <View style={localStyles.statItem}>
          <Ionicons name="time-outline" size={24} color="#ff6b6b" />
          <Text style={localStyles.statNumber}>{userStats?.studyHours || 0}h</Text>
          <Text style={localStyles.statLabel}>Study Time</Text>
        </View>
      </View>
    </Card>
  );

  const renderActionsSection = () => (
    <Card containerStyle={localStyles.actionsCard}>
      <Card.Title style={localStyles.actionsTitle}>Account Actions</Card.Title>
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
          onPress={() => navigation.navigate('Membership')}
        >
          <Ionicons name="star-outline" size={20} color="#ff6b6b" />
          <Text style={localStyles.actionText}>Membership</Text>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>
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
});