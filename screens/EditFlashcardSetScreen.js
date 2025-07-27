import React, { useState, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { flashcardService, apiUtils } from '../services';

export default function EditFlashcardSetScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const { setId } = route.params;
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError } = useToast();
  const globalStyles = createGlobalStyles(theme);

  useEffect(() => {
    fetchFlashcardSetDetails();
  }, [setId]);

  const fetchFlashcardSetDetails = async () => {
    if (!setId) {
      showError('Flashcard set ID is required');
      navigation.goBack();
      return;
    }

    setLoading(true);

    try {
      const response = await flashcardService.getFlashcardSetById(setId);
      const result = apiUtils.parseResponse(response);
      const flashcardSet = result.data?.flashcardSet;

      if (!flashcardSet) {
        showError('Flashcard set not found');
        navigation.goBack();
        return;
      }

      // Check if user owns this flashcard set
      if (flashcardSet.userId !== user?._id) {
        showError('You can only edit your own flashcard sets');
        navigation.goBack();
        return;
      }

      setName(flashcardSet.name || '');
      setDescription(flashcardSet.description || '');
      setOriginalData({
        name: flashcardSet.name || '',
        description: flashcardSet.description || '',
      });
    } catch (err) {
      console.error('Error fetching flashcard set details:', err);
      const errorInfo = apiUtils.handleError(err);
      showError(errorInfo.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      showError('Please enter a name for your flashcard set');
      return;
    }

    if (!user?._id) {
      showError('You must be logged in to update a flashcard set');
      return;
    }

    // Check if there are any changes
    if (name.trim() === originalData.name && description.trim() === originalData.description) {
      showError('No changes detected');
      return;
    }

    setSubmitting(true);

    try {
      const response = await flashcardService.updateFlashcardSet(setId, {
        name: name.trim(),
        description: description.trim(),
      });

      const result = apiUtils.parseResponse(response);
      showSuccess('Flashcard set updated successfully!');
      
      // Navigate back to the flashcard set detail with success flag
      navigation.goBack();
    } catch (err) {
      console.error('Error updating flashcard set:', err);
      const errorInfo = apiUtils.handleError(err);
      showError(errorInfo.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = name.trim() !== originalData.name || description.trim() !== originalData.description;
    
    if (hasChanges) {
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

  const hasChanges = () => {
    return name.trim() !== originalData.name || description.trim() !== originalData.description;
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading flashcard set..." />;
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
          Edit Flashcard Set
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
              Edit Information
            </Text>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              Update your flashcard set name and description. The changes will be saved immediately when you tap "Update Set".
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
            styles.updateButton,
            { 
              backgroundColor: hasChanges() && name.trim() 
                ? theme.colors.primary 
                : theme.colors.textMuted 
            },
          ]}
          onPress={handleUpdate}
          disabled={!hasChanges() || !name.trim() || submitting}
        >
          {submitting ? (
            <LoadingSpinner size="small" color={theme.colors.buttonText} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={theme.colors.buttonText} />
              <Text style={[styles.updateButtonText, { color: theme.colors.buttonText }]}>
                Update Set
              </Text>
            </>
          )}
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
  updateButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
}); 