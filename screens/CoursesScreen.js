import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { SearchBar } from "react-native-elements";
import LoadingSpinner from "../components/LoadingSpinner";
import { createGlobalStyles } from "../utils/globalStyles";
import { courseService, apiUtils } from "../services";

const { width } = Dimensions.get("window");

const CourseItem = ({ course, navigation }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={courseItemStyles.cardContainer}
      onPress={() =>
        navigation.navigate("CourseOverview", { courseId: course._id })
      }
      activeOpacity={0.8}
    >
      <View style={courseItemStyles.card}>
        <View style={courseItemStyles.imageContainer}>
          <Image
            source={
              imageError || !course.coverImage
                ? require("../assets/placeholder-course.jpg")
                : { uri: course.coverImage }
            }
            onError={() => setImageError(true)}
            style={courseItemStyles.courseImage}
          />
          <View style={courseItemStyles.overlay} />
          <View style={courseItemStyles.badgeContainer}>
            <Text style={courseItemStyles.badge}>Course</Text>
          </View>
        </View>

        <View style={courseItemStyles.contentContainer}>
          <Text style={courseItemStyles.title} numberOfLines={2}>
            {course.name}
          </Text>

          <Text style={courseItemStyles.description} numberOfLines={3}>
            {course.description}
          </Text>

          <View style={courseItemStyles.footer}>
            <View style={courseItemStyles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#4CC2FF" />
              <Text style={courseItemStyles.date}>
                {new Date(course.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={courseItemStyles.readMoreContainer}>
              <Text style={courseItemStyles.readMoreText}>View Course</Text>
              <Ionicons name="arrow-forward" size={16} color="#4CC2FF" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const courseItemStyles = StyleSheet.create({
  cardContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  courseImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#444",
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  badge: {
    backgroundColor: '#4CC2FF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontFamily: 'Mulish-Bold',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: "#fff",
    marginBottom: 12,
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: "#ccc",
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'Mulish-Regular',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: 13,
    color: "#aaa",
    fontFamily: 'Mulish-Medium',
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: "#4CC2FF",
    fontFamily: 'Mulish-Bold',
  },
});

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [size] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [order, setOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { userToken } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size,
        order,
        sortBy,
        ...(debouncedSearch && { search: debouncedSearch }),
      };

      const response = await courseService.getCourses(params);
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setCourses(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        setCourses([]);
        setTotal(0);
        setTotalPages(0);
        showError('Data Error', 'Unexpected data structure.');
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, order, sortBy, debouncedSearch, showError]);

  // Fetch courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCourses();
    }, [fetchCourses])
  );

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCourses();
  }, [fetchCourses]);

  const FilterButton = ({ title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderFooter = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          (page === 1 || loading) && styles.disabledPaginationButton,
        ]}
        disabled={page === 1 || loading}
        onPress={handlePreviousPage}
      >
        <Ionicons
          name="chevron-back"
          size={20}
          color={page === 1 || loading ? "#bbb" : "#222"}
        />
        <Text
          style={[
            styles.paginationButtonText,
            (page === 1 || loading) && styles.disabledPaginationButtonText,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.pageIndicator}>
        <Text style={styles.pageInfo}>
          {page} of {totalPages}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.paginationButton,
          (page === totalPages || loading) && styles.disabledPaginationButton,
        ]}
        disabled={page === totalPages || loading}
        onPress={handleNextPage}
      >
        <Text
          style={[
            styles.paginationButtonText,
            (page === totalPages || loading) &&
              styles.disabledPaginationButtonText,
          ]}
        >
          Next
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={page === totalPages || loading ? "#bbb" : "#222"}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading courses..." />;
  }

  // Error and empty state improvements
  if (error) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Unable to Load Courses</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (courses.length === 0 && !loading) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
          <View style={styles.headerContent}>
            <View>
              <View style={styles.titleContainer}>
                <Ionicons name="library-outline" size={28} color="#4CC2FF" style={styles.titleIcon} />
                <Text style={[globalStyles.title, { color: theme.colors.text, marginBottom: 0 }]}>
                  Courses
                </Text>
              </View>
              <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
                No courses available
              </Text>
            </View>
          </View>
        </View>

        {/* Controls Container */}
        <View style={styles.controlsContainer}>
          <SearchBar
            platform="default"
            placeholder="Search courses..."
            onChangeText={setSearch}
            value={search}
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            inputStyle={styles.searchBarInput}
            searchIcon={{ size: 20, color: "#4CC2FF" }}
            clearIcon={
              search
                ? {
                    name: "close",
                    onPress: () => setSearch(""),
                    color: "#4CC2FF",
                  }
                : null
            }
            lightTheme={false}
          />

          <View style={styles.filtersContainer}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort by</Text>
              <View style={styles.filterRow}>
                <FilterButton
                  title="Date"
                  isActive={sortBy === "date"}
                  onPress={() => {
                    setSortBy("date");
                    setPage(1);
                  }}
                />
                <FilterButton
                  title="Title"
                  isActive={sortBy === "name"}
                  onPress={() => {
                    setSortBy("name");
                    setPage(1);
                  }}
                />
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Order</Text>
              <View style={styles.filterRow}>
                <FilterButton
                  title="Ascending"
                  isActive={order === "asc"}
                  onPress={() => {
                    setOrder("asc");
                    setPage(1);
                  }}
                />
                <FilterButton
                  title="Descending"
                  isActive={order === "desc"}
                  onPress={() => {
                    setOrder("desc");
                    setPage(1);
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="library-outline" size={80} color="#666" />
          </View>
          <Text style={styles.emptyTitle}>No Courses Found</Text>
          <Text style={styles.emptyText}>
            {search
              ? "Try adjusting your search terms or filters"
              : "No courses are available at the moment. Check back later!"}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <View style={styles.headerContent}>
          <View>
            <View style={styles.titleContainer}>
              <Ionicons name="library-outline" size={28} color="#4CC2FF" style={styles.titleIcon} />
              <Text style={[globalStyles.title, { color: theme.colors.text, marginBottom: 0 }]}>
                Courses
              </Text>
            </View>
            <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
              {total} course{total !== 1 ? "s" : ""} available for learning
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <SearchBar
          platform="default"
          placeholder="Search courses..."
          onChangeText={setSearch}
          value={search}
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchBarInputContainer}
          inputStyle={styles.searchBarInput}
          searchIcon={{ size: 20, color: "#007bff" }}
          clearIcon={
            search
              ? {
                  name: "close",
                  onPress: () => setSearch(""),
                  color: "#007bff",
                }
              : null
          }
          lightTheme={false}
        />

        <View style={styles.filtersContainer}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Sort by</Text>
            <View style={styles.filterRow}>
              <FilterButton
                title="Date"
                isActive={sortBy === "date"}
                onPress={() => {
                  setSortBy("date");
                  setPage(1);
                }}
              />
              <FilterButton
                title="Title"
                isActive={sortBy === "name"}
                onPress={() => {
                  setSortBy("name");
                  setPage(1);
                }}
              />
            </View>
          </View>

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Order</Text>
            <View style={styles.filterRow}>
              <FilterButton
                title="Ascending"
                isActive={order === "asc"}
                onPress={() => {
                  setOrder("asc");
                  setPage(1);
                }}
              />
              <FilterButton
                title="Descending"
                isActive={order === "desc"}
                onPress={() => {
                  setOrder("desc");
                  setPage(1);
                }}
              />
            </View>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourses}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="library-outline" size={64} color="#555" />
          </View>
          <Text style={styles.emptyTitle}>No courses found</Text>
          <Text style={styles.emptyText}>
            {search
              ? "Try adjusting your search terms"
              : "Check back later for new courses"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CourseItem course={item} navigation={navigation} />
          )}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={totalPages > 1 ? renderFooter : null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Updated to match other screens
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D1D1D',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(76, 194, 255, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  controlsContainer: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  searchBarContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  searchBarInputContainer: {
    backgroundColor: "#333",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    height: 50,
  },
  searchBarInput: {
    color: "#fff",
    fontSize: 16,
    fontFamily: 'Mulish-Medium',
  },
  filtersContainer: {
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: "#aaa",
    fontFamily: 'Mulish-Bold',
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#444",
  },
  activeFilterButton: {
    backgroundColor: "#4CC2FF",
    borderColor: "#4CC2FF",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: 'Mulish-Medium',
  },
  activeFilterButtonText: {
    color: "#fff",
  },
  listContainer: {
    paddingVertical: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
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
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    color: "#fff",
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Mulish-Regular",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  disabledPaginationButton: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    color: "#fff",
  },
  disabledPaginationButtonText: {
    color: "#aaa",
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#333",
    borderRadius: 12,
  },
  pageInfo: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    color: "#4CC2FF",
  },
});
