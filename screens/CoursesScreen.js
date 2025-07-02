import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Image, SearchBar } from 'react-native-elements';

const API_BASE_URL = 'http://localhost:4000/api';

const CourseItem = ({ course, navigation }) => {
  return (
    <Card containerStyle={courseItemStyles.card}>
      <Card.Image
        source={{ uri: course.coverImage || 'https://images.pexels.com/photos/5652121/pexels-photo-5652121.jpeg' }}
      />
      <Card.Title style={courseItemStyles.title}>{course.name}</Card.Title>
      <Card.Divider style={{ backgroundColor: 'white', height: 2, marginVertical: 10, width: '90%', marginHorizontal: 'auto' }} />
      <Text style={courseItemStyles.contentSnippet} numberOfLines={2}>
        {course.description}
      </Text>
      <Text style={courseItemStyles.date}>
        Published: {new Date(course.createdAt).toLocaleDateString()}
      </Text>
      <Button
        title="Read More"
        buttonStyle={courseItemStyles.readMoreButton}
        titleStyle={courseItemStyles.readMoreButtonText}
        onPress={() => navigation.navigate('courseDetail', { courseId: course._id })}
        type="solid"
      />
    </Card>
  );
};

const courseItemStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    paddingHorizontal: 15,
    textAlign: 'center',
    color: '#fff',
  },
  contentSnippet: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  date: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  readMoreButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    marginHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },
  readMoreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default function CoursesScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [order, setOrder] = useState('asc');
  const [sortBy, setSortBy] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { userToken } = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        order: order,
        sortBy: sortBy,
      });

      if (debouncedSearch) {
        queryParams.append('search', debouncedSearch);
      }

      const url = `${API_BASE_URL}/courses?${queryParams.toString()}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
      });

      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok) {
        const coursesData = result.data;
        if (coursesData && Array.isArray(coursesData)) {
          setCourses(coursesData);
          setTotal(result.total || 0);
          setTotalPages(result.totalPages || 0);
        } else {
          setCourses([]);
          setTotal(0);
          setTotalPages(0);
          Alert.alert('Data Error', result.message || 'Received unexpected data structure. Missing "data" or "courses" array.');
        }
      } else {
        setError(result.message || 'Failed to fetch courses.');
        Alert.alert('API Error', result.message || 'Failed to fetch courses.');
        setCourses([]);
      }
    } catch (err) {
      console.error('Network or parsing error:', err);
      setError('Network error. Could not connect to the server.');
      Alert.alert('Network Error', 'Could not connect to the server. Please check your connection.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, order, sortBy, debouncedSearch, userToken]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage((prevPage) => prevPage - 1);
    }
  };

  const renderFooter = () => (
    <View style={styles.paginationContainer}>
      <Button
        icon={<Ionicons name="arrow-back" size={20} color={page === 1 || loading ? 'gray' : '#fff'} />}
        title="Previous"
        type="clear"
        titleStyle={[styles.paginationButtonText, page === 1 || loading ? { color: 'gray' } : { color: '#fff' }]}
        disabled={page === 1 || loading}
        onPress={handlePreviousPage}
        buttonStyle={styles.paginationButton}
      />
      <Text style={styles.pageInfo}>
        Page {page} of {totalPages}
      </Text>
      <Button
        iconRight
        icon={<Ionicons name="arrow-forward" size={20} color={page === totalPages || loading ? 'gray' : '#fff'} />}
        title="Next"
        type="clear"
        titleStyle={[styles.paginationButtonText, page === totalPages || loading ? { color: 'gray' } : { color: '#fff' }]}
        disabled={page === totalPages || loading}
        onPress={handleNextPage}
        buttonStyle={styles.paginationButton}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.container}>
        <View style={styles.controlsContainer}>
          <SearchBar
            platform="default"
            placeholder="Search courses by title/content..."
            onChangeText={setSearch}
            value={search}
            containerStyle={styles.searchBarContainer}
            inputContainerStyle={styles.searchBarInputContainer}
            inputStyle={styles.searchBarInput}
            searchIcon={{ size: 20, color: '#888' }}
            clearIcon={search ? { name: 'close', onPress: () => setSearch('') } : null}
            lightTheme={false}
          />

          <View style={styles.sortFilterSection}>
            <View style={styles.filterRow}>
              <Text style={styles.label}>Sort By:</Text>
              <Button
                title="Date"
                type={sortBy === 'date' ? 'solid' : 'outline'}
                buttonStyle={[styles.sortButton, sortBy === 'date' && styles.activeSortButton]}
                titleStyle={[styles.sortButtonText, sortBy === 'date' && styles.activeSortButtonText]}
                onPress={() => { setSortBy('date'); setPage(1); }}
              />
              <Button
                title="Title"
                type={sortBy === 'title' ? 'solid' : 'outline'}
                buttonStyle={[styles.sortButton, sortBy === 'title' && styles.activeSortButton]}
                titleStyle={[styles.sortButtonText, sortBy === 'title' && styles.activeSortButtonText]}
                onPress={() => { setSortBy('title'); setPage(1); }}
              />
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.label}>Order:</Text>
              <Button
                title="ASC"
                type={order === 'asc' ? 'solid' : 'outline'}
                buttonStyle={[styles.sortButton, order === 'asc' && styles.activeSortButton]}
                titleStyle={[styles.sortButtonText, order === 'asc' && styles.activeSortButtonText]}
                onPress={() => { setOrder('asc'); setPage(1); }}
              />
              <Button
                title="DESC"
                type={order === 'desc' ? 'solid' : 'outline'}
                buttonStyle={[styles.sortButton, order === 'desc' && styles.activeSortButton]}
                titleStyle={[styles.sortButtonText, order === 'desc' && styles.activeSortButtonText]}
                onPress={() => { setOrder('desc'); setPage(1); }}
              />
            </View>
          </View>
        </View>

        {loading && courses.length === 0 ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={30} color="red" />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              onPress={fetchCourses}
              buttonStyle={styles.retryButton}
              titleStyle={styles.retryButtonText}
            />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.nocoursesContainer}>
            <Ionicons name="information-circle-outline" size={50} color="#888" />
            <Text style={styles.nocoursesText}>No courses found.</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <CourseItem course={item} navigation={navigation} />}
            contentContainerStyle={styles.listContentContainer}
            ListFooterComponent={totalPages > 1 ? renderFooter : null}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  controlsContainer: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 10,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    padding: 0,
    marginBottom: 15,
  },
  searchBarInputContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
  },
  searchBarInput: {
    color: '#eee',
    fontSize: 16,
  },
  sortFilterSection: {
    flexDirection: 'column',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '600',
    color: '#bbb',
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 80,
    borderColor: '#555',
  },
  activeSortButton: {
    backgroundColor: '#fff',
  },
  sortButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  activeSortButtonText: {
    color: '#000',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#007bff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nocoursesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  nocoursesText: {
    fontSize: 18,
    color: '#aaa',
    marginTop: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
    marginTop: 10,
    borderRadius: 12,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  paginationButton: {
    // RNE Buttons have padding by default, adjust as needed
  },
  paginationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pageInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#bbb',
  },
});