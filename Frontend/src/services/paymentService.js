import { supabase } from '../supabase';

/**
 * Payment Service
 * Manages unified payment transactions across the platform
 */
const paymentService = {
  /**
   * Create a payment transaction record
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
   * Initiate Razorpay payment
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
      // Create payment transaction record
      const transactionResult = await paymentService.createPaymentTransaction({
        userId,
        transactionType,
        referenceId: purchaseId,
        amount,
      });

      if (!transactionResult.success) {
        throw new Error(transactionResult.error);
      }

      // In production, call backend API to create Razorpay order
      // For now, return mock order data
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return {
        success: true,
        orderId,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        transactionId: transactionResult.transactionId,
        description,
      };
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Handle Razorpay payment success callback
   */
  handleRazorpaySuccess: async ({
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    transactionId,
  }) => {
    try {
      // Update payment transaction
      const updateResult = await paymentService.updatePaymentStatus(
        transactionId,
        'PAID',
        {
          transactionId: razorpayPaymentId,
          orderId: razorpayOrderId,
          gateway: 'razorpay',
          method: 'UNKNOWN', // Will be updated from webhook
          metadata: {
            signature: razorpaySignature,
          },
        }
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error);
      }

      return {
        success: true,
        message: 'Payment recorded successfully',
      };
    } catch (error) {
      console.error('Error handling Razorpay success:', error);
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
};

export default paymentService;
