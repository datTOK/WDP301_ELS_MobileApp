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

const API_BASE_URL = 'http://localhost:4000/api';

const ExerciseItem = ({ exercise, onSubmission }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const { userToken } = useAuth();

  const checkAnswer = async () => {
    if (!userAnswer.trim() && !selectedOption) {
      Alert.alert('Error', 'Please provide an answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    const answer = exercise.options && exercise.options.length > 0 ? selectedOption : userAnswer.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/user-exercises/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          exerciseId: exercise._id,
          answer: answer,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const correct = result.isCorrect || false;
        setIsCorrect(correct);
        setIsSubmitted(true);
        setShowFeedback(true);
        
        if (onSubmission) {
          onSubmission(exercise._id, correct);
        }

        // Hide feedback after 3 seconds
        setTimeout(() => setShowFeedback(false), 3000);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit answer');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
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
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={exerciseItemStyles.container}>
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
              onPress={() => !isSubmitted && setSelectedOption(option)}
              disabled={isSubmitted}
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
            editable={!isSubmitted}
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
              disabled={isSubmitting || (!userAnswer.trim() && !selectedOption)}
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
  const { courseId } = route.params;
  const { userToken } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]); // Array of completed lesson IDs
  const [drawerVisible, setDrawerVisible] = useState(true); // Control drawer visibility

  // State for modal navigation
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null); // 'grammar' | 'vocab' | 'exercise'
  const [modalIndex, setModalIndex] = useState(0);

  // Toggle drawer visibility
  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  // Open modal for a specific item type and index
  const openModal = (type, index) => {
    setModalType(type);
    setModalIndex(index);
    setModalVisible(true);
  };
  const closeModal = () => setModalVisible(false);

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
  const renderModalContent = (lesson) => {
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
            <ExerciseItem exercise={item} onSubmission={handleExerciseSubmission} />
          </View>
        )}
        <Button title="Close" onPress={closeModal} buttonStyle={styles.closeModalButton} />
      </View>
    );
  };

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lessonsResponse, testsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
        fetch(`${API_BASE_URL}/tests/${courseId}/course`, {
          headers: { 'Authorization': `Bearer ${userToken}` },
        }),
      ]);

      const lessonsData = await lessonsResponse.json();
      const testsData = await testsResponse.json();

      if (!lessonsResponse.ok) {
        throw new Error(lessonsData.message || 'Failed to fetch lessons');
      }
      if (!testsResponse.ok) {
        throw new Error(testsData.message || 'Failed to fetch tests');
      }

      const lessons = lessonsData.data || [];
      const tests = testsData.data || [];

      console.log('Original lessons data:', lessons);

      const lessonsWithDetails = await Promise.all(
        lessons.map(async (lesson) => {
          console.log('Processing lesson:', lesson.name, lesson._id);
          
          const [lessonResponse, grammarResponse, vocabResponse, exerciseResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
              headers: { 'Authorization': `Bearer ${userToken}` },
            }),
            fetch(`${API_BASE_URL}/lessons/${lesson._id}/grammars`, {
              headers: { 'Authorization': `Bearer ${userToken}` },
            }),
            fetch(`${API_BASE_URL}/lessons/${lesson._id}/vocabularies`, {
              headers: { 'Authorization': `Bearer ${userToken}` },
            }),
            fetch(`${API_BASE_URL}/exercises/${lesson._id}/lesson`, {
              headers: { 'Authorization': `Bearer ${userToken}` },
            }),
          ]);

          const lessonData = await lessonResponse.json();
          const grammarData = await grammarResponse.json();
          const vocabData = await vocabResponse.json();
          const exerciseData = await exerciseResponse.json();

          if (!lessonResponse.ok || !grammarResponse.ok || !vocabResponse.ok || !exerciseResponse.ok) {
            throw new Error('Failed to fetch lesson details');
          }

          // Preserve original lesson data and add detailed content
          const processedLesson = {
            ...lesson, // Keep original lesson data (name, description, _id, etc.)
            ...lessonData.data, // Add any additional lesson details
            grammars: grammarData.data || [],
            vocabularies: vocabData.data || [],
            exercises: exerciseData.data || [],
          };
          
          console.log('Processed lesson:', processedLesson.name, processedLesson._id);
          return processedLesson;
        })
      );

      console.log('Final lessons with details:', lessonsWithDetails.map(l => ({ name: l.name, _id: l._id })));

      setLessons(lessonsWithDetails);
      setTests(tests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, userToken]);

  // Mark lesson as completed
  const markLessonCompleted = (lessonId) => {
    setCompletedLessons((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
  };

  // Drawer/Sidebar for lessons (updated with toggle)
  const renderLessonDrawer = () => {
    console.log('Drawer Debug - lessons:', lessons.length, 'loading:', loading, 'error:', error);
    console.log('Drawer Debug - lessons data:', lessons);
    
    return (
      <View style={[styles.drawerContainer, !drawerVisible && styles.drawerCollapsed]}>
        {drawerVisible ? (
          <>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Lessons</Text>
              <TouchableOpacity onPress={toggleDrawer} style={styles.closeDrawerButton}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {loading ? (
              <View style={styles.drawerLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.drawerLoadingText}>Loading lessons...</Text>
              </View>
            ) : error ? (
              <View style={styles.drawerErrorContainer}>
                <Text style={styles.drawerErrorText}>Error loading lessons</Text>
              </View>
            ) : lessons.length === 0 ? (
              <View style={styles.drawerEmptyContainer}>
                <Text style={styles.drawerEmptyText}>No lessons found</Text>
              </View>
            ) : (
              lessons.map((lesson, idx) => (
                <TouchableOpacity
                  key={lesson._id || idx}
                  style={[
                    styles.drawerLessonItem,
                    idx === selectedLessonIndex && styles.drawerLessonItemSelected,
                  ]}
                  onPress={() => setSelectedLessonIndex(idx)}
                >
                  <Text style={styles.drawerLessonText}>
                    {lesson.name || `Lesson ${idx + 1}`}
                  </Text>
                  {completedLessons.includes(lesson._id) && (
                    <Icon name="check-circle" type="feather" color="#28a745" size={18} containerStyle={{ marginLeft: 8 }} />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <TouchableOpacity onPress={toggleDrawer} style={styles.openDrawerButton}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Main lesson content area (updated)
  const renderLessonContent = (lesson) => (
    <ScrollView 
      style={styles.lessonContentContainer}
      contentContainerStyle={styles.lessonContentScrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>{lesson.name}</Card.Title>
        <Text style={styles.description}>{lesson.description}</Text>
        {renderChips(lesson.grammars, 'grammar', 'Grammar', '#007AFF')}
        {renderChips(lesson.vocabularies, 'vocab', 'Vocabulary', '#28a745')}
        {renderChips(lesson.exercises, 'exercise', 'Practice', '#ff9800')}
      </Card>
      <Button
        title={completedLessons.includes(lesson._id) ? 'Completed' : 'Mark as Completed'}
        buttonStyle={completedLessons.includes(lesson._id) ? styles.completedButton : styles.completeButton}
        onPress={() => markLessonCompleted(lesson._id)}
        disabled={completedLessons.includes(lesson._id)}
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
          {renderModalContent(lesson)}
        </ScrollView>
      </Overlay>
    </ScrollView>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.center} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Button
          title="Retry"
          onPress={fetchCourseDetails}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {renderLessonDrawer()}
      {console.log('Main Debug - selectedLessonIndex:', selectedLessonIndex, 'lessons length:', lessons.length)}
      <View style={styles.contentContainer}>
        {lessons.length > 0 && lessons[selectedLessonIndex] ? (
          renderLessonContent(lessons[selectedLessonIndex])
        ) : (
          <View style={styles.noLessonContainer}>
            <Text style={styles.noLessonText}>
              {loading ? 'Loading lessons...' : error ? 'Error loading lessons' : 'No lessons available'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    backgroundColor: '#fff',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
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
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  drawerContainer: {
    width: '25%', // Changed to percentage-based width
    backgroundColor: '#181818',
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: '#333',
    alignItems: 'center',
  },
  drawerCollapsed: {
    width: '15%', // Changed to percentage-based width
    paddingVertical: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 15,
  },
  closeDrawerButton: {
    padding: 4,
  },
  openDrawerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  drawerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 15,
  },
  drawerLessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
    width: '100%',
  },
  drawerLessonItemSelected: {
    backgroundColor: '#333',
  },
  drawerLessonText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  lessonContentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  lessonContentScrollContainer: {
    flexGrow: 1,
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
  drawerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  drawerLoadingText: {
    color: '#fff',
    marginLeft: 10,
  },
  drawerErrorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  drawerErrorText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
  drawerEmptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  drawerEmptyText: {
    color: '#ccc',
    fontSize: 16,
  },
  noLessonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  noLessonText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

const exerciseItemStyles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
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