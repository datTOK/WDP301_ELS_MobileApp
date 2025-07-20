import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { blogService, apiUtils } from '../services';

const { width } = Dimensions.get('window');

const BlogCard = ({ blog, navigation, theme, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return theme.colors.primary;
      case 'draft':
      case 'drafting':
        return theme.colors.textMuted;
      case 'archived':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.blogCard,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: theme.colors.borderColor,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('BlogDetail', { blogId: blog._id })}
        activeOpacity={0.8}
        style={styles.cardTouchable}
      >
        {/* Cover Image or Placeholder */}
        <View style={styles.imageContainer}>
          {blog.coverImage ? (
            <Image
              source={{ uri: blog.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceBackground }]}>
              <Text style={[styles.imagePlaceholderText, { color: theme.colors.primary }]}>
                {blog.title?.charAt(0)?.toUpperCase() || 'B'}
              </Text>
            </View>
          )}
          
          {/* Status Badge */}
          {blog.status && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(blog.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(blog.status) }]}>
                {blog.status.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Title */}
          <Text
            style={[styles.blogTitle, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {blog.title}
          </Text>

          {/* Content Preview */}
          <Text
            style={[styles.contentPreview, { color: theme.colors.textSecondary }]}
            numberOfLines={3}
          >
            {blog.content?.replace(/<[^>]*>/g, '').substring(0, 120)}...
          </Text>

          {/* Meta Information */}
          <View style={styles.blogMeta}>
            <View style={styles.authorInfo}>
              <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
              <Text style={[styles.authorText, { color: theme.colors.textMuted }]}>
                {blog.user?.username || 'Anonymous'}
              </Text>
            </View>
            
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
              <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                {formatDate(blog.createdAt)}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.blogStats}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
                {blog.views || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
                {blog.likes || 0}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
                {blog.comments?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Read More Arrow */}
        <View style={styles.readMoreContainer}>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SearchHeader = ({ searchQuery, setSearchQuery, onSearch, onReset, theme }) => {
  const globalStyles = createGlobalStyles(theme);
  
  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search blogs..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={onSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onReset} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[styles.searchButton, { backgroundColor: theme.colors.primary }]}
        onPress={onSearch}
        activeOpacity={0.8}
      >
        <Text style={[styles.searchButtonText, { color: theme.colors.buttonText }]}>
          Search
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function BlogScreen() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const navigation = useNavigation();
  const { userToken } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const headerAnim = useRef(new Animated.Value(0)).current;

  // Fetch blogs when component mounts
  useEffect(() => {
    fetchBlogs(false, '');
    
    // Animate header
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchBlogs = useCallback(async (resetPage = false, searchTerm = null) => {
    if (resetPage) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const currentPage = resetPage ? 1 : page;
      const searchToUse = searchTerm !== null ? searchTerm : currentSearch;
      const params = {
        page: currentPage,
        size: 10,
        order: 'desc',
        sortBy: 'date',
        ...(searchToUse && { search: searchToUse }),
      };

      const response = await blogService.getBlogs(params);
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setBlogs(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        setBlogs([]);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      showError('Failed to load blogs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBlogs(true, currentSearch);
  };

  const handleSearch = () => {
    setCurrentSearch(searchQuery);
    setPage(1);
    fetchBlogs(true, searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    setCurrentSearch('');
    setPage(1);
    fetchBlogs(true, '');
  };

  const renderBlogItem = ({ item, index }) => (
    <BlogCard
      blog={item}
      navigation={navigation}
      theme={theme}
      index={index}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Title Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={[globalStyles.title, { color: theme.colors.text }]}>
          Blog & Articles
        </Text>
        <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
          Discover insights and tips for your English learning journey
        </Text>
      </Animated.View>

      {/* Search Header */}
      <SearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearch={handleSearch}
        onReset={handleReset}
        theme={theme}
      />

      {/* Results Info */}
      {!loading && (
        <View style={styles.resultsInfo}>
          <Text style={[styles.resultsText, { color: theme.colors.textSecondary }]}>
            {currentSearch
              ? `Found ${total} result${total !== 1 ? 's' : ''} for "${currentSearch}"`
              : `${total} article${total !== 1 ? 's' : ''} available`}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
        {currentSearch ? 'No blogs found matching your search.' : 'No blogs available at the moment.'}
      </Text>
      {currentSearch && (
        <TouchableOpacity
          style={[globalStyles.buttonOutline, styles.clearSearchButton]}
          onPress={handleReset}
        >
          <Text style={globalStyles.buttonOutlineText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading blogs..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={blogs}
        renderItem={renderBlogItem}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  resultsInfo: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },
  blogCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTouchable: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 120,
    height: 140,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
    fontFamily: 'Mulish-Bold',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Mulish-Bold',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  blogTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    lineHeight: 22,
    marginBottom: 8,
  },
  contentPreview: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  blogMeta: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    marginLeft: 4,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    marginLeft: 4,
  },
  blogStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    marginLeft: 4,
  },
  readMoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  clearSearchButton: {
    marginTop: 16,
  },
});
