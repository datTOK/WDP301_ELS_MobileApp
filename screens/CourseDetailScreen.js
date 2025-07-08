import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { Card } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:4000/api';

const CourseDetailScreen = ({ route }) => {
  const { courseId } = route.params;
  const { userToken } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const lessonsResponse = await fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      });
      const lessonsData = await lessonsResponse.json();
      if (!lessonsResponse.ok) {
        throw new Error(lessonsData.message || 'Failed to fetch lessons');
      }
      const lessons = lessonsData.data || [];

      const lessonsWithDetails = await Promise.all(
        lessons.map(async (lesson) => {
          const lessonResponse = await fetch(`${API_BASE_URL}/lessons/${lesson._id}`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
          });
          const grammarResponse = await fetch(`${API_BASE_URL}/lessons/${lesson._id}/grammars`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
          });
          const vocabResponse = await fetch(`${API_BASE_URL}/lessons/${lesson._id}/vocabularies`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
          });
          const exerciseResponse = await fetch(`${API_BASE_URL}/exercises/${lesson._id}/lesson`, {
            headers: { 'Authorization': `Bearer ${userToken}` },
          });

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId, userToken]);

  const renderLesson = ({ item }) => (
    <Card containerStyle={styles.card}>
      <Card.Title>{item.name}</Card.Title>
      <Text style={styles.description}>{item.description}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lesson Content</Text>

        {item.grammars.length > 0 ? (
          item.grammars.map((grammar, index) => (
            <View key={index} style={styles.item}>
              <Text style={styles.itemTitle}>{grammar.title}</Text>
              <Text>Structure: {grammar.structure}</Text>
              <Text>Example: {grammar.example}</Text>
              <Text>Explanation: {grammar.explanation}</Text>
            </View>
          ))
        ) : (
          <Text>No grammars available</Text>
        )}

        {item.vocabularies.length > 0 ? (
          item.vocabularies.map((vocab, index) => (
            <View key={index} style={styles.item}>
              <Text>{vocab.englishContent} - {vocab.vietnameseContent}</Text>
              {vocab.imageUrl && <Image source={{ uri: vocab.imageUrl }} style={styles.image} />}
            </View>
          ))
        ) : (
          <Text>No vocabularies available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Content</Text>
        {item.exercises.length > 0 ? (
          item.exercises.map((exercise, index) => (
            <View key={index} style={styles.item}>
              <Text>{exercise.question}</Text>
              {exercise.options && exercise.options.length > 0 && (
                <Text>Options: {exercise.options.join(', ')}</Text>
              )}
              <Text>Answer: {exercise.answer.join(', ')}</Text>
              <Text>Explanation: {exercise.explanation}</Text>
            </View>
          ))
        ) : (
          <Text>No exercises available</Text>
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
      </View>
    );
  }

  return (
    <FlatList
      data={lessons}
      renderItem={renderLesson}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 10,
    margin: 10,
    padding: 15,
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  item: {
    marginBottom: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 5,
    borderRadius: 5,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});

export default CourseDetailScreen;