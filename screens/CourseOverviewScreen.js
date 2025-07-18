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
import { MOBILE_SERVER_URL } from "@env";

const API_BASE_URL = "http://localhost:4000/api";

const CourseOverviewScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const { userToken } = useAuth();
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
  const [userId, setUserId] = useState(null);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        } else {
          setError("User ID not found in storage.");
        }
      } catch (err) {
        setError("Failed to retrieve user data from storage.");
      }
    };
    initialize();
  }, [courseId]);

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
      setError("User ID is required to fetch data.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // First, check enrollment status
      const enrollmentResponse = await fetch(
        `${MOBILE_SERVER_URL}api/user-courses/${courseId}/course`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      // Fetch course info, lessons, and tests regardless of enrollment
      const [courseResponse, lessonsResponse, testsResponse] =
        await Promise.all([
          fetch(`${MOBILE_SERVER_URL}api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
          fetch(`${MOBILE_SERVER_URL}api/courses/${courseId}/lessons`, {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
          fetch(`${MOBILE_SERVER_URL}api/tests/${courseId}/course`, {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
        ]);

      console.log("Course Response Status:", courseResponse.status);
      console.log("Lessons Response Status:", lessonsResponse.status);
      console.log("Tests Response Status:", testsResponse.status);

      if (!courseResponse.ok) throw new Error("Failed to fetch course info");

      const courseData = await courseResponse.json();
      const course = courseData.course;

      let lessonsData = [];
      let testsData = [];

      if (lessonsResponse.ok) {
        const lessonsResult = await lessonsResponse.json();
        lessonsData = lessonsResult.data || [];
        console.log("Lessons data:", lessonsData);
      }

      if (testsResponse.ok) {
        const testsResult = await testsResponse.json();
        testsData = testsResult.data || [];
        console.log("Tests data:", testsData);
      }

      setLessons(lessonsData);
      setTests(testsData);

      if (enrollmentResponse.status === 404) {
        // Not enrolled
        setIsEnrolled(false);
        setCourseInfo({
          title: course.name,
          description: course.description,
          difficulty: getCourseDifficulty(course.level),
          numLessons: lessonsData.length,
          totalTests: testsData.length,
        });
        setCompletedLessons(0);
      } else if (enrollmentResponse.status === 200) {
        // Enrolled - fetch user progress
        setIsEnrolled(true);

        // Fetch user lesson progress using the same logic as CourseLessonScreen
        const completionPromises = lessonsData.map(async (lesson) => {
          try {
            const response = await fetch(
              `${MOBILE_SERVER_URL}api/user-lessons/${lesson._id}/lesson`,
              {
                headers: { Authorization: `Bearer ${userToken}` },
              }
            );

            if (response.ok) {
              const data = await response.json();
              return {
                lessonId: lesson._id,
                completed: data.userLesson?.status === "completed",
                status: data.userLesson?.status || "ongoing",
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

        console.log("Completion results:", completionResults);
        console.log("Completed lessons count:", completedCount);
        console.log("Total lessons:", lessonsData.length);
        setCompletedLessons(completedCount);

        setCourseInfo({
          title: course.name,
          description: course.description,
          numLessons: lessonsData.length,
          totalTests: testsData.length,
        });
      } else {
        throw new Error("Failed to check enrollment status");
      }
    } catch (err) {
      setError(err.message);
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
      Alert.alert("Error", "User ID is required to enroll.");
      return;
    }
    setEnrollLoading(true);
    try {
      const response = await fetch(`${MOBILE_SERVER_URL}api/user-courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ courseId, userId }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to enroll");
      }
      setIsEnrolled(true);
      Alert.alert("Success", "You have enrolled in the course.");
      fetchData();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

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
