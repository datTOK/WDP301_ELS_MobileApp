import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from 'react-native-elements';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService, apiUtils } from '../services';



const MyCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showError } = useToast();

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!user?._id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch user courses using the correct API endpoint
        const response = await courseService.getUserCourses(user._id, {
          page: 1,
          size: 50
        });
        
        const result = apiUtils.parseResponse(response);
        console.log('User courses response:', result);

        if (result.data && Array.isArray(result.data)) {
          // Fetch course details for each enrolled course
          const courseDetails = await Promise.all(
            result.data.map(async (userCourse) => {
              try {
                const courseResponse = await courseService.getCourseById(userCourse.courseId);
                const courseResult = apiUtils.parseResponse(courseResponse);
                return courseResult.data ? { ...courseResult.data, userCourse } : null;
              } catch (courseError) {
                console.error('Error fetching course details for courseId:', userCourse.courseId, courseError);
                return null;
              }
            })
          );

          const validCourses = courseDetails.filter(course => course !== null);
          console.log('Processed course details:', validCourses);
          setCourses(validCourses);
        } else {
          setCourses([]);
        }

      } catch (err) {
        console.error('Error in fetchMyCourses:', err);
        const errorInfo = apiUtils.handleError(err);
        setError(errorInfo.message);
        showError('Failed to load your courses');
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [user?._id]);

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
          onPress={() => {
            setError(null);
            fetchMyCourses();
          }}
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