import api, { apiUtils } from './api';

/**
 * Payment Service
 * Handles all payment-related API calls for PayPal and VNPay
 */
class PaymentService {
  /**
   * Create PayPal payment
   * @param {string} membershipId - Membership ID to purchase
   * @param {string} platform - Platform identifier ('mobile')
   * @returns {Promise<Object>} PayPal payment response with approval link
   */
  async createPayPalPayment(membershipId, platform = 'mobile') {
    try {
      const response = await api.post('/api/payments/paypal/create', {
        membershipId,
        platform
      });
      return response.data;
    } catch (error) {
      throw apiUtils.handleError(error);
    }
  }

  /**
   * Create VNPay payment
   * @param {string} membershipId - Membership ID to purchase
   * @param {string} platform - Platform identifier ('mobile')
   * @param {string} bankCode - Optional bank code for VNPay
   * @returns {Promise<Object>} VNPay payment response with payment URL
   */
  async createVNPayPayment(membershipId, platform = 'mobile', bankCode = null) {
    try {
      const payload = {
        membershipId,
        platform
      };
      
      if (bankCode) {
        payload.bankCode = bankCode;
      }

      const response = await api.post('/api/payments/vnpay/create', payload);
      return response.data;
    } catch (error) {
      throw apiUtils.handleError(error);
    }
  }

  /**
   * Get payment status from URL parameters
   * @param {string} url - Payment return URL
   * @returns {Object} Payment status information
   */
  parsePaymentReturn(url) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      // PayPal parameters
      const paypalToken = params.get('token');
      const paypalPayerId = params.get('PayerID');
      
      // VNPay parameters
      const vnpResponseCode = params.get('vnp_ResponseCode');
      const vnpTxnRef = params.get('vnp_TxnRef');
      const vnpAmount = params.get('vnp_Amount');
      const vnpOrderInfo = params.get('vnp_OrderInfo');
      
      return {
        success: paypalToken || vnpResponseCode === '00',
        paypal: {
          token: paypalToken,
          payerId: paypalPayerId
        },
        vnpay: {
          responseCode: vnpResponseCode,
          txnRef: vnpTxnRef,
          amount: vnpAmount,
          orderInfo: vnpOrderInfo
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid payment return URL'
      };
    }
  }
}

export default new PaymentService(); 