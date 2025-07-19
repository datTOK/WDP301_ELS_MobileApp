import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { createGlobalStyles } from '../utils/globalStyles';
import LoadingSpinner from '../components/LoadingSpinner';
import { membershipService, apiUtils } from '../services';

const { width } = Dimensions.get('window');

const MembershipCard = ({ membership, index, theme, onSubscribe }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Color palette similar to web frontend
  const colorPalette = [
    '#4CC2FF', // Primary blue
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
  ];

  const cardColor = colorPalette[index % colorPalette.length];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const formatDuration = (days) => {
    const months = Math.floor(days / 30);
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : `${days} days`;
  };

  return (
    <Animated.View
      style={[
        localStyles.membershipCard,
        {
          backgroundColor: theme.colors.cardBackground,
          borderColor: cardColor + '30',
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Header with colored badge */}
      <View style={localStyles.cardHeader}>
        <View
          style={[
            localStyles.membershipBadge,
            { backgroundColor: cardColor + '20' },
          ]}
        >
          <Text style={[localStyles.membershipName, { color: cardColor }]}>
            {membership.name}
          </Text>
        </View>
      </View>

      {/* Description */}
      {membership.description && (
        <Text style={[localStyles.membershipDescription, { color: theme.colors.textSecondary }]}>
          {membership.description.length > 120
            ? `${membership.description.slice(0, 120)}...`
            : membership.description}
        </Text>
      )}

      {/* Details */}
      <View style={localStyles.membershipDetails}>
        <View style={localStyles.detailRow}>
          <Text style={[localStyles.detailLabel, { color: theme.colors.textSecondary }]}>
            Duration:
          </Text>
          <Text style={[localStyles.detailValue, { color: theme.colors.text }]}>
            {formatDuration(membership.duration)}
          </Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={[localStyles.detailLabel, { color: theme.colors.textSecondary }]}>
            Price:
          </Text>
          <Text style={[localStyles.priceValue, { color: theme.colors.text }]}>
            {formatPrice(membership.price)}
          </Text>
        </View>
      </View>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={[
          localStyles.subscribeButton,
          { borderColor: cardColor + '50' },
        ]}
        onPress={() => onSubscribe(membership)}
        activeOpacity={0.8}
      >
        <Text style={[localStyles.subscribeButtonText, { color: cardColor }]}>
          Subscribe
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MembershipScreen() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { userToken } = useAuth();
  const { theme } = useTheme();
  const { showError, showSuccess, showInfo } = useToast();
  const styles = createGlobalStyles(theme);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMemberships();
    
    // Animate header
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchMemberships = async () => {
    try {
      setError(null);
      const response = await membershipService.getMemberships({
        page: 1,
        size: 10,
        order: 'asc',
        sortBy: 'price',
      });
      
      const result = apiUtils.parseResponse(response);
      
      if (result.data && Array.isArray(result.data)) {
        setMemberships(result.data);
      } else {
        setMemberships([]);
      }
    } catch (error) {
      console.error('Error fetching memberships:', error);
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      showError('Failed to load memberships');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberships();
  };

  const handleSubscribe = (membership) => {
    if (!userToken) {
      showInfo('Please log in to subscribe to a membership plan');
      return;
    }
    
    // TODO: Implement payment flow
    showInfo(`Selected ${membership.name} plan. Payment integration coming soon!`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading memberships..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={localStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View
          style={[
            localStyles.header,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Membership Plans
          </Text>
          <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
            Choose the perfect plan to enhance your English learning experience
          </Text>
        </Animated.View>

        {/* Error State */}
        {error && (
          <View style={[styles.errorContainer, localStyles.errorContainer]}>
            <Ionicons name="alert-circle" size={24} color={theme.colors.error} />
            <Text style={[styles.bodyText, { color: theme.colors.error, marginLeft: 8 }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.button, localStyles.retryButton]}
              onPress={fetchMemberships}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Membership Cards */}
        {!error && (
          <View style={localStyles.membershipContainer}>
            {memberships.length > 0 ? (
              memberships.map((membership, index) => (
                <MembershipCard
                  key={membership._id}
                  membership={membership}
                  index={index}
                  theme={theme}
                  onSubscribe={handleSubscribe}
                />
              ))
            ) : (
              <View style={[styles.card, localStyles.emptyContainer]}>
                <Ionicons name="card" size={48} color={theme.colors.textMuted} />
                <Text style={[styles.bodyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 16 }]}>
                  No membership plans available at the moment.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  membershipContainer: {
    paddingHorizontal: 16,
  },
  membershipCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  membershipBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  membershipName: {
    fontSize: 18,
    fontFamily: 'Mulish-SemiBold',
  },
  membershipDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  membershipDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  subscribeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-SemiBold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
  },
  retryButton: {
    marginLeft: 'auto',
    minWidth: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    margin: 16,
  },
});
