import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import PaymentModal from '../components/PaymentModal';
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
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[localStyles.detailText, { color: theme.colors.textSecondary }]}>
            {formatDuration(membership.duration)}
          </Text>
        </View>
        <View style={localStyles.detailRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[localStyles.detailText, { color: theme.colors.textSecondary }]}>
            Full access to all courses
          </Text>
        </View>
        <View style={localStyles.detailRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[localStyles.detailText, { color: theme.colors.textSecondary }]}>
            Priority support
          </Text>
        </View>
      </View>

      {/* Price */}
      <View style={localStyles.priceContainer}>
        <Text style={[localStyles.price, { color: theme.colors.text }]}>
          {formatPrice(membership.price)}
        </Text>
      </View>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={[
          localStyles.subscribeButton,
          { backgroundColor: cardColor },
        ]}
        onPress={() => onSubscribe(membership)}
        activeOpacity={0.8}
      >
        <Text style={[localStyles.subscribeButtonText, { color: 'white' }]}>
          Subscribe Now
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function MembershipScreen() {
  const { userToken } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const styles = createGlobalStyles(theme);

  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      
      const { data } = apiUtils.parseResponse(response);
      setMemberships(data || []);
    } catch (error) {
      console.error('Error fetching memberships:', error);
      setError(error.message || 'Failed to load memberships');
      showToast(error.message || 'Failed to load memberships', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMemberships();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemberships();
  };

  const handleSubscribe = (membership) => {
    if (!userToken) {
      showToast('Please log in to subscribe to a membership plan', 'warning');
      return;
    }
    
    setSelectedMembership(membership);
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentModalVisible(false);
    setSelectedMembership(null);
    showToast('Payment successful! Your membership has been activated.', 'success');
    // Optionally refresh user data or navigate to a success screen
  };

  const handlePaymentModalClose = () => {
    setPaymentModalVisible(false);
    setSelectedMembership(null);
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
            { backgroundColor: theme.colors.cardBackground },
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
          <View style={localStyles.headerContent}>
            <View>
              <View style={localStyles.titleContainer}>
                <Ionicons name="diamond-outline" size={28} color="#10b981" style={localStyles.titleIcon} />
                <Text style={[styles.title, { color: theme.colors.text, marginBottom: 0 }]}>
                  Membership Plans
                </Text>
              </View>
              <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
                Choose the perfect plan to enhance your learning
              </Text>
            </View>
          </View>
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
              <View style={[styles.emptyContainer, localStyles.emptyContainer]}>
                <Ionicons name="diamond-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No Memberships Available
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Check back later for new membership plans
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={paymentModalVisible}
        onClose={handlePaymentModalClose}
        membership={selectedMembership}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 8,
  },
  membershipContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 16,
  },
  membershipCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeader: {
    marginBottom: 16,
  },
  membershipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  membershipName: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  membershipDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  membershipDetails: {
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
  },
  priceContainer: {
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontFamily: 'Mulish-Bold',
  },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  errorContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
});
