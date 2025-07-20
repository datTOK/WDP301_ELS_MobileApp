import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, flashcardSetService, apiUtils } from '../services';

const { width, height } = Dimensions.get('window');

export default function FlashcardStudyScreen() {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardVisible, setCardVisible] = useState(true);

  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showError, showSuccess } = useToast();
  const globalStyles = createGlobalStyles(theme);

  // Animation values
  const flipAnim = new Animated.Value(0);
  const cardOpacity = new Animated.Value(1);

  const fetchFlashcardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching flashcard data for setId:', setId);
      
      // Fetch flashcard set details
      const setResponse = await flashcardSetService.getFlashcardSetById(setId);
      const setResult = apiUtils.parseResponse(setResponse);
      console.log('Flashcard set response:', setResult);
      setFlashcardSet(setResult.flashcardSet);

      // Fetch all flashcards for this set
      const cardsResponse = await flashcardService.getFlashcards(setId, {
        page: 1,
        size: 100,
        order: 'asc',
        sortBy: 'date'
      });
      const cardsResult = apiUtils.parseResponse(cardsResponse);
      console.log('Flashcards response:', cardsResult);
      
      if (cardsResult.data && Array.isArray(cardsResult.data)) {
        setFlashcards(cardsResult.data);
      } else {
        setFlashcards([]);
        showError('No flashcards found in this set');
      }

    } catch (err) {
      console.error('Error fetching flashcard data:', err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setFlashcards([]);
      showError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashcardData();
  }, [setId]);

  const flipCard = useCallback(() => {
    setFlipped(!flipped);
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  }, [flipped, flipAnim]);

  const handleCardNavigation = useCallback((newIndex) => {
    if (newIndex < 0 || newIndex >= flashcards.length) return;
    
    setCardVisible(false);
    setFlipped(false);
    flipAnim.setValue(0);
    
    Animated.timing(cardOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIndex(newIndex);
      setCardVisible(true);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [flashcards.length, flipAnim, cardOpacity]);

  const goToNextCard = useCallback(() => {
    handleCardNavigation(currentIndex + 1);
  }, [currentIndex, handleCardNavigation]);

  const goToPrevCard = useCallback(() => {
    handleCardNavigation(currentIndex - 1);
  }, [currentIndex, handleCardNavigation]);

  // Card flip interpolation
  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading flashcards..." />;
  }

  if (error || flashcards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor="#202020" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Flashcards</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Error State */}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
          <Text style={styles.errorTitle}>No Flashcards Available</Text>
          <Text style={styles.errorText}>
            {error || 'This flashcard set is empty. Please add some flashcards first.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#202020" />
      
      {/* Header with gradient background */}
      <View style={styles.headerSection}>
        <View style={styles.headerGradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {flashcardSet?.name || 'Flashcard Study'}
              </Text>
              {flashcardSet?.user && (
                <View style={styles.authorInfo}>
                  <Text style={styles.authorText}>
                    by {flashcardSet.user.username}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => navigation.navigate('FlashcardSetDetail', { setId })}
            >
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Navigation and Card Container */}
        <View style={styles.cardContainer}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentIndex === 0 && styles.navButtonDisabled
            ]}
            onPress={goToPrevCard}
            disabled={currentIndex === 0}
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={currentIndex === 0 ? "#666" : "#fff"} 
            />
          </TouchableOpacity>

          {/* Flashcard */}
          <Animated.View 
            style={[
              styles.flashcardContainer,
              { opacity: cardOpacity }
            ]}
          >
            <TouchableOpacity
              style={styles.flashcardTouchable}
              onPress={flipCard}
              activeOpacity={0.9}
            >
              <View style={styles.flashcard}>
                {/* Front Side */}
                <Animated.View
                  style={[
                    styles.cardSide,
                    styles.cardFront,
                    frontAnimatedStyle
                  ]}
                >
                  <Text style={styles.cardText}>
                    {currentCard?.englishContent}
                  </Text>
                  <View style={styles.flipHint}>
                    <Ionicons name="refresh-outline" size={16} color="#aaa" />
                    <Text style={styles.flipHintText}>Tap to flip</Text>
                  </View>
                </Animated.View>

                {/* Back Side */}
                <Animated.View
                  style={[
                    styles.cardSide,
                    styles.cardBack,
                    backAnimatedStyle
                  ]}
                >
                  <Text style={styles.cardText}>
                    {currentCard?.vietnameseContent}
                  </Text>
                  <View style={styles.flipHint}>
                    <Ionicons name="refresh-outline" size={16} color="#aaa" />
                    <Text style={styles.flipHintText}>Tap to flip</Text>
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              currentIndex === flashcards.length - 1 && styles.navButtonDisabled
            ]}
            onPress={goToNextCard}
            disabled={currentIndex === flashcards.length - 1}
          >
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={currentIndex === flashcards.length - 1 ? "#666" : "#fff"} 
            />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {currentIndex + 1} of {flashcards.length}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsSection}>
          <Text style={styles.instructionsText}>
            Tap the card to flip • Swipe or use arrows to navigate
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  headerSection: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  headerGradient: {
    backgroundColor: '#232526',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    color: '#aaa',
  },
  infoButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  placeholder: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 40,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#373737',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  navButtonDisabled: {
    backgroundColor: '#2a2a2a',
    opacity: 0.5,
  },
  prevButton: {
    marginRight: 20,
  },
  nextButton: {
    marginLeft: 20,
  },
  flashcardContainer: {
    flex: 1,
    maxWidth: 320,
    aspectRatio: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashcardTouchable: {
    width: '100%',
    height: '100%',
  },
  flashcard: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardSide: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  cardFront: {
    backgroundColor: '#232526',
  },
  cardBack: {
    backgroundColor: '#414345',
  },
  cardText: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  flipHint: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  flipHintText: {
    fontSize: 12,
    fontFamily: 'Mulish-Medium',
    color: '#aaa',
    marginLeft: 4,
  },
  progressSection: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  progressInfo: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#404040',
    minWidth: 200,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    width: 120,
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CC2FF',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    color: '#aaa',
  },
  controlsSection: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#4CC2FF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    color: '#fff',
  },
}); 