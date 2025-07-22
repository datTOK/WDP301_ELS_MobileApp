import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import { Card, Button } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  courseService,
  userLessonService,
  testService,
  userCourseService,
  apiUtils,
} from "../services";

const { width } = Dimensions.get("window");

const CourseOverviewScreen = ({ route, navigation }) => {
  const { showError, showSuccess, showWarning } = useToast();
  const { courseId } = route.params;
  const { userToken, user } = useAuth();

  // State management
  const [courseInfo, setCourseInfo] = useState({
    title: "",
    description: "",
    difficulty: "Beginner",
    numLessons: 0,
    totalTests: 0,
  });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);

  // Initialize on component mount
  const initialize = async () => {
    try {
      if (!user?._id) {
        setError("User authentication required. Please log in to continue.");
        return;
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    initialize();
  }, [courseId, userToken]);

  // Map course levels to difficulty
  const getCourseDifficulty = (level) => {
    const levelMap = {
      A1: "Beginner",
      A2: "Beginner",
      B1: "Intermediate",
      B2: "Intermediate",
      C1: "Advanced",
      C2: "Advanced",
    };
    return levelMap[level] || "Not Available";
  };

  // Main data fetching function
  const fetchData = useCallback(async () => {
    if (!user?._id) return;

    setLoading(!refreshing);
    setError(null);

    try {
      // Check enrollment status first
      let enrollmentStatus = false;
      try {
        const enrollmentResponse =
          await userCourseService.getUserCourseByCourseId(courseId);
        // The API returns { data: { userCourse: {...} } } or { data: null } if not enrolled
        enrollmentStatus = !!enrollmentResponse.userCourse;
        setIsEnrolled(enrollmentStatus);
      } catch (error) {
        enrollmentStatus = false;
        setIsEnrolled(false);
      }

      const courseResponse = await courseService.getCourseById(courseId);
      const lessonsResponse = await courseService.getCourseLessons(courseId);
      const testsResponse = await testService.getTestsByCourseId(courseId);

      if (!courseResponse.course) {
        throw new Error("Course not found or no longer available");
      }

      setLessons(lessonsResponse.data);
      setTests(testsResponse.data);

      // Set basic course info with fallback values
      setCourseInfo({
        title:
          courseResponse.course.name ||
          courseResponse.course.title ||
          "Untitled Course",
        description:
          courseResponse.course.description || "No description available",
        difficulty: getCourseDifficulty(courseResponse.course.level),
        numLessons: lessonsResponse.data.length || 0,
        totalTests: testsResponse.data.length || 0,
        level: courseResponse.course.level,
        coverImage: courseResponse.course.coverImage,
        createdAt: courseResponse.course.createdAt,
      });

      // If enrolled, fetch progress
      if (enrollmentStatus && lessonsResponse.data.length > 0) {
        await fetchUserProgress(lessonsResponse.data);
      } else {
        setCompletedLessons(0);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, userToken, user?._id, refreshing]);

  // Fetch user progress for enrolled courses
  const fetchUserProgress = async (courseLessons) => {
    try {
      const completionPromises = courseLessons.map(async (lesson) => {
        try {
          const response = await userLessonService.getUserLessonByLessonId(
            lesson._id
          );

          return response?.userLesson?.status === "completed";
        } catch (error) {
          return false;
        }
      });

      const completionResults = await Promise.all(completionPromises);
      const completedCount = completionResults.filter(Boolean).length;
      setCompletedLessons(completedCount);
    } catch (error) {
      console.log("Error fetching user progress:", error);
      setCompletedLessons(0);
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchData();
      }
    }, [fetchData, user?._id])
  );

  // Enroll in course
  const enrollInCourse = async () => {
    if (!user?._id) {
      showError("Authentication Error", "User ID is required to enroll.");
      return;
    }

    setEnrollLoading(true);
    try {
      const response = await userCourseService.enrollCourse(user._id, courseId);

      // The API returns { data: { userCourse: {...} } }
      if (response.data && response.data.userCourse) {
        setIsEnrolled(true);
        showSuccess("Success", "Successfully enrolled in the course!");
        fetchData();
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      // Handle specific enrollment errors
      if (errorInfo.status === 409) {
        // User is already enrolled - update state and show info message
        setIsEnrolled(true);
        showSuccess(
          "Already Enrolled",
          "You are already enrolled in this course!"
        );
        fetchData(); // Refresh data to show enrolled state
      } else {
        showError(errorInfo.message || "Failed to enroll in course");
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Loading state
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading course overview..." />;
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Ionicons
              name="refresh"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Calculate progress
  const canTakeTests =
    isEnrolled &&
    completedLessons === courseInfo.numLessons &&
    courseInfo.numLessons > 0;
  const progressPercentage =
    courseInfo.numLessons > 0
      ? (completedLessons / courseInfo.numLessons) * 100
      : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {/* Course Header */}
        <View style={styles.headerContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={
                courseInfo.coverImage
                  ? { uri: courseInfo.coverImage }
                  : require("../assets/placeholder-course.jpg")
              }
              style={styles.courseImage}
            />
            <View style={styles.imageOverlay} />
            <View style={styles.headerOverlay}>
              <View style={styles.difficultyBadge}>
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={styles.difficultyText}>
                  {courseInfo.difficulty}
                </Text>
              </View>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {courseInfo.title}
              </Text>
            </View>
          </View>
        </View>

        {/* Course Description */}
        <Card containerStyle={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>About This Course</Text>
          <Text style={styles.descriptionText}>{courseInfo.description}</Text>

          <View style={styles.courseMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="book-outline" size={20} color="#4CC2FF" />
              <Text style={styles.metricText}>
                {courseInfo.numLessons} Lessons
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="help-circle-outline" size={20} color="#FF9500" />
              <Text style={styles.metricText}>
                {courseInfo.totalTests} Tests
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color="#10D876" />
              <Text style={styles.metricText}>
                ~
                {courseInfo.numLessons *
                  (courseInfo.difficulty === "Beginner"
                    ? 15
                    : courseInfo.difficulty === "Intermediate"
                    ? 30
                    : 45)}
                min
              </Text>
            </View>
          </View>
        </Card>

        {/* Progress Card (if enrolled) */}
        {isEnrolled && (
          <Card containerStyle={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
            </View>

            <Text style={styles.progressText}>
              {completedLessons} of {courseInfo.numLessons} lessons completed
            </Text>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedLessons}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {courseInfo.numLessons - completedLessons}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{courseInfo.totalTests}</Text>
                <Text style={styles.statLabel}>Tests Available</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <Card containerStyle={styles.actionCard}>
          {!isEnrolled ? (
            <View style={styles.enrollmentSection}>
              <Text style={styles.enrollmentTitle}>
                Ready to Start Learning?
              </Text>
              <Text style={styles.enrollmentText}>
                Enroll now to access all lessons, tests, and track your progress
              </Text>
              <TouchableOpacity
                style={[
                  styles.enrollButton,
                  enrollLoading && styles.disabledButton,
                ]}
                onPress={enrollInCourse}
                disabled={enrollLoading}
              >
                {enrollLoading ? (
                  <>
                    <LoadingSpinner size="small" color="#fff" />
                    <Text style={styles.buttonText}>Enrolling...</Text>
                  </>
                ) : (
                  <Text style={styles.buttonText}>Enroll in Course</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate("CourseLesson", {
                    courseId,
                    courseName: courseInfo.title,
                  })
                }
              >
                <Text style={styles.buttonText}>Continue Learning</Text>
              </TouchableOpacity>

              {courseInfo.totalTests > 0 && (
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    !canTakeTests && styles.disabledButton,
                  ]}
                  onPress={() => {
                    if (canTakeTests) {
                      navigation.navigate("TestScreen", {
                        courseId,
                        courseName: courseInfo.title,
                      });
                    } else {
                      showWarning(
                        "Tests Locked",
                        `Complete all ${courseInfo.numLessons} lessons to unlock tests.`
                      );
                    }
                  }}
                  disabled={!canTakeTests}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      !canTakeTests && styles.disabledButtonText,
                    ]}
                  >
                    {canTakeTests ? "Take Tests" : "Tests Locked"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* Course Details */}
        <Card containerStyle={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Course Information</Text>

          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#4CC2FF" />
              <Text style={styles.detailLabel}>Published:</Text>
              <Text style={styles.detailValue}>
                {courseInfo.createdAt
                  ? new Date(courseInfo.createdAt).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="trending-up-outline" size={18} color="#10D876" />
              <Text style={styles.detailLabel}>Level:</Text>
              <Text style={styles.detailValue}>
                {courseInfo.level || "Not specified"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="language-outline" size={18} color="#FF9500" />
              <Text style={styles.detailLabel}>Language:</Text>
              <Text style={styles.detailValue}>English</Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={18} color="#9C27B0" />
              <Text style={styles.detailLabel}>Format:</Text>
              <Text style={styles.detailValue}>Self-paced</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header Styles
  headerContainer: {
    height: 250,
    marginBottom: 16,
  },
  imageContainer: {
    flex: 1,
    position: "relative",
  },
  courseImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "linear-gradient(transparent, rgba(0,0,0,0.8))",
  },
  difficultyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 194, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Mulish-SemiBold",
    marginLeft: 4,
  },
  courseTitle: {
    fontSize: 24,
    fontFamily: "Mulish-Bold",
    color: "#fff",
    lineHeight: 30,
  },

  // Card Styles
  descriptionCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: "Mulish-Bold",
    color: "#fff",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: "#CCC",
    fontFamily: "Mulish-Regular",
    lineHeight: 22,
    marginBottom: 20,
  },
  courseMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  metricText: {
    fontSize: 13,
    color: "#AAA",
    fontFamily: "Mulish-Medium",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Progress Card
  progressCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: "Mulish-Bold",
    color: "#fff",
  },
  progressPercentage: {
    fontSize: 24,
    fontFamily: "Mulish-Bold",
    color: "#4CC2FF",
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#333",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CC2FF",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#AAA",
    fontFamily: "Mulish-Regular",
    marginBottom: 20,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#AAA",
    fontFamily: "Mulish-Medium",
    textAlign: "center",
  },

  // Action Card
  actionCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  enrollmentSection: {
    alignItems: "center",
    paddingVertical: 8,
  },
  enrollmentTitle: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  enrollmentText: {
    fontSize: 15,
    color: "#AAA",
    fontFamily: "Mulish-Regular",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  enrollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CC2FF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10D876",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#10D876",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF9500",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#FF9500",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#444",
    shadowOpacity: 0,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Mulish-SemiBold",
  },
  disabledButtonText: {
    color: "#999",
  },

  // Details Card
  detailsCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    margin: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: "Mulish-Bold",
    color: "#fff",
    marginBottom: 16,
  },
  detailsList: {
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#AAA",
    marginLeft: 12,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
    fontFamily: "Mulish-Medium",
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  errorText: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: "Mulish-Regular",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CC2FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Mulish-SemiBold",
  },
  backButton: {
    position: "absolute",
    top: 24,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});

export default CourseOverviewScreen;
