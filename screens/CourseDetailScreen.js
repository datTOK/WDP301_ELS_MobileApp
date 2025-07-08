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
import { Card, Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:4000/api';

const ExerciseItem = ({ exercise }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  const checkAnswer = () => {
    if (exercise.options && exercise.options.length > 0) {
      const isCorrect = exercise.answer.includes(userAnswer);
      Alert.alert(isCorrect ? 'Correct!' : 'Incorrect', 'Try again or see the answer.');
    } else {
      const isCorrect = userAnswer.trim().toLowerCase() === exercise.answer[0].trim().toLowerCase();
      Alert.alert(isCorrect ? 'Correct!' : 'Incorrect', 'Try again or see the answer.');
    }
  };

  return (
    <View style={styles.item}>
      <Text style={styles.itemText}>{exercise.question}</Text>
      {exercise.options && exercise.options.length > 0 ? (
        <View>
          {exercise.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                userAnswer === option && styles.selectedOption,
              ]}
              onPress={() => setUserAnswer(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <TextInput
          style={styles.textInput}
          placeholder="Type your answer here"
          placeholderTextColor="#888"
          value={userAnswer}
          onChangeText={setUserAnswer}
        />
      )}
      <View style={styles.actionButtons}>
        <Button
          title={showAnswer ? 'Hide Answer' : 'See Answer'}
          buttonStyle={styles.seeAnswerButton}
          titleStyle={styles.seeAnswerButtonText}
          onPress={() => setShowAnswer(!showAnswer)}
        />
      </View>
      {showAnswer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>Answer: {exercise.answer.join(', ')}</Text>
          <Text style={styles.explanationText}>Explanation: {exercise.explanation}</Text>
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

      const lessonsWithDetails = await Promise.all(
        lessons.map(async (lesson) => {
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

          return {
            ...lessonData.data,
            grammars: grammarData.data || [],
            vocabularies: vocabData.data || [],
            exercises: exerciseData.data || [],
          };
        })
      );

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

  const renderLesson = (lesson) => (
    <Card containerStyle={styles.card}>
      <Card.Title style={styles.cardTitle}>{lesson.name}</Card.Title>
      <Text style={styles.description}>{lesson.description}</Text>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Grammar</Text>
        </View>
        {lesson.grammars.length > 0 ? (
          lesson.grammars.map((grammar, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemTitle}>{grammar.title}</Text>
              <Text style={styles.itemText}>Structure: {grammar.structure}</Text>
              <Text style={styles.itemText}>Example: {grammar.example}</Text>
              <Text style={styles.itemText}>Explanation: {grammar.explanation}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.itemText}>No grammars available</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="language" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Vocabulary</Text>
        </View>
        {lesson.vocabularies.length > 0 ? (
          lesson.vocabularies.map((vocab, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemText}>{vocab.englishContent} - {vocab.vietnameseContent}</Text>
              {vocab.imageUrl && <Image source={{ uri: vocab.imageUrl }} style={styles.image} />}
            </View>
          ))
        ) : (
          <Text style={styles.itemText}>No vocabularies available</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="pencil" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>Exercises</Text>
        </View>
        {lesson.exercises.length > 0 ? (
          lesson.exercises.map((exercise, index) => (
            <ExerciseItem key={index} exercise={exercise} />
          ))
        ) : (
          <Text style={styles.itemText}>No exercises available</Text>
        )}
      </View>
    </Card>
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
    <ScrollView contentContainerStyle={styles.container}>
      {lessons.map((lesson, index) => renderLesson(lesson))}

      {tests.length > 0 && (
        <View style={styles.testSection}>
          <Text style={styles.testSectionTitle}>Course Tests</Text>
          {tests.map((test, index) => (
            <Card key={index} containerStyle={styles.testCard}>
              <Text style={styles.testTitle}>{test.name}</Text>
              <Text style={styles.testDescription}>{test.description || 'No description available'}</Text>
              <Text style={styles.testInfo}>
                Number of Questions: {test.questions ? test.questions.length : test.totalQuestions || 'N/A'}
              </Text>
              <Button
                title="Do Test"
                buttonStyle={styles.testButton}
                titleStyle={styles.testButtonText}
                onPress={() => {
                  console.log('Start test', test._id);
                }}
              />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: '#ccc',
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
  optionText: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
});

export default CourseDetailScreen;