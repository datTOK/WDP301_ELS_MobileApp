import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { createGlobalStyles } from "../utils/globalStyles";
import LoadingSpinner from "../components/LoadingSpinner";
import { testService, userTestService, apiUtils } from "../services";

const TestScreen = ({ route }) => {
  const [tests, setTests] = useState([]);
  const [userTests, setUserTests] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const fetchTests = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await testService.getTestsByCourseId(
        route.params?.courseId || "default"
      );
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setTests(result.data);
        // Fetch user test data for each test
        await fetchUserTestsData(result.data);
      } else {
        setTests([]);
        showError("No tests found for this course.");
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setTests([]);
      showError("Failed to load tests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params?.courseId, showError]);

  const fetchUserTestsData = useCallback(async (testList) => {
    try {
      const userTestsData = {};
      
      for (const test of testList) {
        try {
          const userTestResponse = await userTestService.getUserTestByTestId(test._id);
          const userTestResult = apiUtils.parseResponse(userTestResponse);
          
          if (userTestResult.data && userTestResult.data.userTest) {
            userTestsData[test._id] = userTestResult.data.userTest;
          }
        } catch (error) {
          // User hasn't taken this test yet, which is normal
          console.log(`No user test data for test ${test._id}`);
        }
      }
      
      setUserTests(userTestsData);
    } catch (error) {
      console.error("Error fetching user tests data:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTests();
    }, [fetchTests])
  );

  const onRefresh = useCallback(() => {
    fetchTests(true);
  }, [fetchTests]);

  const renderTestItem = ({ item, index }) => {
    const userTest = userTests[item._id];
    const hasUserTest = !!userTest;
    const isPassed = userTest?.status === "passed";
    const isFailed = userTest?.status === "failed";

    return (
      <View
        style={[
          styles.testItem,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: hasUserTest 
              ? (isPassed ? "#10D876" : "#FF6B6B") 
              : theme.colors.borderColor,
            borderWidth: hasUserTest ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.testItemContent}
          onPress={() =>
            navigation.navigate("TestScreenDetail", {
              testId: item._id,
              testName: item.name || `Test ${index + 1}`,
            })
          }
          activeOpacity={0.7}
        >
        <View style={styles.testItemContent}>
          <View style={styles.testItemLeft}>
            <Ionicons
              name="document-text"
              size={20}
              color={theme.colors.primary}
            />
            <View style={styles.testInfo}>
              <Text style={[styles.testName, { color: theme.colors.text }]}>
                {item.name || `Test ${index + 1}`}
              </Text>
              <Text
                style={[
                  styles.testDescription,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {hasUserTest 
                  ? `Score: ${userTest.score}% - ${userTest.status?.charAt(0).toUpperCase() + userTest.status?.slice(1).toLowerCase()}`
                  : "Final assessment for the course"
                }
              </Text>
            </View>
          </View>

          <View style={styles.testItemRight}>
            {hasUserTest && (
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: isPassed ? "rgba(16, 216, 118, 0.1)" : "rgba(255, 107, 107, 0.1)",
                  borderColor: isPassed ? "#10D876" : "#FF6B6B",
                }
              ]}>
                <Ionicons
                  name={isPassed ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={isPassed ? "#10D876" : "#FF6B6B"}
                />
              </View>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textMuted}
              style={{ marginLeft: 8 }}
            />
          </View>
                  </View>
        </TouchableOpacity>
        
        {/* Retry button for failed tests */}
        {isFailed && (
          <View style={styles.retrySection}>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() =>
                navigation.navigate("TestScreenDetail", {
                  testId: item._id,
                  testName: item.name || `Test ${index + 1}`,
                  isRetry: true,
                })
              }
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.retryButtonText}>Retry Test</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View
      style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}
    >
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            globalStyles.title,
            styles.headerTitle,
            { color: theme.colors.text },
          ]}
        >
          Course Tests
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text
        style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}
      >
        Test your knowledge with interactive assessments
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={theme.colors.textMuted}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No tests available
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        Check back later for new tests to assess your knowledge.
      </Text>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading tests..." />;
  }

  if (error) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Oops! Something went wrong
          </Text>
          <Text
            style={[styles.errorText, { color: theme.colors.textSecondary }]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => fetchTests()}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={theme.colors.buttonText}
            />
            <Text
              style={[
                styles.retryButtonText,
                { color: theme.colors.buttonText },
              ]}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {renderHeader()}

      {tests.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderTestItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1D1D1D",
    overflow: "hidden",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(76, 194, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Mulish-Bold",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    flexGrow: 1,
  },
  testItem: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  testItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 68,
  },
  testItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  testInfo: {
    marginLeft: 12,
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    fontFamily: "Mulish-Regular",
    lineHeight: 18,
  },
  testItemRight: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 4,
  },
  retrySection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 107, 107, 0.2)",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Mulish-SemiBold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
});

export default TestScreen;
