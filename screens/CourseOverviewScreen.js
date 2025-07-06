import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert, Image } from 'react-native';
import { Card, Button } from 'react-native-elements';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:4000/api';

const CourseOverviewScreen = ({ route, navigation }) => {
    const { courseId } = route.params;
    const { userToken } = useAuth();
    const [courseInfo, setCourseInfo] = useState({
        title: '',
        description: '',
        numLessons: 0,
        totalTests: 0,
    });
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);

    // Fetch userId from AsyncStorage on component mount
    useEffect(() => {
        const getUserId = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                if (storedUserId) {
                    setUserId(storedUserId);
                } else {
                    setError('User ID not found in storage.');
                }
            } catch (err) {
                setError('Failed to retrieve user ID from storage.');
            }
        };
        getUserId();
    }, []);

    const fetchData = useCallback(async () => {
        if (!userId) {
            setError('User ID is required to fetch data.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            // Fetch course details, lessons, enrollment status, and tests concurrently
            const [courseResponse, lessonsResponse, userCourseResponse, testsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                }),
                fetch(`${API_BASE_URL}/courses/${courseId}/lessons`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                }),
                fetch(`${API_BASE_URL}/user-courses/${courseId}/course`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                }),
                fetch(`${API_BASE_URL}/tests/${courseId}/course`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                }),
            ]);

            const courseData = await courseResponse.json();
            const lessonsData = await lessonsResponse.json();
            const userCourseData = await userCourseResponse.json();
            const testsData = await testsResponse.json();

            // Check for errors in responses
            if (!courseResponse.ok || !lessonsResponse.ok || !userCourseResponse.ok || !testsResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const course = courseData.course;
            const lessons = lessonsData.data || [];
            const tests = testsData.data || [];

            setIsEnrolled(!!userCourseData.data);

            // const imageUrl = course.imageUrl || null;

            const totalTests = tests.length;

            setCourseInfo({
                title: course.name,
                description: course.description,
                numLessons: lessons.length,
                totalTests,
                // imageUrl,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [courseId, userToken, userId]);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [fetchData, userId]);

    const enrollInCourse = async () => {
        if (!userId) {
            Alert.alert('Error', 'User ID is required to enroll.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/user-courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({ courseId, userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to enroll');
            }
            console.log(response.data)
            setIsEnrolled(true);
            Alert.alert('Success', 'You have enrolled in the course.');
        } catch (err) {
            Alert.alert('Error', err.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Button
                    title="Retry"
                    onPress={fetchData}
                    buttonStyle={styles.retryButton}
                    titleStyle={styles.retryButtonText}
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Card containerStyle={styles.card}>
                {/* {courseInfo.imageUrl && (
                    <Image source={{ uri: courseInfo.imageUrl }} style={styles.image} />
                )} */}
                <Card.Title style={styles.title}>{courseInfo.title}</Card.Title>
                <Card.Divider />
                <Text style={styles.description}>{courseInfo.description}</Text>
                <Text style={styles.info}>Number of Lessons: {courseInfo.numLessons}</Text>
                <Text style={styles.info}>Total Number of Tests: {courseInfo.totalTests}</Text>
                <Button
                    title={isEnrolled ? 'Go to course' : 'Enroll'}
                    buttonStyle={styles.button}
                    onPress={isEnrolled ? () => navigation.navigate('CourseDetail', { courseId }) : enrollInCourse}
                />
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    card: {
        borderRadius: 12,
        margin: 15,
        backgroundColor: '#2a2a2a',
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 10,
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    description: { fontSize: 16, color: '#ccc', marginVertical: 10 },
    info: { fontSize: 14, color: '#aaa', marginBottom: 10 },
    button: { backgroundColor: '#007bff', borderRadius: 8, marginTop: 15 },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#ff6b6b', fontSize: 16, marginBottom: 20 },
    retryButton: { backgroundColor: '#007bff', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default CourseOverviewScreen;