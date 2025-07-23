import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  RefreshControl,
} from "react-native";
import { Card, Button, Icon, Overlay, Chip } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { lessonService, userLessonService, userExerciseService, exerciseService, testService, apiUtils } from "../services";

const ExerciseItem = ({
  exercise,
  onSubmission,
  onExerciseCompleted,
  isLessonCompleted = false,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackExplanation, setFeedbackExplanation] = useState("");

  const { userToken } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();

  // Reset exercise state when exercise changes
  useEffect(() => {
    if (isLessonCompleted) {
      // If lesson is completed, show all exercises as completed
      setUserAnswer(exercise.answer[0] || exercise.answer);
      setSelectedOption(exercise.answer[0] || exercise.answer);
      setIsSubmitted(true);
      setIsCorrect(true);
      setShowFeedback(false);
      setShowAnswer(false);
    } else {
      setUserAnswer("");
      setSelectedOption("");
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowFeedback(false);
      setShowAnswer(false);
    }
  }, [exercise._id, isLessonCompleted]);

  // const validateAnswer = (userAnswer, correctAnswer) => {
  //   if (Array.isArray(correctAnswer)) {
  //     return correctAnswer.some(
  //       (answer) =>
  //         userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
  //     );
  //   }
  //   return (
  //     userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
  //   );
  // };

  const checkAnswer = async () => {
    if (!userAnswer.trim() && !selectedOption) {
      showError('Please provide an answer before submitting.');
      return;
    }

    setIsSubmitting(true);

    // Local validation for immediate feedback
    const isAnswerCorrect =
      exercise.options && exercise.options.length > 0
        ? selectedOption === exercise.answer[0]
        : userAnswer.trim().toLowerCase() === exercise.answer[0].toLowerCase();

    const answer =
      exercise.options && exercise.options.length > 0
        ? selectedOption
        : userAnswer.trim();

    try {
      const response = await userExerciseService.submitExercise({
        id: exercise._id,
        answer: answer,
      });
      
      const result = apiUtils.parseResponse(response);

      if (result.data && result.message === "Correct answer") {
        setIsCorrect(true);
        setIsSubmitted(true);
        setShowFeedback(true);
        setFeedbackMessage(result.message);
        // Try to get explanation from result, fallback to exercise.explanation
        setFeedbackExplanation(
          result.data.userExercise?.exercise?.explanation ||
            result.data.explanation ||
            exercise.explanation ||
            ""
        );

        if (onSubmission) {
          onSubmission(exercise._id, result.data.isCorrect);
        }

        if (onExerciseCompleted) {
          onExerciseCompleted(exercise._id, true);
        }

        // Hide feedback after 3 seconds
        setTimeout(() => setShowFeedback(false), 3000);
      } else {
        setIsCorrect(false);
        setIsSubmitted(true);
        setShowFeedback(true);
        setFeedbackMessage("Incorrect");
        // Try to get explanation from result, fallback to exercise.explanation
        setFeedbackExplanation(
          result.data.userExercise?.exercise?.explanation ||
            result.data.explanation ||
            exercise.explanation ||
            ""
        );
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError(errorInfo.message);
      // Show local validation result even if API fails
      if (onExerciseCompleted) {
        onExerciseCompleted(exercise._id, isAnswerCorrect);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetExercise = () => {
    setUserAnswer("");
    setSelectedOption("");
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowFeedback(false);
    setShowAnswer(false);
    if (onExerciseCompleted) {
      onExerciseCompleted(exercise._id, false); // Reset completion status
    }
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={exerciseItemStyles.container}>
      {isLessonCompleted && (
        <View style={exerciseItemStyles.completedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          <Text style={exerciseItemStyles.completedIndicatorText}>
            Lesson Completed - Review Mode
          </Text>
        </View>
      )}
      <View style={exerciseItemStyles.questionContainer}>
        <Text style={exerciseItemStyles.questionText}>{exercise.question}</Text>
      </View>

      {exercise.options && exercise.options.length > 0 ? (
        <View style={exerciseItemStyles.optionsContainer}>
          {exercise.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                exerciseItemStyles.optionButton,
                selectedOption === option && exerciseItemStyles.selectedOption,
                isSubmitted &&
                  option === exercise.answer[0] &&
                  exerciseItemStyles.correctOption,
                isSubmitted &&
                  selectedOption === option &&
                  option !== exercise.answer[0] &&
                  exerciseItemStyles.incorrectOption,
              ]}
              onPress={() =>
                !isSubmitted && !isLessonCompleted && setSelectedOption(option)
              }
              disabled={isSubmitted || isLessonCompleted}
            >
              <Text
                style={[
                  exerciseItemStyles.optionText,
                  selectedOption === option &&
                    exerciseItemStyles.selectedOptionText,
                  isSubmitted &&
                    option === exercise.answer[0] &&
                    exerciseItemStyles.correctOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={exerciseItemStyles.textInputContainer}>
          <TextInput
            style={[
              exerciseItemStyles.textInput,
              isSubmitted && isCorrect && exerciseItemStyles.correctInput,
              isSubmitted && !isCorrect && exerciseItemStyles.incorrectInput,
            ]}
            placeholder="Type your answer here..."
            placeholderTextColor="#888"
            value={userAnswer}
            onChangeText={setUserAnswer}
            editable={!isSubmitted && !isLessonCompleted}
            multiline={false}
          />
        </View>
      )}

      {showFeedback && (
        <View
          style={[
            exerciseItemStyles.feedbackContainer,
            isCorrect
              ? exerciseItemStyles.correctFeedback
              : exerciseItemStyles.incorrectFeedback,
          ]}
        >
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "close-circle"}
            size={24}
            color={isCorrect ? "#28a745" : "#dc3545"}
          />
          <View>
            <Text
              style={[
                exerciseItemStyles.feedbackText,
                isCorrect
                  ? exerciseItemStyles.correctFeedbackText
                  : exerciseItemStyles.incorrectFeedbackText,
              ]}
            >
              {feedbackMessage}
            </Text>
            {feedbackExplanation ? (
              <Text style={exerciseItemStyles.explanationText}>
                Explanation: {feedbackExplanation}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      <View style={exerciseItemStyles.actionButtons}>
        {!isSubmitted ? (
          <>
            <Button
              title={isSubmitting ? "Submitting..." : "Submit Answer"}
              buttonStyle={exerciseItemStyles.submitButton}
              titleStyle={exerciseItemStyles.submitButtonText}
              onPress={checkAnswer}
              disabled={
                isSubmitting ||
                (!userAnswer.trim() && !selectedOption) ||
                isLessonCompleted
              }
            />
            <Button
              title="See Answer"
              buttonStyle={exerciseItemStyles.seeAnswerButton}
              titleStyle={exerciseItemStyles.seeAnswerButtonText}
              onPress={toggleAnswer}
            />
          </>
        ) : (
          <View style={exerciseItemStyles.postSubmissionButtons}>
            <Button
              title="Try Again"
              buttonStyle={exerciseItemStyles.tryAgainButton}
              titleStyle={exerciseItemStyles.tryAgainButtonText}
              onPress={resetExercise}
              disabled={isLessonCompleted}
            />
            <Button
              title="See Answer"
              buttonStyle={exerciseItemStyles.seeAnswerButton}
              titleStyle={exerciseItemStyles.seeAnswerButtonText}
              onPress={toggleAnswer}
            />
          </View>
        )}
      </View>

      {showAnswer && (
        <View style={exerciseItemStyles.answerContainer}>
          <Text style={exerciseItemStyles.answerText}>
            Correct Answer:{" "}
            {Array.isArray(exercise.answer)
              ? exercise.answer.join(", ")
              : exercise.answer}
          </Text>
          {exercise.explanation && (
            <Text style={exerciseItemStyles.explanationText}>
              Explanation: {exercise.explanation}
            </Text>
          )}
        </View>
      )}

      {showFeedback && (
        <View style={exerciseItemStyles.answerContainer}>
          <Text style={exerciseItemStyles.answerText}>
            Correct Answer:{" "}
            {Array.isArray(exercise.answer)
              ? exercise.answer.join(", ")
              : exercise.answer}
          </Text>
          {exercise.explanation && (
            <Text style={exerciseItemStyles.explanationText}>
              Explanation: {exercise.explanation}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId, lessonId, lessonName } = route.params;
  const { userToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState("vocabulary");
  const [lesson, setLesson] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [completedExercises, setCompletedExercises] = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userLesson, setUserLesson] = useState(null);
  const { showError, showSuccess, showWarning } = useToast();

  // State for modal navigation
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'grammar' | 'vocab' | 'exercise'
  const [modalIndex, setModalIndex] = useState(0);

  // Open modal for a specific item type and index
  const openModal = (type, index) => {
    setModalType(type);
    setModalIndex(index);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

  // Reset modal state when navigating between items
  useEffect(() => {
    if (modalVisible) {
      // Reset any modal-specific state here if needed
    }
  }, [modalIndex, modalType]);

  // Track exercise completion for current lesson
  const handleExerciseCompletion = (exerciseId, isCorrect) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [exerciseId]: isCorrect,
    }));
  };

  // Check if all exercises in current lesson are completed correctly
  const isLessonFullyCompleted = () => {
    if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
      return true; // No exercises means lesson is complete
    }

    const totalExercises = lesson.exercises.length;
    const correctExercises = Object.values(completedExercises).filter(
      (correct) => correct
    ).length;

    return correctExercises === totalExercises;
  };

  // Mark lesson as completed (only if all exercises are correct)
  const markLessonCompleted = async (lessonId) => {
    console.log("Lesson ID: ", lessonId);

    // Check if lesson is already completed from API
    if (userLesson?.completed) {
      showWarning('This lesson has already been completed. You can review the content but cannot mark it as completed again.');
      return;
    }

    if (!isLessonFullyCompleted()) {
      showWarning('Please complete all exercises correctly before marking this lesson as completed.');
      return;
    }

    try {
      // Get the user lesson record first
      const lessonResponse = await userLessonService.getUserLessonByLessonId(lessonId);
      console.log(lessonResponse)
      if (!lessonResponse.userLesson?._id) {
        showError('Unable to update lesson progress. Please try again.');
        return;
      }

      // Update the lesson status to completed
      const response = await userLessonService.updateUserLessonStatus(
        lessonResponse.userLesson._id,
        "completed"
      );

      if (response && response.userLesson) {
        // Update local state
        setCompletedLessons((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
        setUserLesson(prev => ({ ...prev, completed: true, status: "completed" }));
        showSuccess('Lesson completed! You can now proceed to the next lesson.');
      } else {
        showError('Failed to update lesson status. Please try again.');
      }
    } catch (error) {
      console.log("Error updating lesson status:", error);
      showError('Failed to update lesson progress. Please try again.');
    }
  };

  // Fetch or create user lesson record, then fetch userLesson data
  const fetchLessonDetails = async () => {
    setLoading(!refreshing);
    setError(null);
    try {
      console.log("Fetching lesson details for lessonId:", lessonId);

      // Just fetch userLesson (do not create)
      try {
        const response = await userLessonService.getUserLessonByLessonId(lessonId);
        const result = apiUtils.parseResponse(response);
        setUserLesson(result.data.userLesson || null);
      } catch (error) {
        setUserLesson(null);
      }

      // Fetch lesson data sequentially
      const lessonResponse = await lessonService.getLessonById(lessonId);
      
      if (!lessonResponse) {
        throw new Error("Failed to fetch lesson details");
      }
      
      const grammarResponse = await lessonService.getLessonGrammars(lessonId);
      
      if (!grammarResponse) {
        throw new Error("Failed to fetch grammar details");
      }
      
      const vocabResponse = await lessonService.getLessonVocabulary(lessonId);
      
      if (!vocabResponse) {
        throw new Error("Failed to fetch vocabulary details");
      }
      
      const exerciseResponse = await exerciseService.getExercisesByLessonId(lessonId);
      
      if (!exerciseResponse) {
        throw new Error("Failed to fetch exercise details");
      }
      
      const testsResponse = await testService.getTestsByCourseId(courseId);
      
      if (!testsResponse) {
        throw new Error("Failed to fetch test details");
      }

      if (exerciseResponse.data && exerciseResponse.data.length > 0) {
        const progress = {};
        await Promise.all(
          exerciseResponse.data.map(async (e) => {
            try {
              const response = await userExerciseService.getUserExerciseByExerciseId(e._id);
              const userExercise = response.userExercise;
              progress[e._id] = userExercise.completed === true;            
            } catch (err) {
              progress[e._id] = false;
            }
          })
        );
        setCompletedExercises(progress);
      }
      const lessonWithDetails = {
        ...lessonResponse,
        grammars: grammarResponse.data || [],
        vocabularies: vocabResponse.data || [],
        exercises: exerciseResponse.data || [],
      };

      setLesson(lessonWithDetails);
      setTests(testsResponse.data || []);
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message || "Failed to load lesson details. Please try again later.");
      showError(errorInfo.message || "Failed to load lesson details. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchLessonDetails();
  };

  useEffect(() => {
    if (lessonId) {
      fetchLessonDetails();
    }
  }, [lessonId, userToken]);

  // Render chips for a section
  const renderChips = (items, type, label, color) => (
    <View style={styles.chipSection}>
      <Text style={styles.chipSectionTitle}>{label}</Text>
      <View style={styles.chipRow}>
        {items.length > 0 ? (
          items.map((item, idx) => (
            <Chip
              key={idx}
              title={
                type === "grammar"
                  ? item.title
                  : type === "vocab"
                  ? item.englishContent
                  : item.question || `Practice ${idx + 1}`
              }
              buttonStyle={[styles.chipButton, { backgroundColor: color }]}
              titleStyle={styles.chipTitle}
              onPress={() => openModal(type, idx)}
              icon={{
                name:
                  type === "grammar"
                    ? "book"
                    : type === "vocab"
                    ? "globe"
                    : "edit",
                type: "feather",
                color: "#fff",
                size: 16,
              }}
            />
          ))
        ) : (
          <Text style={styles.itemText}>
            No {label.toLowerCase()} available
          </Text>
        )}
      </View>
    </View>
  );

  const renderTabsItem = (items, type) => (
    <>
      {items.length > 0 ? (
        <>
          {items.map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              style={[styles.itemButtonLight]}
              onPress={() => openModal(type, idx)}
            >
              <View style={styles.itemContent}>
              <View style={styles.itemLeft}>
                  <View style={[styles.itemIcon]}>
                    <Ionicons name={"play"} size={16} color={"#2563EB"} />
                  </View>
                  <View>
                    <Text style={[styles.itemTitleLight]}>
                      {type === "grammar"
                        ? item.title
                        : type === "vocab"
                        ? item.englishContent
                        : `Practice ${idx + 1}`}
                    </Text>
                    <Text style={[styles.itemStatus]}>{"Ready to start"}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <Text style={styles.itemText}>No content available</Text>
      )}
    </>
  );
  
  const renderTabs = (activeTab, setActiveTab, tabData = []) => {
    const tabs = [
      { key: "grammar", label: "Grammar", icon: "book-outline" },
      { key: "vocabulary", label: "Vocabulary", icon: "library-outline" },
      { key: "practice", label: "Practice", icon: "fitness-outline" },
    ];

    return (
      <View style={enhancedTabStyles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const itemCount = tabData[tab.key]?.length || 0;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                enhancedTabStyles.tabButton,
                isActive
                  ? enhancedTabStyles.activeTab
                  : enhancedTabStyles.inactiveTab,
                itemCount > 0 && enhancedTabStyles.tabWithBadge,
              ]}
              activeOpacity={0.7}
            >
              <View style={enhancedTabStyles.tabContent}>
                <Ionicons 
                  name={tab.icon} 
                  size={18} 
                  color={isActive ? "#fff" : "#b0b8c1"} 
                  style={{ marginRight: 6 }} 
                />
                <Text
                  style={[
                    enhancedTabStyles.tabText,
                    isActive && enhancedTabStyles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>

              {/* Badge for item count */}
              {itemCount > 0 && (
                <View style={enhancedTabStyles.tabBadge}>
                  <Text style={enhancedTabStyles.tabBadgeText}>
                    {itemCount > 99 ? "99+" : itemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  // Render modal content for the selected item
  const renderModalContent = () => {
    if (!modalType || !lesson) {
      return <Text style={styles.itemText}>No content available</Text>;
    }
    let items = [];

    if (modalType === "grammar") items = lesson.grammars;
    if (modalType === "vocab") items = lesson.vocabularies;
    if (modalType === "exercise") items = lesson.exercises;
    if (!items[modalIndex]) {
      return <Text style={styles.itemText}>No content available</Text>;
    }

    const item = items[modalIndex];

    const handleExerciseSubmission = (exerciseId, isCorrect) => {
      console.log("Exercise submitted:", exerciseId, "Correct:", isCorrect);
      // You can add logic here to track progress
    };

    return (
      <View style={styles.modalContent}>
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalNavRow}>
            <TouchableOpacity
              disabled={modalIndex === 0}
              onPress={() => setModalIndex((i) => Math.max(0, i - 1))}
            >
              <Ionicons
                name="arrow-back-circle"
                size={32}
                color={modalIndex === 0 ? "#ccc" : "#007AFF"}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalType === "grammar"
                ? item.title
                : modalType === "vocab"
                ? item.englishContent
                : `Practice ${modalIndex + 1}`}
            </Text>
            <TouchableOpacity
              disabled={modalIndex === items.length - 1}
              onPress={() =>
                setModalIndex((i) => Math.min(items.length - 1, i + 1))
              }
            >
              <Ionicons
                name="arrow-forward-circle"
                size={32}
                color={modalIndex === items.length - 1 ? "#ccc" : "#007AFF"}
              />
            </TouchableOpacity>
          </View>
          {modalType === "grammar" && (
            <View style={styles.modalBody}>
              <Text style={[styles.itemText, { color: "#fff" }]}>Structure: {item.structure}</Text>
              <Text style={[styles.itemText, { color: "#fff" }]}>Example: {item.example}</Text>
              <Text style={[styles.itemText, { color: "#fff" }]}>
                Explanation: {item.explanation}
              </Text>
            </View>
          )}
          {modalType === "vocab" && (
            <View style={styles.modalBody}>
              <Text style={[styles.itemText, { color: "#fff" }]}>
                Vietnamese: {item.vietnameseContent}
              </Text>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              )}
            </View>
          )}
          {modalType === "exercise" && (
            <View style={styles.modalBody}>
              <ExerciseItem
                exercise={item}
                onSubmission={handleExerciseSubmission}
                onExerciseCompleted={handleExerciseCompletion}
                isLessonCompleted={userLesson?.completed}
              />
            </View>
          )}
          <Button
            title="Close"
            onPress={closeModal}
            buttonStyle={styles.closeModalButton}
          />
        </ScrollView>
      </View>
    );
  };

  // Main lesson content area
  const renderLessonContent = () => (
    <ScrollView
      style={styles.lessonContentContainer}
      contentContainerStyle={styles.lessonContentScrollContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Lesson Completed Banner Section */}
      {userLesson?.completed && (
        <View style={styles.lessonCompletedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.lessonCompletedText}>
            Lesson Completed - Review Mode
          </Text>
        </View>
      )}

      {/* Main Content Section */}
      <Card containerStyle={styles.cardDark}>
        {renderTabs(activeTab, setActiveTab)}
        {activeTab === "vocabulary" &&
          renderTabsItem(lesson.vocabularies, "vocab")}
        {activeTab === "grammar" && renderTabsItem(lesson.grammars, "grammar")}
        {activeTab === "practice" &&
          renderTabsItem(lesson.exercises, "exercise")}

        {/* Progress indicator for exercises */}
        {lesson.exercises && lesson.exercises.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Exercises Progress:{" "}
              {userLesson?.completed
                ? lesson.exercises.length
                : Object.values(completedExercises).filter((correct) => correct)
                    .length}{" "}
              / {lesson.exercises.length} completed
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      userLesson?.completed
                        ? 100
                        : (Object.values(completedExercises).filter(
                            (correct) => correct
                          ).length /
                            lesson.exercises.length) *
                          100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </Card>

      {/* Action Button Section */}
      <TouchableOpacity
        style={[
          userLesson?.completed 
            ? styles.completedButton 
            : isLessonFullyCompleted()
            ? styles.completeButton
            : styles.incompleteButton
        ]}
        onPress={() => markLessonCompleted(lessonId)}
        disabled={userLesson?.completed || !isLessonFullyCompleted()}
      >
        <Text
          style={[
            userLesson?.completed 
              ? styles.completedButtonText 
              : isLessonFullyCompleted()
              ? styles.completeButtonText
              : styles.incompleteButtonText
          ]}
        >
          {userLesson?.completed
            ? "Lesson Completed"
            : isLessonFullyCompleted()
            ? "Mark as Completed"
            : "Complete All Exercises"}
        </Text>
      </TouchableOpacity>

      {/* Modal Section */}
      {Platform.OS === "web" ? (
        <Overlay
          isVisible={modalVisible}
          onBackdropPress={closeModal}
          overlayStyle={styles.modalOverlay}
          fullScreen={false}
        >
          <View style={styles.modalContainer}>{renderModalContent()}</View>
        </Overlay>
      ) : (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeModal}
        >
          <View style={styles.nativeModalOverlay}>
            <View style={styles.nativeModalContainer}>
              {renderModalContent()}
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading lesson..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.errorContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLessonDetails}>
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Content */}
      {lesson && renderLessonContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container (dark background)
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  // Main app container (light background)
  containerLight: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  // Card or section with dark background
  cardDark: {
    borderRadius: 20,
    margin: 12,
    padding: 18,
    backgroundColor: "#23272f",
    borderColor: "#23272f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: "100%",
  },
  // Header (dark)
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#181818",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  // Header (light)
  headerLight: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    position: "absolute",
    top: 24,
    left: 16,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  headerTitleDark: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  headerTitleLight: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
  },
  lessonContentContainer: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    width: "100%",
  },
  lessonContentScrollContainer: {
    flexGrow: 1,
    paddingTop: 80,
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginLeft: 10,
  },
  item: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  itemTitleDark: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  itemTitleLight: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  itemText: {
    fontSize: 16,
    color: "#AAA",
    marginTop: 5,
  },
  image: {
    width: "100%",
    height: 150,
    marginTop: 5,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    color: "#007AFF",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 32,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 22,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  errorText: {
    color: "#AAA",
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Mulish-Regular",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CC2FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  testSection: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  testSectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: "#333",
    fontFamily: "Mulish-Bold",
  },
  testCard: {
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#2a2a2a",
    borderColor: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  testTitle: {
    fontSize: 18,
    marginBottom: 5,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  testDescription: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 10,
    fontFamily: "Mulish-Regular",
  },
  testInfo: {
    fontSize: 16,
    marginBottom: 10,
    color: "#ccc",
    fontFamily: "Mulish-Regular",
  },
  testButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
  },
  testButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  textInput: {
    backgroundColor: "#444",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  selectedOption: {
    backgroundColor: "#007AFF",
  },
  correctOption: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  optionText: {
    color: "#fff",
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  correctOptionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  checkButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  checkButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemButtonLight: {
    backgroundColor: "#2b2b2b",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#333",
  },
  itemButtonDark: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#2a2a2a",
  },
  completedItem: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  lockedItem: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    opacity: 0.6,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e6f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  completedIcon: {
    backgroundColor: "#DCFCE7",
  },
  lockedIcon: {
    backgroundColor: "#E5E7EB",
  },
  itemStatus: {
    fontSize: 13,
    color: "#AAA",
    fontWeight: "500",
  },
  lockedText: {
    color: "#9CA3AF",
  },
  lockedStatusText: {
    color: "#D1D5DB",
  },
  chipSection: {
    marginTop: 15,
    marginBottom: 5,
    width: "100%",
  },
  chipSectionTitle: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  chipButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipTitle: {
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  modalOverlay: {
    width: "90%",
    height: "80%",
    borderRadius: 16,
    padding: 0,
    backgroundColor: "#222",
    alignSelf: "center",
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalContent: {
    flex: 1,
    width: "100%",
  },
  modalNavRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 18,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 10,
    fontFamily: "Mulish-Bold",
  },
  modalBody: {
    marginBottom: 15,
    width: "100%",
    paddingHorizontal: 10,
  },
  closeModalButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    marginTop: 10,
  },
  progressContainer: {
    marginTop: 15,
    marginBottom: 10,
    width: "100%",
    paddingHorizontal: 10,
  },
  progressText: {
    fontSize: 14,
    color: "#AAA",
    marginBottom: 5,
    textAlign: "center",
    fontFamily: "Mulish-Regular",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#444",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  lessonCompletedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    padding: 12,
    margin: 10,
    borderRadius: 8,
  },
  lessonCompletedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  nativeModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  nativeModalContainer: {
    width: "90%",
    height: "80%",
    backgroundColor: "#222",
    borderRadius: 16,
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
});

// Enhanced and improved tab styles
const enhancedTabStyles = {
  // Main container for the entire tab section
  tabSection: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    margin: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },

  // Tab Container - more refined
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#181c22",
    borderRadius: 14,
    padding: 5,
    marginBottom: 18,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  // Individual Tab Button - improved proportions
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
marginHorizontal: 0.5,
    minHeight: 48,
  },

  // Active Tab - more prominent
  activeTab: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },

  // Inactive Tab
  inactiveTab: {
    backgroundColor: "transparent",
  },

  // Tab content container
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Tab icon
  tabIcon: {
    fontSize: 14,
    marginRight: 6,
  },

  // Tab Text - better typography
  tabText: {
    fontSize: 15,
    color: "#b0b8c1",
    textAlign: "center",
    fontFamily: "Mulish-SemiBold",
  },

  // Active Tab Text
  activeTabText: {
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },

  // Improved badge styling
  tabBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 14,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#23272f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  tabBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Mulish-Bold",
  },

  // Items container
  itemsContainer: {
    gap: 10, // Consistent spacing between items
  },

  // Enhanced item styling
  itemButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },

  // Item content layout
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  // Enhanced icon container
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // Text container
  itemTextContainer: {
    flex: 1,
    justifyContent: "center",
  },

  // Item title
  itemTitle: {
    fontSize: 16,
    color: "#111827",
    marginBottom: 2,
    fontFamily: "Mulish-SemiBold",
  },

  // Item subtitle
  itemSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Mulish-Medium",
  },

  // Start button
  startButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Mulish-SemiBold",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },

  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Mulish-Medium",
  },

  // Progress section
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },

  progressText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "Mulish-Medium",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#1a1a1a",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  // Complete button
  completeButton: {
    backgroundColor: "#10D876",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    marginHorizontal: 12,
    alignItems: "center",
    shadowColor: "#10D876",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },

  completeButtonText: {
    color: "#E6F0FF",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },

  completeButtonDisabled: {
    backgroundColor: "#6B7280",
    shadowOpacity: 0,
  },

  completeButtonTextDisabled: {
    color: "#D1D5DB",
  },
  completedButton: {
    backgroundColor: "#10D876",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    marginHorizontal: 12,
    alignItems: "center",
    shadowColor: "#10D876",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  completedButtonText: {
    color: "#E6F0FF",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  incompleteButton: {
    backgroundColor: "#10D876",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 16,
    marginHorizontal: 12,
    alignItems: "center",
    shadowColor: "#10D876",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  incompleteButtonText: {
    color: "#888",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
};

const exerciseItemStyles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  completedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  completedIndicatorText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
    fontFamily: "Mulish-Bold",
  },
  questionContainer: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  optionsContainer: {
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: "#555",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  selectedOption: {
    backgroundColor: "#007AFF",
  },
  correctOption: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: "#dc3545",
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  optionText: {
    color: "#fff",
    fontFamily: "Mulish-Regular",
  },
  selectedOptionText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Mulish-Bold",
  },
  correctOptionText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Mulish-Bold",
  },
  textInputContainer: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#444",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
    fontFamily: "Mulish-Regular",
  },
  correctInput: {
    borderColor: "#28a745",
    borderWidth: 2,
  },
  incorrectInput: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  feedbackContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#444",
  },
  correctFeedback: {
    backgroundColor: "#28a745",
  },
  incorrectFeedback: {
    backgroundColor: "#dc3545",
  },
  feedbackText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    fontFamily: "Mulish-Regular",
  },
  correctFeedbackText: {
    color: "#fff",
    fontFamily: "Mulish-Regular",
  },
  incorrectFeedbackText: {
    color: "#fff",
    fontFamily: "Mulish-Regular",
  },
  tabNavigation: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    fontFamily: "Mulish-Medium",
  },
  activeTabText: {
    color: "#111827",
    fontFamily: "Mulish-Medium",
  },
  scrollView: {
    flex: 1,
  },
  tabContentContainer: {
    gap: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },
  submitButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    flex: 1,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mulish-Bold",
  },
  postSubmissionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  tryAgainButton: {
    backgroundColor: "#6c757d",
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  tryAgainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mulish-Bold",
  },
  seeAnswerButton: {
    backgroundColor: "#6c757d",
    borderRadius: 8,
    flex: 1,
  },
  seeAnswerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Mulish-Bold",
  },
  answerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#444",
    borderRadius: 5,
  },
  answerText: {
    color: "#28a745",
    fontFamily: "Mulish-Bold",
  },
  explanationText: {
    color: "#ccc",
    marginTop: 5,
    fontFamily: "Mulish-Regular",
  },
});

export default CourseDetailScreen;
