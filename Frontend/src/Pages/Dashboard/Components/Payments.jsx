import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  History, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Wallet,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { getUserTransactions } from '../../../services/dashboardService';

const Payments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  // Set up real-time subscription for payment updates
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel(`user-payments-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Payment update detected:', payload);
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const fetchPayments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setUserId(user.id);
        const result = await getUserTransactions();
        if (result.success) {
          setTransactions(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = transactions
    .filter(t => t.status?.toUpperCase() === 'SUCCESS')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

  const successfulPayments = transactions.filter(t => t.status?.toUpperCase() === 'SUCCESS').length;
  const pendingPayments = transactions.filter(t => t.status?.toUpperCase() === 'PENDING' || t.status?.toUpperCase() === 'INITIATED').length;

  const getStatusStyles = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'SUCCESS': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'PAID': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'INITIATED': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'FAILED': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getBookingTypeLabel = (type) => {
    const types = {
      'event': 'Event',
      'combo': 'Combo',
      'accommodation': 'Accommodation',
      'lunch': 'Lunch',
      'team': 'Team Event',
      'mixed_registration': 'Mixed Registration'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-secondary/20 to-primary/20 border border-white/10 p-6 rounded-3xl"
        >
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <Wallet className="text-secondary" size={24} />
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Spent</p>
          <h3 className="text-3xl font-bold mt-1">₹{totalSpent}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 className="text-green-500" size={24} />
          </div>
          <p className="text-gray-400 text-sm font-medium">Successful Payments</p>
          <h3 className="text-3xl font-bold mt-1">{successfulPayments}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl"
        >
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="text-yellow-500" size={24} />
          </div>
          <p className="text-gray-400 text-sm font-medium">Pending Approvals</p>
          <h3 className="text-3xl font-bold mt-1">{pendingPayments}</h3>
        </motion.div>
      </div>

      {/* Cash Approval Info */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle className="text-yellow-500" size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-lg font-bold text-yellow-500">Cash Payment Information</h4>
          <p className="text-sm text-gray-400 mt-1">
            If you've paid via cash at the registration desk, please wait for the admin to approve your transaction. 
            Your Attendance QR will be unlocked automatically once approved.
          </p>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History className="text-secondary" size={20} />
            Transaction History
          </h3>
        </div>
        
        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="p-6 font-medium">Transaction ID</th>
                <th className="p-6 font-medium">Item / Event</th>
                <th className="p-6 font-medium">Amount</th>
                <th className="p-6 font-medium">Date</th>
                <th className="p-6 font-medium">Status</th>
                <th className="p-6 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 font-mono text-sm text-gray-400">{txn.transaction_id || txn.order_id || 'N/A'}</td>
                  <td className="p-6">
                    <p className="font-bold text-white">{getBookingTypeLabel(txn.booking_type)}</p>
                    <p className="text-xs text-gray-500 capitalize">{txn.payment_method || 'Online'}</p>
                  </td>
                  <td className="p-6 font-bold text-white">₹{parseFloat(txn.amount).toFixed(2)}</td>
                  <td className="p-6 text-sm text-gray-400">
                    {new Date(txn.created_at).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="p-6">
                    <button 
                      disabled={txn.status?.toUpperCase() !== 'SUCCESS'}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-secondary disabled:opacity-30"
                      title="Download Receipt"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden divide-y divide-white/10">
          {transactions.map((txn) => (
            <div key={txn.id} className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                   <p className="text-[10px] font-mono text-gray-500 mb-1">{txn.transaction_id || txn.order_id || 'N/A'}</p>
                   <h4 className="font-bold text-white text-lg">{getBookingTypeLabel(txn.booking_type)}</h4>
                   <p className="text-xs text-gray-400 capitalize">{txn.payment_method || 'Online'}</p>
                </div>
                <div className="text-right">
                   <p className="text-xl font-bold text-white">₹{parseFloat(txn.amount).toFixed(2)}</p>
                   <p className="text-xs text-gray-500">
                     {new Date(txn.created_at).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short'
                      })}
                   </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(txn.status)}`}>
                      {txn.status}
                 </span>
                 
                 <button 
                    disabled={txn.status?.toUpperCase() !== 'SUCCESS'}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Download size={14} />
                    Receipt
                  </button>
              </div>
            </div>
          ))}
          
          {transactions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;
