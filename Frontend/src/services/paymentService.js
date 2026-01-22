import { supabase } from '../supabase';

// Use localhost for development, ngrok for production/testing
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Payment Service
 * Manages unified payment transactions with local payment gateway
 */
const paymentService = {
  /**
   * Initiate payment with local payment gateway
   */
  initiatePayment: async ({
    userId,
    bookingId,
    bookingType, // 'accommodation', 'lunch', 'event', 'combo'
    amount,
  }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          booking_id: bookingId,
          booking_type: bookingType,
          amount: amount,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      return {
        success: true,
        payment_data: result.payment_data,
        transaction_id: result.transaction_id,
      };
    } catch (error) {
      console.error('Error initiating payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Create a payment transaction record (legacy - keeping for compatibility)
   */
  createPaymentTransaction: async ({
    userId,
    transactionType, // 'EVENT' | 'COMBO' | 'ACCOMMODATION' | 'LUNCH'
    referenceId, // Purchase ID or Registration ID
    amount,
    currency = 'INR',
  }) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          transaction_type: transactionType,
          reference_id: referenceId,
          amount: amount,
          currency: currency,
          payment_status: 'INITIATED',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        transactionId: data.id,
      };
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update payment status after gateway callback
   */
  updatePaymentStatus: async (transactionId, status, gatewayData = {}) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .update({
          payment_status: status,
          gateway_transaction_id: gatewayData.transactionId,
          gateway_order_id: gatewayData.orderId,
          payment_method: gatewayData.method,
          payment_gateway: gatewayData.gateway,
          metadata: gatewayData.metadata || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error updating payment status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user's payment history
   */
  getUserPaymentHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Get payment transaction by ID
   */
  getPaymentTransaction: async (transactionId) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get payment transactions by reference ID
   */
  getPaymentsByReference: async (referenceId) => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference_id', referenceId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching payments by reference:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Initiate Razorpay payment (legacy - replaced with initiatePayment)
   * Returns order details for frontend to open Razorpay modal
   */
  initiateRazorpayPayment: async ({
    amount,
    purchaseId,
    userId,
    transactionType = 'COMBO',
    description = '',
  }) => {
    try {
      // Use new payment gateway instead
      return await paymentService.initiatePayment({
        userId,
        bookingId: purchaseId,
        bookingType: transactionType.toLowerCase(),
        amount,
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Handle payment success callback
   */
  handlePaymentSuccess: async ({
    orderId,
    transactionId,
    paymentMethod = 'gateway',
    gatewayResponse = {},
  }) => {
    try {
      // Backend callback handler will update the status
      // This is just for frontend confirmation
      return {
        success: true,
        message: 'Payment recorded successfully',
        orderId,
        transactionId,
      };
    } catch (error) {
      console.error('Error handling payment success:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Handle payment failure
   */
  handlePaymentFailure: async (transactionId, errorDetails) => {
    try {
      const updateResult = await paymentService.updatePaymentStatus(
        transactionId,
        'FAILED',
        {
          metadata: {
            error: errorDetails,
          },
        }
      );

      return updateResult;
    } catch (error) {
      console.error('Error handling payment failure:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
  
  /**
   * Initiate team payment
   */
  initiateTeamPayment: async ({
    userId,
    eventId,
    teamName,
    memberCount,
    amount, // Optional, backend recalculates
  }) => {
    try {
      // Use the main payment/initiate endpoint which now handles team logic
      const response = await fetch(`${BACKEND_URL}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          booking_type: 'team',
          // team_id is null for new team
          team_name: teamName,
          event_id: eventId,
          member_count: memberCount,
          amount: amount, 
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      // Result should contain payment_url from the custom gateway response
      // Structure based on server.js: 
      // res.json({ success: true, payment_url: paymentUrl, transaction_id: ... })
      return {
        success: true,
        payment_url: result.payment_url || result.data?.payment_url || result.payment_data?.payment_url,
        transaction_id: result.transaction_id
      };
    } catch (error) {
      console.error('Error initiating team payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Verify team payment (Legacy/Razorpay - Deprecated)
   * The custom gateway handles verification via callback
   */
  verifyTeamPayment: async () => {
     console.warn("verifyTeamPayment is deprecated. Verification happens via backend callback.");
     return { success: true };
  },
};

export default paymentService;
