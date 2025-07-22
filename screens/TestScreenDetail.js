import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { testService, apiUtils } from '../services';

const TestScreenDetail = ({ route, navigation }) => {
  const { testId, testName } = route.params;
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [userTest, setUserTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const { userToken, user } = useAuth();
  const { showError } = useToast();

  const fetchUserId = async () => {
    try {
      return user?._id || null;
    } catch (error) {
      console.error('Error fetching user ID:', error);
      return null;
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testService.getTestById(testId);
      const result = apiUtils.parseResponse(response);

      if (result.data && result.data.test) {
        // getTestById returns { test: {..., exercises: [...] } }
        setQuestions(result.data.test.exercises || []);
      } else {
        setQuestions([]);
        showError('No questions found for this test.');
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTest = async () => {
    try {
      const userId = await fetchUserId();
      if (!userId) return;

      const response = await testService.getUserTestByTestId(testId, { userId });
      const result = apiUtils.parseResponse(response);

      if (result.data && result.data.userTest) {
        setUserTest(result.data.userTest);
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setUserTest(result.data[0]);
      }
    } catch (err) {
      console.error('Error fetching user test:', err);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchUserTest();
  }, [testId]);

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: prev[questionId] ? [...prev[questionId], option] : [option]
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const response = await testService.submitTest(testId, { answers });
      const result = apiUtils.parseResponse(response);

      if (result.data) {
        setResult(result.data);
        setJustSubmitted(true);
        // Refresh user test data
        await fetchUserTest();
      } else {
        showError('Submission Error', 'Failed to submit test.');
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      showError('Submission Error', errorInfo.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedoTest = () => {
    setAnswers({});
    setResult(null);
    setJustSubmitted(false);
  };

  const ProgressBar = ({ value, max }) => (
    <View style={{ width: '100%', height: 8, backgroundColor: '#444', borderRadius: 4, overflow: 'hidden' }}>
      <View style={{ width: `${(value / max) * 100}%`, height: '100%', backgroundColor: '#4CC2FF' }} />
    </View>
  );

  const renderResultView = (submission) => (
    <View style={styles.resultContainerModern}>
      <Text style={styles.resultTextModern}>Test Completed!</Text>
      <View style={styles.resultSummaryRow}>
        <Text style={styles.resultScoreModern}>Score: {submission.score}</Text>
        <Text style={styles.resultStatusModern}>Status: {submission.status}</Text>
      </View>
      <Text style={styles.resultDescriptionModern}>
        {submission.description || 'Great job completing the test!'}
      </Text>
      <ProgressBar value={submission.score} max={100} />
      
      {submission.results && submission.results.map((res, idx) => {
        const question = questions.find(q => q._id === res.exerciseId);
        return (
          <View 
            key={res.exerciseId} 
            style={[
              styles.resultItemModern,
              res.isCorrect ? styles.resultCorrectModern : styles.resultIncorrectModern
            ]}
          >
            {question?.image && (
              <Image source={{ uri: question.image }} style={styles.resultImage} />
            )}
            <Text style={styles.resultQuestionModern}>
              {idx + 1}. {question?.question || 'Question'}
            </Text>
            <Text style={styles.resultYourAnswerModern}>
              Your answer: {res.selectedAnswers?.join(', ') || '-'}
            </Text>
            <Text style={styles.resultCorrectAnswerModern}>
              Correct answer: {res.correctAnswers?.join(', ') || '-'}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // Show loading spinner if loading
  if (loading) {
    return <LoadingSpinner fullScreen text="Loading test..." />;
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
  cardTitle: { fontSize: 20, fontFamily: 'Mulish-Bold', color: '#fff', textAlign: 'center' },
  userTestResult: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  userTestScore: { color: '#fff', fontFamily: 'Mulish-Bold', marginLeft: 8 },
  userTestStatus: { color: '#fff', marginLeft: 8 },
  userTestAttempt: { color: '#fff', marginLeft: 8 },
  questionContainer: { marginBottom: 20 },
  questionText: { color: '#fff', fontFamily: 'Mulish-Bold', fontSize: 16, marginBottom: 8 },
  optionButton: { backgroundColor: '#444', padding: 10, borderRadius: 6, marginBottom: 6 },
  selectedOption: { backgroundColor: '#007AFF' },
  optionText: { color: '#fff' },
  submitButton: { backgroundColor: '#28a745', borderRadius: 8, marginTop: 10 },
  submitButtonText: { color: '#fff', fontFamily: 'Mulish-Bold', fontSize: 16 },
  resultContainer: { alignItems: 'center', marginTop: 20 },
  resultText: { color: '#ffc107', fontFamily: 'Mulish-Bold', fontSize: 18, marginTop: 10 },
  resultScore: { color: '#fff', fontSize: 16, marginTop: 5 },
  resultStatus: { color: '#fff', fontSize: 16, marginTop: 5 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { color: '#007AFF', marginTop: 10 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  errorText: { color: '#ff6b6b', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  retryButton: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Mulish-Bold' },
  textInput: { backgroundColor: '#222', color: '#fff', borderRadius: 6, padding: 10, borderWidth: 1, borderColor: '#444', marginBottom: 6, fontSize: 15 },
  questionImage: { width: '100%', height: 180, marginBottom: 10, borderRadius: 8, backgroundColor: '#eee' },
  resultItem: { marginTop: 12, padding: 10, backgroundColor: '#222', borderRadius: 8 },
  resultQuestion: { color: '#fff', fontFamily: 'Mulish-Bold', fontSize: 15 },
  resultYourAnswer: { color: '#fff', marginTop: 4 },
  resultCorrectAnswer: { color: '#ffc107', marginTop: 2 },
  resultCorrect: { color: '#28a745', fontFamily: 'Mulish-Bold', marginTop: 2 },
  resultIncorrect: { color: '#ff6b6b', fontFamily: 'Mulish-Bold', marginTop: 2 },
  resultDescription: { color: '#ccc', fontSize: 13, marginTop: 8 },
  // New styles for modern result view
  resultContainerModern: { alignItems: 'center', marginTop: 10, backgroundColor: '#181818', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#333' },
  resultTextModern: { color: '#ffc107', fontFamily: 'Mulish-Bold', fontSize: 22, marginBottom: 8 },
  resultSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  resultScoreModern: { color: '#fff', fontSize: 16 },
  resultStatusModern: { color: '#fff', fontSize: 16 },
  resultDescriptionModern: { color: '#ccc', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  resultItemModern: { width: '100%', marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: '#232323', borderWidth: 1 },
  resultCorrectModern: { borderColor: '#28a745' },
  resultIncorrectModern: { borderColor: '#ff6b6b' },
  resultQuestionModern: { color: '#fff', fontFamily: 'Mulish-Bold', fontSize: 15, marginBottom: 4 },
  resultYourAnswerModern: { color: '#fff', marginTop: 2 },
  resultCorrectAnswerModern: { color: '#fff', marginTop: 2 },
  resultImage: { width: '100%', height: 120, marginBottom: 8, borderRadius: 8, backgroundColor: '#eee' },
});

export default TestScreenDetail; 