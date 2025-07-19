import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, Overlay } from 'react-native-elements';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { testsAPI, apiUtils } from '../services';

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
      <View style={testItemStyles.optionsContainer}>
        {test.options && test.options.map((option, index) => (
          <View
            key={index}
            style={[
              testItemStyles.optionButton,
              test.correctAnswer === option && testItemStyles.correctOption,
            ]}
          >
            <Text style={{ color: '#fff', flex: 1 }}>{option}</Text>
            {test.correctAnswer === option && (
              <Ionicons name="checkmark-circle" size={20} color="#28a745" />
            )}
          </View>
        ))}
      </View>
      {isReadOnly && (
        <TouchableOpacity onPress={toggleAnswer} style={{ marginTop: 10 }}>
          <Text style={{ color: '#4CC2FF', textAlign: 'center' }}>
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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
    fontFamily: 'Mulish-Bold',
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
});

const TestScreen = ({ route, navigation }) => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);
  const { userToken } = useAuth();
  const { showError } = useToast();

  const openModal = (index) => {
    setSelectedTestIndex(index);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const fetchTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await testsAPI.getCourseTests(route.params?.courseId || 'default');
      const result = apiUtils.parseResponse(response);

      if (result.data && Array.isArray(result.data)) {
        setTests(result.data);
      } else {
        setTests([]);
        showError('Data Error', 'No tests found for this course.');
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      setError(errorInfo.message);
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const renderModalContent = () => {
    if (tests.length === 0) return null;

    const test = tests[selectedTestIndex];
    return (
      <View style={styles.modalContent}>
        <View style={styles.modalNavRow}>
          <TouchableOpacity onPress={closeModal}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Test {selectedTestIndex + 1}</Text>
          <View style={styles.modalNavSpacer} />
        </View>
        <View style={styles.modalBody}>
          <TestItem test={test} isReadOnly={true} />
        </View>
        <Button
          title="Take Test"
          buttonStyle={styles.closeModalButton}
          titleStyle={{ color: '#fff', fontFamily: 'Mulish-Bold' }}
          onPress={() => {
            closeModal();
            navigation.navigate('TestScreenDetail', { 
              testId: test._id, 
              testName: test.name || `Test ${selectedTestIndex + 1}` 
            });
          }}
        />
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading tests..." />;
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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Tests</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentScrollContainer}>
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Available Tests</Card.Title>
          <Text style={styles.description}>
            Test your knowledge with these interactive quizzes. Each test contains multiple-choice questions to help you assess your understanding of the course material.
          </Text>

          {tests.length > 0 ? (
            <View style={styles.testsSection}>
              <Text style={styles.sectionTitle}>Select a Test</Text>
              <View style={styles.chipRow}>
                {tests.map((test, index) => (
                  <Button
                    key={test._id || index}
                    title={`Test ${index + 1}`}
                    type="outline"
                    buttonStyle={styles.chipButton}
                    titleStyle={styles.chipTitle}
                    onPress={() => openModal(index)}
                  />
                ))}
              </View>
              <Button
                title="Take Test"
                buttonStyle={{ backgroundColor: '#28a745', borderRadius: 8, marginTop: 20 }}
                titleStyle={{ color: '#fff', fontFamily: 'Mulish-Bold' }}
                onPress={() => navigation.navigate('TestScreenDetail', { testId: tests[0]._id, testName: tests[0].name })}
              />
            </View>
          ) : (
            <View style={styles.noTestsContainer}>
              <Ionicons name="document-text-outline" size={50} color="#888" />
              <Text style={styles.noTestsText}>No tests available for this course yet.</Text>
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
    fontFamily: 'Mulish-Bold',
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
    fontFamily: 'Mulish-Bold',
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
    fontFamily: 'Mulish-Bold',
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
    fontFamily: 'Mulish-Bold',
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
    fontFamily: 'Mulish-Bold',
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
    fontFamily: 'Mulish-Bold',
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

export default TestScreen; 