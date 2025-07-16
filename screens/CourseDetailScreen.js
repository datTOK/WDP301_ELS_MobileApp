import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Card, Button, Icon, Overlay, Chip } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOBILE_SERVER_URL } from '@env';

const ExerciseItem = ({ exercise, onSubmission, onExerciseCompleted, isLessonCompleted = false }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const { userToken } = useAuth();

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
      setUserAnswer('');
      setSelectedOption('');
      setIsSubmitted(false);
      setIsCorrect(false);
      setShowFeedback(false);
      setShowAnswer(false);
    }
  }, [exercise._id, isLessonCompleted]);

  const validateAnswer = (userAnswer, correctAnswer) => {
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.some(answer =>
        userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
      );
    }
    return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  };

  const checkAnswer = async () => {
    if (!userAnswer.trim() && !selectedOption) {
      Alert.alert('Error', 'Please provide an answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    const answer = exercise.options && exercise.options.length > 0 ? selectedOption : userAnswer.trim();

    console.log('Submitting exercise answer:');
    console.log('Exercise ID:', exercise._id);
    console.log('User Answer:', answer);
    console.log('Correct Answer:', exercise.answer);
    console.log('User Token:', userToken ? 'Token exists' : 'No token');

    try {
      const isAnswerCorrect = validateAnswer(answer, exercise.answer);
      setIsCorrect(isAnswerCorrect);
      setIsSubmitted(true);
      setShowFeedback(true);

      const response = await fetch(`${MOBILE_SERVER_URL}api/user-exercises/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          id: exercise._id,
          answer: answer,
        }),
      });

      console.log('Exercise submission response status:', response.status);
      const result = await response.json();
      console.log('Exercise submission response data:', result);

      if (response.ok) {
        // Use API result if available, otherwise use local validation
        const apiCorrect = result.isCorrect !== undefined ? result.isCorrect : isAnswerCorrect;
        setIsCorrect(apiCorrect);

        if (onSubmission) {
          onSubmission(exercise._id, apiCorrect);
        }

        if (onExerciseCompleted) {
          onExerciseCompleted(exercise._id, apiCorrect);
        }

        // Hide feedback after 3 seconds
        setTimeout(() => setShowFeedback(false), 3000);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit answer');
        // Still show local validation result
        if (onExerciseCompleted) {
          onExerciseCompleted(exercise._id, isAnswerCorrect);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      // Show local validation result even if API fails
      if (onExerciseCompleted) {
        onExerciseCompleted(exercise._id, isAnswerCorrect);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetExercise = () => {
    setUserAnswer('');
    setSelectedOption('');
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
          <Text style={exerciseItemStyles.completedIndicatorText}>Lesson Completed - Review Mode</Text>
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
                isSubmitted && option === exercise.answer[0] && exerciseItemStyles.correctOption,
                isSubmitted && selectedOption === option && option !== exercise.answer[0] && exerciseItemStyles.incorrectOption,
              ]}
              onPress={() => !isSubmitted && !isLessonCompleted && setSelectedOption(option)}
              disabled={isSubmitted || isLessonCompleted}
            >
              <Text style={[
                exerciseItemStyles.optionText,
                selectedOption === option && exerciseItemStyles.selectedOptionText,
                isSubmitted && option === exercise.answer[0] && exerciseItemStyles.correctOptionText,
              ]}>
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
        <View style={[
          exerciseItemStyles.feedbackContainer,
          isCorrect ? exerciseItemStyles.correctFeedback : exerciseItemStyles.incorrectFeedback
        ]}>
          <Ionicons
            name={isCorrect ? "checkmark-circle" : "close-circle"}
            size={24}
            color={isCorrect ? "#28a745" : "#dc3545"}
          />
          <Text style={[
            exerciseItemStyles.feedbackText,
            isCorrect ? exerciseItemStyles.correctFeedbackText : exerciseItemStyles.incorrectFeedbackText
          ]}>
            {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
          </Text>
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
              disabled={isSubmitting || (!userAnswer.trim() && !selectedOption) || isLessonCompleted}
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
            Correct Answer: {Array.isArray(exercise.answer) ? exercise.answer.join(', ') : exercise.answer}
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
            Correct Answer: {Array.isArray(exercise.answer) ? exercise.answer.join(', ') : exercise.answer}
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
  console.log("Course ID: ", courseId);
  console.log("Lesson ID: ", lessonId);
  console.log("Lesson Name: ", lessonName);
  console.log("Update Lesson Status: ", updateLessonStatus);
  const { userToken, user } = useAuth();
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
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: isCorrect
    }));
  };

  // Check if all exercises in current lesson are completed correctly
  const isLessonFullyCompleted = () => {
    if (!lesson || !lesson.exercises || lesson.exercises.length === 0) {
      return true; // No exercises means lesson is complete
    }

    const totalExercises = lesson.exercises.length;
    const correctExercises = Object.values(completedExercises).filter(correct => correct).length;

    return correctExercises === totalExercises;
  };

  // Create user lesson record
  const createUserLesson = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch(`${MOBILE_SERVER_URL}api/user-lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          userId: userId,
          lessonId: lessonId,
        }),
      });

      console.log('Create user lesson response status:', response.status);
      const result = await response.json();
      console.log('Create user lesson response data:', result);

      if (response.ok) {
        console.log('User lesson created successfully');
        return true;
      } else {
        console.log('Failed to create user lesson:', result.message);
        // Don't throw error here as the lesson might already exist
        return false;
      }
    } catch (error) {
      console.log('Error creating user lesson:', error);
      // Don't throw error here as the lesson might already exist
      return false;
    }
  };

  // Mark lesson as completed (only if all exercises are correct)
  const markLessonCompleted = async (lessonId) => {
    console.log("Lesson ID: ", lessonId);
    
    // Check if lesson is already completed from API
    if (userLesson?.completed) {
      Alert.alert('Already Completed', 'This lesson has already been completed. You can review the content but cannot mark it as completed again.');
      return;
    }
    
    if (!isLessonFullyCompleted()) {
      Alert.alert('Incomplete', 'Please complete all exercises correctly before marking this lesson as completed.');
      return;
    }

    if (updateLessonStatus) {
      const success = await updateLessonStatus(lessonId, 'completed');
      if (success) {
        setCompletedLessons((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
        Alert.alert('Success', 'Lesson completed! You can now proceed to the next lesson.');
      } else {
        Alert.alert('Error', 'Failed to update lesson status. Please try again.');
      }
    } else {
      setCompletedLessons((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
      Alert.alert('Success', 'Lesson completed! You can now proceed to the next lesson.');
    }
  };

  // Fetch or create user lesson record, then fetch userLesson data
  const fetchOrCreateUserLesson = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      // Try to fetch userLesson first
      const getRes = await fetch(`${MOBILE_SERVER_URL}api/user-lessons/${lessonId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (getRes.ok) {
        const userLessonData = await getRes.json();
        console.log('Fetched user lesson data:', userLessonData);
        setUserLesson(userLessonData.userLesson || null);
        console.log('Lesson completion status:', userLessonData.userLesson?.completed);
        return userLessonData.userLesson;
      } else {
        // If not found, create it
        const response = await fetch(`${MOBILE_SERVER_URL}api/user-lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            userId: userId,
            lessonId: lessonId,
          }),
        });
        const result = await response.json();
        if (response.ok) {
          console.log('Created user lesson data:', result);
          setUserLesson(result.userLesson || null);
          console.log('New lesson completion status:', result.userLesson?.completed);
          return result.userLesson;
        } else {
          setUserLesson(null);
          return null;
        }
      }
    } catch (error) {
      console.log('Error in fetchOrCreateUserLesson:', error);
      setUserLesson(null);
      return null;
    }
  };

  const fetchLessonDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching lesson details for lessonId:', lessonId);
      console.log('Using userToken:', userToken ? 'Token exists' : 'No token');

      // First, fetch or create user lesson record and get userLesson data
      await fetchOrCreateUserLesson();

      const [lessonResponse, grammarResponse, vocabResponse, exerciseResponse, testsResponse] = await Promise.all([
        fetch(`${MOBILE_SERVER_URL}api/lessons/${lessonId}`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
        fetch(`${MOBILE_SERVER_URL}api/lessons/${lessonId}/grammars`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
        fetch(`${MOBILE_SERVER_URL}api/lessons/${lessonId}/vocabularies`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
        fetch(`${MOBILE_SERVER_URL}api/exercises/${lessonId}/lesson`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
        fetch(`${MOBILE_SERVER_URL}api/tests/${courseId}/course`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
      ]);

      console.log('Lesson Response Status:', lessonResponse.status);
      console.log('Grammar Response Status:', grammarResponse.status);
      console.log('Vocab Response Status:', vocabResponse.status);
      console.log('Exercise Response Status:', exerciseResponse.status);
      console.log('Tests Response Status:', testsResponse.status);

      const lessonData = await lessonResponse.json();
      const grammarData = await grammarResponse.json();
      const vocabData = await vocabResponse.json();
      const exerciseData = await exerciseResponse.json();
      const testsData = await testsResponse.json();

      console.log('Lesson Response Data:', lessonData);
      console.log('Grammar Response Data:', grammarData);
      console.log('Vocab Response Data:', vocabData);
      console.log('Exercise Response Data:', exerciseData);
      console.log('Tests Response Data:', testsData);

      if (!lessonResponse.ok || !grammarResponse.ok || !vocabResponse.ok || !exerciseResponse.ok || !testsResponse.ok) {
        console.log('One or more API calls failed');
        console.log('Lesson Response OK:', lessonResponse.ok);
        console.log('Grammar Response OK:', grammarResponse.ok);
        console.log('Vocab Response OK:', vocabResponse.ok);
        console.log('Exercise Response OK:', exerciseResponse.ok);
        console.log('Tests Response OK:', testsResponse.ok);
        throw new Error('Failed to fetch lesson details');
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
        {items.length > 0 ? items.map((item, idx) => (
          <Chip
            key={idx}
            title={type === 'grammar' ? item.title : type === 'vocab' ? item.englishContent : `Practice ${idx + 1}`}
            buttonStyle={[styles.chipButton, { backgroundColor: color }]}
            titleStyle={styles.chipTitle}
            onPress={() => openModal(type, idx)}
            icon={{ name: type === 'grammar' ? 'book' : type === 'vocab' ? 'language' : 'edit', type: 'feather', color: '#fff', size: 16 }}
          />
        )) : <Text style={styles.itemText}>No {label.toLowerCase()} available</Text>}
      </View>
    </View>
  );

  // Render modal content for the selected item
  const renderModalContent = () => {
    if (!modalType || !lesson) return null;
    let items = [];
    if (modalType === 'grammar') items = lesson.grammars;
    if (modalType === 'vocab') items = lesson.vocabularies;
    if (modalType === 'exercise') items = lesson.exercises;
    if (!items[modalIndex]) return null;
    const item = items[modalIndex];

    const handleExerciseSubmission = (exerciseId, isCorrect) => {
      console.log('Exercise submitted:', exerciseId, 'Correct:', isCorrect);
      // You can add logic here to track progress
    };

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalNavRow}>
          <TouchableOpacity
            disabled={modalIndex === 0}
            onPress={() => setModalIndex((i) => Math.max(0, i - 1))}
          >
            <Ionicons name="arrow-back-circle" size={32} color={modalIndex === 0 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{modalType === 'grammar' ? item.title : modalType === 'vocab' ? item.englishContent : `Practice ${modalIndex + 1}`}</Text>
          <TouchableOpacity
            disabled={modalIndex === items.length - 1}
            onPress={() => setModalIndex((i) => Math.min(items.length - 1, i + 1))}
          >
            <Ionicons name="arrow-forward-circle" size={32} color={modalIndex === items.length - 1 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
        </View>
        {modalType === 'grammar' && (
          <View style={styles.modalBody}>
            <Text style={styles.itemText}>Structure: {item.structure}</Text>
            <Text style={styles.itemText}>Example: {item.example}</Text>
            <Text style={styles.itemText}>Explanation: {item.explanation}</Text>
          </View>
        )}
        {modalType === 'vocab' && (
          <View style={styles.modalBody}>
            <Text style={styles.itemText}>Vietnamese: {item.vietnameseContent}</Text>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
          </View>
        )}
        {modalType === 'exercise' && (
          <View style={styles.modalBody}>
            <ExerciseItem 
              exercise={item} 
              onSubmission={handleExerciseSubmission} 
              onExerciseCompleted={handleExerciseCompletion}
              isLessonCompleted={userLesson?.completed}
            />
          </View>
        )}
        <Button title="Close" onPress={closeModal} buttonStyle={styles.closeModalButton} />
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
      {userLesson?.completed && (
        <View style={styles.lessonCompletedBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.lessonCompletedText}>Lesson Completed - Review Mode</Text>
        </View>
      )}
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>{lesson.name}</Card.Title>
        <Text style={styles.description}>{lesson.description}</Text>
        {renderChips(lesson.grammars, 'grammar', 'Grammar', '#007AFF')}
        {renderChips(lesson.vocabularies, 'vocab', 'Vocabulary', '#28a745')}
        {renderChips(lesson.exercises, 'exercise', 'Practice', '#ff9800')}

        {/* Progress indicator for exercises */}
        {lesson.exercises && lesson.exercises.length > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Exercises Progress: {userLesson?.completed ? lesson.exercises.length : Object.values(completedExercises).filter(correct => correct).length} / {lesson.exercises.length} completed
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${userLesson?.completed ? 100 : (Object.values(completedExercises).filter(correct => correct).length / lesson.exercises.length) * 100}%`
                  }
                ]}
              />
            </View>
          </View>
        )}
      </Card>
      <Button
        title={userLesson?.completed ? 'Lesson Completed' : (isLessonFullyCompleted() ? 'Mark as Completed' : 'Complete All Exercises')}
        buttonStyle={userLesson?.completed ? styles.completedButton : (isLessonFullyCompleted() ? styles.completeButton : styles.incompleteButton)}
        onPress={() => markLessonCompleted(lessonId)}
        disabled={userLesson?.completed || !isLessonFullyCompleted()}
      />
      <Overlay
        isVisible={modalVisible}
        onBackdropPress={closeModal}
        overlayStyle={styles.modalOverlay}
        fullScreen={false}
      >
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderModalContent()}
        </ScrollView>
      </Overlay>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ff6b6b" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchLessonDetails}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{lessonName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {lesson && renderLessonContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#181818',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Adjust as needed for spacing
  },
  lessonContentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  lessonContentScrollContainer: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 10,
    margin: 10,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    maxWidth: '100%',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginLeft: 10,
  },
  item: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  itemText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  image: {
    width: '100%',
    height: 150,
    marginTop: 5,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#007AFF',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testSection: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  testSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testCard: {
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#2a2a2a',
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  testTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  testDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
  },
  testInfo: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ccc',
  },
  testButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  correctOption: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  optionText: {
    color: '#fff',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  checkButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAnswerButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  seeAnswerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  answerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 5,
  },
  answerText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  explanationText: {
    color: '#ccc',
    marginTop: 5,
  },
  completeButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    margin: 15,
  },
  completedButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    margin: 15,
  },
  incompleteButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    margin: 15,
  },
  chipSection: {
    marginTop: 15,
    marginBottom: 5,
    width: '100%',
  },
  chipSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bbb',
    marginBottom: 8,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipButton: { // Added for chip button style
    marginRight: 8,
    marginBottom: 8,
  },
  chipTitle: { // Added for chip title style
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#222',
    alignSelf: 'center',
  },
  modalScrollView: {
    flex: 1,
    maxHeight: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  modalBody: {
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 10,
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginTop: 10,
  },
  progressContainer: {
    marginTop: 15,
    marginBottom: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  lessonCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    margin: 10,
    borderRadius: 8,
  },
  lessonCompletedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

const exerciseItemStyles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  completedIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  questionContainer: {
    marginBottom: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  optionsContainer: {
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  correctOption: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  incorrectOption: {
    backgroundColor: '#dc3545',
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  optionText: {
    color: '#fff',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  textInputContainer: {
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    fontSize: 14,
  },
  correctInput: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  incorrectInput: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#444',
  },
  correctFeedback: {
    backgroundColor: '#28a745',
  },
  incorrectFeedback: {
    backgroundColor: '#dc3545',
  },
  feedbackText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  correctFeedbackText: {
    color: '#fff',
  },
  incorrectFeedbackText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    flex: 1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postSubmissionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  tryAgainButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  tryAgainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAnswerButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    flex: 1,
  },
  seeAnswerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  answerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 5,
  },
  answerText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  explanationText: {
    color: '#ccc',
    marginTop: 5,
  },
});

export default CourseDetailScreen;