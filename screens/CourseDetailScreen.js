import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { Card, Icon, Overlay, Chip } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  lessonService,
  userLessonService,
  userExerciseService,
  testService,
  apiUtils,
} from "../services";

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
  const { showError, showSuccess, showWarning } = useToast();

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
      showError("Error", "Please provide an answer before submitting.");
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

      if (response.message === "Correct answer") {
        setIsCorrect(true);
        setIsSubmitted(true);
        setShowFeedback(true);
        setFeedbackMessage(response.message);
        // Try to get explanation from result, fallback to exercise.explanation
        setFeedbackExplanation(
          response.userExercise?.exercise?.explanation || ""
        );

        // Show success toast
        showSuccess("Correct!", "Great job! Your answer is correct.");

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
          response.userExercise?.exercise?.explanation ||
            response.explanation ||
            exercise.explanation ||
            ""
        );

        // Show error toast
        showError("Incorrect", "That's not quite right. Try again!");
        
        // Still mark as completed but incorrect
        if (onExerciseCompleted) {
          onExerciseCompleted(exercise._id, false);
        }
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      showError("Error", errorInfo.message);
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
    
    // Show info toast
    showWarning("Reset", "Exercise has been reset. Try again!");
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={exerciseItemStyles.container}>
      {(isLessonCompleted || isSubmitted) && (
        <View style={exerciseItemStyles.completedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#28a745" />
          <Text style={exerciseItemStyles.completedIndicatorText}>
            {isLessonCompleted ? "Lesson Completed - Review Mode" : "Exercise Completed"}
          </Text>
        </View>
      )}
      <View style={exerciseItemStyles.questionContainer}>
        <Text style={exerciseItemStyles.questionText}>{exercise.question}</Text>
      </View>

      {/* Display exercise image if available */}
      {exercise.image && (
        <View style={exerciseItemStyles.imageContainer}>
          <Image 
            source={{ uri: exercise.image }} 
            style={exerciseItemStyles.exerciseImage}
            resizeMode="contain"
            onError={(error) => console.log('Exercise image loading error:', error)}
            onLoad={() => console.log('Exercise image loaded successfully')}
            defaultSource={require("../assets/placeholder-image.jpg")}
          />
        </View>
      )}

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
            <TouchableOpacity
              style={[
                exerciseItemStyles.submitButton,
                (isSubmitting || (!userAnswer.trim() && !selectedOption) || isLessonCompleted) && 
                exerciseItemStyles.submitButtonDisabled
              ]}
              onPress={checkAnswer}
              disabled={
                isSubmitting ||
                (!userAnswer.trim() && !selectedOption) ||
                isLessonCompleted
              }
              activeOpacity={0.7}
            >
              <Text style={exerciseItemStyles.submitButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={exerciseItemStyles.seeAnswerButton}
              onPress={toggleAnswer}
              activeOpacity={0.7}
            >
              <Text style={exerciseItemStyles.seeAnswerButtonText}>
                See Answer
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={exerciseItemStyles.postSubmissionButtons}>
            {!isCorrect ? (
              // Only show Try Again button for incorrect answers
              <TouchableOpacity
                style={[
                  exerciseItemStyles.tryAgainButton,
                  isLessonCompleted && exerciseItemStyles.tryAgainButtonDisabled
                ]}
                onPress={resetExercise}
                disabled={isLessonCompleted}
                activeOpacity={0.7}
              >
                <Text style={exerciseItemStyles.tryAgainButtonText}>
                  Try Again
                </Text>
              </TouchableOpacity>
            ) : (
              // Show only See Answer button for correct answers
              <TouchableOpacity
                style={exerciseItemStyles.seeAnswerButton}
                onPress={toggleAnswer}
                activeOpacity={0.7}
              >
                <Text style={exerciseItemStyles.seeAnswerButtonText}>
                  See Answer
                </Text>
              </TouchableOpacity>
            )}
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
  const { courseId, lessonId, lessonName, updateLessonStatus } = route.params;
  // console.log("Course ID: ", courseId);
  // console.log("Lesson ID: ", lessonId);
  // console.log("Lesson Name: ", lessonName);
  // console.log("Update Lesson Status: ", updateLessonStatus);
  const { userToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState("vocabulary");
  const [lesson, setLesson] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedExercises, setCompletedExercises] = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [userLesson, setUserLesson] = useState(null);

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

  // Create user lesson record
  const createUserLesson = async () => {
    try {
      const response = await userLessonService.createUserLesson({
        userId: user._id,
        lessonId: lessonId,
      });

      console.log("Create user lesson response status:", response.status);
      const result = apiUtils.parseResponse(response);
      console.log("Create user lesson response data:", result);

      if (result.data) {
        console.log("User lesson created successfully");
        return true;
      } else {
        console.log("Failed to create user lesson:", result.message);
        // Don't throw error here as the lesson might already exist
        return false;
      }
    } catch (error) {
      console.log("Error creating user lesson:", error);
      // Don't throw error here as the lesson might already exist
      return false;
    }
  };

  // Mark lesson as completed (only if all exercises are correct)
  const markLessonCompleted = async (lessonId) => {
    console.log("Lesson ID: ", lessonId);

    // Check if lesson is already completed from API
    if (userLesson?.status === "completed") {
      showWarning(
        "Already Completed",
        "This lesson has already been completed. You can review the content but cannot mark it as completed again."
      );
      return;
    }

    if (!isLessonFullyCompleted()) {
      showWarning(
        "Incomplete",
        "Please complete all exercises correctly before marking this lesson as completed."
      );
      return;
    }
    const userLessonResponse =
      await userLessonService.getUserLessonByLessonId(lessonId);

    const response = await userLessonService.updateUserLessonStatus(
      userLessonResponse.userLesson._id.toString(),
      "completed"
    );

    if (response) {
      setUserLesson(response.userLesson);
      showSuccess(
        "Success",
        "Lesson completed! You can now proceed to the next lesson."
      );
    } else {
      showError("Error", "Failed to update lesson status. Please try again.");
    }

    showSuccess(
      "Success",
      "Lesson completed! You can now proceed to the next lesson."
    );
  };

  // Fetch or create user lesson record, then fetch userLesson data
  const fetchOrCreateUserLesson = async () => {
    try {
      // Try to fetch userLesson first
      try {
        const response =
          await userLessonService.getUserLessonByLessonId(lessonId);

        const result = response.userLesson;
        setUserLesson(result || null);
        return result;
      } catch (error) {
        // If not found, create it
        const createResponse = await userLessonService.createUserLesson({
          userId: user._id,
          lessonId: lessonId,
        });
        const result = apiUtils.parseResponse(createResponse);
        if (result.data) {
          setUserLesson(result.data.userLesson || null);
          return result.data.userLesson;
        } else {
          setUserLesson(null);
          return null;
        }
      }
    } catch (error) {
      console.log("Error in fetchOrCreateUserLesson:", error);
      setUserLesson(null);
      return null;
    }
  };

  const fetchLessonDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching lesson details for lessonId:", lessonId);
      console.log("Using userToken:", userToken ? "Token exists" : "No token");

      // First, fetch or create user lesson record and get userLesson data
      await fetchOrCreateUserLesson();

      const [
        lessonResponse,
        grammarResponse,
        vocabResponse,
        exerciseResponse,
        testsResponse,
      ] = await Promise.all([
        await lessonService.getLessonById(lessonId),
        await lessonService.getLessonGrammars(lessonId),
        await lessonService.getLessonVocabulary(lessonId),
        await lessonService.getLessonExercises(lessonId),
        await testService.getTestsByCourseId(courseId),
      ]);

      //lessonData not need parsing
      const lessonData = lessonResponse;
      const grammarData = apiUtils.parseResponse(grammarResponse);
      const vocabData = apiUtils.parseResponse(vocabResponse);
      const exerciseData = apiUtils.parseResponse(exerciseResponse);
      const testsData = apiUtils.parseResponse(testsResponse);

      if (
        !lessonData ||
        !grammarData.data ||
        !vocabData.data ||
        !exerciseData.data ||
        !testsData.data
      ) {
        console.log(
          !lessonData,
          !grammarData.data,
          !vocabData.data,
          !exerciseData.data,
          !testsData.data
        );
        throw new Error("Failed to fetch lesson details");
      }

      if (exerciseData.data && exerciseData.data.length > 0) {
        const progress = {};
        console.log("Handling exercise completion");
        await Promise.all(
          exerciseData.data.map(async (e) => {
            try {
              const response =
                await userExerciseService.getUserExerciseByExerciseId(
                  e._id.toString()
                );

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
        ...lessonData.data,
        grammars: grammarData.data || [],
        vocabularies: vocabData.data || [],
        exercises: exerciseData.data || [],
      };

      setLesson(lessonWithDetails);
      setTests(testsData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          {items.map((item, idx) => {
            const isCompleted = type === "exercise" && completedExercises[item._id];
            const isLessonCompleted = userLesson?.status === "completed";
            
            return (
              <TouchableOpacity
                key={item.id || idx}
                style={[
                  styles.itemButtonLight,
                  isCompleted && styles.completedItem,
                  isLessonCompleted && type === "exercise" && styles.completedItem
                ]}
                onPress={() => openModal(type, idx)}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemLeft}>
                    <View style={[
                      styles.itemIcon,
                      isCompleted && styles.completedIcon,
                      isLessonCompleted && type === "exercise" && styles.completedIcon
                    ]}>
                      <Ionicons 
                        name={
                          type === "grammar" 
                            ? "book-outline" 
                            : type === "vocab" 
                            ? "library-outline" 
                            : isCompleted || (isLessonCompleted && type === "exercise")
                            ? "checkmark-circle"
                            : "pencil-outline"
                        } 
                        size={16} 
                        color={
                          isCompleted || (isLessonCompleted && type === "exercise")
                            ? "#28a745"
                            : "#2563EB"
                        } 
                      />
                    </View>
                    <View>
                      <Text style={[styles.itemTitleLight]}>
                        {type === "grammar"
                          ? item.title
                          : type === "vocab"
                          ? item.englishContent
                          : `Practice ${idx + 1}`}
                      </Text>
                      <Text style={[
                        styles.itemStatus,
                        isCompleted && styles.completedStatusText,
                        isLessonCompleted && type === "exercise" && styles.completedStatusText
                      ]}>
                        {type === "exercise" 
                          ? (isCompleted || isLessonCompleted 
                              ? "Completed" 
                              : "Ready to start")
                          : "Ready to start"
                        }
                      </Text>
                      {/* Show image for vocabulary items */}
                      {type === "vocab" && item.imageUrl && (
                        <View style={styles.itemImageContainer}>
                          <Image 
                            source={{ uri: item.imageUrl }} 
                            style={styles.itemImage}
                            resizeMode="cover"
                            onError={(error) => console.log('Vocabulary list image loading error:', error)}
                            onLoad={() => console.log('Vocabulary list image loaded successfully')}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  {(isCompleted || (isLessonCompleted && type === "exercise")) && (
                    <View style={styles.completionBadge}>
                      <Ionicons name="checkmark" size={12} color="#28a745" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <Text style={{ color: "#ccc", fontFamily: "Mulish-Regular" }}>No content available</Text>
      )}
    </>
  );
  const renderTabs = (activeTab, setActiveTab, tabData = []) => {
    const tabs = [
      { key: "grammar", label: "Grammar", icon: "book-outline" },
      { key: "vocabulary", label: "Vocabulary", icon: "library-outline" },
      { key: "practice", label: "Practice", icon: "pencil-outline" },
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
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
      return <Text style={{ color: "#fff", fontFamily: "Mulish-Regular" }}>No content available</Text>;
    }
    let items = [];

    if (modalType === "grammar") items = lesson.grammars;
    if (modalType === "vocab") items = lesson.vocabularies;
    if (modalType === "exercise") items = lesson.exercises;
    if (!items[modalIndex]) {
      return <Text style={{ color: "#fff", fontFamily: "Mulish-Regular" }}>No content available</Text>;
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
              <Text style={styles.itemText}>Structure: {item.structure}</Text>
              <Text style={styles.itemText}>Example: {item.example}</Text>
              <Text style={styles.itemText}>
                Explanation: {item.explanation}
              </Text>
            </View>
          )}
          {modalType === "vocab" && (
            <View style={styles.modalBody}>
              <Text style={styles.itemText}>
                Vietnamese: {item.vietnameseContent}
              </Text>
              {item.imageUrl && (
                <>
                  <Image 
                    source={{ uri: item.imageUrl }} 
                    style={styles.image}
                    onError={(error) => console.log('Vocabulary image loading error:', error)}
                    onLoad={() => console.log('Vocabulary image loaded successfully')}
                  />
                </>
              )}
            </View>
          )}
          {modalType === "exercise" && (
            <View style={styles.modalBody}>
              <ExerciseItem
                exercise={item}
                onSubmission={handleExerciseSubmission}
                onExerciseCompleted={handleExerciseCompletion}
                isLessonCompleted={userLesson?.status === "completed"}
              />
            </View>
          )}
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={closeModal}
            activeOpacity={0.7}
          >
            <Text style={styles.closeModalButtonText}>
              Close
            </Text>
          </TouchableOpacity>
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
    >
      {userLesson?.status === "completed" && (
        <View style={styles.lessonCompletedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.lessonCompletedText}>
            Lesson Completed - Review Mode
          </Text>
        </View>
      )}
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
              {userLesson?.status === "completed"
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
                      userLesson?.status === "completed"
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

        {/* Complete Button */}
        <TouchableOpacity
          onPress={() => markLessonCompleted(lessonId)}
          disabled={
            userLesson?.status === "completed" || !isLessonFullyCompleted()
          }
        >
          <View
            style={[
              styles.completeButton,
              userLesson?.status === "completed" || !isLessonFullyCompleted()
                ? styles.completeButtonDisabled
                : null,
            ]}
          >
            <Text
              style={[
                styles.completeButtonText,
                userLesson?.status === "completed" || !isLessonFullyCompleted()
                  ? styles.completeButtonTextDisabled
                  : null,
              ]}
            >
              {userLesson?.status === "completed"
                ? "Lesson Completed"
                : isLessonFullyCompleted()
                ? "Mark as Completed"
                : "Complete All Exercises"}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>
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
              {/* Add a test here */}
              {renderModalContent()}
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading lesson..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLessonDetails}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.containerLight}>
      {/* Header */}
      <View style={styles.headerDark}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>{lessonName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {lesson && renderLessonContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main app container (light background)
  containerLight: {
    flex: 1,
    backgroundColor: "#202020",
  },
  // Card or section with dark background
  cardDark: {
    borderRadius: 20,
    margin: 12,
    padding: 18,
    backgroundColor: "#232323",
    borderColor: "#232323",
    maxWidth: "100%",
    minHeight: 400,
  },
  // Header (dark)
  headerDark: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#202020",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  // Header (light)
  headerLight: {
    backgroundColor: "#2b2b2b",
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
    borderBottomColor: "#333",
  },
  backButton: { 
    padding: 8,
    marginLeft: -8,
  },
  headerTitleDark: {
    fontSize: 20,
    color: "#fff",
    flex: 1,
    textAlign: "center",
    fontFamily: "Mulish-Bold",
  },
  headerTitleLight: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Mulish-SemiBold",
  },
  headerSpacer: {
    width: 40,
  },
  lessonContentContainer: {
    flex: 1,
    backgroundColor: "#202020",
    width: "100%",
  },
  lessonContentScrollContainer: {
    flexGrow: 1,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: "#ccc",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Mulish-Regular",
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
    color: "#007AFF",
    marginLeft: 10,
    fontFamily: "Mulish-Bold",
  },
  item: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#333",
    borderRadius: 8,
  },
  itemTitleDark: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  itemTitleLight: {
    fontSize: 17,
    color: "#fff",
    marginBottom: 2,
    fontFamily: "Mulish-Bold",
  },
  itemText: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 5,
    fontFamily: "Mulish-Regular",
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
    backgroundColor: "#202020",
  },
  loadingText: {
    color: "#007AFF",
    marginTop: 10,
    fontFamily: "Mulish-Regular",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#202020",
    padding: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    fontFamily: "Mulish-Regular",
  },
  retryButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  testSection: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  testSectionTitle: {
    fontSize: 20,
    marginBottom: 10,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  testCard: {
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#2b2b2b",
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
    fontFamily: "Mulish-Regular",
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
    fontFamily: "Mulish-Bold",
  },
  correctOptionText: {
    color: "#fff",
    fontFamily: "Mulish-Bold",
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
    fontFamily: "Mulish-Bold",
  },
  itemButtonLight: {
    backgroundColor: "#232323",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    backgroundColor: "#1a1a1a",
    borderColor: "#28a745",
    borderWidth: 1,
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
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  lockedIcon: {
    backgroundColor: "#E5E7EB",
  },
  itemStatus: {
    fontSize: 13,
    color: "#AAA",
    fontFamily: "Mulish-Medium",
  },
  lockedText: {
    color: "#9CA3AF",
    fontFamily: "Mulish-Regular",
  },
  lockedStatusText: {
    color: "#D1D5DB",
    fontFamily: "Mulish-Regular",
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
  },
  progressContainer: {
    marginTop: 15,
    marginBottom: 20,
    width: "100%",
    paddingHorizontal: 10,
  },
  progressText: {
    fontSize: 14,
    color: "#ccc",
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
    marginLeft: 8,
    fontFamily: "Mulish-Bold",
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
  completedButton: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#10D876",
    borderWidth: 1,
    borderColor: "#10D876",
    shadowColor: "#10D876",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDisabled: {
    backgroundColor: "#444",
    borderColor: "#555",
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },
  completeButtonTextDisabled: {
    color: "#D1D5DB",
    fontFamily: "Mulish-Regular",
  },
  incompleteButton: {
    marginVertical: 10,
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#555",
    opacity: 0.6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  incompleteButtonText: {
    color: "#D1D5DB",
    fontFamily: "Mulish-Regular",
  },
  completionBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "#28a745",
  },
  completedStatusText: {
    color: "#28a745",
  },
  itemImageContainer: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  itemImage: {
    width: 60,
    height: 40,
    borderRadius: 6,
  },
});

// Enhanced and improved tab styles
const enhancedTabStyles = {
  // Main container for the entire tab section
  tabSection: {
    backgroundColor: "#2b2b2b",
    borderRadius: 16,
    margin: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  // Tab Container - more refined
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#202020",
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Individual Tab Button - improved proportions
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    minHeight: 48,
  },

  // Tab with badge (for future use)
  tabWithBadge: {
    position: "relative",
  },

  // Active Tab - more prominent
  activeTab: {
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
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
    borderColor: "#232323",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
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
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#333",
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
    shadowOpacity: 0.08,
    shadowRadius: 1,
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
    color: "#fff",
    marginBottom: 2,
    fontFamily: "Mulish-SemiBold",
  },

  // Item subtitle
  itemSubtitle: {
    fontSize: 13,
    color: "#ccc",
    fontFamily: "Mulish-Medium",
  },

  // Start button
  startButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
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
    color: "#ccc",
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
    backgroundColor: "#202020",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 3,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
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
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  completeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Mulish-SemiBold",
  },

  completeButtonDisabled: {
    backgroundColor: "#6B7280",
    shadowOpacity: 0,
  },

  completeButtonTextDisabled: {
    color: "#D1D5DB",
    fontFamily: "Mulish-Regular",
  },
};

const exerciseItemStyles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#2b2b2b",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
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
    marginLeft: 5,
    fontFamily: "Mulish-Bold",
  },
  questionContainer: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Mulish-Bold",
  },
  optionsContainer: {
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: "#444",
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#555",
  },
  selectedOption: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
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
    fontFamily: "Mulish-Bold",
  },
  correctOptionText: {
    color: "#fff",
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
    borderWidth: 1,
    borderColor: "#555",
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
    backgroundColor: "#202020",
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
    backgroundColor: "#232323",
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
    color: "#ccc",
    fontFamily: "Mulish-Medium",
  },
  activeTabText: {
    color: "#fff",
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
  },
  postSubmissionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
    minHeight: 48,
  },
  tryAgainButton: {
    backgroundColor: "#dc3545",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  tryAgainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
  },
  seeAnswerButton: {
    backgroundColor: "#28a745",
    borderRadius: 8,
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  seeAnswerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Mulish-Bold",
    textAlign: "center",
  },
  answerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#444",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#555",
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
  submitButtonDisabled: {
    backgroundColor: "#6B7280",
    opacity: 0.7,
  },
  tryAgainButtonDisabled: {
    backgroundColor: "#6B7280",
    opacity: 0.7,
  },
  imageContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  exerciseImage: {
    width: "100%",
    height: 150,
    borderRadius: 5,
  },
});

export default CourseDetailScreen;
