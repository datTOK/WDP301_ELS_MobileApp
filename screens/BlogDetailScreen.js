// screens/BlogDetailScreen.js

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'react-native-elements'
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../context/AuthContext'; 
import RenderHtml from 'react-native-render-html'; 

// Base URL for your API
const API_BASE_URL = 'http://localhost:4000/api/blogs';

export default function BlogDetailScreen({ route, navigation }) {
  const { blogId } = route.params;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userToken } = useAuth();

  const { width } = useWindowDimensions();

  const fetchBlogDetails = useCallback(async () => {
    setLoading(true); 
    setError(null);   

    if (!userToken || !blogId) {
      setError("Authentication token or Blog ID is missing. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${blogId}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${userToken}`, 
        },
      });

      const result = await response.json(); 
      console.log("Full fetched blog data:", result); 
      console.log("Blog content specifically:", result.blog?.content); 

      if (response.ok) {
        setBlog(result.blog);
      } else {
        const errorMessage = result.message || 'Failed to fetch blog details.';
        setError(errorMessage);
        Alert.alert('API Error', errorMessage); 
      }
    } catch (err) {
      console.error('Network or parsing error:', err);
      setError('Network error. Could not connect to the server.');
      Alert.alert('Network Error', 'Could not connect to the server. Please check your connection.');
    } finally {
      setLoading(false); 
    }
  }, [blogId, userToken]); 

  // useEffect hook to call fetchBlogDetails when component mounts or userToken/blogId changes
  useEffect(() => {
    if (userToken && blogId) {
      fetchBlogDetails();
    } else {
      // If no token or blogId, set loading to false and show appropriate error
      setLoading(false);
      setError("Please ensure you are logged in and a valid blog ID is provided.");
    }
  }, [fetchBlogDetails, userToken, blogId]); 

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading blog details...</Text>
      </View>
    );
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

        <Text style={styles.title}>{blog.title}</Text>

        <Text style={styles.meta}>
          By {blog.user?.username || 'Unknown'} | {new Date(blog.createdAt).toLocaleDateString()}
        </Text>

        {blog.content ? ( 
          <RenderHtml
            contentWidth={width - 40}
            source={{ html: blog.content }}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Blog content is empty.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
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
});