// screens/BlogDetailScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'react-native-elements'
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../context/AuthContext'; 
import RenderHtml from 'react-native-render-html'; 
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { blogService, apiUtils } from '../services';

export default function BlogDetailScreen({ route, navigation }) {
  const { blogId } = route.params;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userToken } = useAuth();
  const { showError } = useToast();

  const { width } = useWindowDimensions();

  const fetchBlogDetails = useCallback(async () => {
    setLoading(true); 
    setError(null);   

    if (!blogId) {
      setError("Blog ID is missing. Please try again.");
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching blog with ID:', blogId);
      const response = await blogService.getBlogById(blogId);
      console.log('Raw API response:', response);
      
      const result = apiUtils.parseResponse(response);
      console.log('Parsed result:', result);

      if (result.data) {
        console.log('Blog data received:', result.data);
        // Check if the blog data is in result.data.blog (from API response structure)
        const blogData = result.data.blog || result.data;
        console.log('Extracted blog data:', blogData);
        console.log('Blog title:', blogData.title);
        console.log('Blog content:', blogData.content);
        console.log('Blog user:', blogData.user);
        setBlog(blogData);
      } else {
        const errorMessage = result.message || 'Failed to fetch blog details.';
        console.error('No data in response:', result);
        setError(errorMessage);
        showError('API Error', errorMessage); 
      }
    } catch (err) {
      console.error('Network or parsing error:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError('Network Error', errorInfo.message);
    } finally {
      setLoading(false); 
    }
  }, [blogId]); 

  // useEffect hook to call fetchBlogDetails when component mounts or blogId changes
  useEffect(() => {
    if (blogId) {
      fetchBlogDetails();
    } else {
      // If no blogId, set loading to false and show appropriate error
      setLoading(false);
      setError("Please ensure a valid blog ID is provided.");
    }
  }, [fetchBlogDetails, blogId]); 

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading blog details..." />;
  }

  // Show error message if an error occurred during fetch
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBlogDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show "Blog post not found" if blog object is null after loading and no error
  if (!blog) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>Blog post not found or data is invalid.</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {blog.coverImage ? (
          <Image
            source={{ uri: blog.coverImage }}
            style={styles.coverImage}
            PlaceholderContent={<ActivityIndicator color="#007bff" />} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>No Cover Image</Text>
          </View>
        )}

        <Text style={styles.title}>{blog.title || 'Untitled Blog'}</Text>

        <Text style={styles.meta}>
          By {blog.user?.username || blog.author || 'Unknown'} | {new Date(blog.createdAt || blog.created_at || Date.now()).toLocaleDateString()}
        </Text>

        {blog.content && blog.content.trim() ? ( 
          <View style={styles.contentContainer}>
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: blog.content }}
              baseStyle={styles.htmlContent}
              enableExperimentalMarginCollapsing={true}
              renderersProps={{
                img: {
                  enableExperimentalPercentWidth: true,
                },
              }}
              onHTMLLoadError={(error) => {
                console.error('HTML rendering error:', error);
              }}
              onTTreeChange={(tree) => {
                console.log('HTML tree changed:', tree);
              }}
            />
          </View>
        ) : blog.body && blog.body.trim() ? (
          <View style={styles.contentContainer}>
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: blog.body }}
              baseStyle={styles.htmlContent}
              enableExperimentalMarginCollapsing={true}
              renderersProps={{
                img: {
                  enableExperimentalPercentWidth: true,
                },
              }}
              onHTMLLoadError={(error) => {
                console.error('HTML rendering error:', error);
              }}
            />
          </View>
        ) : blog.description && blog.description.trim() ? (
          <View style={styles.contentContainer}>
            <Text style={styles.htmlContent}>{blog.description}</Text>
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Blog content is empty or not available.</Text>
            <Text style={styles.debugText}>Available fields: {Object.keys(blog).join(', ')}</Text>
            <Text style={styles.debugText}>Content field: {JSON.stringify(blog.content)}</Text>
            <Text style={styles.debugText}>Body field: {JSON.stringify(blog.body)}</Text>
            <Text style={styles.debugText}>Description field: {JSON.stringify(blog.description)}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202020',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#202020',
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202020',
  },
  noDataText: {
    color: '#bbb',
    fontSize: 18,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  coverImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  imagePlaceholderText: {
    color: '#bbb',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  meta: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#007bff',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  backButtonAbsolute: {
    position: 'absolute',
    top: 50, 
    left: 20,
    zIndex: 10, 
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  contentContainer: {
    marginTop: 10,
  },
  htmlContent: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
  },
  debugText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});