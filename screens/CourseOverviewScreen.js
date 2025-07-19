import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Card, Button, Chip } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { courseService, userLessonService, apiUtils } from "../services";

const CourseOverviewScreen = ({ route, navigation }) => {
    const { showError, showSuccess, showWarning } = useToast();
  const { courseId } = route.params;
  const { userToken, userId } = useAuth();
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
  const [completedLessons, setCompletedLessons] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);

  const initialize = async () => {
    try {
      if (!userId) {
        setError("User ID not found");
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

  const getCourseDifficulty = (level) => {
    switch (level) {
      case "A1":
      case "A2":
        return "Beginner";

        break;
      case "B1":
      case "B2":
        return "Intermediate";
        break;

      case "C1":
      case "C2":
        return "Advanced";
      default:
        return "NA";
        break;
    }
  };
  const fetchData = useCallback(async () => {
    if (!userId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First, check enrollment status
      try {
        const enrollmentResponse = await courseService.getUserCourseByCourseId(courseId);
        const enrollmentResult = apiUtils.parseResponse(enrollmentResponse);
        setIsEnrolled(true);
      } catch (error) {
        // Not enrolled
        setIsEnrolled(false);
      }

      // Fetch course info, lessons, and tests regardless of enrollment
      const [courseResponse, lessonsResponse, testsResponse] =
        await Promise.all([
          courseService.getCourseById(courseId),
          courseService.getCourseLessons(courseId),
          courseService.getCourseTests(courseId),
        ]);

      const courseData = apiUtils.parseResponse(courseResponse);
      const lessonsData = apiUtils.parseResponse(lessonsResponse);
      const testsData = apiUtils.parseResponse(testsResponse);

      if (!courseData.data) throw new Error("Failed to fetch course info");

      const course = courseData.data.course || courseData.data;
      const lessons = lessonsData.data || [];
      const tests = testsData.data || [];

      setLessons(lessons);
      setTests(tests);

      if (!isEnrolled) {
        setCourseInfo({
          title: course.name,
          description: course.description,
          difficulty: getCourseDifficulty(course.level),
          numLessons: lessons.length,
          totalTests: tests.length,
        });
        setCompletedLessons(0);
      } else {
        // Enrolled - fetch user progress
        const completionPromises = lessons.map(async (lesson) => {
          try {
            const response = await userLessonService.getUserLessonByLessonId(lesson._id);
            const result = apiUtils.parseResponse(response);
            
            if (result.data) {
              return {
                lessonId: lesson._id,
                completed: result.data.userLesson?.status === "completed",
                status: result.data.userLesson?.status || "ongoing",
              };
            }
            return {
              lessonId: lesson._id,
              completed: false,
              status: "not_started",
            };
          } catch (error) {
            console.log("Error fetching user lesson status:", error);
            return {
              lessonId: lesson._id,
              completed: false,
              status: "not_started",
            };
          }
        });

        const completionResults = await Promise.all(completionPromises);
        const completedCount = completionResults.filter(
          (result) => result.completed
        ).length;

        setCompletedLessons(completedCount);

        setCourseInfo({
          title: course.name,
          description: course.description,
          numLessons: lessons.length,
          totalTests: tests.length,
        });
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, userToken, userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId]);

  // Refresh data when screen comes into focus (e.g., when returning from lesson completion)
  useFocusEffect(
    useCallback(() => {
      if (userId && isEnrolled) {
        fetchData();
      }
    }, [userId, isEnrolled])
  );

    const enrollInCourse = async () => {
        if (!userId) {
            showError('Error', 'User ID is required to enroll.');
            return;
        }
        setEnrollLoading(true);
        try {
            const response = await courseService.enrollCourse({ courseId, userId });
            const result = apiUtils.parseResponse(response);
            if (result.data) {
                setIsEnrolled(true);
                showSuccess('Success', 'You have enrolled in the course.');
                fetchData();
            } else {
                throw new Error(result.message || 'Failed to enroll');
            }
        } catch (err) {
            const errorInfo = apiUtils.handleError(err);
            showError('Error', errorInfo.message);
        } finally {
            setEnrollLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen text="Loading course overview..." />;
    }
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchData}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

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
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card containerStyle={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.courseIcon}>
              <Ionicons name="school" size={40} color="#007AFF" />
            </View>
            <View style={styles.courseInfo}>
              <Text style={styles.title}>{courseInfo.title}</Text>
              <Text style={styles.description}>{courseInfo.description}</Text>
            </View>
          </View>
        </Card>

        {/* Progress Card */}
        {isEnrolled && (
          <Card containerStyle={styles.progressCard}>
            <Text style={styles.progressTitle}>Course Progress</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedLessons} of {courseInfo.numLessons} lessons completed (
              {Math.round(progressPercentage)}%)
            </Text>
          </Card>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card containerStyle={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="book" size={30} color="#28a745" />
              <Text style={styles.statNumber}>{courseInfo.numLessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
          </Card>

          <Card containerStyle={styles.statCard}>
            <View style={styles.statContent}>
              <Ionicons name="help-circle" size={30} color="#ff9800" />
              <Text style={styles.statNumber}>{courseInfo.totalTests}</Text>
              <Text style={styles.statLabel}>Tests</Text>
            </View>
          </Card>
        </View>

                {/* Action Buttons */}
                <Card containerStyle={styles.actionCard}>
                    {!isEnrolled ? (
                        <Button
                            title="Enroll in Course"
                            buttonStyle={styles.enrollButton}
                            titleStyle={styles.buttonText}
                            onPress={enrollInCourse}
                            disabled={enrollLoading}
                            icon={
                                <Ionicons 
                                    name="person-add" 
                                    size={20} 
                                    color="#fff" 
                                    style={styles.buttonIcon}
                                />
                            }
                        />
                    ) : (
                        <View style={styles.actionButtons}>
                            <Button
                                title="Continue Learning"
                                buttonStyle={styles.primaryButton}
                                titleStyle={styles.buttonText}
                                onPress={() => navigation.navigate('CourseLesson', { courseId, courseName: courseInfo.title })}
                                icon={
                                    <Ionicons 
                                        name="play" 
                                        size={20} 
                                        color="#fff" 
                                        style={styles.buttonIcon}
                                    />
                                }
                            />
                            
                            {courseInfo.totalTests > 0 && (
                                <TouchableOpacity
                                    style={[
                                        styles.testButton,
                                        !canTakeTests && styles.testButtonDisabled
                                    ]}
                                    onPress={() => {
                                        if (canTakeTests) {
                                            navigation.navigate('TestScreen', { courseId, courseName: courseInfo.title });
                                        } else {
                                            showWarning(
                                                'Tests Locked',
                                                `Complete all ${courseInfo.numLessons} lessons to unlock tests.`,
                                                [{ text: 'OK' }]
                                            );
                                        }
                                    }}
                                    disabled={!canTakeTests}
                                >
                                    <Ionicons 
                                        name={canTakeTests ? "help-circle" : "lock-closed"} 
                                        size={20} 
                                        color={canTakeTests ? "#fff" : "#ccc"} 
                                        style={styles.buttonIcon}
                                    />
                                    <Text style={[
                                        styles.testButtonText,
                                        !canTakeTests && styles.testButtonTextDisabled
                                    ]}>
                                        {canTakeTests ? 'Take Tests' : 'Tests Locked'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </Card>
        {/* Action Buttons */}
        <Card containerStyle={styles.actionCard}>
          {!isEnrolled ? (
            <Button
              title="Enroll in Course"
              buttonStyle={styles.enrollButton}
              titleStyle={styles.buttonText}
              onPress={enrollInCourse}
              disabled={enrollLoading}
              icon={
                <Ionicons
                  name="person-add"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
              }
            />
          ) : (
            <View style={styles.actionButtons}>
              <Button
                title="Continue Learning"
                buttonStyle={styles.primaryButton}
                titleStyle={styles.buttonText}
                onPress={() =>
                  navigation.navigate("CourseLesson", {
                    courseId,
                    courseName: courseInfo.title,
                  })
                }
                icon={
                  <Ionicons
                    name="play"
                    size={20}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                }
              />

              {courseInfo.totalTests > 0 && (
                <TouchableOpacity
                  style={[
                    styles.testButton,
                    !canTakeTests && styles.testButtonDisabled,
                  ]}
                  onPress={() => {
                    if (canTakeTests) {
                      navigation.navigate("TestScreen", {
                        courseId,
                        courseName: courseInfo.title,
                      });
                    } else {
                      Alert.alert(
                        "Tests Locked",
                        `Complete all ${courseInfo.numLessons} lessons to unlock tests.`,
                        [{ text: "OK" }]
                      );
                    }
                  }}
                  disabled={!canTakeTests}
                >
                  <Ionicons
                    name={canTakeTests ? "help-circle" : "lock-closed"}
                    size={20}
                    color={canTakeTests ? "#fff" : "#ccc"}
                    style={styles.buttonIcon}
                  />
                  <Text
                    style={[
                      styles.testButtonText,
                      !canTakeTests && styles.testButtonTextDisabled,
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
          <Text style={styles.detailsTitle}>Course Details</Text>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#007AFF" />
            <Text style={styles.detailText}>
              Estimated time:{" "}
              {courseInfo.difficulty === "NA"
                ? "NA"
                : courseInfo.numLessons *
                  (courseInfo.difficulty === "Beginner"
                    ? 15
                    : courseInfo.difficulty === "Intermediate"
                    ? 30
                    : 60)}{" "}
              minutes
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#ffc107" />
            <Text style={styles.detailText}>Difficulty: Beginner</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="language" size={16} color="#28a745" />
            <Text style={styles.detailText}>Language: English</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  headerCard: {
    borderRadius: 16,
    margin: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  courseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f8ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  courseInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  progressCard: {
    borderRadius: 16,
    margin: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28a745",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    marginHorizontal: 5,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    alignItems: "center",
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  actionCard: {
    borderRadius: 16,
    margin: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  enrollButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: "#28a745",
    borderRadius: 12,
    paddingVertical: 12,
    flex: 1,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  testButton: {
    backgroundColor: "#ff9800",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  testButtonDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
    borderWidth: 1,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  testButtonTextDisabled: {
    color: "#999",
  },
  detailsCard: {
    borderRadius: 16,
    margin: 15,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CourseOverviewScreen;
