import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import userService from '../services/userService';
import { apiUtils } from '../services';

export default function LeaderboardScreen() {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  // Fetch leaderboard when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [])
  );

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      const response = await userService.getLeaderboard({ limit: 10 });
      
      const result = apiUtils.parseResponse(response);
      
      // The backend returns users array directly in the response
      if (result.data && result.data.users && Array.isArray(result.data.users)) {
        setTopUsers(result.data.users);
      } else if (result.data && Array.isArray(result.data)) {
        // Handle case where data is directly an array
        setTopUsers(result.data);
      } else {
        console.warn('Unexpected leaderboard data structure:', result.data);
        setTopUsers([]);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      const errorInfo = apiUtils.handleError(err);
      showError(`Failed to load leaderboard: ${errorInfo.message}`);
      setTopUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(true);
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Ionicons name="trophy" size={20} color="#FBBF24" />;
      case 2:
        return <Ionicons name="medal" size={20} color="#D1D5DB" />;
      case 3:
        return <Ionicons name="ribbon" size={20} color="#F59E0B" />;
      default:
        return <Ionicons name="person" size={20} color="#9CA3AF" />;
    }
  };

  const getPositionColors = (position) => {
    switch (position) {
      case 1:
        return {
          text: '#FBBF24',
          bg: 'rgba(251, 191, 36, 0.1)',
        };
      case 2:
        return {
          text: '#D1D5DB',
          bg: 'rgba(209, 213, 219, 0.1)',
        };
      case 3:
        return {
          text: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          text: '#9CA3AF',
          bg: 'transparent',
        };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDate(dateString);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.headerContent}>
        <View>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={28} color="#FBBF24" style={styles.titleIcon} />
            <Text style={[globalStyles.title, { color: theme.colors.text, marginBottom: 0 }]}>
              Leaderboard
            </Text>
          </View>
          <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
            Top performers in our community
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTableHeader = () => (
    <View style={[styles.tableHeader, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.rankHeader}>
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>RANK</Text>
      </View>
      <View style={styles.userHeader}>
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>USER</Text>
      </View>
      <View style={styles.pointsHeader}>
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>POINTS</Text>
      </View>
      <View style={styles.streakHeader}>
        <Text style={[styles.headerText, { color: theme.colors.textSecondary }]}>STREAK</Text>
      </View>
    </View>
  );

  const renderUser = ({ item, index }) => {
    const position = index + 1;
    const colors = getPositionColors(position);
    
    // Ensure item is an object and has required properties
    if (!item || typeof item !== 'object') {
      console.warn('Invalid user item:', item);
      return null;
    }

    const username = item.username || item.name || 'Unknown User';
    const email = item.email || '';
    const points = item.points || 0;
    const onlineStreak = item.onlineStreak || item.streak || 0;

    return (
      <View style={[
        styles.userRow, 
        { 
          backgroundColor: theme.colors.cardBackground,
          borderBottomColor: theme.colors.border,
        }
      ]}>
        <View style={styles.rankCell}>
          <View style={styles.rankContent}>
            {getPositionIcon(position)}
            <Text style={[styles.rankText, { color: colors.text }]}>
              #{position}
            </Text>
          </View>
        </View>
        
        <View style={styles.userCell}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>
                {username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.username, { color: theme.colors.text }]}>
                {username}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {email}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.pointsCell}>
          <Text style={[styles.pointsText, { color: colors.text }]}>
            {points}
          </Text>
          <Text style={[styles.pointsLabel, { color: theme.colors.textSecondary }]}>
            pts
          </Text>
        </View>
        
        <View style={styles.streakCell}>
          <View style={styles.streakContent}>
            <Ionicons name="flame" size={16} color="#F97316" />
            <Text style={[styles.streakText, { color: theme.colors.textSecondary }]}>
              {onlineStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textMuted }]}>
              days
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
        No leaderboard data available.
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading leaderboard..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={topUsers}
        renderItem={renderUser}
        keyExtractor={(item, index) => item._id || item.id || `user-${index}`}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderTableHeader()}
          </View>
        }
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  refreshButton: {
    padding: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankHeader: {
    flex: 1,
    alignItems: 'center',
  },
  userHeader: {
    flex: 3,
    paddingLeft: 8,
  },
  pointsHeader: {
    flex: 1,
    alignItems: 'center',
  },
  streakHeader: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontFamily: 'Mulish-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankContent: {
    alignItems: 'center',
  },
  rankText: {
    fontSize: 12,
    fontFamily: 'Mulish-Bold',
    marginTop: 2,
  },
  userCell: {
    flex: 3,
    paddingLeft: 8,
    justifyContent: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
  },
  pointsCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
  },
  pointsLabel: {
    fontSize: 10,
    fontFamily: 'Mulish-Regular',
    marginTop: 2,
  },
  streakCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    marginLeft: 4,
  },
  streakLabel: {
    fontSize: 10,
    fontFamily: 'Mulish-Regular',
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
}); 