// AiRecommendationScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext'; 
import { useTheme } from '../context/ThemeContext'; 
import { useToast } from '../context/ToastContext'; 
import { Ionicons } from '@expo/vector-icons'; 
import { getAiRecommendations } from '../services/aiService'; 

const AiRecommendationScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { user } = useContext(AuthContext);
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Function to fetch recommendations
    const fetchRecommendations = async () => {
        if (!user || !user._id) {
            setError("User ID not available. Please log in.");
            setLoading(false);
            showToast('User ID not found.', 'error');
            return;
        }

        try {
            setLoading(true); // Set loading to true before fetching
            setError(null); // Clear any previous errors
            const data = await getAiRecommendations(user._id);
            setRecommendations(data.response); 
            showToast('Recommendations loaded successfully!', 'success');
        } catch (err) {
            console.error("Failed to fetch AI recommendations:", err);
            setError(err.error || "Failed to load recommendations. Please try again.");
            showToast(err.error || 'Failed to load recommendations.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // useEffect hook to fetch recommendations when the component mounts or user changes
    useEffect(() => {
        fetchRecommendations();
    }, [user]);

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="barbell-outline" size={24} color={theme.colors.primary} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>AI recommendations</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Loading indicator */}
                {loading && (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.statusText, { color: theme.colors.text }]}>Loading recommendations...</Text>
                    </View>
                )}

                {/* Error message display */}
                {error && !loading && (
                    <View style={styles.statusContainer}>
                        <Ionicons name="alert-circle-outline" size={32} color="red" />
                        <Text style={[styles.statusText, { color: 'red' }]}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendations}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Display recommendations if available and not loading/error */}
                {recommendations && !loading && !error && (
                    <View style={styles.recommendationsContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Summary:</Text>
                        </View>
                        <Text style={[styles.bodyText, { color: theme.colors.text }]}>{recommendations.summary}</Text>

                        <Text style={[styles.sectionTitle, { color: "green", marginTop: 20 }]}>Strengths:</Text>
                        {recommendations.strengths && recommendations.strengths.length > 0 ? (
                            recommendations.strengths.map((strength, index) => (
                                <Text key={`strength-${index}`} style={[styles.listItem, { color: theme.colors.text }]}>
                                    • {strength}
                                </Text>
                            ))
                        ) : (
                            <Text style={[styles.bodyText, { color: theme.colors.text }]}>No strengths identified yet.</Text>
                        )}

                        <Text style={[styles.sectionTitle, { color: "red", marginTop: 20 }]}>Areas for improvement:</Text>
                        {recommendations.weaknesses && recommendations.weaknesses.length > 0 ? (
                            recommendations.weaknesses.map((weakness, index) => (
                                <Text key={`weakness-${index}`} style={[styles.listItem, { color: theme.colors.text }]}>
                                    • {weakness}
                                </Text>
                            ))
                        ) : (
                            <Text style={[styles.bodyText, { color: theme.colors.text }]}>No weaknesses identified yet.</Text>
                        )}

                        <Text style={[styles.sectionTitle, { color: "yellow", marginTop: 20 }]}>Recommendations:</Text>
                        {recommendations.recommendations && recommendations.recommendations.length > 0 ? (
                            recommendations.recommendations.map((rec, index) => (
                                <Text key={`rec-${index}`} style={[styles.listItem, { color: theme.colors.text }]}>
                                    • {rec}
                                </Text>
                            ))
                        ) : (
                            <Text style={[styles.bodyText, { color: theme.colors.text }]}>No specific recommendations at this time.</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#202020', 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40, 
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1D1D1D', 
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1, 
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Mulish-Bold', 
        marginLeft: 12,
    },
    scrollContent: {
        flexGrow: 1, 
        padding: 20,
    },
    statusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    statusText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#007AFF', 
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    recommendationsContainer: {
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Mulish-Bold', 
    },
    bodyText: {
        fontSize: 16,
        fontFamily: 'Mulish-Regular', 
        lineHeight: 24, 
        marginBottom: 10,
    },
    listItem: {
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        marginLeft: 10, 
        marginBottom: 5,
    },
});

export default AiRecommendationScreen;
