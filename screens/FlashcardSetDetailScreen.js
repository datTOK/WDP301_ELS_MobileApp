import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { Card, Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, flashcardSetService, apiUtils } from '../services';
import * as Speech from 'expo-speech';

const { width: screenWidth } = Dimensions.get('window');

export default function FlashcardSetDetailScreen() {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const cardChangeAnimation = useRef(new Animated.Value(1)).current;

  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const fetchFlashcardSetDetails = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      console.log('Fetching flashcard set details for ID:', setId);
      
      // Fetch flashcard set details
      const setResponse = await flashcardSetService.getFlashcardSetById(setId);
      const setResult = apiUtils.parseResponse(setResponse);
      setFlashcardSet(setResult.data.flashcardSet);

      // Fetch flashcards for this set
      const cardsResponse = await flashcardService.getFlashcards(setId, {
        page: 1,
        size: 100,
        order: 'asc',
        sortBy: 'date'
      });
      const cardsResult = apiUtils.parseResponse(cardsResponse);
      setFlashcards(cardsResult.data || []);

    } catch (err) {
      console.error('Error fetching flashcard set details:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError('Failed to load flashcard set');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFlashcardSetDetails();
  }, [setId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFlashcardSetDetails(true);
  };

  const handleDeleteFlashcardSet = () => {
    Alert.alert(
      'Delete Flashcard Set',
      'Are you sure you want to delete this flashcard set? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await flashcardSetService.deleteFlashcardSet(setId);
              showSuccess('Flashcard set deleted successfully');
              navigation.goBack();
            } catch (err) {
              const errorInfo = apiUtils.handleError(err);
              showError(errorInfo.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Flashcard animation functions
  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setIsFlipped(!isFlipped);
    });
  };

  const nextCard = () => {
    if (flashcards.length === 0) return;
    
    Animated.timing(cardChangeAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      
      Animated.timing(cardChangeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const prevCard = () => {
    if (flashcards.length === 0) return;
    
    Animated.timing(cardChangeAnimation, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
      setIsFlipped(false);
      flipAnimation.setValue(0);
      
      Animated.timing(cardChangeAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Auto-cycle through cards
  useEffect(() => {
    if (flashcards.length > 1) {
      const interval = setInterval(() => {
        nextCard();
      }, 6000); // Change card every 6 seconds

      return () => clearInterval(interval);
    }
  }, [flashcards.length, currentCardIndex]);

  const isOwner = user?._id === flashcardSet?.userId;

  // Pronunciation function
  const speakText = async (text) => {
    try {
      // Stop any current speech
      await Speech.stop();
      
      // Speak the text with English pronunciation
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        quality: Speech.QUALITY_ENHANCED,
      });
    } catch (error) {
      console.error('Error speaking text:', error);
      showError('Unable to play pronunciation');
    }
  };

  // Animated Flashcard Component
  const AnimatedFlashcard = () => {
    if (flashcards.length === 0) {
      return (
        <Card containerStyle={[styles.flashcardContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
          <View style={styles.emptyFlashcard}>
            <Ionicons name="document-outline" size={48} color={theme.colors.textMuted} />
            <Text style={[styles.emptyFlashcardText, { color: theme.colors.textSecondary }]}>
              No flashcards available
            </Text>
          </View>
        </Card>
      );
    }

    const currentCard = flashcards[currentCardIndex];
    
    // Simple opacity-based animation (more reliable on mobile)
    const frontOpacity = flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0, 0],
    });

    const backOpacity = flipAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
    });

    const cardScale = cardChangeAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });

    return (
      <Card containerStyle={[styles.flashcardContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
        <View style={styles.flashcardHeader}>
          <Text style={[styles.flashcardCounter, { color: theme.colors.textMuted }]}>
            {currentCardIndex + 1} / {flashcards.length}
          </Text>
          <Text style={[styles.tapToFlipText, { color: theme.colors.textMuted }]}>
            Tap to flip
          </Text>
        </View>

                <TouchableOpacity
          style={styles.flashcardWrapper}
          onPress={flipCard}
          activeOpacity={0.9}
        >
          <Animated.View
            style={[
              styles.flashcardSide,
              {
                backgroundColor: theme.colors.primary,
                opacity: frontOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.pronunciationButton}
              onPress={(e) => {
                e.stopPropagation();
                speakText(currentCard.englishContent);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            
            <View style={styles.flashcardContent}>
              <Text style={[styles.flashcardLabel, { color: 'rgba(255,255,255,0.8)' }]}>
                English
              </Text>
              <Text style={[styles.flashcardText, { color: '#fff' }]}>
                {currentCard.englishContent}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.flashcardSide,
              {
                backgroundColor: theme.colors.secondary || '#8B5CF6',
                opacity: backOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <View style={styles.flashcardContent}>
              <Text style={[styles.flashcardLabel, { color: 'rgba(255,255,255,0.8)' }]}>
                Vietnamese
              </Text>
              <Text style={[styles.flashcardText, { color: '#fff' }]}>
                {currentCard.vietnameseContent}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {flashcards.length > 1 && (
          <View style={styles.flashcardControls}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surfaceBackground }]}
              onPress={prevCard}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.progressIndicator}>
              {flashcards.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index === currentCardIndex 
                        ? theme.colors.primary 
                        : theme.colors.borderColor
                    }
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: theme.colors.surfaceBackground }]}
              onPress={nextCard}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading flashcard set..." />;
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
        <Button
          title="Retry"
          onPress={() => {
            setError(null);
            fetchFlashcardSetDetails();
          }}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  if (!flashcardSet) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="document-outline" size={50} color={theme.colors.textMuted} />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Flashcard set not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
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
              Flashcard Set
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Flashcard Set Details */}
      <Card containerStyle={[styles.detailsCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
        <Text style={[styles.setTitle, { color: theme.colors.text }]}>
          {flashcardSet.name}
        </Text>
        
        <Text style={[styles.setDescription, { color: theme.colors.textSecondary }]}>
          {flashcardSet.description || 'No description available'}
        </Text>

        <View style={styles.setMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              {flashcardSet.user?.username || 'Unknown User'}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              Created {formatDate(flashcardSet.createdAt)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="document-outline" size={16} color={theme.colors.textMuted} />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              {flashcards.length} card{flashcards.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </Card>

      {/* Animated Flashcard */}
      <AnimatedFlashcard />

      {/* Manage Cards Button (Owner Only) */}
      {isOwner && (
        <View style={styles.actionButtons}>
          <Button
            title="Manage Cards"
            icon={{
              name: 'settings-outline',
              type: 'ionicon',
              size: 20,
              color: theme.colors.buttonText,
            }}
            buttonStyle={[styles.secondaryButton, { backgroundColor: theme.colors.surfaceBackground }]}
            titleStyle={[styles.secondaryButtonText, { color: theme.colors.text }]}
            onPress={() => navigation.navigate('FlashcardManagement', { setId: flashcardSet._id })}
          />
        </View>
      )}

      {/* Flashcards List */}
      <Card containerStyle={[styles.cardsCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
        <Text style={[styles.cardsTitle, { color: theme.colors.text }]}>
          Flashcards ({flashcards.length})
        </Text>

        {flashcards.length > 0 ? (
          flashcards.map((flashcard, index) => (
            <View key={flashcard._id} style={[styles.flashcardItem, { borderBottomColor: theme.colors.borderColor }]}>
              <View style={styles.flashcardContent}>
                <View style={styles.flashcardTextRow}>
                  <View style={styles.flashcardTexts}>
                    <Text style={[styles.flashcardFront, { color: theme.colors.text }]}>
                      {flashcard.englishContent}
                    </Text>
                    <Text style={[styles.flashcardBack, { color: theme.colors.textSecondary }]}>
                      {flashcard.vietnameseContent}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.listPronunciationButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => speakText(flashcard.englishContent)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="volume-high" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.flashcardNumber}>
                <Text style={[styles.numberText, { color: theme.colors.textMuted }]}>
                  {index + 1}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCards}>
            <Ionicons name="document-outline" size={32} color={theme.colors.textMuted} />
            <Text style={[styles.emptyCardsText, { color: theme.colors.textSecondary }]}>
              No flashcards in this set yet
            </Text>
          </View>
        )}
      </Card>

      {/* Delete Button (Owner Only) */}
      {isOwner && (
        <Card containerStyle={[styles.deleteCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
          <Button
            title="Delete Flashcard Set"
            icon={{
              name: 'trash-outline',
              type: 'ionicon',
              size: 20,
              color: '#fff',
            }}
            buttonStyle={styles.deleteButton}
            titleStyle={styles.deleteButtonText}
            onPress={handleDeleteFlashcardSet}
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
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
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
  },
  headerSpacer: {
    width: 40,
  },
  detailsCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  setTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  setDescription: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  setMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginLeft: 6,
  },
  actionButtons: {
    paddingHorizontal: 15,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 15,
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  cardsCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  cardsTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    marginBottom: 15,
  },
  flashcardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  flashcardContent: {
    flex: 1,
  },
  flashcardFront: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 4,
  },
  flashcardBack: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
  },
  flashcardNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  numberText: {
    fontSize: 12,
    fontFamily: 'Mulish-Bold',
  },
  emptyCards: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyCardsText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    marginTop: 10,
    textAlign: 'center',
  },
  deleteCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    paddingVertical: 15,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CC2FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Mulish-Bold',
    fontSize: 16,
  },
  // Animated Flashcard Styles
  flashcardContainer: {
    borderRadius: 20,
    margin: 15,
    padding: 20,
    minHeight: 280,
  },
  flashcardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  flashcardCounter: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },
  tapToFlipText: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    fontStyle: 'italic',
  },
  flashcardWrapper: {
    height: 180,
    marginBottom: 20,
    position: 'relative',
  },
  flashcardSide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  flashcardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  flashcardLabel: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.8,
  },
  flashcardText: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  flashcardControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: screenWidth * 0.5,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  emptyFlashcard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyFlashcardText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    marginTop: 12,
    textAlign: 'center',
  },
  // Pronunciation button styles
  pronunciationButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  // List item pronunciation styles
  flashcardTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flashcardTexts: {
    flex: 1,
  },
  listPronunciationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
}); 