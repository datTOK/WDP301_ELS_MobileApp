import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
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
    const [enrollLoading, setEnrollLoading] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('userId');
                if (storedUserId) {
                    setUserId(storedUserId);
                } else {
                    setError('User ID not found in storage.');
                }
            } catch (err) {
                setError('Failed to retrieve user data from storage.');
            }
        };
        initialize();
    }, [courseId]);

    const fetchData = useCallback(async () => {
        if (!userId) {
            setError('User ID is required to fetch data.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // First, check enrollment status
            const enrollmentResponse = await fetch(`${API_BASE_URL}/user-courses/${courseId}/course`, {
                headers: { 'Authorization': `Bearer ${userToken}` },
            });
            if (enrollmentResponse.status === 404) {
                // Not enrolled
                setIsEnrolled(false);
                // Fetch only course info
                const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                if (!courseResponse.ok) throw new Error('Failed to fetch course info');
                const courseData = await courseResponse.json();
                const course = courseData.course;
                setCourseInfo({
                    title: course.name,
                    description: course.description,
                    numLessons: 0,
                    totalTests: 0,
                });
                setLoading(false);
                return;
            } else if (enrollmentResponse.status === 200) {
                // Enrolled
                setIsEnrolled(true);
                // Fetch only course info
                const courseResponse = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${userToken}` },
                });
                if (!courseResponse.ok) throw new Error('Failed to fetch course info');
                const courseData = await courseResponse.json();
                const course = courseData.course;
                setCourseInfo({
                    title: course.name,
                    description: course.description,
                    numLessons: 0,
                    totalTests: 0,
                });
                setLoading(false);
                return;
            } else {
                throw new Error('Failed to check enrollment status');
            }
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
        setEnrollLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/user-courses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
                body: JSON.stringify({ courseId, userId }),
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to enroll');
            }
            setIsEnrolled(true);
            Alert.alert('Success', 'You have enrolled in the course.');
            fetchData();
        } catch (err) {
            Alert.alert('Error', err.message);
        } finally {
            setEnrollLoading(false);
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
                <Card.Title style={styles.title}>{courseInfo.title}</Card.Title>
                <Card.Divider />
                <Text style={styles.description}>{courseInfo.description}</Text>
                <Text style={styles.info}>Number of Lessons: {courseInfo.numLessons}</Text>
                <Text style={styles.info}>Total Number of Tests: {courseInfo.totalTests}</Text>
                <Button
                    title={isEnrolled ? 'Go to course' : 'Enroll'}
                    buttonStyle={styles.button}
                    onPress={isEnrolled ? () => navigation.navigate('CourseLesson', { courseId, courseName: courseInfo.title }) : enrollInCourse}
                    disabled={enrollLoading}
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
        width: '100',
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