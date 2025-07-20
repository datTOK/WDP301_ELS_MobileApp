import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, apiUtils } from '../services';

export default function CreateFlashcardSetScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  const handleCreate = async () => {
    if (!name.trim()) {
      showError('Please enter a name for your flashcard set');
      return;
    }

    if (!user?._id) {
      showError('You must be logged in to create a flashcard set');
      return;
    }

    setLoading(true);

    try {
      const response = await flashcardService.createFlashcardSet({
        name: name.trim(),
        description: description.trim(),
      });

      const result = apiUtils.parseResponse(response);
      showSuccess('Flashcard set created successfully!');
      
      // Navigate to the new flashcard set detail
      navigation.replace('FlashcardSetDetail', { setId: result.flashcardSet._id });
    } catch (err) {
      console.error('Error creating flashcard set:', err);
      const errorInfo = apiUtils.handleError(err);
      showError(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Creating flashcard set..." />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleCancel}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[globalStyles.title, { color: theme.colors.text, flex: 1, textAlign: 'center' }]}>
          Create Flashcard Set
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Set Name *
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.borderColor,
                color: theme.colors.text,
              },
            ]}
            placeholder="Enter flashcard set name"
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoFocus
          />
          <Text style={[styles.characterCount, { color: theme.colors.textMuted }]}>
            {name.length}/100
          </Text>
        </View>

        {/* Description Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Description
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.borderColor,
                color: theme.colors.text,
              },
            ]}
            placeholder="Enter a description for your flashcard set (optional)"
            placeholderTextColor={theme.colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { color: theme.colors.textMuted }]}>
            {description.length}/500
          </Text>
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.borderColor }]}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
              Next Steps
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              After creating your flashcard set, you can add individual flashcards with English content on the front and Vietnamese translation on the back.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.cancelButton,
            { backgroundColor: theme.colors.surfaceBackground, borderColor: theme.colors.borderColor },
          ]}
          onPress={handleCancel}
        >
          <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: name.trim() ? theme.colors.primary : theme.colors.textMuted },
          ]}
          onPress={handleCreate}
          disabled={!name.trim()}
        >
          <Ionicons name="add" size={20} color={theme.colors.buttonText} />
          <Text style={[styles.createButtonText, { color: theme.colors.buttonText }]}>
            Create Set
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerSpacer: {
    width: 40,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  textArea: {
    fontSize: 16,
    fontFamily: 'Mulish-Regular',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Mulish-Regular',
    textAlign: 'right',
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  createButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
}); 