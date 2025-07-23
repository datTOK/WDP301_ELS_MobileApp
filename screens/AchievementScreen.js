import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { userAchievementService, apiUtils } from '../services';

export default function AchievementScreen() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { theme } = useTheme();
  const { showError } = useToast();
  const { user } = useAuth();
  const globalStyles = createGlobalStyles(theme);

  useEffect(() => {
    if (user?._id) {
      fetchAchievements();
    }
  }, [user?._id]);

  const fetchAchievements = async (isRefresh = false) => {
    try {
      if (!user?._id) {
        return;
      }

      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      
      const response = await userAchievementService.getUserAchievementsByUserId(user._id, {
        page: 1,
        limit: 50
      });
      
      const result = apiUtils.parseResponse(response);
      
      if (result.data && Array.isArray(result.data)) {
        // Sort achievements by date (most recent first)
        const sortedAchievements = result.data.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB - dateA; // Most recent first
        });
        setAchievements(sortedAchievements);
      } else {
        setAchievements([]);
      }
    } catch (err) {
      console.error('Error fetching user achievements:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError('Failed to load achievements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAchievements(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderAchievement = ({ item }) => (
    <View style={[styles.achievementCard, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.achievementContent}>
        <View style={styles.achievementHeader}>
          <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
            {item.achievement?.name || 'Unknown Achievement'}
          </Text>
          <Ionicons name="trophy" size={20} color="#FFD700" />
        </View>
        <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
          {item.achievement?.description || 'No description available'}
        </Text>
        <Text style={[styles.achievementDate, { color: theme.colors.textMuted }]}>
          Awarded: {formatDate(item.createdAt || item.earnedAt || item.dateAwarded)}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[globalStyles.title, styles.headerTitle, { color: theme.colors.text }]}>
            My Achievements
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
        Track your learning milestones and accomplishments
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="trophy-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
        No achievements earned yet.
      </Text>
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
        Keep learning to unlock achievements!
      </Text>
    </View>
  );

  if (!user?._id) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
            User not authenticated.
          </Text>
          <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            Please log in to view your achievements.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading achievements..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerSpacer: {
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
  },
  achievementCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 1,
  },
  achievementContent: {
    padding: 16,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    lineHeight: 24,
    flex: 1,
    marginRight: 8,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  achievementDate: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
});