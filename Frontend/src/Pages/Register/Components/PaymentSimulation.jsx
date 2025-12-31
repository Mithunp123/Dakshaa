import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../supabase';
import toast from 'react-hot-toast';

/**
 * TEMPORARY PAYMENT SIMULATION PAGE
 * 
 * This page simulates a payment gateway for temporary use.
 * When real payment integration (Razorpay/Stripe) is ready:
 * 
 * TO REMOVE THIS SIMULATION:
 * 1. In RegistrationForm.jsx, find "PAYMENT_SIMULATION_ENABLED"
 * 2. Set it to false
 * 3. Delete this file
 * 
 * That's it! The flow will proceed directly to registration.
 */

const PaymentSimulation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  
  // Get registration data passed from previous page
  const {
    userId,
    selectedEvents,
    registrationMode,
    selectedCombo,
    totalAmount,
    eventDetails,
    userProfile
  } = location.state || {};

  // Redirect back if no data
  if (!userId || !selectedEvents) {
    navigate('/register-events');
    return null;
  }

  const handlePaymentConfirm = async () => {
    try {
      setProcessing(true);

      // Generate temporary transaction ID
      const tempTransactionId = registrationMode === 'combo' 
        ? `TEMP_COMBO_${userId.substring(0, 8)}_${Date.now()}`
        : `TEMP_${userId.substring(0, 8)}_${Date.now()}`;

      // Process registration based on mode
      if (registrationMode === 'individual') {
        // Import service dynamically to avoid circular deps
        const { supabaseService } = await import('../../../services/supabaseService');
        
        // Create registrations with PENDING status
        const registrationResults = await supabaseService.registerEvents(
          userId,
          selectedEvents,
          null,
          null
        );

        // Update to PAID with payment ID
        const registrationIds = registrationResults.map(r => r.id);
        
        await supabase
          .from('registrations')
          .update({
            payment_status: 'PAID',
            payment_id: tempTransactionId
          })
          .in('id', registrationIds);

        // Create admin notification
        const eventNames = eventDetails?.map(e => e.name).join(', ') || '';
        
        await supabase.from('admin_notifications').insert({
          type: 'NEW_REGISTRATION',
          title: 'New Event Registration',
          message: `${userProfile?.full_name || 'User'} registered for: ${eventNames}`,
          data: {
            user_id: userId,
            user_name: userProfile?.full_name,
            user_email: userProfile?.email,
            events: selectedEvents,
            event_names: eventNames,
            total_amount: totalAmount,
            registration_type: 'individual',
          },
          is_read: false,
        });

      } else if (registrationMode === 'combo') {
        // Validate combo data
        if (!selectedCombo || (!selectedCombo.id && !selectedCombo.combo_id)) {
          throw new Error('Invalid combo data. Please select a combo again.');
        }

        // Import combo service
        const comboService = await import('../../../services/comboService');
        
        // Use id or combo_id (database uses 'id' as primary key)
        const comboId = selectedCombo.id || selectedCombo.combo_id;
        
        const result = await comboService.default.purchaseCombo(
          userId,
          comboId,
          selectedEvents
        );

        if (!result.success) {
          throw new Error(result.error || 'Combo registration failed');
        }

        // Create admin notification for combo
        await supabase.from('admin_notifications').insert({
          type: 'NEW_COMBO_REGISTRATION',
          title: 'New Combo Registration',
          message: `${userProfile?.full_name || 'User'} registered for combo: ${selectedCombo.name || selectedCombo.combo_name}`,
          data: {
            user_id: userId,
            user_name: userProfile?.full_name,
            user_email: userProfile?.email,
            combo_id: selectedCombo.id || selectedCombo.combo_id,
            combo_name: selectedCombo.name || selectedCombo.combo_name,
            events: selectedEvents,
            total_amount: totalAmount,
            registration_type: 'combo',
          },
          is_read: false,
        });
      }

      // Show success message
      toast.success('Payment successful! Registration confirmed.', {
        duration: 3000,
        icon: '✅',
      });

      // Redirect to success page
      navigate('/register-events', { 
        state: { 
          registrationSuccess: true,
          registrationMode,
          totalAmount 
        } 
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed. Please try again.', {
        duration: 4000,
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CreditCard size={32} className="text-blue-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white">Payment Gateway</h2>
          <p className="text-blue-100 text-sm mt-2">Simulation Mode</p>
        </div>

        {/* Payment Details */}
        <div className="p-6 space-y-6">
          {/* Amount */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2">Total Amount</p>
            <p className="text-4xl font-bold text-white">₹{totalAmount}</p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Registration Type</span>
                <span className="text-white font-semibold capitalize">{registrationMode}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Events Selected</span>
                <span className="text-white font-semibold">{selectedEvents?.length}</span>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <Lock size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-300">Secure Payment</p>
              <p className="text-xs text-gray-400 mt-1">
                This is a simulation. In production, this will be replaced with a real payment gateway.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePaymentConfirm}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Confirm Payment
                </>
              )}
            </motion.button>

            <button
              onClick={() => navigate(-1)}
              disabled={processing}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            💡 This is a temporary payment simulation. Click "Confirm Payment" to complete registration.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSimulation;
