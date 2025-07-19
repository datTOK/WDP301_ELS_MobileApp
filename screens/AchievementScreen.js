import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Card } from 'react-native-elements';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { userAchievementService, apiUtils } from '../services';

export default function AchievementScreen() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const { theme } = useTheme();
  const { showError } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, [currentPage]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAchievementService.getUserAchievements({
        page: currentPage,
        limit: 10
      });
      
      const result = apiUtils.parseResponse(response);
      
      if (result.data && Array.isArray(result.data.achievements)) {
        setAchievements(result.data.achievements);
        setTotalPages(result.data.totalPages || 0);
      } else {
        setError('Invalid data structure received');
      }
    } catch (err) {
      console.error('Error fetching user achievements:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError('Error', errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAchievement = ({ item }) => (
    <Card containerStyle={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.achievementHeader}>
        <Image
          source={{ uri: item.achievement.icon || 'https://via.placeholder.com/50' }}
          style={styles.achievementIcon}
        />
        <View style={styles.achievementInfo}>
          <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
            {item.achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, { color: theme.colors.textSecondary }]}>
            {item.achievement.description}
          </Text>
        </View>
      </View>
      <View style={styles.achievementFooter}>
        <Text style={[styles.achievementDate, { color: theme.colors.textMuted }]}>
          Earned: {new Date(item.earnedAt).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading achievements..." />;
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Error: {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAchievements}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>My Achievements</Text>
      
      {achievements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No achievements earned yet. Keep learning to unlock achievements!
          </Text>
        </View>
      ) : (
        <FlatList
          data={achievements}
          renderItem={renderAchievement}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 18,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4CC2FF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noAchievementsText: {
    color: '#bbb',
    fontSize: 18,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medalIcon: {
    marginRight: 15,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 5,
  },
  achievementDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  paginationButton: {
    backgroundColor: '#4CC2FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  paginationButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationText: {
    color: '#fff',
    fontSize: 16,
  },
  // Additional styles needed by the component
  card: {
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  achievementFooter: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
});