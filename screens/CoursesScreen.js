import React, { useState, useEffect, useCallback } from "react";
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
import { useToast } from "../context/ToastContext";
import { SearchBar } from "react-native-elements";
import LoadingSpinner from "../components/LoadingSpinner";
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
              <Ionicons name="calendar-outline" size={14} color="#888" />
              <Text style={courseItemStyles.date}>
                {new Date(course.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={courseItemStyles.readMoreContainer}>
              <Text style={courseItemStyles.readMoreText}>Read More</Text>
              <Ionicons name="arrow-forward" size={16} color="#007bff" />
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
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  courseImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
  },
  overlay: {
    display: "none",
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
    lineHeight: 26,
  },
  description: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 16,
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
    color: "#888",
    fontWeight: "500",
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
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
  const { showError } = useToast();

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

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Courses</Text>
        <Text style={styles.headerSubtitle}>
          {total} course{total !== 1 ? "s" : ""} available
        </Text>
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
    backgroundColor: "#f7f7f7",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#f7f7f7",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#222",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#888",
    marginTop: 4,
    fontWeight: "500",
  },
  controlsContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBarContainer: {
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    borderTopWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  searchBarInputContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    height: 50,
  },
  searchBarInput: {
    color: "#222",
    fontSize: 16,
    fontWeight: "500",
  },
  filtersContainer: {
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
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
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeFilterButton: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#888",
    fontWeight: "600",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#007bff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  disabledPaginationButton: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  disabledPaginationButtonText: {
    color: "#bbb",
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
});
