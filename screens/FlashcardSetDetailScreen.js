import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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

export default function FlashcardSetDetailScreen() {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

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
      console.log('Flashcard set response:', setResult);
      setFlashcardSet(setResult.flashcardSet);

      // Fetch flashcards for this set
      const cardsResponse = await flashcardService.getFlashcards(setId, {
        page: 1,
        size: 100,
        order: 'asc',
        sortBy: 'date'
      });
      const cardsResult = apiUtils.parseResponse(cardsResponse);
      console.log('Flashcards response:', cardsResult);
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

  const isOwner = user?._id === flashcardSet?.userId;

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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Practice"
          icon={{
            name: 'play-outline',
            type: 'ionicon',
            size: 20,
            color: theme.colors.buttonText,
          }}
          buttonStyle={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
          titleStyle={[styles.primaryButtonText, { color: theme.colors.buttonText }]}
          onPress={() => navigation.navigate('FlashcardStudy', { setId: flashcardSet._id })}
        />

        {isOwner && (
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
        )}
      </View>

      {/* Flashcards List */}
      <Card containerStyle={[styles.cardsCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
        <Text style={[styles.cardsTitle, { color: theme.colors.text }]}>
          Flashcards ({flashcards.length})
        </Text>

        {flashcards.length > 0 ? (
          flashcards.map((flashcard, index) => (
            <View key={flashcard._id} style={[styles.flashcardItem, { borderBottomColor: theme.colors.borderColor }]}>
              <View style={styles.flashcardContent}>
                <Text style={[styles.flashcardFront, { color: theme.colors.text }]}>
                  {flashcard.englishContent}
                </Text>
                <Text style={[styles.flashcardBack, { color: theme.colors.textSecondary }]}>
                  {flashcard.vietnameseContent}
                </Text>
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
}); 