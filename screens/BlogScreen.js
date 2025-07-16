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
  TextInput,
  TouchableOpacity, 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/Topbar'
import { useAuth } from '../context/AuthContext';
import { Card, Button, Image } from 'react-native-elements';
import { MOBILE_SERVER_URL } from '@env'; 

const stripHtmlTags = (htmlString) => {
  return htmlString ? htmlString.replace(/<[^>]*>/g, '').trim() : '';
};

const BlogItem = ({ blog, navigation }) => {
  const plainTextContent = stripHtmlTags(blog.content);
  return (
    <Card containerStyle={blogItemStyles.card}>
      {blog.coverImage ? (
        <Card.Image
          source={{ uri: blog.coverImage }}
          style={blogItemStyles.image}
          resizeMode='cover'
          onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
        />
      ) : (
        <View style={blogItemStyles.placeholderImage}>
          <Text style={blogItemStyles.placeholderText}>No Image</Text>
        </View>
      )}
      <Card.Title style={blogItemStyles.title}>{blog.title}</Card.Title>
      <Text style={blogItemStyles.contentSnippet} numberOfLines={3}>
        {plainTextContent}
      </Text>
      <Text style={blogItemStyles.date}>
        Published: {new Date(blog.createdAt).toLocaleDateString()}
      </Text>
      <Button
        title="Read More"
        buttonStyle={blogItemStyles.readMoreButton}
        titleStyle={blogItemStyles.readMoreButtonText}
        onPress={() => navigation.navigate('BlogDetail', { blogId: blog._id })} 
        type="solid"
      />
    </Card>
  );
};

const blogItemStyles = StyleSheet.create({
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
  image: {
    width: '100%',
    height: 180,
  },
  placeholderImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#444', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#bbb', 
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    paddingHorizontal: 15,
    textAlign: 'left',
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

export default function BlogScreen({navigation}) {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [order, setOrder] = useState('desc');
  const [sortBy, setSortBy] = useState('date');
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

  const fetchBlogs = useCallback(async () => {
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

      const url = `${MOBILE_SERVER_URL}api/blogs?${queryParams.toString()}`;
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
        const blogsData = result.data || result.blogs;
        if (blogsData && Array.isArray(blogsData)) {
          setBlogs(blogsData);
          setTotal(result.total || 0);
          setTotalPages(result.totalPages || 0);
        } else {
          setBlogs([]);
          setTotal(0);
          setTotalPages(0);
          Alert.alert('Data Error', result.message || 'Received unexpected data structure. Missing "data" or "blogs" array.');
        }
      } else {
        setError(result.message || 'Failed to fetch blogs.');
        Alert.alert('API Error', result.message || 'Failed to fetch blogs.');
        setBlogs([]);
      }
    } catch (err) {
      console.error('Network or parsing error:', err);
      setError('Network error. Could not connect to the server.');
      Alert.alert('Network Error', 'Could not connect to the server. Please check your connection.');
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, size, order, sortBy, debouncedSearch, userToken]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(prevPage => prevPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
    }
  };

  const renderFooter = () => (
    <View style={styles.paginationContainer}>
      <Button
        icon={<Ionicons name="arrow-back" size={20} color={page === 1 || loading ? 'gray' : '#fff'} />}
        title="Previous"
        type="clear"
        titleStyle={[styles.paginationButtonText, page === 1 || loading ? { color: 'gray' } : {color: '#fff'}]}
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
        titleStyle={[styles.paginationButtonText, page === totalPages || loading ? { color: 'gray' } : {color: '#fff'}]}
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
        <TopBar title="Blog" />
        <View style={styles.controlsContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search blogs by title/content..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#888"
              autoCapitalize="none"
              autoCorrect={false}
              editable={true} 
              keyboardAppearance="dark" 
            />
          </View>

          {/* <View style={styles.sortFilterSection}>
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
          </View> */}
        </View>

        {loading && blogs.length === 0 ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={30} color="red" />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title="Retry"
              onPress={fetchBlogs}
              buttonStyle={styles.retryButton}
              titleStyle={styles.retryButtonText}
            />
          </View>
        ) : blogs.length === 0 ? (
          <View style={styles.noBlogsContainer}>
            <Ionicons name="ios-information-circle-outline" size={50} color="#888" />
            <Text style={styles.noBlogsText}>No blogs found.</Text>
          </View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <BlogItem blog={item} navigation={navigation}/>}
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
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    backgroundColor: 'fff',
    marginBottom: 15,
    height: 45,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1, 
    fontSize: 16,
    color: '#eee', 
    paddingVertical: Platform.OS === 'web' ? 8 : 0, 
    outlineStyle: 'none', 
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
  noBlogsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  noBlogsText: {
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
