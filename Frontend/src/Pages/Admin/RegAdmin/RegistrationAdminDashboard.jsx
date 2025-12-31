import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  User, 
  CreditCard, 
  AlertCircle, 
  QrCode, 
  Download,
  Plus,
  RefreshCw,
  ArrowRightLeft,
  ShieldAlert,
  Users,
  IndianRupee,
  Phone,
  Mail,
  Building,
  UserPlus,
  Printer,
  Camera,
  FileText,
  DollarSign,
  TrendingUp,
  Package
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { QRCodeCanvas } from 'qrcode.react';

const RegistrationAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [cashQueue, setCashQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedRegs, setSelectedRegs] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const qrRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    cashInHand: 0,
    pendingApprovals: 0,
    processedToday: 0
  });

  // On-spot registration form
  const [onSpotForm, setOnSpotForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    college: '',
    department: '',
    year: '',
    rollNo: '',
    selectedEventId: '',
    amountCollected: 0
  });

  // Troubleshooting form
  const [troubleshootForm, setTroubleshootForm] = useState({
    searchType: 'email',
    searchValue: '',
    transactionId: ''
  });

  useEffect(() => {
    fetchAdminData();
    fetchPendingCashApprovals();
    fetchEvents();
    fetchStats();
    
    // Real-time updates
    const subscription = supabase
      .channel('cash-approvals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'registrations',
        filter: 'payment_mode=eq.cash'
      }, fetchPendingCashApprovals)
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setAdminUser(user);
  };

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Cash in hand (collected by this admin today)
      const { data: cashData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('marked_by', user.id)
        .eq('method', 'cash')
        .eq('status', 'PAID')
        .gte('created_at', new Date().toISOString().split('T')[0]);
      
      const cashInHand = cashData?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;

      // Pending approvals count
      const { count: pendingCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'pending')
        .eq('payment_mode', 'cash');

      // Total processed today
      const { count: processedCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('approved_by', user.id)
        .gte('approved_at', new Date().toISOString().split('T')[0]);

      setStats({
        cashInHand,
        pendingApprovals: pendingCount || 0,
        processedToday: processedCount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true);
    setEvents(data || []);
  };

  const fetchPendingCashApprovals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles:user_id (full_name, roll_number, mobile_number, college_name),
          events:event_id (event_id, category, price)
        `)
        .eq('payment_status', 'pending')
        .eq('payment_mode', 'cash')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCashQueue(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCash = async (regId, amount) => {
    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update registration status
      const { error: regError } = await supabase
        .from('registrations')
        .update({ 
          payment_status: 'PAID',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          amount_paid: amount
        })
        .eq('id', regId);

      if (regError) throw regError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          registration_id: regId,
          amount: amount,
          type: 'payment',
          method: 'cash',
          status: 'PAID',
          marked_by: user.id,
          notes: 'Cash payment approved at registration desk'
        });

      if (txError) throw txError;

      alert('✅ Payment approved and printed!');
      fetchPendingCashApprovals();
      fetchStats();
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRegs.length === 0) return;
    
    const confirmed = confirm(`Approve ${selectedRegs.length} cash payments?`);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const regId of selectedRegs) {
        const reg = cashQueue.find(r => r.id === regId);
        if (reg) {
          await supabase
            .from('registrations')
            .update({ 
              payment_status: 'PAID',
              approved_by: user.id,
              approved_at: new Date().toISOString(),
              amount_paid: reg.events.price
            })
            .eq('id', regId);

          await supabase
            .from('transactions')
            .insert({
              registration_id: regId,
              amount: reg.events.price,
              type: 'payment',
              method: 'cash',
              status: 'PAID',
              marked_by: user.id,
              notes: 'Bulk approval'
            });
        }
      }

      alert(`✅ ${selectedRegs.length} payments approved!`);
      setSelectedRegs([]);
      fetchPendingCashApprovals();
      fetchStats();
    } catch (error) {
      alert('Bulk approval failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      setSearchResult(null);

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          registrations (
            *,
            events:event_id (event_id, category, price)
          )
        `)
        .or(`full_name.ilike.%${searchTerm}%,mobile_number.eq.${searchTerm},roll_number.ilike.%${searchTerm}%`)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          alert('❌ User not found');
        } else throw error;
      } else {
        setSearchResult(data);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleOnSpotRegistration = async (e) => {
    e.preventDefault();
    if (!onSpotForm.selectedEventId || !onSpotForm.amountCollected) {
      alert('Please select an event and enter amount collected');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      // Create auth user
      const tempPassword = Math.random().toString(36).slice(-8);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: onSpotForm.email,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: onSpotForm.fullName,
          mobile_number: onSpotForm.mobile,
          email: onSpotForm.email,
          college_name: onSpotForm.college,
          department: onSpotForm.department,
          year_of_study: onSpotForm.year,
          roll_number: onSpotForm.rollNo
        });

      if (profileError) throw profileError;

      // Create registration
      const { data: regData, error: regError } = await supabase
        .from('registrations')
        .insert({
          user_id: authData.user.id,
          event_id: onSpotForm.selectedEventId,
          payment_status: 'PAID',
          payment_mode: 'cash',
          amount_paid: onSpotForm.amountCollected,
          approved_by: adminUser.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (regError) throw regError;

      // Create transaction
      await supabase
        .from('transactions')
        .insert({
          registration_id: regData.id,
          user_id: authData.user.id,
          amount: onSpotForm.amountCollected,
          type: 'payment',
          method: 'cash',
          status: 'PAID',
          marked_by: adminUser.id,
          notes: 'On-spot registration'
        });

      alert(`✅ Registration successful!\nUser: ${onSpotForm.fullName}\nTemp Password: ${tempPassword}\n\nShow QR code below to student.`);
      
      // Show QR for student to photograph
      setSearchResult({
        id: authData.user.id,
        full_name: onSpotForm.fullName,
        mobile_number: onSpotForm.mobile,
        email: onSpotForm.email,
        college_name: onSpotForm.college,
        registrations: [{ ...regData, events: events.find(e => e.event_id === onSpotForm.selectedEventId) }]
      });
      setActiveTab('search');
      
      // Reset form
      setOnSpotForm({
        fullName: '',
        mobile: '',
        email: '',
        college: '',
        department: '',
        year: '',
        rollNo: '',
        selectedEventId: '',
        amountCollected: 0
      });
      
      fetchStats();
    } catch (error) {
      console.error('On-spot registration error:', error);
      alert('Registration failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTroubleshoot = async (e) => {
    e.preventDefault();
    setSearching(true);
    
    try {
      if (troubleshootForm.searchType === 'transaction_id') {
        // Check payment status via transaction ID
        const { data: txData } = await supabase
          .from('transactions')
          .select('*, registrations(*, profiles!user_id(id, full_name, email, mobile_number), events(*))')
          .eq('provider_id', troubleshootForm.transactionId)
          .single();

        if (!txData) {
          alert('❌ Transaction not found in database');
        } else {
          alert(`Transaction Status: ${txData.status}\nAmount: ₹${txData.amount}\nUser: ${txData.registrations.profiles.full_name}`);
        }
      } else {
        // Search by email/mobile
        const field = troubleshootForm.searchType === 'email' ? 'email' : 'mobile_number';
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, registrations(*, events(*))')
          .eq(field, troubleshootForm.searchValue)
          .single();

        if (!profile) {
          alert('❌ User not found');
        } else {
          setSearchResult(profile);
          setActiveTab('search');
        }
      }
    } catch (error) {
      console.error('Troubleshoot error:', error);
      alert('Troubleshoot failed');
    } finally {
      setSearching(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${searchResult.full_name}-QR.png`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold font-orbitron mb-2">Registration Desk</h1>
          <p className="text-gray-400">The Command Center - Help Desk & Cashier</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:max-w-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <IndianRupee className="text-green-500" size={24} />
              <TrendingUp className="text-green-500/40" size={20} />
            </div>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Cash in Hand</p>
            <p className="text-3xl font-bold text-green-500">₹{stats.cashInHand.toLocaleString()}</p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-yellow-500" size={24} />
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            </div>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Pending Approvals</p>
            <p className="text-3xl font-bold text-yellow-500">{stats.pendingApprovals}</p>
          </motion.div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <Package className="text-secondary" size={24} />
              <CheckCircle2 className="text-secondary/40" size={20} />
            </div>
            <p className="text-sm text-gray-400 uppercase tracking-widest">Processed Today</p>
            <p className="text-3xl font-bold text-secondary">{stats.processedToday}</p>
          </motion.div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
        {[
          { id: 'queue', label: 'Live Queue', icon: Clock, count: stats.pendingApprovals },
          { id: 'onspot', label: 'On-Spot Registration', icon: UserPlus },
          { id: 'troubleshoot', label: 'Ticket Troubleshoot', icon: AlertCircle },
          { id: 'search', label: 'User Search', icon: Search }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.count > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* LIVE QUEUE TAB */}
        {activeTab === 'queue' && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <Loader2 className="animate-spin text-secondary" size={48} />
              </div>
            ) : cashQueue.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
                <h3 className="text-2xl font-bold">No Pending Approvals</h3>
                <p className="text-gray-400 mt-2">All cash payments are processed</p>
              </div>
            ) : (
              <>
                {/* Bulk Actions */}
                {selectedRegs.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-between p-5 bg-secondary/10 border border-secondary/20 rounded-2xl"
                  >
                    <p className="font-bold">{selectedRegs.length} selected</p>
                    <button
                      onClick={handleBulkApprove}
                      disabled={submitting}
                      className="px-6 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary-dark transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      Approve & Print All
                    </button>
                  </motion.div>
                )}

                {/* Queue List */}
                <div className="space-y-4">
                  {cashQueue.map((reg, index) => (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white/5 border rounded-3xl p-6 transition-all ${
                        selectedRegs.includes(reg.id) 
                          ? 'border-secondary bg-secondary/5' 
                          : 'border-white/10 hover:border-secondary/30'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex items-start gap-5 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedRegs.includes(reg.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRegs([...selectedRegs, reg.id]);
                              } else {
                                setSelectedRegs(selectedRegs.filter(id => id !== reg.id));
                              }
                            }}
                            className="mt-1 w-5 h-5 rounded border-white/10 bg-white/5 text-secondary focus:ring-secondary"
                          />
                          
                          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 flex-shrink-0">
                            <Clock className="text-yellow-500" size={28} />
                          </div>

                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{reg.profiles?.full_name}</h3>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <User size={14} /> {reg.profiles?.roll_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone size={14} /> {reg.profiles?.mobile_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building size={14} /> {reg.profiles?.college_name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Event / Amount</p>
                            <p className="font-bold text-secondary mb-1">{reg.events?.event_id}</p>
                            <p className="text-2xl font-bold">₹{reg.events?.price}</p>
                          </div>

                          <button
                            onClick={() => handleApproveCash(reg.id, reg.events.price)}
                            disabled={submitting}
                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center gap-2 disabled:opacity-50"
                          >
                            {submitting ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Approve & Print</>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ON-SPOT REGISTRATION TAB */}
        {activeTab === 'onspot' && (
          <motion.div
            key="onspot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
                  <UserPlus className="text-secondary" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Fast Track Registration</h2>
                  <p className="text-gray-400">For students with no internet or phone battery</p>
                </div>
              </div>

              <form onSubmit={handleOnSpotRegistration} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={onSpotForm.fullName}
                      onChange={(e) => setOnSpotForm({...onSpotForm, fullName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Mobile Number *</label>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      value={onSpotForm.mobile}
                      onChange={(e) => setOnSpotForm({...onSpotForm, mobile: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="9876543210"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Email *</label>
                    <input
                      required
                      type="email"
                      value={onSpotForm.email}
                      onChange={(e) => setOnSpotForm({...onSpotForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Roll Number</label>
                    <input
                      type="text"
                      value={onSpotForm.rollNo}
                      onChange={(e) => setOnSpotForm({...onSpotForm, rollNo: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="21CS001"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">College Name *</label>
                    <input
                      required
                      type="text"
                      value={onSpotForm.college}
                      onChange={(e) => setOnSpotForm({...onSpotForm, college: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="ABC Engineering College"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Department</label>
                    <input
                      type="text"
                      value={onSpotForm.department}
                      onChange={(e) => setOnSpotForm({...onSpotForm, department: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="Computer Science"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Year of Study</label>
                    <select
                      value={onSpotForm.year}
                      onChange={(e) => setOnSpotForm({...onSpotForm, year: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                    >
                      <option value="" className="bg-slate-900">Select Year</option>
                      <option value="1" className="bg-slate-900">1st Year</option>
                      <option value="2" className="bg-slate-900">2nd Year</option>
                      <option value="3" className="bg-slate-900">3rd Year</option>
                      <option value="4" className="bg-slate-900">4th Year</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Select Event *</label>
                    <select
                      required
                      value={onSpotForm.selectedEventId}
                      onChange={(e) => {
                        const event = events.find(ev => ev.event_id === e.target.value);
                        setOnSpotForm({
                          ...onSpotForm, 
                          selectedEventId: e.target.value,
                          amountCollected: event ? event.price : 0
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                    >
                      <option value="" className="bg-slate-900">Choose Event...</option>
                      {events.map(event => (
                        <option key={event.event_id} value={event.event_id} className="bg-slate-900">
                          {event.event_id} - ₹{event.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Amount to Collect</p>
                      <p className="text-4xl font-bold text-secondary">₹{onSpotForm.amountCollected}</p>
                    </div>
                    <IndianRupee className="text-secondary/40" size={48} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !onSpotForm.selectedEventId}
                  className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <CheckCircle2 size={24} />
                      Register & Approve
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* TROUBLESHOOT TAB */}
        {activeTab === 'troubleshoot' && (
          <motion.div
            key="troubleshoot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <AlertCircle className="text-red-500" size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Ticket Troubleshooting</h2>
                  <p className="text-gray-400">"I paid online but didn't get a ticket"</p>
                </div>
              </div>

              <form onSubmit={handleTroubleshoot} className="space-y-6">
                <div className="space-y-4">
                  <label className="text-sm text-gray-400 ml-2 font-bold">Search By</label>
                  <div className="flex gap-3">
                    {['email', 'mobile', 'transaction_id'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setTroubleshootForm({...troubleshootForm, searchType: type, searchValue: '', transactionId: ''})}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                          troubleshootForm.searchType === type
                            ? 'bg-secondary text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {type === 'email' ? 'Email' : type === 'mobile' ? 'Mobile' : 'Transaction ID'}
                      </button>
                    ))}
                  </div>
                </div>

                {troubleshootForm.searchType === 'transaction_id' ? (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">Razorpay Transaction ID</label>
                    <input
                      required
                      type="text"
                      value={troubleshootForm.transactionId}
                      onChange={(e) => setTroubleshootForm({...troubleshootForm, transactionId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all font-mono"
                      placeholder="pay_..."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2 font-bold">
                      {troubleshootForm.searchType === 'email' ? 'Email Address' : 'Mobile Number'}
                    </label>
                    <input
                      required
                      type={troubleshootForm.searchType === 'email' ? 'email' : 'tel'}
                      value={troubleshootForm.searchValue}
                      onChange={(e) => setTroubleshootForm({...troubleshootForm, searchValue: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder={troubleshootForm.searchType === 'email' ? 'user@example.com' : '9876543210'}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={searching}
                  className="w-full py-5 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:border-red-500 text-red-500 hover:text-white font-bold text-lg rounded-2xl transition-all flex items-center justify-center gap-3"
                >
                  {searching ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Search size={24} />
                      Re-verify Payment
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={24} />
              <input
                type="text"
                placeholder="Search by Name, Mobile, or Roll Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] pl-16 pr-36 py-5 text-lg focus:outline-none focus:border-secondary transition-all shadow-2xl"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? <Loader2 className="animate-spin" size={20} /> : <><Search size={20} /> Search</>}
              </button>
            </form>

            {searchResult && (
              <div className="max-w-5xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                <div className="p-8 md:p-12 border-b border-white/5 bg-gradient-to-br from-secondary/5 to-primary/5">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div ref={qrRef} className="w-40 h-40 bg-white rounded-3xl p-4 shadow-2xl">
                      <QRCodeCanvas value={searchResult.id} size={128} level="H" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-4xl font-bold mb-3">{searchResult.full_name}</h2>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400">
                        <span className="flex items-center gap-2"><User size={16} /> {searchResult.roll_number || 'N/A'}</span>
                        <span className="flex items-center gap-2"><Phone size={16} /> {searchResult.mobile_number}</span>
                        <span className="flex items-center gap-2"><Mail size={16} /> {searchResult.email}</span>
                        <span className="flex items-center gap-2"><Building size={16} /> {searchResult.college_name}</span>
                      </div>
                    </div>
                    <button
                      onClick={downloadQRCode}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center gap-2"
                    >
                      <Download size={20} /> QR Code
                    </button>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <QrCode className="text-secondary" size={28} />
                    Registrations ({searchResult.registrations?.length || 0})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResult.registrations?.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-secondary/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-lg">{reg.events?.event_id}</p>
                            <p className="text-sm text-gray-400 capitalize">{reg.events?.category}</p>
                          </div>
                          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                            reg.payment_status?.toUpperCase() === 'PAID'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {reg.payment_status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">₹{reg.events?.price}</p>
                          <p className="text-xs text-gray-500 uppercase">{reg.payment_mode}</p>
                        </div>
                      </div>
                    ))}
                    {(!searchResult.registrations || searchResult.registrations.length === 0) && (
                      <p className="col-span-2 text-center text-gray-500 py-8">No registrations found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegistrationAdminDashboard;
