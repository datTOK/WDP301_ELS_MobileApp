import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card } from 'react-native-elements';
import { useToast } from '../context/ToastContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import LoadingSpinner from '../components/LoadingSpinner';
import { userCourseService, courseService, lessonService, userLessonService, apiUtils } from '../services';

const { width } = Dimensions.get("window");

const MyCourseCard = ({ course, navigation, progress }) => {
  const [imageError, setImageError] = useState(false);

  const handleCoursePress = () => {
    if (course.isDeleted) {
      // Don't navigate for deleted courses
      return;
    }
    navigation.navigate('CourseOverview', { courseId: course._id });
  };

  return (
    <TouchableOpacity
      style={[styles.courseCard, course.isDeleted && styles.deletedCourseCard]}
      onPress={handleCoursePress}
      activeOpacity={course.isDeleted ? 1 : 0.8}
      disabled={course.isDeleted}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            imageError || !course.coverImage
              ? require("../assets/placeholder-course.jpg")
              : { uri: course.coverImage }
          }
          onError={() => setImageError(true)}
          style={styles.courseImage}
        />
        <View style={styles.imageOverlay} />
        
        {/* Progress Badge */}
        {progress && (
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{progress}%</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.name}
        </Text>
        
        <Text style={styles.courseDescription} numberOfLines={3}>
          {course.description || "No description available"}
        </Text>

        {/* Course Meta Info */}
        <View style={styles.courseMetaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#4CC2FF" />
            <Text style={styles.metaText}>
              {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : "N/A"}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="trending-up-outline" size={14} color="#10D876" />
            <Text style={styles.metaText}>{course.level || "All Levels"}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress === 100 ? "Completed" : `${progress}% Complete`}
            </Text>
          </View>
        )}

        {/* Action Button */}
        {!course.isDeleted ? (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('CourseLesson', { 
              courseId: course._id, 
              courseName: course.name 
            })}
          >
            <Ionicons 
              name={progress === 100 ? "refresh" : "play"} 
              size={16} 
              color="#fff" 
              style={{ marginRight: 6 }}
            />
            <Text style={styles.continueButtonText}>
              {progress === 100 ? "Review" : "Continue"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.deletedButton}>
            <Ionicons name="close-circle" size={16} color="#FF6B6B" style={{ marginRight: 6 }} />
            <Text style={styles.deletedButtonText}>Course Unavailable</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const MyCoursesScreen = ({ navigation }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [courseProgress, setCourseProgress] = useState({});
  
  const { user } = useAuth();
  const { showError } = useToast();
  const nav = useNavigation();

  // Fetch courses on component mount and focus
  useEffect(() => {
    fetchMyCourses();
  }, [user?._id]);

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchMyCourses();
      }
    }, [user?._id])
  );

  const fetchMyCourses = async () => {
    if (!user?._id) {
      setError('Please log in to view your courses.');
      setLoading(false);
      return;
    }

    setLoading(!refreshing);
    setError(null);
    
    try {
      // Fetch user courses
      const response = await userCourseService.getUserCoursesByUserId(user._id, {
        page: 1,
        size: 9999
      });

      if (!response.data || !Array.isArray(response.data)) {
        setCourses([]);
        setCourseProgress({});
        return;
      }

      // Fetch detailed course information for each enrolled course
      const courseDetailsPromises = response.data.map(async (userCourse) => {
        try {
          const courseResponse = await courseService.getCourseById(userCourse.courseId);
          
          if (courseResponse && courseResponse.course) {
            const courseData = courseResponse.course;
            return {
              ...courseData,
              userCourse,
              enrolledAt: userCourse.createdAt,
            };
          }
          return null;
        } catch (courseError) {
          console.error('Error fetching course details:', userCourse.courseId, courseError);
          // Return a placeholder course object for deleted courses
          return {
            _id: userCourse.courseId,
            name: 'Course Unavailable',
            description: 'This course is no longer available.',
            coverImage: null,
            level: 'Unknown',
            createdAt: userCourse.createdAt,
            userCourse,
            enrolledAt: userCourse.createdAt,
            isDeleted: true,
          };
        }
      });

      const courseDetails = await Promise.all(courseDetailsPromises);
      const validCourses = courseDetails.filter(course => course !== null);

      setCourses(validCourses);

      // Calculate progress for each course by counting completed lessons
      const progressData = {};
      await Promise.all(validCourses.map(async (course) => {
        if (course.isDeleted) {
          progressData[course._id] = 0;
          return;
        }

        try {
          // Get all lessons for this course
          const lessonsResponse = await lessonService.getLessonsByCourseId(course._id, {
            page: 1,
            size: 9999
          });
          
          const lessons = lessonsResponse.data || [];
          const totalLessons = lessons.length;
          
          if (totalLessons === 0) {
            progressData[course._id] = 0;
            return;
          }

          // Get user lessons for this specific course using the optimized method
          const userLessons = await userLessonService.getUserLessonsByCourseId(user._id, course._id);
          
          // Count completed lessons for this specific course
          const completedLessons = userLessons.filter(userLesson => 
            userLesson.status === 'completed'
          ).length;

          // Calculate progress percentage
          const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
          progressData[course._id] = progressPercentage;
          
          console.log(`Course ${course.name}: ${completedLessons}/${totalLessons} lessons completed (${progressPercentage}%)`);
          
        } catch (error) {
          console.error('Error calculating progress for course:', course._id, error);
          // Fallback to averageScore if available, otherwise 0
          progressData[course._id] = Math.round(course.userCourse?.averageScore || 0);
        }
      }));

      setCourseProgress(progressData);

    } catch (err) {
      console.error('Error in fetchMyCourses:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError('Failed to load your courses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMyCourses();
  }, []);

  const renderCourseItem = ({ item }) => (
    <MyCourseCard 
      course={item} 
      navigation={navigation}
      progress={courseProgress[item._id]}
    />
  );

  // Loading state
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading your courses..." />;
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        {/* Back Button for Error State */}
        <View style={styles.errorHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => nav.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Courses</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchMyCourses}>
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Empty state
  if (!loading && courses.length === 0) {
    return (
      <View style={styles.container}>
        {/* Back Button for Empty State */}
        <View style={styles.errorHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => nav.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="school-outline" size={80} color="#666" />
          </View>
          <Text style={styles.emptyTitle}>No Enrolled Courses</Text>
          <Text style={styles.emptyText}>
            You haven't enrolled in any courses yet. Explore our course catalog to get started!
          </Text>
          
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.exploreButtonText}>Explore Courses</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.refreshButton} onPress={fetchMyCourses}>
            <Ionicons name="refresh" size={16} color="#4CC2FF" style={{ marginRight: 6 }} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => nav.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Ionicons name="school" size={28} color="#4CC2FF" style={{ marginRight: 12 }} />
              <Text style={styles.headerTitle}>My Courses</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={styles.headerSubtitle}>
            {courses.length} course{courses.length !== 1 ? "s" : ""} enrolled
          </Text>
        </View>
      </View>

      {/* Course List */}
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4CC2FF"
            colors={["#4CC2FF"]}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={() => <View style={{ height: 20 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },

  // Header Styles
  headerContainer: {
    backgroundColor: "#2A2A2A",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    padding: 20,
    backgroundColor: 'rgba(76, 194, 255, 0.1)',
    borderRadius: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    color: '#fff',
    fontFamily: "Mulish-Bold",
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#AAA',
    fontFamily: "Mulish-Medium",
  },

  // List Styles
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },

  // Course Card Styles
  courseCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  imageContainer: {
    position: 'relative',
    height: 160,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progressBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(76, 194, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: "Mulish-Bold",
  },

  cardContent: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 26,
    fontFamily: "Mulish-Bold",
  },
  courseDescription: {
    fontSize: 15,
    color: '#BBB',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: "Mulish-Regular",
  },

  // Course Meta
  courseMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 13,
    color: '#AAA',
    marginLeft: 6,
    fontFamily: "Mulish-Medium",
  },

  // Progress Styles
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#444',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CC2FF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    fontFamily: "Mulish-Medium",
  },

  // Action Button
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CC2FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: "Mulish-SemiBold",
  },
  deletedCourseCard: {
    opacity: 0.6,
    backgroundColor: '#1A1A1A',
  },
  deletedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  deletedButtonText: {
    color: '#FF6B6B',
    fontSize: 15,
    fontFamily: "Mulish-SemiBold",
  },

  // Error States
  errorHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorIcon: {
    marginBottom: 8,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  emptyTitle: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  errorText: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Mulish-Regular",
  },
  emptyText: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Mulish-Regular",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4CC2FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CC2FF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CC2FF',
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  refreshButtonText: {
    color: '#4CC2FF',
    fontSize: 14,
    fontFamily: "Mulish-Medium",
  },
});

export default MyCoursesScreen;