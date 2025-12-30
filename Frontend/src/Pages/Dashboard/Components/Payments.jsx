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
import { supabaseService } from '../../../services/supabaseService';

const Payments = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const data = await supabaseService.getUserRegistrations(user.id);
        setRegistrations(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = registrations
    .filter(r => r.payment_status === 'completed')
    .reduce((sum, r) => sum + (r.events?.price || 0), 0);

  const successfulPayments = registrations.filter(r => r.payment_status === 'completed').length;
  const pendingPayments = registrations.filter(r => r.payment_status === 'pending').length;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'failed': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
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
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <History className="text-secondary" size={20} />
            Transaction History
          </h3>
        </div>
        <div className="overflow-x-auto">
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
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 font-mono text-sm text-gray-400">{reg.payment_id || 'N/A'}</td>
                  <td className="p-6">
                    <p className="font-bold text-white">{reg.events?.title || 'Event'}</p>
                    <p className="text-xs text-gray-500 capitalize">{reg.events?.category}</p>
                  </td>
                  <td className="p-6 font-bold text-white">₹{reg.events?.price || 0}</td>
                  <td className="p-6 text-sm text-gray-400">
                    {new Date(reg.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyles(reg.payment_status)}`}>
                      {reg.payment_status}
                    </span>
                  </td>
                  <td className="p-6">
                    <button 
                      disabled={reg.payment_status !== 'completed'}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-secondary disabled:opacity-30"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
