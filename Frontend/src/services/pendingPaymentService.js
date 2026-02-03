// Pending Payment Tracker Service
// Tracks payments in localStorage while user completes payment on gateway

const PENDING_PAYMENTS_KEY = 'dakshaa_pending_payments';

export const pendingPaymentService = {
  /**
   * Add a pending payment to localStorage
   * @param {Object} payment - Payment details
   */
  addPendingPayment(payment) {
    try {
      const pendingPayments = this.getPendingPayments();
      
      const newPayment = {
        ...payment,
        timestamp: new Date().toISOString(),
        status: 'PENDING'
      };
      
      pendingPayments.push(newPayment);
      localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(pendingPayments));
      
      console.log('💳 Added pending payment:', newPayment);
      return newPayment;
    } catch (error) {
      console.error('Error adding pending payment:', error);
      return null;
    }
  },

  /**
   * Get all pending payments from localStorage
   * @returns {Array} - Array of pending payments
   */
  getPendingPayments() {
    try {
      const stored = localStorage.getItem(PENDING_PAYMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return [];
    }
  },

  /**
   * Check if an event has a pending payment
   * @param {string} eventId - Event ID to check
   * @param {string} userId - User ID
   * @returns {Object|null} - Pending payment object or null
   */
  hasPendingPayment(eventId, userId) {
    const pendingPayments = this.getPendingPayments();
    return pendingPayments.find(
      payment => 
        payment.eventId === eventId && 
        payment.userId === userId &&
        payment.status === 'PENDING'
    );
  },

  /**
   * Remove a pending payment (called after successful payment)
   * @param {string} bookingId - Booking ID
   */
  removePendingPayment(bookingId) {
    try {
      const pendingPayments = this.getPendingPayments();
      const filtered = pendingPayments.filter(p => p.bookingId !== bookingId);
      localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(filtered));

    } catch (error) {
      console.error('Error removing pending payment:', error);
    }
  },

  /**
   * Clear all pending payments for a user
   * @param {string} userId - User ID
   */
  clearUserPendingPayments(userId) {
    try {
      const pendingPayments = this.getPendingPayments();
      const filtered = pendingPayments.filter(p => p.userId !== userId);
      localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(filtered));

    } catch (error) {
      console.error('Error clearing pending payments:', error);
    }
  },

  /**
   * Clear expired pending payments (older than 30 minutes)
   */
  clearExpiredPayments() {
    try {
      const pendingPayments = this.getPendingPayments();
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      const filtered = pendingPayments.filter(payment => {
        const paymentTime = new Date(payment.timestamp);
        return paymentTime > thirtyMinutesAgo;
      });
      
      localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(filtered));

    } catch (error) {
      console.error('Error clearing expired payments:', error);
    }
  },

  /**
   * Check and update payment status from database (with debounce)
   * @param {Object} supabase - Supabase client
   * @param {string} userId - User ID
   */
  async syncWithDatabase(supabase, userId) {
    try {
      const pendingPayments = this.getPendingPayments();
      const userPending = pendingPayments.filter(p => p.userId === userId);
      
      if (userPending.length === 0) return;

      // Check if we synced recently (within 30 seconds) to avoid spamming
      const lastSyncKey = `pending_payment_sync_${userId}`;
      const lastSync = sessionStorage.getItem(lastSyncKey);
      if (lastSync) {
        const timeSinceSync = Date.now() - parseInt(lastSync);
        if (timeSinceSync < 30000) { // 30 seconds debounce
          console.log('⏭️ Skipping pending payment sync (synced recently)');
          return;
        }
      }
      
      // Mark sync time
      sessionStorage.setItem(lastSyncKey, Date.now().toString());

      // Check payment status for each pending payment
      for (const payment of userPending) {
        const { data, error } = await supabase
          .from('event_registrations_config')
          .select('payment_status')
          .eq('id', payment.bookingId)
          .single();

        if (!error && data && data.payment_status === 'PAID') {
          // Payment completed, remove from pending
          this.removePendingPayment(payment.bookingId);
        }
      }
    } catch (error) {
      console.error('Error syncing pending payments:', error);
    }
  }
};

export default pendingPaymentService;
