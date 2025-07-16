import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button, Icon, Overlay, Chip } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { MOBILE_SERVER_URL } from '@env';


const TestItem = ({ test, isReadOnly = true }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={testItemStyles.container}>
      <View style={testItemStyles.questionContainer}>
        <Text style={testItemStyles.questionText}>{test.question}</Text>
      </View>

      {test.options && test.options.length > 0 ? (
        <View style={testItemStyles.optionsContainer}>
          {test.options.map((option, index) => (
            <View
              key={index}
              style={[
                testItemStyles.optionButton,
                option === test.answer[0] && testItemStyles.correctOption,
              ]}
            >
              <Text style={[
                testItemStyles.optionText,
                option === test.answer[0] && testItemStyles.correctOptionText,
              ]}>
                {option}
              </Text>
              {option === test.answer[0] && (
                <Ionicons name="checkmark-circle" size={20} color="#28a745" style={testItemStyles.correctIcon} />
              )}
            </View>
          ))}
        </View>
      ) : (
        <View style={testItemStyles.textAnswerContainer}>
          <Text style={testItemStyles.answerLabel}>Correct Answer:</Text>
          <Text style={testItemStyles.correctAnswerText}>
            {Array.isArray(test.answer) ? test.answer.join(', ') : test.answer}
          </Text>
        </View>
      )}

      <View style={testItemStyles.actionButtons}>
        <Button
          title={showAnswer ? "Hide Explanation" : "Show Explanation"}
          buttonStyle={testItemStyles.explanationButton}
          titleStyle={testItemStyles.explanationButtonText}
          onPress={toggleAnswer}
        />
      </View>

      {showAnswer && test.explanation && (
        <View style={testItemStyles.explanationContainer}>
          <Text style={testItemStyles.explanationText}>
            Explanation: {test.explanation}
          </Text>
        </View>
      )}
    </View>
  );
};

const TestScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { userToken } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const openModal = (index) => {
    setModalIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching tests for courseId:', courseId);
      
      const response = await fetch(`${MOBILE_SERVER_URL}api/tests/${courseId}/course`, {
        headers: { 'Authorization': `Bearer ${userToken}` },
      });

      console.log('Tests Response Status:', response.status);
      const result = await response.json();
      console.log('Tests Response Data:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch tests');
      }

      setTests(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchTests();
    }
  }, [courseId, userToken]);

  const renderModalContent = () => {
    if (!tests[modalIndex]) return null;
    const test = tests[modalIndex];

    return (
      <View style={styles.modalContent}>
        <View style={styles.modalNavRow}>
          <View style={styles.modalNavSpacer} />
          <Text style={styles.modalTitle}>Test Question {modalIndex + 1}</Text>
          <TouchableOpacity
            disabled={modalIndex === tests.length - 1}
            onPress={() => setModalIndex((i) => Math.min(tests.length - 1, i + 1))}
          >
            <Ionicons name="arrow-forward-circle" size={32} color={modalIndex === tests.length - 1 ? '#ccc' : '#007AFF'} />
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <TestItem test={test} isReadOnly={true} />
        </View>
        <Button title="Close" onPress={closeModal} buttonStyle={styles.closeModalButton} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading tests...</Text>
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
          onPress={fetchTests}
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
        <Text style={styles.headerTitle}>Course Tests</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.contentScrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>{courseName} - Tests</Card.Title>
          {/* Removed static description as per requirements */}
          
          {tests.length === 0 ? (
            <View style={styles.noTestsContainer}>
              <Ionicons name="document-text-outline" size={50} color="#ccc" />
              <Text style={styles.noTestsText}>You haven't done any test yet. Please go back and do a test.</Text>
            </View>
          ) : (
            <View style={styles.testsSection}>
              <Text style={styles.sectionTitle}>Available Tests ({tests.length})</Text>
              <View style={styles.chipRow}>
                {tests.map((test, index) => (
                  <Chip
                    key={index}
                    title={`Question ${index + 1}`}
                    buttonStyle={styles.chipButton}
                    titleStyle={styles.chipTitle}
                    onPress={() => navigation.navigate('TestScreenDetail', { testId: test._id, testName: test.name })}
                    icon={{ name: 'help-circle', type: 'feather', color: '#fff', size: 16 }}
                  />
                ))}
              </View>
              <Button
                title="Take Test"
                buttonStyle={{ backgroundColor: '#28a745', borderRadius: 8, marginTop: 20 }}
                titleStyle={{ color: '#fff', fontWeight: 'bold' }}
                onPress={() => navigation.navigate('TestScreenDetail', { testId: tests[0]._id, testName: tests[0].name })}
              />
            </View>
          )}
        </Card>

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
    width: 40,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentScrollContainer: {
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
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    marginBottom: 15,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 20,
  },
  testsSection: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#bbb',
    marginBottom: 10,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipButton: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#007AFF',
  },
  chipTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  noTestsContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noTestsText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
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
  modalNavSpacer: {
    width: 32,
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
});

const testItemStyles = StyleSheet.create({
  container: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  questionContainer: {
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 10,
  },
  optionButton: {
    backgroundColor: '#555',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  correctOption: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
    borderWidth: 2,
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  correctIcon: {
    marginLeft: 10,
  },
  textAnswerContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#28a745',
    borderRadius: 8,
  },
  answerLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  correctAnswerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    marginTop: 15,
  },
  explanationButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
  },
  explanationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  explanationContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#444',
    borderRadius: 8,
  },
  explanationText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TestScreen; 