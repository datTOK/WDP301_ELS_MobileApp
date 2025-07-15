import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:4000/api';

const CourseLessonScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { userToken } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState({});

  useEffect(() => {
    fetchLessons();
  }, [courseId, userToken]);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch lessons');
      }

      const lessonsData = data.data || [];
      setLessons(lessonsData);

      // Fetch completion status for each lesson
      await fetchLessonCompletionStatus(lessonsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonCompletionStatus = async (lessonsData) => {
    try {
      const completionPromises = lessonsData.map(async (lesson) => {
        try {
          const response = await fetch(`${API_BASE_URL}/user-lessons/${lesson._id}/lesson`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
          });

          if (response.ok) {
            const data = await response.json();
            // Use userLesson.status and userLesson.currentOrder from API
            return {
              lessonId: lesson._id,
              completed: data.userLesson?.status === 'completed',
              currentOrder: data.userLesson?.currentOrder || [],
              status: data.userLesson?.status || 'ongoing',
            };
          }
          return { lessonId: lesson._id, completed: false, currentOrder: [], status: 'not_started' };
        } catch (error) {
          console.log('Error fetching user lesson status:', error);
          return { lessonId: lesson._id, completed: false, currentOrder: [], status: 'not_started' };
        }
      });

      const completionResults = await Promise.all(completionPromises);
      const progressData = {};
      const completedIds = [];

      completionResults.forEach(({ lessonId, completed, currentOrder, status }) => {
        progressData[lessonId] = { completed, currentOrder, status };
        if (completed) {
          completedIds.push(lessonId);
        }
      });
      setLessonProgress(progressData);
      setCompletedLessons(completedIds);
    } catch (error) {
      console.log('Error fetching completion status:', error);
    }
  };

  const updateLessonStatus = async (lessonId, status) => {
    try {
      const lessonResponse = await fetch(`${API_BASE_URL}/user-lessons/${lessonId}/lesson`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });
      const lessonData = await lessonResponse.json();

      const response = await fetch(`${API_BASE_URL}/user-lessons/${lessonData?.userLesson?._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update local state
        setLessonProgress(prev => ({
          ...prev,
          [lessonId]: { ...prev[lessonId], completed: status === 'completed' }
        }));

        if (status === 'completed') {
          setCompletedLessons(prev =>
            prev.includes(lessonId) ? prev : [...prev, lessonId]
          );
        } else {
          setCompletedLessons(prev =>
            prev.filter(id => id !== lessonId)
          );
        }

        return true;
      }
      return false;
    } catch (error) {
      console.log('Error updating lesson status:', error);
      return false;
    }
  };

  const navigateToLesson = (lesson) => {
    console.log("Lesson:", lesson);
    navigation.navigate('CourseDetail', {
      courseId,
      lessonId: lesson._id,
      lessonName: lesson.name,
      updateLessonStatus: updateLessonStatus, // Pass the update function
    });
  };

  const renderLessonCard = (lesson, index) => {
    const lessonProgressData = lessonProgress[lesson._id];
    const isCompleted = lessonProgressData?.completed || false;
    const isLocked = index > 0 && !(lessonProgress[lessons[index - 1]?._id]?.completed || false);

    return (
      <TouchableOpacity
        key={lesson._id}
        style={[
          styles.lessonCard,
          isCompleted && styles.completedLessonCard,
          isLocked && styles.lockedLessonCard,
        ]}
        onPress={() => !isLocked && navigateToLesson(lesson)}
        disabled={isLocked}
      >
        <View style={styles.lessonHeader}>
          <View style={styles.lessonNumberContainer}>
            <Text style={styles.lessonNumber}>{index + 1}</Text>
          </View>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle}>{lesson.name}</Text>
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lesson.description}
            </Text>
          </View>
          <View style={styles.lessonStatus}>
            {isLocked ? (
              <Icon name="lock" type="feather" color="#888" size={20} />
            ) : isCompleted ? (
              <Icon name="check-circle" type="feather" color="#28a745" size={24} />
            ) : (
              <Icon name="play-circle" type="feather" color="#007AFF" size={24} />
            )}
          </View>
        </View>

        {!isLocked && (
          <View style={styles.lessonProgress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${isCompleted ? 100 : 0}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {isCompleted ? 'Completed' : 'Not started'}
            </Text>
          </View>
        )}

        {isLocked && (
          <View style={styles.lockedMessage}>
            <Text style={styles.lockedText}>
              Complete previous lesson to unlock
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lessons...</Text>
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
          onPress={fetchLessons}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courseName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressOverview}>
        <Text style={styles.progressTitle}>Course Progress</Text>
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedLessons.length}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lessons.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.lessonsContainer}
        contentContainerStyle={styles.lessonsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lessonsTitle}>Lessons</Text>
        {lessons.map((lesson, index) => renderLessonCard(lesson, index))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#2a2a2a',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerSpacer: {
    width: 40,
  },
  progressOverview: {
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333',
  },
  lessonsContainer: {
    flex: 1,
  },
  lessonsContent: {
    padding: 20,
  },
  lessonsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  lessonCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  completedLessonCard: {
    borderColor: '#28a745',
    backgroundColor: '#1a2a1a',
  },
  lockedLessonCard: {
    opacity: 0.6,
    backgroundColor: '#222',
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  lessonNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  lessonStatus: {
    marginLeft: 10,
  },
  lessonProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#ccc',
    minWidth: 80,
  },
  lockedMessage: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  lockedText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CourseLessonScreen; 