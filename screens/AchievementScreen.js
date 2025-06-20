import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AchievementScreen() {
  const { userToken, userId } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (userId && userToken) {
      fetchUserAchievements();
    } else {
      setLoading(false);
      setError("User not logged in or user ID is missing.");
    }
  }, [userId, userToken, page, size]);

  const fetchUserAchievements = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!userId || !userToken) {
        throw new Error('Authentication token or user ID is missing.');
      }

      console.log(`Fetching achievements for user ID: ${userId}, Page: ${page}, Size: ${size}`);
      const response = await fetch(`http://localhost:4000/api/user-achievements/${userId}/users?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const data = await response.json();
      console.log('Achievement API response:', data);

      if (response.ok) {
        setAchievements(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        const errorMessage = data.message || 'Failed to fetch user achievements.';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error fetching user achievements:', err);
      setError(err.message || 'An unexpected error occurred while loading achievements.');
      Alert.alert('Error', err.message || 'Could not load achievements.');
    } finally {
      setLoading(false);
    }
  };

  const renderAchievementItem = ({ item }) => (
    <View style={achievementStyles.achievementCard}>
      <Ionicons name="trophy" size={30} color="#FFD700" style={achievementStyles.medalIcon} />
      <View style={achievementStyles.achievementTextContainer}>
        <Text style={achievementStyles.achievementName}>{item.achievement.name}</Text>
        <Text style={achievementStyles.achievementDescription}>{item.achievement.description}</Text>
        <Text style={achievementStyles.achievementDate}>Achieved on: {formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.warn("Invalid date string for formatting:", dateString);
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={achievementStyles.centered}>
        <ActivityIndicator size="large" color="#4CC2FF" />
        <Text style={achievementStyles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={achievementStyles.centered}>
        <Text style={achievementStyles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={achievementStyles.retryButton} onPress={fetchUserAchievements}>
          <Text style={achievementStyles.retryButtonText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!achievements.length) {
    return (
      <View style={achievementStyles.centered}>
        <Text style={achievementStyles.noAchievementsText}>No achievements found yet. Keep learning!</Text>
      </View>
    );
  }

  return (
    <View style={achievementStyles.container}>
      <View style={{flex: 1, flexDirection: 'row' , justifyContent: 'center', alignItems: 'center' }}>
        <Text style={achievementStyles.title}>Your Achievements</Text>
        <Ionicons name="happy" size={30} color="#FFD700" style={{ marginLeft: 10 }}/>
      </View>
      <FlatList
        data={achievements}
        renderItem={renderAchievementItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={achievementStyles.listContent}
      />
      {totalPages > 1 && (
        <View style={achievementStyles.paginationContainer}>
          <TouchableOpacity
            style={achievementStyles.paginationButton}
            onPress={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            <Text style={achievementStyles.paginationButtonText}>Previous</Text>
          </TouchableOpacity>
          <Text style={achievementStyles.paginationText}>Page {page} of {totalPages}</Text>
          <TouchableOpacity
            style={achievementStyles.paginationButton}
            onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            <Text style={achievementStyles.paginationButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const achievementStyles = StyleSheet.create({
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
    color: '#fff',
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
    color: '#4CC2FF',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#ccc',
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
});