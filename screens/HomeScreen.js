import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Animated,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { courseService, blogService, userService, apiUtils } from '../services';
import LottieView from 'lottie-react-native';
import AIChatBot from '../components/AiChatBox';

const { width, height } = Dimensions.get('window');

// Animated Title Component
const AnimatedTitle = ({ theme }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.animatedTitleContainer}>
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
          English Learning System
        </Text>
        <Text style={[styles.subTitle, { color: theme.colors.textSecondary }]}>
          The perfect place to master English.
        </Text>
      </Animated.View>
    </View>
  );
};

// Stats Section Component
const StatsSection = ({ theme }) => {
  const [animatedNumbers, setAnimatedNumbers] = useState([0, 0, 0, 0]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const stats = [
    {
      number: 10000,
      suffix: '+',
      label: 'Active Learners',
      icon: 'people',
      color: '#4CC2FF',
    },
    {
      number: 500,
      suffix: '+',
      label: 'Lessons Available',
      icon: 'book',
      color: '#8B5CF6',
    },
    {
      number: 95,
      suffix: '%',
      label: 'Success Rate',
      icon: 'checkmark-circle',
      color: '#10B981',
    },
    {
      number: 24,
      suffix: '/7',
      label: 'Support Available',
      icon: 'heart',
      color: '#F59E0B',
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animate numbers
    const timer = setTimeout(() => {
      stats.forEach((stat, index) => {
        const duration = 2000;
        const steps = 60;
        const increment = stat.number / steps;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          const currentValue = Math.min(increment * currentStep, stat.number);

          setAnimatedNumbers((prev) => {
            const newNumbers = [...prev];
            newNumbers[index] = Math.floor(currentValue);
            return newNumbers;
          });

          if (currentStep >= steps) {
            clearInterval(interval);
          }
        }, duration / steps);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.borderColor,
        },
      ]}
    >
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <Ionicons name={stat.icon} size={24} color="white" />
            </View>
            <Text style={[styles.statNumber, { color: theme.colors.text }]}>
              {index === 0
                ? (animatedNumbers[index] / 1000).toFixed(0) + 'K'
                : animatedNumbers[index]}
              <Text style={[styles.statSuffix, { color: '#4CC2FF' }]}>
                {index === 0 ? '+' : stat.suffix}
              </Text>
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {stat.label}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, theme, delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.borderColor,
        },
      ]}
    >
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={28} color="#4CC2FF" />
      </View>
      <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </Animated.View>
  );
};

// Simple Leaderboard Component
const SimpleLeaderboard = ({ theme, navigation }) => {
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await userService.getLeaderboard(3);
      const result = apiUtils.parseResponse(response);
      if (result.data && Array.isArray(result.data)) {
        setTop3(result.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getPositionIcon = (position) => {
    switch (position) {
      case 0:
        return 'trophy';
      case 1:
        return 'medal';
      case 2:
        return 'ribbon';
      default:
        return 'person';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 0:
        return '#FFD700';
      case 1:
        return '#C0C0C0';
      case 2:
        return '#CD7F32';
      default:
        return '#4CC2FF';
    }
  };

  if (loading) {
    return (
      <View style={[styles.leaderboardContainer, { backgroundColor: theme.colors.cardBackground }]}>
        <LoadingSpinner text="Loading leaderboard..." />
      </View>
    );
  }

  return (
    <View style={[styles.leaderboardContainer, { backgroundColor: theme.colors.cardBackground }]}>
      <Text style={[styles.leaderboardTitle, { color: theme.colors.text }]}>
        🏆 Top Performers
      </Text>
      <Text style={[styles.leaderboardSubtitle, { color: theme.colors.textSecondary }]}>
        Leading the leaderboard
      </Text>
      
      <View style={styles.leaderboardGrid}>
        {top3.map((user, index) => (
          <View key={user._id} style={styles.leaderboardItem}>
            <View style={[styles.leaderboardCard, { borderColor: getPositionColor(index) }]}>
              <View style={[styles.positionBadge, { backgroundColor: getPositionColor(index) }]}>
                <Ionicons name={getPositionIcon(index)} size={20} color="white" />
              </View>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user.username}
              </Text>
              <Text style={[styles.userPoints, { color: getPositionColor(index) }]}>
                {user.points || 0} pts
              </Text>
            </View>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('Leaderboard')}
      >
        <Text style={[styles.viewAllText, { color: '#4CC2FF' }]}>
          View Full Leaderboard →
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [courses, setCourses] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { userToken, user } = useAuth();
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme);

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
      style={[styles.courseCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => navigation.navigate('CourseDetail', { courseId: course._id })}
    >
      <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
        {course.title}
      </Text>
      <Text style={[styles.courseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
        {course.description || course.content?.substring(0, 100)}...
      </Text>
      <View style={styles.courseMeta}>
        <Text style={[styles.courseDate, { color: theme.colors.textMuted }]}>
          {new Date(course.createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('CourseDetail', { courseId: course._id })}
        >
          <Text style={styles.viewButtonText}>View Course</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderBlogCard = (blog) => (
    <TouchableOpacity
      key={blog._id}
      style={[styles.blogCard, { backgroundColor: theme.colors.cardBackground }]}
      onPress={() => navigation.navigate('BlogDetail', { blogId: blog._id })}
    >
      <Text style={[styles.blogTitle, { color: theme.colors.text }]}>
        {blog.title}
      </Text>
      <Text style={[styles.blogContent, { color: theme.colors.textSecondary }]} numberOfLines={3}>
        {blog.content?.substring(0, 150)}...
      </Text>
      <View style={styles.blogMeta}>
        <Text style={[styles.blogDate, { color: theme.colors.textMuted }]}>
          {new Date(blog.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  if (error) {
    return (
      <View style={globalStyles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={globalStyles.errorText}>{error}</Text>
        <TouchableOpacity
          style={globalStyles.retryButton}
          onPress={fetchHomeData}
        >
          <Text style={globalStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[globalStyles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={globalStyles.scrollContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Image
          source={{ uri: 'https://w0.peakpx.com/wallpaper/491/1016/HD-wallpaper-book-bw-silhouette-minimalism.jpg' }}
          style={styles.heroBackground}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <AnimatedTitle theme={theme} />
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={styles.heroButtonText}>Start learning now</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBadge}>
            <Ionicons name="book" size={16} color="#4CC2FF" />
            <Text style={styles.sectionBadgeText}>Discover ELS</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            What is ELS?
          </Text>
          <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
            Welcome to our English Learning System! Unlock your language potential with interactive lessons, engaging activities, and personalized progress tracking.
          </Text>
        </View>

        <StatsSection theme={theme} />

        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="phone-portrait"
            title="Learn Anytime, Anywhere"
            description="Access lessons on your phone, tablet, or desktop at your convenience. Study during your commute, lunch break, or whenever you have a few minutes to spare."
            theme={theme}
            delay={200}
          />
          <FeatureCard
            icon="play-circle"
            title="Interactive Lessons & Quizzes"
            description="Engage with fun exercises and quizzes that make learning enjoyable. Our interactive approach keeps you motivated and helps retain information better."
            theme={theme}
            delay={400}
          />
          <FeatureCard
            icon="trophy"
            title="Track Your Progress"
            description="Visualize your journey and stay motivated with detailed progress tracking. See your improvements and celebrate your achievements along the way."
            theme={theme}
            delay={600}
          />
        </View>

        <SimpleLeaderboard theme={theme} navigation={navigation} />

        {/* Call to Action for non-authenticated users */}
        {!user && (
          <View style={styles.callToActionSection}>
            <View style={[styles.callToActionCard, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.callToActionTitle}>
                Ready to Start Your English Journey?
              </Text>
              <Text style={styles.callToActionDescription}>
                Join thousands of learners who have already improved their English skills with ELS. Start your transformation today!
              </Text>
              <View style={styles.callToActionButtons}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: 'white' }]}
                  onPress={() => navigation.navigate('Register')}
                >
                  <Text style={[styles.primaryButtonText, { color: theme.colors.primary }]}>
                    Get Started Today
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: 'white' }]}
                >
                  <Text style={styles.secondaryButtonText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Featured Courses */}
      {courses.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Featured Courses
          </Text>
          {courses.map(renderCourseCard)}
        </View>
      )}

      {/* Latest Blogs */}
      {blogs.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Latest Articles
          </Text>
          {blogs.map(renderBlogCard)}
        </View>
      )}

      {/* Lottie Animation */}
      <LottieView
        source={{ uri: 'https://lottie.host/dc75f86c-1920-48bf-9d38-e84684bd4612/NqkDK4PTpW.json' }}
        speed={0.5}
        autoPlay
        style={styles.lottieAnimation} 
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Hero Section
  heroSection: {
    height: height * 0.7,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  animatedTitleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleContainer: {
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: '#4CC2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginRight: 8,
  },

  // Features Section
  featuresSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 194, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(76, 194, 255, 0.3)',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionBadgeText: {
    color: '#4CC2FF',
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },

  // Stats Section
  statsContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    shadowColor: '#4CC2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    marginBottom: 4,
  },
  statSuffix: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    textAlign: 'center',
  },

  // Feature Cards
  featuresGrid: {
    marginBottom: 40,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#4CC2FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 194, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
  },

  // Leaderboard
  leaderboardContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  leaderboardSubtitle: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  leaderboardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  leaderboardItem: {
    alignItems: 'center',
    flex: 1,
  },
  leaderboardCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CC2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  userName: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    textAlign: 'center',
    marginBottom: 4,
  },
  userPoints: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
  },
  viewAllButton: {
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },

  // Call to Action
  callToActionSection: {
    marginBottom: 40,
  },
  callToActionCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  callToActionTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  callToActionDescription: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  callToActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    marginRight: 8,
  },
  secondaryButton: {
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Course Cards
  courseCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginBottom: 12,
    lineHeight: 20,
  },
  courseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseDate: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Mulish-Bold',
  },

  // Blog Cards
  blogCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blogTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    marginBottom: 8,
  },
  blogContent: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginBottom: 12,
    lineHeight: 20,
  },
  blogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blogDate: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
  },

  // Lottie Animation
  lottieAnimation: {
    width: width,
    height: 200,
    alignSelf: 'center',
  },
});