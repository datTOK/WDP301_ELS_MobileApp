import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { testService, apiUtils } from '../services';

const TestScreen = ({ route }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const fetchTests = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await testService.getCourseTests(route.params?.courseId || 'default');
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setTests(result.data);
      } else {
        setTests([]);
        showError('No tests found for this course.');
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setTests([]);
      showError('Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const onRefresh = () => {
    fetchTests(true);
  };

  const renderTestItem = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.testItem, { 
        backgroundColor: theme.colors.cardBackground, 
        borderColor: theme.colors.borderColor 
      }]}
      onPress={() => navigation.navigate('TestScreenDetail', { 
        testId: item._id, 
        testName: item.name || `Test ${index + 1}` 
      })}
      activeOpacity={0.7}
    >
      <View style={styles.testItemContent}>
        <View style={styles.testItemLeft}>
          <Ionicons name="document-text" size={20} color={theme.colors.primary} />
          <View style={styles.testInfo}>
            <Text style={[styles.testName, { color: theme.colors.text }]}>
              {item.name || `Test ${index + 1}`}
            </Text>
            <Text style={[styles.testDescription, { color: theme.colors.textSecondary }]}>
              Final assessment for the course
            </Text>
          </View>
        </View>
        
        <View style={styles.testItemRight}>
          {/* TODO: Add completion status badge when user test data is available */}
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[globalStyles.title, styles.headerTitle, { color: theme.colors.text }]}>
            Course Tests
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>
      
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
        Test your knowledge with interactive assessments
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} />
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} 
            onPress={() => fetchTests()}
          >
            <Ionicons name="refresh" size={20} color={theme.colors.buttonText} />
            <Text style={[styles.retryButtonText, { color: theme.colors.buttonText }]}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
    borderColor: '#1D1D1D',
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(76, 194, 255, 0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
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
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  testItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 68,
  },
  testItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  testInfo: {
    marginLeft: 12,
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 18,
  },
  testItemRight: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
});

export default TestScreen; 