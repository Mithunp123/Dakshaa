import React, { useState, useEffect } from 'react';
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
  MoreVertical,
  DollarSign,
  UserPlus,
  FileText,
  Printer,
  IndianRupee,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { QRCodeCanvas } from 'qrcode.react';

const Desk = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedRegs, setSelectedRegs] = useState([]);
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapData, setSwapData] = useState({ reg: null, newEventId: '' });
  
  // Stats
  const [stats, setStats] = useState({
    cashInHand: 0,
    pendingCount: 0,
    processedToday: 0
  });
  
  // On-spot registration form
  const [onSpotForm, setOnSpotForm] = useState({
    fullName: '',
    mobile: '',
    college: '',
    department: '',
    year: '',
    selectedEvents: []
  });

  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    fetchPendingPayments();
    fetchEvents();
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    const { data } = await supabase
      .from('waitlist')
      .select('*, profiles!user_id(id, full_name, roll_number, email, mobile_number, college_name), events(*)')
      .eq('status', 'waiting');
    setWaitlist(data || []);
  };

  const handlePromote = async (waitId) => {
    setSubmitting(true);
    try {
      const item = waitlist.find(w => w.id === waitId);
      // 1. Create registration
      const { error: regError } = await supabase
        .from('registrations')
        .insert({
          user_id: item.user_id,
          event_id: item.event_id,
          payment_status: 'pending',
          payment_mode: 'cash'
        });
      
      if (regError) throw regError;

      // 2. Update waitlist status
      await supabase.from('waitlist').update({ status: 'promoted' }).eq('id', waitId);
      
      alert('Student promoted to registration');
      fetchWaitlist();
      fetchPendingPayments();
    } catch (error) {
      alert('Promotion failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('is_active', true);
    setEvents(data || []);
  };

  const handleBulkApprove = async () => {
    if (selectedRegs.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ payment_status: 'PAID' })
        .in('id', selectedRegs);
      
      if (error) throw error;
      alert(`Successfully approved ${selectedRegs.length} registrations`);
      setPendingPayments(prev => prev.filter(p => !selectedRegs.includes(p.id)));
      setSelectedRegs([]);
    } catch (error) {
      alert('Bulk approval failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEventSwap = async () => {
    if (!swapData.reg || !swapData.newEventId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ event_id: swapData.newEventId })
        .eq('id', swapData.reg.id);
      
      if (error) throw error;
      alert('Event swapped successfully');
      setIsSwapModalOpen(false);
      if (searchResult) handleSearch(); // Refresh search result
    } catch (error) {
      alert('Swap failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceAdd = async (userId, eventId) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('registrations')
        .insert({
          user_id: userId,
          event_id: eventId,
          payment_status: 'PAID',
          payment_mode: 'cash',
          is_force_added: true
        });
      
      if (error) throw error;
      alert('User force-added to event');
      if (searchResult) handleSearch();
    } catch (error) {
      alert('Force add failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          profiles:user_id (full_name, roll_number, mobile_number),
          events:event_id (title, price)
        `)
        .eq('payment_status', 'pending')
        .eq('payment_method', 'cash');

      if (error) throw error;
      setPendingPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (regId) => {
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ 
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', regId);

      if (error) throw error;
      
      alert('Payment approved successfully');
      setPendingPayments(prev => prev.filter(p => p.id !== regId));
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment');
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          registrations (
            *,
            events:event_id (title, price)
          )
        `)
        .or(`mobile_number.eq.${searchTerm},roll_number.eq.${searchTerm.toUpperCase()}`)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          alert('User not found');
        } else {
          throw error;
        }
        setSearchResult(null);
      } else {
        setSearchResult(data);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleOnSpotSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Check if user exists by roll number
      const { data: existingUser, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('roll_number', onSpotForm.roll_number.toUpperCase())
        .single();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      if (existingUser) {
        alert(`User found: ${existingUser.full_name}. Redirecting to registration...`);
        setSearchTerm(onSpotForm.roll_number);
        setActiveTab('search');
        handleSearch();
      } else {
        alert('User not found. Please ask the student to register on the website first.');
      }
    } catch (error) {
      console.error('On-spot error:', error);
      alert('Failed to process on-spot registration');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Registration Desk</h2>
          <p className="text-gray-400">Manage on-spot registrations and cash approvals</p>
        </div>
        <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'pending' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Pending Cash ({pendingPayments.length})
          </button>
          <button 
            onClick={() => setActiveTab('waitlist')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'waitlist' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            Waitlist
          </button>
          <button 
            onClick={() => setActiveTab('search')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'search' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            User Search
          </button>
          <button 
            onClick={() => setActiveTab('onspot')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'onspot' ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Plus size={18} className="inline mr-1" /> On-Spot
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="animate-spin text-secondary" size={40} />
              </div>
            ) : pendingPayments.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                <CheckCircle2 className="mx-auto text-green-500 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-400">No pending payments</h3>
                <p className="text-gray-500 mt-2">All cash registrations are up to date</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRegs(pendingPayments.map(p => p.id));
                        else setSelectedRegs([]);
                      }}
                      checked={selectedRegs.length === pendingPayments.length && pendingPayments.length > 0}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-secondary focus:ring-secondary"
                    />
                    <span className="text-sm text-gray-400">Select All</span>
                  </div>
                  {selectedRegs.length > 0 && (
                    <motion.button
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={handleBulkApprove}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      Approve Selected ({selectedRegs.length})
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {pendingPayments.map((reg) => (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`bg-white/5 border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${
                        selectedRegs.includes(reg.id) ? 'border-secondary bg-secondary/5' : 'border-white/10 hover:border-secondary/30'
                      }`}
                    >
                      <div className="flex items-center gap-5 w-full md:w-auto">
                        <input 
                          type="checkbox" 
                          checked={selectedRegs.includes(reg.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedRegs([...selectedRegs, reg.id]);
                            else setSelectedRegs(selectedRegs.filter(id => id !== reg.id));
                          }}
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-secondary focus:ring-secondary"
                        />
                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                          <Clock className="text-yellow-500" size={28} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{reg.profiles?.full_name}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-xs text-gray-500 font-mono">{reg.profiles?.roll_number}</span>
                            <span className="text-xs text-gray-500">{reg.profiles?.mobile_number}</span>
                          </div>
                        </div>
                      </div>

                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Event / Price</p>
                        <p className="font-bold text-secondary">{reg.events?.title}</p>
                        <p className="text-xl font-bold">₹{reg.events?.price}</p>
                      </div>
                      <button 
                        onClick={() => handleApprove(reg.id)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center gap-2"
                      >
                        <CheckCircle2 size={20} /> Approve
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            )}
          </motion.div>
        )}

        {activeTab === 'waitlist' && (
          <motion.div
            key="waitlist"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {waitlist.length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
                <Users className="mx-auto text-gray-600 mb-4" size={64} />
                <h3 className="text-xl font-bold text-gray-400">Waitlist is empty</h3>
                <p className="text-gray-500 mt-2">No students are currently waiting for events</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {waitlist.map((item) => (
                  <div key={item.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Users className="text-blue-500" size={28} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{item.profiles?.full_name}</h3>
                        <p className="text-xs text-gray-500">{item.profiles?.roll_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Event</p>
                        <p className="font-bold text-secondary">{item.events?.title}</p>
                      </div>
                      <button 
                        onClick={() => handlePromote(item.id)}
                        disabled={submitting}
                        className="px-6 py-3 bg-secondary hover:bg-secondary-dark text-white font-bold rounded-xl transition-all flex items-center gap-2"
                      >
                        Promote to Confirmed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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
                placeholder="Enter Mobile Number or Roll Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-32 py-5 text-lg focus:outline-none focus:border-secondary transition-all shadow-2xl"
              />
              <button 
                type="submit"
                disabled={searching}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-3 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all disabled:opacity-50"
              >
                {searching ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
              </button>
            </form>

            {searchResult && (
              <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden">
                <div className="p-8 md:p-12 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-secondary to-primary p-1">
                      <div className="w-full h-full rounded-[2.4rem] bg-slate-950 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${searchResult.full_name}`} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h3 className="text-3xl font-bold mb-2">{searchResult.full_name}</h3>
                      <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400">
                        <span className="flex items-center gap-2"><User size={16} /> {searchResult.roll_number}</span>
                        <span className="flex items-center gap-2"><CreditCard size={16} /> {searchResult.mobile_number}</span>
                        <span className="flex items-center gap-2"><AlertCircle size={16} /> {searchResult.college_name}</span>
                      </div>
                    </div>
                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all flex items-center gap-2">
                      <Download size={20} /> Ticket
                    </button>
                  </div>
                </div>

                <div className="p-8 md:p-12">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold flex items-center gap-2">
                      <QrCode className="text-secondary" size={24} /> Registrations
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResult.registrations?.map((reg) => (
                      <div key={reg.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between group">
                        <div>
                          <p className="font-bold">{reg.events?.title}</p>
                          <p className="text-sm text-gray-400 capitalize">{reg.events?.category}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${
                            reg.payment_status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {reg.payment_status}
                          </span>
                          <button 
                            onClick={() => { setSwapData({ reg, newEventId: '' }); setIsSwapModalOpen(true); }}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-secondary transition-all opacity-0 group-hover:opacity-100"
                            title="Swap Event"
                          >
                            <ArrowRightLeft size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!searchResult.registrations || searchResult.registrations.length === 0) && (
                      <p className="text-gray-500 col-span-2 text-center py-4">No registrations found for this user.</p>
                    )}
                  </div>

                  {/* Force Add Section */}
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h4 className="text-xl font-bold mb-6 flex items-center gap-2 text-red-400">
                      <ShieldAlert size={24} /> Manual Override (Force Add)
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4">
                      <select 
                        id="force-add-event"
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-red-500 transition-all"
                      >
                        <option value="">Select Event to Force Add...</option>
                        {events.map(e => (
                          <option key={e.event_id} value={e.event_id} className="bg-slate-900">
                            {e.event_id} (₹{e.price})
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => {
                          const eventId = document.getElementById('force-add-event').value;
                          if (eventId) handleForceAdd(searchResult.id, eventId);
                        }}
                        disabled={submitting}
                        className="px-8 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 font-bold rounded-2xl border border-red-500/20 transition-all flex items-center gap-2"
                      >
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        Force Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Swap Modal */}
        <AnimatePresence>
          {isSwapModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSwapModalOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
              >
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <ArrowRightLeft className="text-secondary" size={24} /> Swap Event
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Current Event</p>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 font-bold">
                      {swapData.reg?.events?.title}
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRightLeft className="text-gray-600 rotate-90" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">New Event</p>
                    <select 
                      value={swapData.newEventId}
                      onChange={(e) => setSwapData({ ...swapData, newEventId: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                    >
                      <option value="">Select New Event...</option>
                      {events.map(e => (
                        <option key={e.event_id} value={e.event_id} className="bg-slate-900">
                          {e.event_id} (₹{e.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setIsSwapModalOpen(false)}
                      className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleEventSwap}
                      disabled={submitting || !swapData.newEventId}
                      className="flex-1 px-6 py-3 bg-secondary text-white rounded-xl font-bold hover:bg-secondary-dark transition-all disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Swap'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {activeTab === 'onspot' && (
          <motion.div
            key="onspot"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[3rem]">
              <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <Plus className="text-secondary" size={28} /> New On-Spot Registration
              </h3>
              <form onSubmit={handleOnSpotSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2">Full Name</label>
                    <input 
                      required
                      type="text"
                      value={onSpotForm.full_name}
                      onChange={(e) => setOnSpotForm({...onSpotForm, full_name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2">Roll Number</label>
                    <input 
                      required
                      type="text"
                      value={onSpotForm.roll_number}
                      onChange={(e) => setOnSpotForm({...onSpotForm, roll_number: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="21CS001"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2">Mobile Number</label>
                    <input 
                      required
                      type="tel"
                      value={onSpotForm.mobile_number}
                      onChange={(e) => setOnSpotForm({...onSpotForm, mobile_number: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400 ml-2">Email</label>
                    <input 
                      required
                      type="email"
                      value={onSpotForm.email}
                      onChange={(e) => setOnSpotForm({...onSpotForm, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-secondary transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-secondary text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-secondary/20 transition-all flex items-center justify-center gap-3 mt-4 text-lg"
                >
                  {submitting ? <Loader2 className="animate-spin" size={24} /> : (
                    <>
                      <CheckCircle2 size={24} /> Verify & Continue
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-gray-500">
                  This will verify if the user has an account and redirect to registration.
                </p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Desk;
