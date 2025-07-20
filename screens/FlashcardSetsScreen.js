import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Card, Button, SearchBar } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, apiUtils } from '../services';

const FlashcardSetCard = ({ flashcardSet, navigation, theme, showOwnerInfo = true }) => {
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
            <Text style={styles.badge}>Flashcards</Text>
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

          {/* Meta Information */}
          {showOwnerInfo && (
            <View style={styles.setMeta}>
              <View style={styles.authorInfo}>
                <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.authorText, { color: theme.colors.textMuted }]}>
                  {flashcardSet.user?.username || 'Anonymous'}
                </Text>
              </View>
              
              <View style={styles.dateInfo}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                  {formatDate(flashcardSet.createdAt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Study Button */}
        <View style={styles.studyButtonContainer}>
          <Button
            title="Study"
            buttonStyle={[styles.studyButton, { backgroundColor: theme.colors.primary }]}
            titleStyle={[styles.studyButtonText, { color: theme.colors.buttonText }]}
            onPress={() => navigation.navigate('FlashcardStudy', { setId: flashcardSet._id })}
          />
        </View>
      </TouchableOpacity>
    </Card>
  );
};

export default function FlashcardSetsScreen() {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [order, setOrder] = useState("desc");
  const [sortBy, setSortBy] = useState("date");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all" or "mine"

  const navigation = useNavigation();
  const { userToken, user } = useAuth();
  const { theme } = useTheme();
  const { showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchFlashcardSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      const params = {
        page,
        size,
        order,
        sortBy,
        ...(debouncedSearch && { search: debouncedSearch }),
      };

      if (viewMode === "mine" && user?._id) {
        // Get user's own flashcard sets
        response = await flashcardService.getUserFlashcardSets(user._id, params);
      } else {
        // Get all flashcard sets
        response = await flashcardService.getFlashcardSets(params);
      }
      
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setFlashcardSets(result.data);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } else {
        setFlashcardSets([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      setFlashcardSets([]);
      showError('Failed to load flashcard sets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, size, order, sortBy, debouncedSearch, viewMode, user?._id]);

  useEffect(() => {
    fetchFlashcardSets();
  }, [fetchFlashcardSets]);

  const handleNextPage = () => {
    if (page < totalPages) setPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFlashcardSets();
  }, [fetchFlashcardSets]);

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

  const renderFlashcardSetItem = ({ item }) => (
    <FlashcardSetCard
      flashcardSet={item}
      navigation={navigation}
      theme={theme}
      showOwnerInfo={viewMode === "all"}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
        Flashcard Sets
      </Text>
      <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
        {total} flashcard set{total !== 1 ? "s" : ""} available
      </Text>
    </View>
  );

  const renderControls = () => (
    <View style={[styles.controlsContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
      {/* Create Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateFlashcardSet')}
      >
        <Ionicons name="add" size={20} color={theme.colors.buttonText} />
        <Text style={[styles.createButtonText, { color: theme.colors.buttonText }]}>
          Create Set
        </Text>
      </TouchableOpacity>

      {/* Search Bar */}
      <SearchBar
        platform="default"
        placeholder="Search flashcard sets..."
        onChangeText={setSearch}
        value={search}
        containerStyle={styles.searchBarContainer}
        inputContainerStyle={[styles.searchBarInputContainer, { backgroundColor: theme.colors.surfaceBackground, borderColor: theme.colors.borderColor }]}
        inputStyle={[styles.searchBarInput, { color: theme.colors.text }]}
        searchIcon={{ size: 20, color: theme.colors.primary }}
        clearIcon={
          search
            ? {
                name: "close",
                onPress: () => setSearch(""),
                color: theme.colors.primary,
              }
            : null
        }
        lightTheme={false}
      />

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {/* View Mode Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>View</Text>
          <View style={styles.filterRow}>
            <FilterButton
              title="All Sets"
              isActive={viewMode === "all"}
              onPress={() => {
                setViewMode("all");
                setPage(1);
              }}
            />
            <FilterButton
              title="My Sets"
              isActive={viewMode === "mine"}
              onPress={() => {
                setViewMode("mine");
                setPage(1);
              }}
            />
          </View>
        </View>

        {/* Sort By Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Sort by</Text>
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
              title="Name"
              isActive={sortBy === "name"}
              onPress={() => {
                setSortBy("name");
                setPage(1);
              }}
            />
          </View>
        </View>

        {/* Order Filter */}
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Order</Text>
          <View style={styles.filterRow}>
            <FilterButton
              title="Newest"
              isActive={order === "desc"}
              onPress={() => {
                setOrder("desc");
                setPage(1);
              }}
            />
            <FilterButton
              title="Oldest"
              isActive={order === "asc"}
              onPress={() => {
                setOrder("asc");
                setPage(1);
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    totalPages > 1 && (
      <View style={[styles.paginationContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            { backgroundColor: theme.colors.surfaceBackground },
            (page === 1 || loading) && styles.disabledPaginationButton,
          ]}
          disabled={page === 1 || loading}
          onPress={handlePreviousPage}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={page === 1 || loading ? theme.colors.textMuted : theme.colors.text}
          />
          <Text
            style={[
              styles.paginationButtonText,
              { color: page === 1 || loading ? theme.colors.textMuted : theme.colors.text },
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <View style={[styles.pageIndicator, { backgroundColor: theme.colors.surfaceBackground }]}>
          <Text style={[styles.pageInfo, { color: theme.colors.primary }]}>
            {page} of {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            { backgroundColor: theme.colors.surfaceBackground },
            (page === totalPages || loading) && styles.disabledPaginationButton,
          ]}
          disabled={page === totalPages || loading}
          onPress={handleNextPage}
        >
          <Text
            style={[
              styles.paginationButtonText,
              { color: page === totalPages || loading ? theme.colors.textMuted : theme.colors.text },
            ]}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={page === totalPages || loading ? theme.colors.textMuted : theme.colors.text}
          />
        </TouchableOpacity>
      </View>
    )
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="layers-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        {viewMode === "mine" ? "No flashcard sets found" : "No flashcard sets available"}
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        {viewMode === "mine" 
          ? "Create your first flashcard set to start learning!"
          : search
          ? "Try adjusting your search terms"
          : "Check back later for new flashcard sets"
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading flashcard sets..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderControls()}

      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          </View>
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>Oops! Something went wrong</Text>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchFlashcardSets}>
            <Ionicons name="refresh" size={20} color={theme.colors.buttonText} />
            <Text style={[styles.retryButtonText, { color: theme.colors.buttonText }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : flashcardSets.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={flashcardSets}
          keyExtractor={(item) => item._id}
          renderItem={renderFlashcardSetItem}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={renderFooter}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    backgroundColor: '#202020',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#202020',
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
    fontFamily: 'Mulish-Medium',
  },
  controlsContainer: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  createButtonText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    marginLeft: 8,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    borderTopWidth: 0,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  searchBarInputContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
    height: 50,
  },
  searchBarInput: {
    color: '#fff',
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
    color: '#aaa',
    fontFamily: 'Mulish-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#444',
  },
  activeFilterButton: {
    backgroundColor: '#4CC2FF',
    borderColor: '#4CC2FF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'Mulish-Medium',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  listContainer: {
    paddingVertical: 16,
    paddingBottom: 100, // Extra padding at bottom for better scrolling
    flexGrow: 1,
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
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorText: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    marginLeft: 4,
    color: '#aaa',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  disabledPaginationButton: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
  },
  pageIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  pageInfo: {
    fontSize: 14,
    fontFamily: 'Mulish-Bold',
    color: '#4CC2FF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Mulish-Regular',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorIcon: {
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Mulish-Regular',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4CC2FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
}); 