import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { Card, Button } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useConfirmation } from "../context/ConfirmationContext";
import { createGlobalStyles } from "../utils/globalStyles";
import LoadingSpinner from "../components/LoadingSpinner";
import { flashcardService, flashcardSetService, apiUtils } from "../services";
import * as Speech from "expo-speech";

const { width: screenWidth } = Dimensions.get("window");

export default function FlashcardSetDetailScreen() {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [englishContent, setEnglishContent] = useState("");
  const [vietnameseContent, setVietnameseContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Animation values
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const cardChangeAnimation = useRef(new Animated.Value(1)).current;

  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { confirmDelete } = useConfirmation();
  const globalStyles = createGlobalStyles(theme);

  const fetchFlashcardSetDetails = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    setError(null);

    try {
      // Fetch flashcard set details
      const setResponse = await flashcardService.getFlashcardSetById(setId);
      const setResult = apiUtils.parseResponse(setResponse);
      setFlashcardSet(setResult.data.flashcardSet);

      // Fetch flashcards for this set
      const cardsResponse = await flashcardService.getFlashcards(setId, {
        page: 1,
        size: 100,
        order: "asc",
        sortBy: "date",
      });
      const cardsResult = apiUtils.parseResponse(cardsResponse);
      setFlashcards(cardsResult.data || []);
    } catch (err) {
      console.error("Error fetching flashcard set details:", err);
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      showError("Failed to load flashcard set");
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
    confirmDelete(flashcardSet?.name || "this flashcard set", async () => {
      try {
        await flashcardSetService.deleteFlashcardSet(setId);
        showSuccess("Flashcard set deleted successfully");
        navigation.goBack();
      } catch (err) {
        const errorInfo = apiUtils.handleError(err);
        showError(errorInfo.message);
      }
    });
  };

  const openCreateModal = () => {
    setEditingFlashcard(null);
    setEnglishContent("");
    setVietnameseContent("");
    setCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setCreateModalVisible(false);
    setEditingFlashcard(null);
    setEnglishContent("");
    setVietnameseContent("");
  };

  const openEditModal = (flashcard) => {
    setEditingFlashcard(flashcard);
    setEnglishContent(flashcard.englishContent);
    setVietnameseContent(flashcard.vietnameseContent);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setEditingFlashcard(null);
    setEnglishContent("");
    setVietnameseContent("");
  };

  const handleCreateFlashcard = async () => {
    if (!englishContent.trim() || !vietnameseContent.trim()) {
      showError("Please fill in both English and Vietnamese content");
      return;
    }

    setSubmitting(true);

    try {
      await flashcardService.createFlashcard({
        flashcardSetId: setId,
        englishContent: englishContent.trim(),
        vietnameseContent: vietnameseContent.trim(),
      });

      showSuccess("Flashcard created successfully!");
      closeCreateModal();
      fetchFlashcardSetDetails(true); // Refresh the data
    } catch (err) {
      console.error("Error creating flashcard:", err);
      const errorInfo = apiUtils.handleError(err);
      showError(errorInfo.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditFlashcard = async () => {
    if (!englishContent.trim() || !vietnameseContent.trim()) {
      showError("Please fill in both English and Vietnamese content");
      return;
    }

    setSubmitting(true);

    try {
      await flashcardService.updateFlashcard(editingFlashcard._id, {
        englishContent: englishContent.trim(),
        vietnameseContent: vietnameseContent.trim(),
      });

      showSuccess("Flashcard updated successfully!");
      closeEditModal();
      fetchFlashcardSetDetails(true); // Refresh the data
    } catch (err) {
      console.error("Error updating flashcard:", err);
      const errorInfo = apiUtils.handleError(err);
      showError(errorInfo.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFlashcard = (flashcard) => {
    confirmDelete(`"${flashcard.englishContent}"`, async () => {
      try {
        await flashcardService.deleteFlashcard(flashcard._id);
        showSuccess("Flashcard deleted successfully!");
        fetchFlashcardSetDetails(true);
      } catch (err) {
        console.error("Error deleting flashcard:", err);
        const errorInfo = apiUtils.handleError(err);
        showError(errorInfo.message);
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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
      setCurrentCardIndex(
        (prev) => (prev - 1 + flashcards.length) % flashcards.length
      );
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
        language: "en-US",
        pitch: 1.0,
        rate: 0.8,
        quality: Speech.QUALITY_ENHANCED,
      });
    } catch (error) {
      console.error("Error speaking text:", error);
      showError("Unable to play pronunciation");
    }
  };

  // Animated Flashcard Component
  const AnimatedFlashcard = () => {
    if (flashcards.length === 0) {
      return (
        <Card
          containerStyle={[
            styles.flashcardContainer,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.borderColor,
            },
          ]}
        >
          <View style={styles.emptyFlashcard}>
            <Ionicons
              name="document-outline"
              size={48}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.emptyFlashcardText,
                { color: theme.colors.textSecondary },
              ]}
            >
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
      <Card
        containerStyle={[
          styles.flashcardContainer,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.borderColor,
          },
        ]}
      >
        <View style={styles.flashcardHeader}>
          <Text
            style={[styles.flashcardCounter, { color: theme.colors.textMuted }]}
          >
            {currentCardIndex + 1} / {flashcards.length}
          </Text>
          <Text
            style={[styles.tapToFlipText, { color: theme.colors.textMuted }]}
          >
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
              <Ionicons
                name="volume-high"
                size={20}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>

            <View style={styles.flashcardContent}>
              <Text
                style={[
                  styles.flashcardLabel,
                  { color: "rgba(255,255,255,0.8)" },
                ]}
              >
                English
              </Text>
              <Text style={[styles.flashcardText, { color: "#fff" }]}>
                {currentCard.englishContent}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.flashcardSide,
              {
                backgroundColor: theme.colors.secondary || "#8B5CF6",
                opacity: backOpacity,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <View style={styles.flashcardContent}>
              <Text
                style={[
                  styles.flashcardLabel,
                  { color: "rgba(255,255,255,0.8)" },
                ]}
              >
                Vietnamese
              </Text>
              <Text style={[styles.flashcardText, { color: "#fff" }]}>
                {currentCard.vietnameseContent}
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>

        {flashcards.length > 1 && (
          <View style={styles.flashcardControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: theme.colors.surfaceBackground },
              ]}
              onPress={prevCard}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>

            <View style={styles.progressIndicator}>
              {flashcards.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor:
                        index === currentCardIndex
                          ? theme.colors.primary
                          : theme.colors.borderColor,
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.controlButton,
                { backgroundColor: theme.colors.surfaceBackground },
              ]}
              onPress={nextCard}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text}
              />
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
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          {error}
        </Text>
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
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Ionicons
          name="document-outline"
          size={50}
          color={theme.colors.textMuted}
        />
        <Text style={[styles.errorText, { color: theme.colors.text }]}>
          Flashcard set not found
        </Text>
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
            <Text
              style={[
                globalStyles.title,
                styles.headerTitle,
                { color: theme.colors.text },
              ]}
            >
              Flashcard Set
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Flashcard Set Details */}
      <Card
        containerStyle={[
          styles.detailsCard,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.borderColor,
          },
        ]}
      >
        <Text style={[styles.setTitle, { color: theme.colors.text }]}>
          {flashcardSet.name}
        </Text>

        <Text
          style={[styles.setDescription, { color: theme.colors.textSecondary }]}
        >
          {flashcardSet.description || "No description available"}
        </Text>

        <View style={styles.setMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="person-outline"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              {flashcardSet.user?.username || "Unknown User"}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              Created {formatDate(flashcardSet.createdAt)}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="document-outline"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.metaText, { color: theme.colors.textMuted }]}>
              {flashcards.length} card{flashcards.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      </Card>

      {/* Flashcards Content */}
      {flashcards.length > 0 ? (
        <>
          {/* Animated Flashcard */}
          <AnimatedFlashcard />

          {/* Flashcards List */}
          <Card
            containerStyle={[
              styles.cardsCard,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.borderColor,
              },
            ]}
          >
            <Text style={[styles.cardsTitle, { color: theme.colors.text }]}>
              Flashcards ({flashcards.length})
            </Text>

            {flashcards.map((flashcard, index) => (
              <View
                key={flashcard._id}
                style={[
                  styles.flashcardItem,
                  { borderBottomColor: theme.colors.borderColor },
                ]}
              >
                <View style={styles.flashcardContent}>
                  <View style={styles.flashcardTextRow}>
                    <View style={styles.flashcardTexts}>
                      <Text
                        style={[
                          styles.flashcardFront,
                          { color: theme.colors.text },
                        ]}
                      >
                        {flashcard.englishContent}
                      </Text>
                      <Text
                        style={[
                          styles.flashcardBack,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        {flashcard.vietnameseContent}
                      </Text>
                    </View>
                    <View style={styles.flashcardActions}>
                      <TouchableOpacity
                        style={[
                          styles.listPronunciationButton,
                          { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => speakText(flashcard.englishContent)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="volume-high" size={16} color="#fff" />
                      </TouchableOpacity>

                      {isOwner && (
                        <>
                          <TouchableOpacity
                            style={[
                              styles.actionIconButton,
                              { backgroundColor: "rgba(76, 194, 255, 0.1)" },
                            ]}
                            onPress={() => openEditModal(flashcard)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name="pencil"
                              size={16}
                              color={theme.colors.primary}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionIconButton,
                              { backgroundColor: "rgba(255, 107, 107, 0.1)" },
                            ]}
                            onPress={() => handleDeleteFlashcard(flashcard)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash" size={16} color="#ff6b6b" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.flashcardNumber}>
                  <Text
                    style={[
                      styles.numberText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </View>
            ))}

            {/* Create Flashcard Button (Owner Only) */}
            {isOwner && (
              <View style={styles.createCardButtonContainer}>
                <Button
                  title="Create Flashcard"
                  icon={{
                    name: "add",
                    type: "ionicon",
                    size: 20,
                    color: theme.colors.buttonText,
                  }}
                  buttonStyle={[
                    styles.createCardButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  titleStyle={[
                    styles.createCardButtonText,
                    { color: theme.colors.buttonText },
                  ]}
                  onPress={openCreateModal}
                />
              </View>
            )}
          </Card>
        </>
      ) : (
        /* Empty State - No Flashcards */
        <Card
          containerStyle={[
            styles.emptyStateCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.borderColor,
            },
          ]}
        >
          <View style={styles.emptyStateContent}>
            <Ionicons
              name="document-outline"
              size={64}
              color={theme.colors.textMuted}
            />
            <Text
              style={[styles.emptyStateTitle, { color: theme.colors.text }]}
            >
              No flashcards in this set yet
            </Text>
            <Text
              style={[
                styles.emptyStateDescription,
                { color: theme.colors.textSecondary },
              ]}
            >
              Start building your flashcard collection by adding your first card
            </Text>
            {isOwner && (
              <Button
                title="Create First Flashcard"
                icon={{
                  name: "add",
                  type: "ionicon",
                  size: 20,
                  color: theme.colors.buttonText,
                }}
                buttonStyle={[
                  styles.createFirstCardButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                titleStyle={[
                  styles.createFirstCardButtonText,
                  { color: theme.colors.buttonText },
                ]}
                onPress={openCreateModal}
              />
            )}
          </View>
        </Card>
      )}

      {/* Delete Button (Owner Only) */}
      {isOwner && (
        <Card
          containerStyle={[
            styles.deleteCard,
            {
              backgroundColor: theme.colors.cardBackground,
              borderColor: theme.colors.borderColor,
            },
          ]}
        >
          <Button
            title="Delete Flashcard Set"
            icon={{
              name: "trash-outline",
              type: "ionicon",
              size: 20,
              color: "#fff",
            }}
            buttonStyle={styles.deleteButton}
            titleStyle={styles.deleteButtonText}
            onPress={handleDeleteFlashcardSet}
          />
        </Card>
      )}

      {/* Create/Edit Flashcard Modal */}
      <Modal
        visible={createModalVisible || editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={editModalVisible ? closeEditModal : closeCreateModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editModalVisible ? "Edit Flashcard" : "Create Flashcard"}
              </Text>
              <TouchableOpacity
                onPress={editModalVisible ? closeEditModal : closeCreateModal}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  English Content *
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.surfaceBackground,
                      borderColor: theme.colors.borderColor,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Enter English content..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={englishContent}
                  onChangeText={setEnglishContent}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text
                  style={[
                    styles.characterCount,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {englishContent.length}/200
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                  Vietnamese Translation *
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.surfaceBackground,
                      borderColor: theme.colors.borderColor,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Enter Vietnamese translation..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={vietnameseContent}
                  onChangeText={setVietnameseContent}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                  textAlignVertical="top"
                />
                <Text
                  style={[
                    styles.characterCount,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  {vietnameseContent.length}/200
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: theme.colors.borderColor },
                ]}
                onPress={editModalVisible ? closeEditModal : closeCreateModal}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.text },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  {
                    backgroundColor:
                      !englishContent.trim() || !vietnameseContent.trim()
                        ? theme.colors.textMuted
                        : theme.colors.primary,
                  },
                ]}
                onPress={
                  editModalVisible ? handleEditFlashcard : handleCreateFlashcard
                }
                disabled={
                  submitting ||
                  !englishContent.trim() ||
                  !vietnameseContent.trim()
                }
              >
                {submitting ? (
                  <LoadingSpinner
                    size="small"
                    color={theme.colors.buttonText}
                  />
                ) : (
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: theme.colors.buttonText },
                    ]}
                  >
                    {editModalVisible ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Mulish-Bold",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  detailsCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  setTitle: {
    fontSize: 24,
    fontFamily: "Mulish-Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  setDescription: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  setMeta: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  metaText: {
    fontSize: 14,
    fontFamily: "Mulish-Regular",
    marginLeft: 6,
  },

  cardsCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  cardsTitle: {
    fontSize: 18,
    fontFamily: "Mulish-Bold",
    marginBottom: 15,
  },
  flashcardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  flashcardContent: {
    flex: 1,
  },
  flashcardFront: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    marginBottom: 4,
  },
  flashcardBack: {
    fontSize: 14,
    fontFamily: "Mulish-Regular",
  },
  flashcardNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  numberText: {
    fontSize: 12,
    fontFamily: "Mulish-Bold",
  },
  emptyCards: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyCardsText: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    marginTop: 10,
    textAlign: "center",
  },
  deleteCard: {
    borderRadius: 12,
    margin: 15,
    padding: 20,
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingVertical: 15,
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4CC2FF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontFamily: "Mulish-Bold",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  flashcardCounter: {
    fontSize: 14,
    fontFamily: "Mulish-Medium",
  },
  tapToFlipText: {
    fontSize: 12,
    fontFamily: "Mulish-Regular",
    fontStyle: "italic",
  },
  flashcardWrapper: {
    height: 180,
    marginBottom: 20,
    position: "relative",
  },
  flashcardSide: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
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
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    width: "100%",
  },
  flashcardLabel: {
    fontSize: 12,
    fontFamily: "Mulish-Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.8,
  },
  flashcardText: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  flashcardControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  progressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    maxWidth: screenWidth * 0.5,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  emptyFlashcard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyFlashcardText: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    marginTop: 12,
    textAlign: "center",
  },
  // Pronunciation button styles
  pronunciationButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  // List item pronunciation styles
  flashcardTextRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flashcardTexts: {
    flex: 1,
  },
  flashcardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  listPronunciationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  // Empty state styles
  emptyStateCard: {
    borderRadius: 12,
    margin: 15,
    padding: 30,
  },
  emptyStateContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  createFirstCardButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 200,
  },
  createFirstCardButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  createCardButtonContainer: {
    paddingTop: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  createCardButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 180,
  },
  createCardButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  // Create Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Mulish-Bold",
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    marginBottom: 8,
  },
  textArea: {
    fontSize: 16,
    fontFamily: "Mulish-Regular",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: "Mulish-Regular",
    textAlign: "right",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  saveButton: {
    backgroundColor: "#4CC2FF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    color: "#fff",
  },
});
