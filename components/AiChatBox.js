// components/AIChatBot.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Text,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext'; 
import { askAiTutor } from '../services/aiService';


const AIChatBot = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]); // [{type: 'user' | 'ai', text: '...'}]
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast(); 
  const { userToken } = useAuth(); 
  const flatListRef = useRef(null);

  // Scroll to bottom of chat whenever conversation changes
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  useEffect(() => {
    if(modalVisible && conversation.length === 0) {
        setConversation([
            { type: 'ai', text: 'Hello! I am your English tutor AI. How can I assist you today?' },
        ]);  
    }
  }, [modalVisible]);

  // Function to clear the entire chat conversation
  const clearConversation = () => {
    setConversation([]);
    setQuestion('');
  };

  // Function to handle sending a question to the AI tutor
  const handleAskAI = async () => {
    // Check if the question input is empty
    if (!question.trim()) {
      showToast('Please enter a question.', 'info');
      return;
    }

    // Check if the user is authenticated (has a token)
    if (!userToken) {
      showToast('Authentication Required: Please log in to use the AI tutor.', 'error');
      return;
    }

    const userQuestion = question.trim(); // Get the trimmed question
    setConversation((prev) => [...prev, { type: 'user', text: userQuestion }]);
    setQuestion(''); // Clear the input field immediately after sending

    setLoading(true); // Set loading state to true while waiting for AI response
    try {
      const response = await askAiTutor(userQuestion); 
      console.log('AI Tutor Raw Response (Frontend):', response);

      // Ensure 'response' property exists in the successful data
      if (response && typeof response.response === 'string') {
        const aiResponse = response.response;
        setConversation((prev) => [...prev, { type: 'ai', text: aiResponse }]);
      } else {
        // If the structure is not as expected, treat it as an error
        console.error('AI Tutor Response structure unexpected:', response);
        throw { statusCode: 500, error: 'Unexpected AI response format.' }; // Throw a custom error
      }
    } catch (error) {
      // Log the full error object to understand its structure
      console.error('Error caught in handleAskAI:', error);

      let errorMessage = 'Failed to get response from AI. Please try again later.';
      let statusCode = error.statusCode || error.response?.status; // Check both direct statusCode and axios response status

      if (statusCode === 400) {
        errorMessage = error.error || error.response?.data?.error || 'Invalid request to AI tutor.';
      } else if (statusCode === 401 || statusCode === 403) {
        errorMessage = error.error || error.response?.data?.error || 'Unauthorized to access AI tutor. Please log in again.';
      } else if (statusCode === 500) {
        errorMessage = error.error || error.response?.data?.error || 'AI tutor is currently unavailable. Please try again later.';
      } else if (error.message) { // Catch generic JS errors or network errors
        errorMessage = error.message;
      }

      setConversation((prev) => [...prev, { type: 'error', text: errorMessage }]);
      showToast(`AI Error: ${errorMessage}`, 'error');
    } finally {
      setLoading(false); // Set loading state to false after response or error
    }
  };

  // Render function for individual chat messages
  const renderMessage = ({ item }) => (
    <View style={[styles.messageBubble, item.type === 'user' ? styles.userBubble : styles.aiBubble]}>
      <Text style={item.type === 'user' ? styles.userText : styles.aiText}>
        {item.text}
      </Text>
      {item.type === 'error' && (
        <Ionicons name="warning-outline" size={16} color="#e74c3c" style={{ marginLeft: 5 }} />
      )}
    </View>
  );

  return (
    <>
      {/* Floating Action Button to open the chat modal */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="chatbox-ellipses" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} 
          >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>English Tutor AI</Text>
              <View style={styles.headerRightButtons}>
                {/* Button to clear the conversation */}
                <TouchableOpacity onPress={clearConversation} style={styles.clearButton}>
                  <Ionicons name="trash-bin-outline" size={24} color="#ededed" />
                </TouchableOpacity>
                {/* Button to close the modal */}
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={30} color="#ededed" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Conversation Area (FlatList) */}
            <FlatList
              ref={flatListRef}
              data={conversation}
              renderItem={renderMessage}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.conversationContainer}
              inverted={false} // Display new messages at the bottom
            />

            {/* Loading Indicator when AI is thinking */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4CC2FF" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}

            {/* Input Container for typing and sending messages */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me about English (grammar, vocab, pronunciation)..."
                placeholderTextColor="#999"
                value={question}
                onChangeText={setQuestion}
                multiline
              />
              {/* Send Button */}
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleAskAI}
                disabled={loading || !question.trim()} // Disable if loading or input is empty
              >
                <Ionicons name="send" size={24} color={loading || !question.trim() ? '#AAAAAA' : '#4CC2FF'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20, 
    right: 20,
    backgroundColor: '#4CC2FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1000, 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#202020',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2B2B2B',
  },
  chatTitle: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
    color: '#ededed',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    padding: 5,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  conversationContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-start', 
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4CC2FF',
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
    borderBottomLeftRadius: 2,
  },
  userText: {
    color: '#fff',
    fontFamily: 'Mulish-Regular',
    fontSize: 16,
  },
  aiText: {
    color: '#ededed',
    fontFamily: 'Mulish-Regular',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#2B2B2B',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#ededed',
    fontFamily: 'Mulish-Regular',
    maxHeight: 120, 
    marginRight: 10,
  },
  sendButton: {
    padding: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#2B2B2B',
  },
  loadingText: {
    color: '#ededed',
    marginLeft: 10,
    fontFamily: 'Mulish-Regular',
  },
});

export default AIChatBot;
