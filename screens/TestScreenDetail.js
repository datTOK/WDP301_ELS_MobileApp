import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Card, Button, Overlay } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOBILE_SERVER_URL } from '@env';

const TestScreenDetail = ({ route, navigation }) => {
  const { testId, testName } = route.params;
  const { userToken } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [userTest, setUserTest] = useState(null);
  const [userId, setUserId] = useState(null);
  // Track if the result is from a fresh submission
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    if (testId && userToken) {
      fetchQuestions();
      fetchUserTest();
    }
  }, [testId, userToken, userId]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${MOBILE_SERVER_URL}api/tests/${testId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      }); 
      const data = await response.json();
      console.log(data.test.exercises);
      if (!response.ok) throw new Error(data.message || 'Failed to fetch test questions');
      setQuestions(data.test.exercises || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTest = async () => {
    try {
      const response = await fetch(`${MOBILE_SERVER_URL}api/user-tests/${testId}/test`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserTest(data.userTest || null);
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: [option] }));
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found.');
      return;
    }
    // Validate all questions answered
    const unanswered = questions.filter(q => !answers[q._id] || answers[q._id].length === 0);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', 'Please answer all questions before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        userId,
        answers: questions.map(q => ({
          exerciseId: q._id,
          selectedAnswers: answers[q._id],
        })),
      };
      const response = await fetch(`${MOBILE_SERVER_URL}api/tests/${testId}/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Submission failed');
      setResult(data);
      setJustSubmitted(true);
      fetchUserTest(); // Refresh user test result
      Alert.alert('Test Submitted', data.message || 'Test submitted successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // When user presses Redo, reset justSubmitted
  const handleRedoTest = () => {
    setAnswers({});
    setResult(null);
    setUserTest(null);
    setJustSubmitted(false);
  };

  // Modern progress bar component
  const ProgressBar = ({ value, max }) => (
    <View style={{ height: 12, backgroundColor: '#333', borderRadius: 6, overflow: 'hidden', marginVertical: 10 }}>
      <View style={{ width: `${Math.round((value / max) * 100)}%`, height: '100%', backgroundColor: value >= 60 ? '#28a745' : '#ff6b6b' }} />
    </View>
  );

  // Helper to render result view
  const renderResultView = (submission) => (
    <View style={styles.resultContainerModern}>
      <Ionicons name={submission.status === 'passed' ? 'checkmark-circle' : 'close-circle'} size={40} color={submission.status === 'passed' ? '#28a745' : '#ff6b6b'} style={{ marginBottom: 8 }} />
      <Text style={styles.resultTextModern}>Test Result</Text>
      <ProgressBar value={submission.score} max={100} />
      <View style={styles.resultSummaryRow}>
        <Text style={styles.resultScoreModern}>Score: <Text style={{ color: submission.score >= 60 ? '#28a745' : '#ff6b6b' }}>{submission.score}</Text></Text>
        <Text style={styles.resultStatusModern}>Status: <Text style={{ color: submission.status === 'passed' ? '#28a745' : '#ff6b6b' }}>{submission.status}</Text></Text>
      </View>
      <Text style={styles.resultDescriptionModern}>{submission.description}</Text>
      {submission.results?.map((res, idx) => {
        const question = questions.find(q => q._id === res.exerciseId);
        return (
          <View key={res.exerciseId} style={[styles.resultItemModern, res.isCorrect ? styles.resultCorrectModern : styles.resultIncorrectModern]}> 
            {question?.type === 'image_translate' && question?.image ? (
              <Image source={{ uri: question.image }} style={styles.resultImage} resizeMode="contain" />
            ) : null}
            <Text style={styles.resultQuestionModern}>{idx + 1}. {question?.question || 'Question'}</Text>
            <Text style={styles.resultYourAnswerModern}>Your answer: <Text style={{ color: res.isCorrect ? '#28a745' : '#ff6b6b' }}>{res.selectedAnswers?.join(', ') || '-'}</Text></Text>
            <Text style={styles.resultCorrectAnswerModern}>Correct answer: <Text style={{ color: '#ffc107' }}>{res.correctAnswers?.join(', ') || '-'}</Text></Text>
            <Ionicons name={res.isCorrect ? 'checkmark-circle' : 'close-circle'} size={22} color={res.isCorrect ? '#28a745' : '#ff6b6b'} style={{ marginTop: 4 }} />
          </View>
        );
      })}
      <Button
        title="Redo Test"
        buttonStyle={{ backgroundColor: '#007AFF', borderRadius: 8, marginTop: 18 }}
        titleStyle={{ color: '#fff', fontWeight: 'bold' }}
        onPress={handleRedoTest}
      />
    </View>
  );

  // Show loading spinner if loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading test...</Text>
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
          onPress={fetchQuestions}
          buttonStyle={styles.retryButton}
          titleStyle={styles.retryButtonText}
        />
      </View>
    );
  }

  // If just submitted, show last attempt result
  if (justSubmitted && result && result.submission) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>{testName || 'Test'}</Card.Title>
          <Text style={{ color: '#ffc107', textAlign: 'center', marginBottom: 8 }}>
            Showing result of your last attempt (Attempt #{result.submission.attemptNo})
          </Text>
          {renderResultView(result.submission)}
        </Card>
      </ScrollView>
    );
  }

  // If userTest exists and has testId, show result view (highest score)
  if (userTest && userTest.testId) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>{testName || 'Test'}</Card.Title>
          {userTest.attemptNo > 1 && (
            <Text style={{ color: '#ffc107', textAlign: 'center', marginBottom: 8 }}>
              Showing your highest score (Attempt #{userTest.attemptNo})
            </Text>
          )}
          {renderResultView(userTest)}
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>{testName || 'Test'}</Card.Title>
        {userTest && (
          <View style={styles.userTestResult}>
            <Ionicons name={userTest.status === 'passed' ? 'checkmark-circle' : 'close-circle'} size={24} color={userTest.status === 'passed' ? '#28a745' : '#dc3545'} />
            <Text style={styles.userTestScore}>Score: {userTest.score}</Text>
            <Text style={styles.userTestStatus}>Status: {userTest.status}</Text>
            <Text style={styles.userTestAttempt}>Attempt: {userTest.attemptNo}</Text>
          </View>
        )}
        {questions.map((q, idx) => (
          <View key={q._id} style={styles.questionContainer}>
            {q.type === 'image_translate' && q.image ? (
              <Image
                source={{ uri: q.image }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            ) : null}
            <Text style={styles.questionText}>{idx + 1}. {q.question}</Text>
            {q.type === 'multiple_choice' && q.options && q.options.length > 0 ? (
              q.options.map((option, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionButton,
                    answers[q._id]?.includes(option) && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(q._id, option)}
                  disabled={!!result}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={styles.textInput}
                  value={answers[q._id]?.[0] || ''}
                  onChangeText={text => handleSelect(q._id, text)}
                  editable={!result}
                  placeholder="Type your answer here"
                  placeholderTextColor="#aaa"
                />
              </View>
            )}
          </View>
        ))}
        {!result && (
          <Button
            title={submitting ? 'Submitting...' : 'Submit Test'}
            buttonStyle={styles.submitButton}
            titleStyle={styles.submitButtonText}
            onPress={handleSubmit}
            disabled={submitting}
          />
        )}
        {result && (
          <View style={styles.resultContainer}>
            <Ionicons name="trophy" size={32} color="#ffc107" />
            <Text style={styles.resultText}>Test Submitted!</Text>
            <Text style={styles.resultScore}>Score: {result.submission?.score ?? '-'}</Text>
            <Text style={styles.resultStatus}>Status: {result.submission?.status ?? '-'}</Text>
            <Text style={styles.resultDescription}>{result.submission?.description}</Text>
            {result.submission?.results?.map((res, idx) => {
              const question = questions.find(q => q._id === res.exerciseId);
              return (
                <View key={res.exerciseId} style={styles.resultItem}>
                  <Text style={styles.resultQuestion}>{idx + 1}. {question?.question || 'Question'}</Text>
                  <Text style={styles.resultYourAnswer}>Your answer: {res.selectedAnswers?.join(', ') || '-'}</Text>
                  <Text style={styles.resultCorrectAnswer}>Correct answer: {res.correctAnswers?.join(', ') || '-'}</Text>
                  <Text style={res.isCorrect ? styles.resultCorrect : styles.resultIncorrect}>
                    {res.isCorrect ? 'Correct' : 'Incorrect'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  card: { borderRadius: 12, margin: 15, backgroundColor: '#2a2a2a', borderColor: '#333' },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  userTestResult: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  userTestScore: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  userTestStatus: { color: '#fff', marginLeft: 8 },
  userTestAttempt: { color: '#fff', marginLeft: 8 },
  questionContainer: { marginBottom: 20 },
  questionText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  optionButton: { backgroundColor: '#444', padding: 10, borderRadius: 6, marginBottom: 6 },
  selectedOption: { backgroundColor: '#007AFF' },
  optionText: { color: '#fff' },
  submitButton: { backgroundColor: '#28a745', borderRadius: 8, marginTop: 10 },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { alignItems: 'center', marginTop: 20 },
  resultText: { color: '#ffc107', fontWeight: 'bold', fontSize: 18, marginTop: 10 },
  resultScore: { color: '#fff', fontSize: 16, marginTop: 5 },
  resultStatus: { color: '#fff', fontSize: 16, marginTop: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { color: '#007AFF', marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  errorText: { color: '#ff6b6b', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  retryButton: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  textInput: { backgroundColor: '#222', color: '#fff', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#444', marginBottom: 6, fontSize: 15 },
  questionImage: { width: '100%', height: 180, marginBottom: 10, borderRadius: 8, backgroundColor: '#eee' },
  resultItem: { marginTop: 12, padding: 10, backgroundColor: '#222', borderRadius: 8 },
  resultQuestion: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  resultYourAnswer: { color: '#fff', marginTop: 4 },
  resultCorrectAnswer: { color: '#ffc107', marginTop: 2 },
  resultCorrect: { color: '#28a745', fontWeight: 'bold', marginTop: 2 },
  resultIncorrect: { color: '#ff6b6b', fontWeight: 'bold', marginTop: 2 },
  resultDescription: { color: '#ccc', fontSize: 13, marginTop: 8 },
  // New styles for modern result view
  resultContainerModern: { alignItems: 'center', marginTop: 10, backgroundColor: '#181818', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#333' },
  resultTextModern: { color: '#ffc107', fontWeight: 'bold', fontSize: 22, marginBottom: 8 },
  resultSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  resultScoreModern: { color: '#fff', fontSize: 16 },
  resultStatusModern: { color: '#fff', fontSize: 16 },
  resultDescriptionModern: { color: '#ccc', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  resultItemModern: { width: '100%', marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: '#232323', borderWidth: 1 },
  resultCorrectModern: { borderColor: '#28a745' },
  resultIncorrectModern: { borderColor: '#ff6b6b' },
  resultQuestionModern: { color: '#fff', fontWeight: 'bold', fontSize: 15, marginBottom: 4 },
  resultYourAnswerModern: { color: '#fff', marginTop: 2 },
  resultCorrectAnswerModern: { color: '#fff', marginTop: 2 },
  resultImage: { width: '100%', height: 120, marginBottom: 8, borderRadius: 8, backgroundColor: '#eee' },
});

export default TestScreenDetail; 