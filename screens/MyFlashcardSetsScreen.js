import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Card, Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, apiUtils } from '../services';

const FlashcardSetCard = ({ flashcardSet, navigation, theme }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card containerStyle={[styles.flashcardCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('FlashcardSetDetail', { setId: flashcardSet._id })}
        activeOpacity={0.8}
      >
        {/* Cover Image or Placeholder */}
        <View style={styles.imageContainer}>
          {flashcardSet.coverImage ? (
            <Image
              source={{ uri: flashcardSet.coverImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.surfaceBackground }]}>
              <Ionicons name="layers-outline" size={32} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badge}>My Set</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.setTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {flashcardSet.name}
          </Text>
          
          <Text style={[styles.setDescription, { color: theme.colors.textSecondary }]} numberOfLines={3}>
            {flashcardSet.description || 'No description available'}
          </Text>

          {/* Stats */}
          <View style={styles.setStats}>
            <View style={styles.statItem}>
              <Ionicons name="document-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
                {flashcardSet.flashcardCount || 0} cards
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={theme.colors.textMuted} />
              <Text style={[styles.statText, { color: theme.colors.textMuted }]}>
                {flashcardSet.views || 0}
              </Text>
            </View>
          </View>

          {/* Date */}
          <View style={styles.setMeta}>
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
              <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                Created {formatDate(flashcardSet.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Study Button */}
        <View style={styles.studyButtonContainer}>
          <Button
            title="Study"
            buttonStyle={[styles.studyButton, { backgroundColor: theme.colors.primary }]}
            titleStyle={[styles.studyButtonText, { color: theme.colors.buttonText }]}
            onPress={() => navigation.navigate('FlashcardSetDetail', { setId: flashcardSet._id })}
          />
        </View>
      </TouchableOpacity>
    </Card>
  );
};

export default function MyFlashcardSetsScreen() {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { userToken, user } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const fetchFlashcardSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user?._id) {
        setFlashcardSets([]);
        return;
      }

      // Get user's own flashcard sets
      const response = await flashcardService.getUserFlashcardSets(user._id, {
        page: 1,
        size: 50,
        order: 'desc',
        sortBy: 'date',
      });
      
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setFlashcardSets(result.data);
      } else {
        setFlashcardSets([]);
      }
    } catch (error) {
      console.error('Error fetching user flashcard sets:', error);
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      setFlashcardSets([]);
      showError('Failed to load your flashcard sets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchFlashcardSets();
  }, [fetchFlashcardSets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFlashcardSets();
  }, [fetchFlashcardSets]);

  const renderFlashcardSetItem = ({ item }) => (
    <FlashcardSetCard
      flashcardSet={item}
      navigation={navigation}
      theme={theme}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[globalStyles.title, styles.headerTitle, { color: theme.colors.text }]}>
            My Flashcard Sets
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('CreateFlashcardSet')}
        >
          <Ionicons name="add" size={20} color={theme.colors.buttonText} />
        </TouchableOpacity>
      </View>
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary }]}>
        Manage and study your personal flashcard collections
      </Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="layers-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
        You haven't created any flashcard sets yet.
      </Text>
      <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
        Create your first flashcard set to start learning!
      </Text>
      <TouchableOpacity
        style={[styles.createFirstButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateFlashcardSet')}
      >
        <Ionicons name="add" size={20} color={theme.colors.buttonText} />
        <Text style={[styles.createFirstButtonText, { color: theme.colors.buttonText }]}>
          Create First Set
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!user?._id) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
          <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
            User not authenticated.
          </Text>
          <Text style={[globalStyles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
            Please log in to view your flashcard sets.
          </Text>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading your flashcard sets..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={flashcardSets}
        keyExtractor={(item) => item._id}
        renderItem={renderFlashcardSetItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
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
        nestedScrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    backgroundColor: '#202020',
  },
  listContainer: {
    paddingBottom: 100, // Extra padding at bottom for better scrolling
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
  },
  createButton: {
    padding: 8,
    borderRadius: 8,
  },
  flashcardCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#444',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  cardContent: {
    marginBottom: 12,
  },
  setTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    lineHeight: 24,
    marginBottom: 8,
    color: '#fff',
  },
  setDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
    marginBottom: 12,
    color: '#ccc',
  },
  setStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    color: '#aaa',
  },
  setMeta: {
    marginBottom: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    marginLeft: 4,
    color: '#aaa',
  },
  studyButtonContainer: {
    alignItems: 'center',
  },
  studyButton: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: '#4CC2FF',
  },
  studyButtonText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginLeft: 8,
    color: '#fff',
  },
}); 