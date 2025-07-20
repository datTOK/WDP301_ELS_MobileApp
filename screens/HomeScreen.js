import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { Card, Button, Divider } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService, blogService, apiUtils } from '../services';
import Swiper from 'react-native-swiper';
import LottieView from 'lottie-react-native';
import AIChatBot from '../components/AiChatBox';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { userToken, userId } = useAuth();
  const { theme } = useTheme();
  const styles = createGlobalStyles(theme);

  const imageUrls = [
    'https://images.pexels.com/photos/5652121/pexels-photo-5652121.jpeg',
    'https://images.pexels.com/photos/256417/pexels-photo-256417.jpeg',
    'https://images.pexels.com/photos/6005081/pexels-photo-6005081.jpeg',
  ];

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch courses and blogs in parallel
      const [coursesResponse, blogsResponse] = await Promise.all([
        courseService.getCourses({ page: 1, size: 3 }),
        blogService.getBlogs({ page: 1, size: 3 }),
      ]);

      const coursesResult = apiUtils.parseResponse(coursesResponse);
      const blogsResult = apiUtils.parseResponse(blogsResponse);

      if (coursesResult.data && Array.isArray(coursesResult.data)) {
        setCourses(coursesResult.data);
      }
      if (blogsResult.data && Array.isArray(blogsResult.data)) {
        setBlogs(blogsResult.data);
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
    fetchHomeData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const renderCourseCard = (course) => (
    <TouchableOpacity
      key={course._id}
      onPress={() => navigation.navigate('CourseDetail', { courseId: course._id })}
    >
      <Card containerStyle={localStyles.courseCard}>
        <Card.Title style={localStyles.courseTitle}>{course.title}</Card.Title>
        <Text style={localStyles.courseDescription} numberOfLines={2}>
          {course.description || course.content?.substring(0, 100)}...
        </Text>
        <View style={localStyles.courseMeta}>
          <Text style={localStyles.courseDate}>
            {new Date(course.createdAt).toLocaleDateString()}
          </Text>
          <Button
            title="View Course"
            buttonStyle={localStyles.viewButton}
            titleStyle={localStyles.viewButtonText}
            onPress={() => navigation.navigate('CourseDetail', { courseId: course._id })}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderBlogCard = (blog) => (
    <TouchableOpacity
      key={blog._id}
      onPress={() => navigation.navigate('BlogDetail', { blogId: blog._id })}
    >
      <Card containerStyle={localStyles.blogCard}>
        <Card.Title style={localStyles.blogTitle}>{blog.title}</Card.Title>
        <Text style={localStyles.blogContent} numberOfLines={3}>
          {blog.content?.substring(0, 150)}...
        </Text>
        <View style={localStyles.blogMeta}>
          <Text style={localStyles.blogDate}>
            {new Date(blog.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchHomeData}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Image Swiper */}
        <View style={localStyles.swiperContainer}>
          <Swiper
            autoplay
            autoplayTimeout={6}
            showsPagination={true}
            loop
            dotStyle={localStyles.paginationDot}
            activeDotStyle={[localStyles.activePaginationDot, { backgroundColor: theme.colors.text }]}
          >
            {imageUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={localStyles.swiperImage}
                resizeMode="cover"
              />
            ))}
          </Swiper>
        </View>

        <Divider style={[localStyles.sectionDivider, { backgroundColor: theme.colors.borderColor }]} />

        {/* Welcome Section */}
        <View style={localStyles.welcomeSection}>
          <Text style={localStyles.welcomeTitle}>Welcome to ELS</Text>
          <Text style={localStyles.welcomeSubtitle}>
            Continue your English learning journey
          </Text>
          {userId && (
            <Text style={localStyles.userId}>User ID: {userId}</Text>
          )}
        </View>

        {/* Why Choose ELS Section */}
        <View style={localStyles.whyChooseSection}>
          <Text style={[localStyles.sectionTitle, { color: theme.colors.text }]}>Why Choose ELS?</Text>
          <View style={[localStyles.featureCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
            <Ionicons name="bulb-outline" size={30} color={theme.colors.primary} style={localStyles.featureIcon} />
            <Text style={[localStyles.featureText, { color: theme.colors.text }]}>
              ELS is one of the most chosen English learning apps in Vietnam and continues to grow largely.
              We provide engaging lessons, interactive exercises, and a supportive community.
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Card containerStyle={localStyles.actionsCard}>
          <Card.Title style={localStyles.actionsTitle}>Quick Actions</Card.Title>
          <View style={localStyles.actionsGrid}>
            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={() => navigation.navigate('Courses')}
            >
              <Ionicons name="book" size={24} color="#4CC2FF" />
              <Text style={localStyles.actionText}>Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={() => navigation.navigate('BlogTab')}
            >
              <Ionicons name="newspaper" size={24} color="#28a745" />
              <Text style={localStyles.actionText}>Blog</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Ionicons name="trophy" size={24} color="#ffc107" />
              <Text style={localStyles.actionText}>Achievements</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={localStyles.actionButton}
              onPress={() => navigation.navigate('Membership')}
            >
              <Ionicons name="card" size={24} color="#ff6b6b" />
              <Text style={localStyles.actionText}>Membership</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Featured Courses */}
        {courses.length > 0 && (
          <Card containerStyle={localStyles.sectionCard}>
            <Card.Title style={localStyles.sectionTitle}>Featured Courses</Card.Title>
            {courses.map(renderCourseCard)}
          </Card>
        )}

        {/* Latest Blogs */}
        {blogs.length > 0 && (
          <Card containerStyle={localStyles.sectionCard}>
            <Card.Title style={localStyles.sectionTitle}>Latest Articles</Card.Title>
            {blogs.map(renderBlogCard)}
          </Card>
        )}

        {/* Lottie Animation */}
        <LottieView
          source={{ uri: 'https://lottie.host/dc75f86c-1920-48bf-9d38-e84684bd4612/NqkDK4PTpW.json' }}
          speed={0.5}
          autoPlay
          style={localStyles.lottieAnimation}
        />

        {/* Call to Action */}
        <TouchableOpacity
          style={[localStyles.callToActionCard, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Courses')}
        >
          <Text style={localStyles.callToActionText}>Explore Our Courses!</Text>
          <Ionicons name="arrow-forward-outline" size={24} color={'white'} />
        </TouchableOpacity>
      </ScrollView>
      <AIChatBot />
    </View>
  );
}

const localStyles = StyleSheet.create({
  swiperContainer: {
    height: 200,
    marginBottom: 20,
  },
  swiperImage: {
    width: '100%',
    height: '100%',
  },
  paginationDot: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3,
  },
  activePaginationDot: {
    backgroundColor: '#ffffff',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 3,
    marginRight: 3,
    marginTop: 3,
    marginBottom: 3,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 20,
  },
  welcomeSection: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: 'Mulish-Bold',
    color: '#ededed',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    color: '#AAAAAA',
    textAlign: 'center',
  },
  userId: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    color: '#666666',
    marginTop: 8,
  },
  whyChooseSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  actionsCard: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionsTitle: {
    color: '#ededed',
    fontFamily: 'Mulish-Bold',
    fontSize: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    minWidth: 80,
  },
  actionText: {
    color: '#ededed',
    fontFamily: 'Mulish-Medium',
    fontSize: 12,
    marginTop: 8,
  },
  sectionCard: {
    backgroundColor: '#2B2B2B',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: 'blue',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 7,
  },
  sectionTitle: {
    color: '#ededed',
    fontFamily: 'Mulish-Bold',
    fontSize: 18,
  },
  courseCard: {
    backgroundColor: '#333333',
    borderRadius: 8,
    marginBottom: 12,
  },
  courseTitle: {
    color: '#ededed',
    fontFamily: 'Mulish-Bold',
    fontSize: 16,
  },
  courseDescription: {
    color: '#AAAAAA',
    fontFamily: 'Mulish-Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDate: {
    color: '#666666',
    fontFamily: 'Mulish-Regular',
    fontSize: 12,
  },
  viewButton: {
    backgroundColor: '#4CC2FF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Mulish-Bold',
    fontSize: 12,
  },
  blogCard: {
    backgroundColor: '#333333',
    borderRadius: 8,
    marginBottom: 12,
  },
  blogTitle: {
    color: '#ededed',
    fontFamily: 'Mulish-Bold',
    fontSize: 16,
  },
  blogContent: {
    color: '#AAAAAA',
    fontFamily: 'Mulish-Regular',
    fontSize: 14,
    marginBottom: 12,
  },
  blogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blogDate: {
    color: '#666666',
    fontFamily: 'Mulish-Regular',
    fontSize: 12,
  },
  lottieAnimation: {
    width: 600,
    height: 200,
    alignSelf: 'center',
  },
  callToActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CC2FF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  callToActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});