import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
import { useFocusEffect } from "@react-navigation/native";
import { courseService, userLessonService, apiUtils } from "../services";

const { width } = Dimensions.get("window");

const CourseLessonScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { userToken, user } = useAuth();
  const { showError, showSuccess, showWarning } = useToast();

  // State management
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonProgress, setLessonProgress] = useState({});
  const [courseInfo, setCourseInfo] = useState({
    title: courseName || "Course Lessons",
    description: "",
    coverImage: null,
  });

  // Initialize and fetch data
  useEffect(() => {
    fetchLessons();
    fetchCourseInfo();
  }, [courseId, userToken]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        fetchLessons(); // Always refresh lessons on focus
      }
    }, [user?._id])
  );

  // Fetch course information
  const fetchCourseInfo = async () => {
    try {
      const response = await courseService.getCourseById(courseId);
      const result = apiUtils.parseResponse(response);

      if (result.data) {
        const course = result.data.course || result.data;
        setCourseInfo({
          title: course.name || courseName || "Course Lessons",
          description: course.description || "",
          coverImage: course.coverImage,
        });
      }
    } catch (err) {
      console.log("Error fetching course info:", err);
    }
  };

  // Fetch lessons data
  const fetchLessons = async () => {
    if (!user?._id) {
      setError("Authentication required. Please log in to continue.");
      setLoading(false);
      return;
    }

    setLoading(!refreshing);
    setError(null);

    try {
      const response = await courseService.getCourseLessons(courseId);
      const result = apiUtils.parseResponse(response);

      if (!result.data) {
        throw new Error(result.message || "Failed to fetch lessons");
      }

      const lessonsData = result.data || [];

      if (lessonsData.length === 0) {
        setLessons([]);
        setError(null); // Not an error, just empty
      } else {
        setLessons(lessonsData);
        await fetchLessonProgress(lessonsData);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setLessons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch lesson completion progress
  const fetchLessonProgress = async (lessonsData = lessons) => {
    if (!user?._id || lessonsData.length === 0) return;

    try {
      const progressPromises = lessonsData.map(async (lesson) => {
        try {
          const response = await userLessonService.getUserLessonByLessonId(
            lesson._id
          );

          if (response.userLesson) {
            return {
              lessonId: lesson._id,
              completed: response.userLesson.status === "completed",
              status: response.userLesson.status || "not_started",
              currentOrder: response.userLesson.currentOrder || [],
            };
          }

          return {
            lessonId: lesson._id,
            completed: false,
            status: "not_started",
            currentOrder: [],
          };
        } catch (error) {
          return {
            lessonId: lesson._id,
            completed: false,
            status: "not_started",
            currentOrder: [],
          };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressData = {};

      progressResults.forEach(
        ({ lessonId, completed, status, currentOrder }) => {
          progressData[lessonId] = { completed, status, currentOrder };
        }
      );

      setLessonProgress(progressData);
    } catch (error) {
      console.log("Error fetching lesson progress:", error);
    }
  };

  // Update lesson status
  const updateLessonStatus = async (lessonId, status) => {
    try {
      const lessonResponse =
        await userLessonService.getUserLessonByLessonId(lessonId);
      const lessonResult = apiUtils.parseResponse(lessonResponse);

      if (!lessonResult.data?.userLesson?._id) {
        showError(
          "Error",
          "Unable to update lesson progress. Please try again."
        );
        return false;
      }

      const response = await userLessonService.updateUserLesson(
        lessonResult.data.userLesson._id,
        { status }
      );

      if (response.status === 200) {
        // Update local state
        setLessonProgress((prev) => ({
          ...prev,
          [lessonId]: {
            ...prev[lessonId],
            completed: status === "completed",
            status: status,
          },
        }));

        if (status === "completed") {
          showSuccess("Success", "Lesson completed successfully!");
        }
        return true;
      }
      return false;
    } catch (error) {
      console.log("Error updating lesson status:", error);
      showError("Error", "Failed to update lesson progress. Please try again.");
      return false;
    }
  };

  // Navigate to lesson detail
  const navigateToLesson = (lesson) => {
    navigation.navigate("CourseDetail", {
      courseId,
      lessonId: lesson._id,
      lessonName: lesson.name,
      // updateLessonStatus: updateLessonStatus, // REMOVE THIS
    });
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLessons();
  }, []);

  // Get lesson status info
  const getLessonStatusInfo = (lessonId, index) => {
    const progress = lessonProgress[lessonId];
    const isCompleted = progress?.completed || false;
    const isLocked =
      index > 0 &&
      !(lessonProgress[lessons[index - 1]?._id]?.completed || false);

    let statusText = "Not Started";
    let statusColor = "#666";
    let iconName = "play-circle-outline";
    let iconColor = "#4CC2FF";

    if (isLocked) {
      statusText = "Locked";
      statusColor = "#666";
      iconName = "lock-closed-outline";
      iconColor = "#666";
    } else if (isCompleted) {
      statusText = "Completed";
      statusColor = "#10D876";
      iconName = "checkmark-circle";
      iconColor = "#10D876";
    } else if (progress?.status === "in-progress") {
      statusText = "In Progress";
      statusColor = "#FF9500";
      iconName = "play-circle";
      iconColor = "#FF9500";
    }

    return {
      statusText,
      statusColor,
      iconName,
      iconColor,
      isLocked,
      isCompleted,
    };
  };

  // Calculate overall progress
  const calculateProgress = () => {
    if (lessons.length === 0) return { completed: 0, total: 0, percentage: 0 };

    const completedCount = lessons.filter(
      (lesson) => lessonProgress[lesson._id]?.completed
    ).length;

    return {
      completed: completedCount,
      total: lessons.length,
      percentage: Math.round((completedCount / lessons.length) * 100),
    };
  };

  const progress = calculateProgress();

  // Loading state
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading lessons..." />;
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
          <Text style={styles.errorTitle}>Unable to Load Lessons</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLessons}>
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

  // Empty state
  if (!loading && lessons.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.emptyIcon}>
            <Ionicons name="library-outline" size={64} color="#666" />
          </View>
          <Text style={styles.emptyTitle}>No Lessons Available</Text>
          <Text style={styles.emptyText}>
            This course doesn't have any lessons yet. Check back later for new
            content.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLessons}>
            <Ionicons
              name="refresh"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerOverlay}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {courseInfo.title}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Overview Card */}
      <Card containerStyle={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Course Progress</Text>
          <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress.percentage}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{progress.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{progress.total}</Text>
            <Text style={styles.statLabel}>Total Lessons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {progress.total - progress.completed}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
        </View>
      </Card>

      {/* Lessons List */}
      <ScrollView
        style={styles.lessonsContainer}
        contentContainerStyle={styles.lessonsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.lessonsTitle}>Lessons ({lessons.length})</Text>

        {lessons.map((lesson, index) => {
          const statusInfo = getLessonStatusInfo(lesson._id, index);

          return (
            <TouchableOpacity
              key={lesson._id}
              style={[
                styles.lessonCard,
                statusInfo.isCompleted && styles.completedLessonCard,
                statusInfo.isLocked && styles.lockedLessonCard,
              ]}
              onPress={() => !statusInfo.isLocked && navigateToLesson(lesson)}
              disabled={statusInfo.isLocked}
              activeOpacity={statusInfo.isLocked ? 1 : 0.7}
            >
              <View style={styles.lessonHeader}>
                <View
                  style={[
                    styles.lessonNumberContainer,
                    statusInfo.isCompleted && styles.completedNumberContainer,
                    statusInfo.isLocked && styles.lockedNumberContainer,
                  ]}
                >
                  <Text
                    style={[
                      styles.lessonNumber,
                      statusInfo.isCompleted && styles.completedLessonNumber,
                      statusInfo.isLocked && styles.lockedLessonNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.lessonInfo}>
                  <Text
                    style={[
                      styles.lessonTitle,
                      statusInfo.isLocked && styles.lockedText,
                    ]}
                    numberOfLines={2}
                  >
                    {lesson.name}
                  </Text>
                  <Text
                    style={[
                      styles.lessonDescription,
                      statusInfo.isLocked && styles.lockedDescription,
                    ]}
                    numberOfLines={2}
                  >
                    {lesson.description || "No description available"}
                  </Text>

                  <View style={styles.lessonStatus}>
                    <Ionicons
                      name={statusInfo.iconName}
                      size={16}
                      color={statusInfo.iconColor}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusInfo.statusColor },
                      ]}
                    >
                      {statusInfo.statusText}
                    </Text>
                  </View>
                </View>

                <View style={styles.lessonActions}>
                  <Ionicons
                    name={statusInfo.iconName}
                    size={24}
                    color={statusInfo.iconColor}
                  />
                </View>
              </View>

              {/* Progress bar for individual lesson */}
              {!statusInfo.isLocked && (
                <View style={styles.lessonProgressContainer}>
                  <View style={styles.lessonProgressBar}>
                    <View
                      style={[
                        styles.lessonProgressFill,
                        { width: `${statusInfo.isCompleted ? 100 : 0}%` },
                      ]}
                    />
                  </View>
                </View>
              )}

              {statusInfo.isLocked && (
                <View style={styles.lockedMessage}>
                  <Text style={styles.lockedMessageText}>
                    Complete the previous lesson to unlock this one
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },

  // Header Styles
  headerContainer: {
    height: 200,
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40,
    background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
  },
  courseTitle: {
    fontSize: 24,
    color: "#fff",
    lineHeight: 30,
    fontFamily: "Mulish-Bold",
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // toned down
    shadowRadius: 2, // toned down
    elevation: 1, // toned down
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  progressPercentage: {
    fontSize: 24,
    color: "#4CC2FF",
    fontFamily: "Mulish-Bold",
  },
  progressBarContainer: {
    marginBottom: 16,
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
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 4,
    fontFamily: "Mulish-Bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#AAA",
    textAlign: "center",
    fontFamily: "Mulish-Regular",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#444",
  },

  // Lessons Container
  lessonsContainer: {
    flex: 1,
  },
  lessonsContent: {
    padding: 16,
    paddingBottom: 32,
  },
  lessonsTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 16,
    fontFamily: "Mulish-Bold",
  },

  // Lesson Card
  lessonCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, // toned down
    shadowRadius: 1, // toned down
    elevation: 1, // toned down
  },
  completedLessonCard: {
    borderColor: "#10D876",
    borderWidth: 2,
    backgroundColor: "#1A2A1A",
  },
  lockedLessonCard: {
    opacity: 0.6,
    backgroundColor: "#222",
  },

  lessonHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  lessonNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4CC2FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completedNumberContainer: {
    backgroundColor: "#10D876",
    shadowColor: "#10D876",
  },
  lockedNumberContainer: {
    backgroundColor: "#666",
    shadowColor: "transparent",
  },
  lessonNumber: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  completedLessonNumber: {
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  lockedLessonNumber: {
    color: "#ccc",
    fontFamily: "Mulish-Regular",
  },

  lessonInfo: {
    flex: 1,
    marginRight: 12,
  },
  lessonTitle: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 6,
    lineHeight: 24,
    fontFamily: "Mulish-Bold",
  },
  lessonDescription: {
    fontSize: 14,
    color: "#BBB",
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: "Mulish-Regular",
  },
  lessonStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Mulish-SemiBold",
  },

  lessonActions: {
    justifyContent: "center",
    alignItems: "center",
  },

  // Lesson Progress
  lessonProgressContainer: {
    marginTop: 8,
  },
  lessonProgressBar: {
    height: 4,
    backgroundColor: "#444",
    borderRadius: 2,
    overflow: "hidden",
  },
  lessonProgressFill: {
    height: "100%",
    backgroundColor: "#10D876",
    borderRadius: 2,
  },

  // Locked State
  lockedText: {
    color: "#666",
  },
  lockedDescription: {
    color: "#555",
  },
  lockedMessage: {
    alignItems: "center",
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  lockedMessageText: {
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    fontFamily: "Mulish-Regular",
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  emptyTitle: {
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
  emptyText: {
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
    shadowColor: "#4CC2FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Mulish-SemiBold",
  },
});

export default CourseLessonScreen;
