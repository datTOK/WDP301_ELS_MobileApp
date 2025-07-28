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
    const [recommendationsLoaded, setRecommendationsLoaded] = useState(false);
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false); 
    const [error, setError] = useState(null);

    // Function to fetch recommendations
    const fetchRecommendations = async () => {
        if (!user || !user._id) {
            setError("User ID not available. Please log in.");
            showToast('User ID not found.', 'error');
            return;
        }

        try {
            setLoading(true);
            setError(null); 
            const data = await getAiRecommendations(user._id);
            setRecommendations(data.response);
            setRecommendationsLoaded(true); // Set to true once loaded successfully
            showToast('Recommendations loaded successfully!', 'success');
        } catch (err) {
            console.error("Failed to fetch AI recommendations:", err);
            setError("AI is currently unavailable. Please try again later.");
            showToast("AI is busy. Please try again later.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const renderCard = (title, content, iconName, tintColor) => (
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.cardHeader}>
                <Ionicons name={iconName} size={24} color={tintColor || theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: tintColor || theme.colors.text }]}>{title}</Text>
            </View>
            <View style={styles.cardContent}>
                {Array.isArray(content) && content.length > 0 ? (
                    content.map((item, index) => (
                        <Text key={`${title.toLowerCase()}-${index}`} style={[styles.listItem, { color: theme.colors.text }]}>
                            • {item}
                        </Text>
                    ))
                ) : typeof content === 'string' ? (
                    <Text style={[styles.bodyText, { color: theme.colors.text }]}>{content}</Text>
                ) : (
                    <Text style={[styles.bodyText, { color: theme.colors.text }]}>No {title.toLowerCase()} identified yet.</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleGoBack}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="barbell-outline" size={24} color="#e472d1ff" />
                    <Text style={[styles.title, { color: theme.colors.text }]}>AI Recommendations</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {!recommendationsLoaded && !loading && !error && (
                    <View style={styles.initialPromptContainer}>
                        <Ionicons name="sparkles-outline" size={60} color={theme.colors.primary} />
                        <Text style={[styles.initialPromptText, { color: theme.colors.text }]}>
                            Tap the button below to get your personalized AI recommendations!
                        </Text>
                        <TouchableOpacity
                            style={[styles.loadButton, { backgroundColor: theme.colors.primary }]}
                            onPress={fetchRecommendations}
                            disabled={loading} 
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.loadButtonText}>Get My Recommendations</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading indicator (only shown if recommendationsLoaded is false but loading is true) */}
                {loading && !recommendationsLoaded && (
                    <View style={styles.statusContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.statusText, { color: theme.colors.text }]}>Loading recommendations...</Text>
                    </View>
                )}

                {/* Error message display (only shown if recommendationsLoaded is false and there's an error) */}
                {error && !recommendationsLoaded && (
                    <View style={styles.statusContainer}>
                        <Ionicons name="alert-circle-outline" size={32} color={theme.colors.error} />
                        <Text style={[styles.statusText, { color: theme.colors.error }]}>{error}</Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                            onPress={fetchRecommendations}
                            disabled={loading}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Display recommendations if available and loaded */}
                {recommendationsLoaded && recommendations && !loading && !error && (
                    <View style={styles.recommendationsContainer}>
                        {renderCard("Summary", recommendations.summary, "information-circle-outline")}
                        {renderCard("Strengths", recommendations.strengths, "happy-outline", "green")}
                        {renderCard("Areas for Improvement", recommendations.weaknesses, "sad-outline", "red")}
                        {renderCard("Recommendations", recommendations.recommendations, "bulb-outline", theme.colors.accent)}
                    </View>
                )}
                {recommendationsLoaded && (
                    <TouchableOpacity
                        style={[styles.refetchButton, { backgroundColor: theme.colors.secondary }]}
                        onPress={fetchRecommendations}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.refetchButtonText}>Refresh Recommendations</Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        borderBottomWidth: 1,
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
        fontFamily: 'Mulish-Regular',
    },
    // Styles for the initial prompt and load button
    initialPromptContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
        paddingHorizontal: 20,
    },
    initialPromptText: {
        fontSize: 18,
        fontFamily: 'Mulish-Regular',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 26,
    },
    loadButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 220, 
    },
    loadButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Mulish-Bold',
    },
    retryButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Mulish-Bold',
    },
    recommendationsContainer: {
        paddingVertical: 10,
    },
    card: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    cardTitle: {
        fontSize: 20,
        fontFamily: 'Mulish-Bold',
        marginLeft: 10,
    },
    cardContent: {
    },
    bodyText: {
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        lineHeight: 24,
    },
    listItem: {
        fontSize: 16,
        fontFamily: 'Mulish-Regular',
        marginLeft: 10,
        marginBottom: 5,
        lineHeight: 22,
    },
    refetchButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refetchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
    },
});

export default AiRecommendationScreen;