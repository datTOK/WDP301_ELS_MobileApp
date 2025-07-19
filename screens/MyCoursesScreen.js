import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Image } from 'react-native-elements';
import { MOBILE_SERVER_URL } from '@env';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const API_BASE_URL = 'http://localhost:4000/api';

const MyCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userToken, userId } = useAuth();
  const { showError } = useToast();

  useEffect(() => {
    const fetchMyCourses = async () => {
      setLoading(true);
      setError(null);
      console.log('Starting fetchMyCourses with userId:', userId, 'userToken:', userToken);

      try {
        const response = await fetch(`${MOBILE_SERVER_URL}api/user-courses`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
        });
        console.log('Fetch response status:', response.status);

        if (!response.ok) {
          console.log('API response not OK, status:', response.status);
          const errorResult = await response.json();
          console.log('API error response:', errorResult);
          throw new Error(errorResult.message || 'Failed to fetch enrolled courses');
        }

        const result = await response.json();
        console.log('API response data:', result);

        if (!result.data || !Array.isArray(result.data)) {
          console.log('Invalid data structure in response:', result);
          throw new Error('Invalid data structure. Missing "data" array.');
        }

        const enrolledCourses = result.data || [];
        console.log('Enrolled courses retrieved:', enrolledCourses);

        const courseDetails = await Promise.all(
          enrolledCourses.map(async (userCourse) => {
            console.log('Fetching course details for courseId:', userCourse.courseId);
            const courseResponse = await fetch(`${MOBILE_SERVER_URL}api/courses/${userCourse.courseId}`, {
              headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${userToken}`,
              },
            });

            if (!courseResponse.ok) {
              console.log('Course details fetch failed for courseId:', userCourse.courseId, 'status:', courseResponse.status);
              return null;
            }

            const courseData = await courseResponse.json();
            console.log('Course details fetched for courseId:', userCourse.courseId, 'data:', courseData);
            return courseResponse.ok ? { ...courseData, userCourse } : null;
          })
        );

        const validCourses = courseDetails.filter(course => course !== null);
        console.log('Processed course details:', validCourses);
        setCourses(validCourses);

      } catch (err) {
        console.error('Error in fetchMyCourses:', err.message);
        setError(err.message);
        showError('Error', err.message);
      } finally {
        console.log('FetchMyCourses completed, loading set to false');
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [userId, userToken]);

  const renderCourseItem = ({ item }) => (
    <Card containerStyle={myCourseStyles.card}>
      <Card.Image
        source={{ uri: item.coverImage || 'https://images.pexels.com/photos/5652121/pexels-photo-5652121.jpeg' }}
      />
      <Card.Title style={myCourseStyles.title}>{item.name}</Card.Title>
      <Card.Divider style={{ backgroundColor: 'white', height: 2, marginVertical: 10, width: '90%', marginHorizontal: 'auto' }} />
      <Text style={myCourseStyles.contentSnippet} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={myCourseStyles.date}>
        Published: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Button
        title="View Details"
        buttonStyle={myCourseStyles.viewButton}
        titleStyle={myCourseStyles.viewButtonText}
        onPress={() => navigation.navigate('courseDetail', { courseId: item._id })}
        type="solid"
      />
    </Card>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading my courses..." />;
  }

  if (error) {
    console.log('Rendering error state with error:', error);
    return (
      <View style={myCourseStyles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={30} color="red" />
        <Text style={myCourseStyles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={() => fetchMyCourses()}
          buttonStyle={myCourseStyles.retryButton}
          titleStyle={myCourseStyles.retryButtonText}
        />
      </View>
    );
  }

  if (courses.length === 0) {
    console.log('Rendering no courses state');
    return (
      <View style={myCourseStyles.noDataContainer}>
        <Ionicons name="information-circle-outline" size={50} color="#888" />
        <Text style={myCourseStyles.noDataText}>No enrolled courses found.</Text>
      </View>
    );
  }

  console.log('Rendering course list with courses:', courses);
  return (
    <View style={myCourseStyles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={renderCourseItem}
        contentContainerStyle={myCourseStyles.listContentContainer}
      />
    </View>
  );
};

const myCourseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  card: {
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
    padding: 0,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    paddingHorizontal: 15,
    textAlign: 'center',
    color: '#fff',
  },
  contentSnippet: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  viewButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ff6b6b', marginTop: 10, fontSize: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 20 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noDataContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  noDataText: { fontSize: 18, color: '#888', marginTop: 10, textAlign: 'center', marginHorizontal: 15 },
  listContentContainer: { paddingBottom: 20 },
});

export default MyCoursesScreen;