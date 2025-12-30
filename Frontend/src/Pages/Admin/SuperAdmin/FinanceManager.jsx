import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { supabase } from '../../../supabase';

const FinanceManager = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [cashierSessions, setCashierSessions] = useState([]);

  useEffect(() => {
    fetchFinanceData();
    fetchCashierSessions();
  }, []);

  const fetchCashierSessions = async () => {
    const { data } = await supabase
      .from('cashier_sessions')
      .select('*, profiles:admin_id(full_name)')
      .order('created_at', { ascending: false });
    setCashierSessions(data || []);
  };

  const handleVerifySession = async (sessionId) => {
    try {
      const { error } = await supabase
        .from('cashier_sessions')
        .update({ status: 'verified', verified_by: (await supabase.auth.getUser()).data.user.id })
        .eq('id', sessionId);
      
      if (error) throw error;
      alert('Session verified successfully');
      fetchCashierSessions();
    } catch (error) {
      alert('Verification failed');
    }
  };
  const [stats, setStats] = useState({
    totalRevenue: 0,
    onlineRevenue: 0,
    cashRevenue: 0,
    pendingCash: 0,
    totalRegistrations: 0
  });
  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch all registrations with event details
      const { data: regs, error } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles (full_name, college_name),
          events (event_id, category, price),
          combos (combo_id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process Stats
      let total = 0;
      let online = 0;
      let cash = 0;
      let pending = 0;
      
      const categories = {};
      const hourly = {};

      regs.forEach(reg => {
        const price = reg.combos?.price || reg.events?.price || 0;
        const status = reg.payment_status;
        const mode = reg.payment_mode || 'online';

        if (status === 'completed' || status === 'approved') {
          total += Number(price);
          if (mode === 'online') online += Number(price);
          else cash += Number(price);

          // Category breakdown
          const cat = reg.combos ? 'Combo' : (reg.events?.category || 'Other');
          categories[cat] = (categories[cat] || 0) + Number(price);
        } else if (status === 'pending' && mode === 'cash') {
          pending += Number(price);
        }

        // Hourly breakdown
        const hour = new Date(reg.created_at).getHours();
        hourly[hour] = (hourly[hour] || 0) + 1;
      });

      setStats({
        totalRevenue: total,
        onlineRevenue: online,
        cashRevenue: cash,
        pendingCash: pending,
        totalRegistrations: regs.length
      });

      setTransactions(regs);
      
      setCategoryData(Object.keys(categories).map(name => ({
        name,
        value: categories[name]
      })));

      setHourlyData(Object.keys(hourly).map(hour => ({
        hour: `${hour}:00`,
        count: hourly[hour]
      })));

    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#F97316', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444'];

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.payment_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <RefreshCcw className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Finance Management</h2>
          <p className="text-gray-400">Track revenue, transactions, and cashier reconciliation</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Transactions
          </button>
          <button 
            onClick={() => setActiveTab('cashier')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'cashier' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Cashier Logs
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={`₹${stats.totalRevenue}`} 
              icon={DollarSign} 
              trend="+12%" 
              color="text-green-500"
            />
            <StatCard 
              title="Online Payments" 
              value={`₹${stats.onlineRevenue}`} 
              icon={CreditCard} 
              trend="+8%" 
              color="text-blue-500"
            />
            <StatCard 
              title="Cash Collected" 
              value={`₹${stats.cashRevenue}`} 
              icon={DollarSign} 
              trend="+15%" 
              color="text-orange-500"
            />
            <StatCard 
              title="Pending Cash" 
              value={`₹${stats.pendingCash}`} 
              icon={Clock} 
              trend="Action Required" 
              color="text-yellow-500"
            />
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h3 className="text-xl font-bold mb-6">Revenue by Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
              <h3 className="text-xl font-bold mb-6">Registration Velocity (Hourly)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="hour" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="count" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b border-white/10 flex flex-col md:flex-row justify-between gap-4">
            <h3 className="text-xl font-bold">Transaction Explorer</h3>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-secondary"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Transaction ID</th>
                  <th className="px-8 py-4">Student</th>
                  <th className="px-8 py-4">Amount</th>
                  <th className="px-8 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-4 font-mono text-xs text-gray-400">{t.payment_id || t.id.substring(0, 8)}</td>
                    <td className="px-8 py-4">{t.profiles?.full_name}</td>
                    <td className="px-8 py-4 font-bold">₹{t.combos?.price || t.events?.price || 0}</td>
                    <td className="px-8 py-4"><StatusBadge status={t.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cashier' && (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
          <div className="p-8 border-b border-white/10">
            <h3 className="text-xl font-bold">Cashier Reconciliation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-4">Admin</th>
                  <th className="px-8 py-4">Session Start</th>
                  <th className="px-8 py-4">Expected Cash</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cashierSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-4 font-bold">{session.profiles?.full_name}</td>
                    <td className="px-8 py-4 text-sm text-gray-400">{new Date(session.start_time).toLocaleString()}</td>
                    <td className="px-8 py-4 font-bold text-orange-500">₹{session.expected_cash}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        session.status === 'verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {session.status !== 'verified' && (
                        <button 
                          onClick={() => handleVerifySession(session.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-all"
                        >
                          Verify & Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl bg-white/5 ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
        {trend}
      </span>
    </div>
    <div>
      <p className="text-gray-400 text-sm">{title}</p>
      <h4 className="text-2xl font-bold mt-1">{value}</h4>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-500/10 text-green-500 border-green-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || "bg-gray-500/10 text-gray-500"}`}>
      {status.toUpperCase()}
    </span>
  );
};

export default FinanceManager;
