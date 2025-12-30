import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  IndianRupee,
  Wallet,
  CreditCard,
  FileText,
  Calendar,
  User
} from "lucide-react";
import {
  getCashierLogs,
  getPaymentReconciliation,
  initiateRefund
} from "../../../services/adminService";

const FinanceModule = () => {
  const [activeTab, setActiveTab] = useState('cashier'); // 'cashier', 'refunds', 'reconciliation'
  const [loading, setLoading] = useState(true);
  
  // Cashier data
  const [cashierData, setCashierData] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Reconciliation data
  const [reconciliationData, setReconciliationData] = useState(null);
  
  // Refund form
  const [refundForm, setRefundForm] = useState({
    paymentId: '',
    amount: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange]);

  const loadData = async () => {
    setLoading(true);
    
    if (activeTab === 'cashier') {
      const { data } = await getCashierLogs(dateRange.start && dateRange.end ? dateRange : null);
      if (data) setCashierData(data);
    } else if (activeTab === 'reconciliation') {
      const { data } = await getPaymentReconciliation();
      if (data) setReconciliationData(data);
    }
    
    setLoading(false);
  };

  const handleRefund = async () => {
    if (!refundForm.paymentId || !refundForm.amount || !refundForm.reason) {
      alert('Please fill all fields');
      return;
    }
    
    setLoading(true);
    const { data, error } = await initiateRefund(
      refundForm.paymentId,
      parseFloat(refundForm.amount),
      refundForm.reason
    );
    setLoading(false);
    
    if (data) {
      alert('Refund initiated successfully! It will be processed soon.');
      setRefundForm({ paymentId: '', amount: '', reason: '' });
    } else {
      alert('Error: ' + error.message);
    }
  };

  const totalCash = cashierData.reduce((sum, item) => sum + item.total_cash, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Finance Management</h1>
          <p className="text-gray-400 mt-1">Track payments, cash flow, and reconciliation</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl hover:bg-secondary/90 transition-colors"
        >
          <RefreshCw size={20} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'cashier', label: 'Cashier Logs', icon: Wallet },
          { id: 'refunds', label: 'Refunds', icon: RefreshCw },
          { id: 'reconciliation', label: 'Reconciliation', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-secondary text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {activeTab === 'cashier' && (
            <CashierLogsTab
              cashierData={cashierData}
              totalCash={totalCash}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          )}
          
          {activeTab === 'refunds' && (
            <RefundsTab
              refundForm={refundForm}
              setRefundForm={setRefundForm}
              handleRefund={handleRefund}
              loading={loading}
            />
          )}
          
          {activeTab === 'reconciliation' && (
            <ReconciliationTab reconciliationData={reconciliationData} />
          )}
        </>
      )}
    </div>
  );
};

// Cashier Logs Tab
const CashierLogsTab = ({ cashierData, totalCash, dateRange, setDateRange }) => {
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-400 text-sm font-medium mb-2">Total Cash Collected</p>
            <p className="text-5xl font-bold">₹{totalCash.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-2">{cashierData.length} cashiers</p>
          </div>
          <div className="p-6 bg-green-500/20 rounded-2xl">
            <IndianRupee size={48} className="text-green-400" />
          </div>
        </div>
      </motion.div>

      {/* Date Filter */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Cashier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashierData.map((cashier, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-bold text-lg">{cashier.admin?.full_name || 'Unknown'}</p>
                <p className="text-sm text-gray-400">{cashier.admin?.email}</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-xl">
                <User size={24} className="text-secondary" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Total Cash</span>
                <span className="font-bold text-xl text-green-400">₹{cashier.total_cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Transactions</span>
                <span className="font-medium">{cashier.transaction_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Avg. Amount</span>
                <span className="font-medium">
                  ₹{(cashier.total_cash / cashier.transaction_count).toFixed(2)}
                </span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
              View Transactions
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Refunds Tab
const RefundsTab = ({ refundForm, setRefundForm, handleRefund, loading }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-red-500/10 rounded-xl">
            <RefreshCw size={32} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Initiate Refund</h2>
            <p className="text-gray-400">Process refunds for online payments</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Payment ID</label>
            <input
              type="text"
              placeholder="Enter Razorpay Payment ID"
              value={refundForm.paymentId}
              onChange={(e) => setRefundForm({ ...refundForm, paymentId: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount (₹)</label>
            <input
              type="number"
              placeholder="Enter refund amount"
              value={refundForm.amount}
              onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Reason</label>
            <textarea
              placeholder="Enter reason for refund"
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
            />
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="text-yellow-500 flex-shrink-0 mt-1" size={20} />
              <div className="text-sm">
                <p className="text-yellow-500 font-medium mb-1">Important Note</p>
                <p className="text-gray-400">
                  Refunds are processed through Razorpay and may take 5-7 business days to reflect in the user's account.
                  This action creates a refund request that will be processed by the payment gateway.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefund}
            disabled={loading || !refundForm.paymentId || !refundForm.amount || !refundForm.reason}
            className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={20} />
            ) : (
              'Initiate Refund'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Reconciliation Tab
const ReconciliationTab = ({ reconciliationData }) => {
  if (!reconciliationData) return null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Registrations</p>
              <p className="text-3xl font-bold mt-1">{reconciliationData.total_registrations}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl">
              <FileText size={24} className="text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Transactions</p>
              <p className="text-3xl font-bold mt-1">{reconciliationData.total_transactions}</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-xl">
              <CreditCard size={24} className="text-green-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Orphan Entries</p>
              <p className="text-3xl font-bold mt-1 text-red-400">{reconciliationData.orphan_count}</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-xl">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Orphan Transactions */}
      {reconciliationData.orphan_transactions.length > 0 && (
        <div className="bg-white/5 border border-red-500/20 rounded-2xl overflow-hidden">
          <div className="bg-red-500/10 px-6 py-4 border-b border-red-500/20">
            <h3 className="font-bold text-lg text-red-400">Orphan Transactions (Money but no Registration)</h3>
            <p className="text-sm text-gray-400 mt-1">These payments were received but have no matching registration</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reconciliationData.orphan_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-mono text-sm">{tx.provider_id}</td>
                    <td className="px-6 py-4 font-bold text-green-400">₹{tx.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-sm">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orphan Registrations */}
      {reconciliationData.orphan_registrations.length > 0 && (
        <div className="bg-white/5 border border-yellow-500/20 rounded-2xl overflow-hidden">
          <div className="bg-yellow-500/10 px-6 py-4 border-b border-yellow-500/20">
            <h3 className="font-bold text-lg text-yellow-400">Orphan Registrations (Registration but no Payment)</h3>
            <p className="text-sm text-gray-400 mt-1">These registrations have no matching payment transaction</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Registration ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Payment ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reconciliationData.orphan_registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 font-mono text-sm">{reg.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-mono text-sm">{reg.payment_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(reg.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-sm">
                        {reg.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reconciliationData.orphan_count === 0 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
        >
          <div className="flex justify-center mb-4">
            <div className="p-6 bg-green-500/20 rounded-full">
              <FileText size={48} className="text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-400 mb-2">All Clear!</h3>
          <p className="text-gray-400">
            No orphan entries found. All registrations and transactions are properly matched.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default FinanceModule;
