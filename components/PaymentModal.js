import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { paymentService } from '../services';
import LoadingSpinner from './LoadingSpinner';

const { height } = Dimensions.get('window');

const PaymentModal = ({ 
  visible, 
  onClose, 
  membership, 
  onPaymentSuccess 
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const formatDuration = (days) => {
    const months = Math.floor(days / 30);
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : `${days} days`;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    setLoading(true);
    try {
      let paymentUrl;
      
      if (selectedMethod === 'paypal') {
        const response = await paymentService.createPayPalPayment(membership._id);
        paymentUrl = response.link;
      } else if (selectedMethod === 'vnpay') {
        const response = await paymentService.createVNPayPayment(membership._id);
        paymentUrl = response.link;
      }

      if (paymentUrl) {
        const supported = await Linking.canOpenURL(paymentUrl);
        if (supported) {
          await Linking.openURL(paymentUrl);
          onClose();
          showToast('Redirecting to payment gateway...', 'info');
        } else {
          showToast('Cannot open payment link', 'error');
        }
      } else {
        showToast('Failed to create payment', 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      showToast(error.message || 'Payment failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: 'logo-paypal',
      color: '#0070BA',
    },
    {
      id: 'vnpay',
      name: 'VNPay',
      description: 'Pay with Vietnamese banks',
      icon: 'card-outline',
      color: '#0055A4',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.cardBackground,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Complete Purchase
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Membership Summary */}
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                {membership?.name}
              </Text>
              <Text style={[styles.summaryDescription, { color: theme.colors.textSecondary }]}>
                {membership?.description}
              </Text>
              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Duration:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                    {formatDuration(membership?.duration)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Price:
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.primary, fontSize: 18 }]}>
                    {formatPrice(membership?.price)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Select Payment Method
              </Text>
              
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethod,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: selectedMethod === method.id 
                        ? method.color 
                        : theme.colors.borderColor,
                    },
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodContent}>
                    <View style={[styles.paymentIcon, { backgroundColor: method.color + '20' }]}>
                      <Ionicons name={method.icon} size={24} color={method.color} />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={[styles.paymentName, { color: theme.colors.text }]}>
                        {method.name}
                      </Text>
                      <Text style={[styles.paymentDescription, { color: theme.colors.textSecondary }]}>
                        {method.description}
                      </Text>
                    </View>
                    <View style={styles.paymentRadio}>
                      <View
                        style={[
                          styles.radioButton,
                          {
                            borderColor: selectedMethod === method.id 
                              ? method.color 
                              : theme.colors.textSecondary,
                          },
                        ]}
                      >
                        {selectedMethod === method.id && (
                          <View
                            style={[
                              styles.radioButtonInner,
                              { backgroundColor: method.color },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment Info */}
            <View style={[styles.infoCard, { backgroundColor: theme.colors.background }]}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                  Payment Information
                </Text>
              </View>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • You will be redirected to a secure payment gateway{'\n'}
                • Your payment information is encrypted and secure{'\n'}
                • Membership will be activated immediately after successful payment{'\n'}
                • You can cancel the payment at any time
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.borderColor }]}>
            <TouchableOpacity
              style={[
                styles.payButton,
                {
                  backgroundColor: selectedMethod ? theme.colors.primary : theme.colors.buttonDisabled,
                },
              ]}
              onPress={handlePayment}
              disabled={!selectedMethod || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <Text style={[styles.payButtonText, { color: 'white' }]}>
                  Pay {formatPrice(membership?.price)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    height: height * 0.85,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Mulish-Bold',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Mulish-Bold',
    marginBottom: 8,
  },
  summaryDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    marginBottom: 16,
    lineHeight: 20,
  },
  summaryDetails: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Mulish-Medium',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
  paymentSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 16,
  },
  paymentMethod: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
  },
  paymentRadio: {
    marginLeft: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoCard: {
    marginTop: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Mulish-Regular',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: 'Mulish-Bold',
  },
});

export default PaymentModal; 