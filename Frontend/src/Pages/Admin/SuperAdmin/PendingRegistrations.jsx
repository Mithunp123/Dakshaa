import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  IndianRupee,
  User,
  Ticket,
  Package,
  Loader2,
  Edit3,
  X
} from "lucide-react";
import { supabase } from "../../../supabase";
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Helper function to format dates
const formatDate = (date, formatStr) => {
  const d = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  
  const formats = {
    'dd/MM/yyyy HH:mm': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    'dd MMM yyyy': `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`,
    'HH:mm': `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    'yyyy-MM-dd': `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  };
  
  return formats[formatStr] || d.toLocaleString();
};

const PendingRegistrations = () => {
  const location = useLocation();
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [comboPurchases, setComboPurchases] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, EVENTS, COMBOS
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    totalAmount: 0
  });
  
  // Status change modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  // Auto-refresh on visibility change and location change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing pending registrations...');
        loadAllData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  useEffect(() => {
    loadAllData();
    
    // Set up real-time subscription for event registrations
    const eventChannel = supabase
      .channel('pending-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations_config' },
        () => {
          loadAllData();
        }
      )
      .subscribe();

    // Set up real-time subscription for combo purchases
    const comboChannel = supabase
      .channel('combo-purchases')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'combo_purchases' },
        () => {
          loadAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
      supabase.removeChannel(comboChannel);
    };
  }, [statusFilter, selectedEventId]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load both in parallel
      const [eventRegs, comboRegs] = await Promise.all([
        loadPendingRegistrations(),
        loadComboPurchases()
      ]);

      // Calculate stats with both datasets
      calculateStats(eventRegs || [], comboRegs || []);
    } catch (error) {
      console.error('Error loading all data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPendingRegistrations = async () => {
    try {
      // Build query
      let query = supabase
        .from('event_registrations_config')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            mobile_number,
            college_name
          ),
          events:event_id (
            name,
            category
          )
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('payment_status', statusFilter);
      }

      // Apply event filter
      if (selectedEventId && selectedEventId !== 'ALL') {
        query = query.eq('event_id', selectedEventId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setPendingRegistrations(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading pending registrations:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      
      // Set empty data on error
      setPendingRegistrations([]);
      return [];
    }
  };

  const loadComboPurchases = async () => {
    try {
      // Build query - fetch combo purchases first
      let query = supabase
        .from('combo_purchases')
        .select(`
          *,
          combos:combo_id (
            name,
            description
          )
        `)
        .order('purchased_at', { ascending: false });

      // Apply status filter
      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('payment_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Combo purchases error:', error);
        throw error;
      }

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name')
          .in('id', userIds);

        if (!profilesError && profilesData) {
          // Map profiles to combo purchases
          const profileMap = {};
          profilesData.forEach(profile => {
            profileMap[profile.id] = profile;
          });

          // Attach profiles to combo purchases
          const enrichedData = data.map(item => ({
            ...item,
            profiles: profileMap[item.user_id] || null
          }));

          setComboPurchases(enrichedData);
          return enrichedData;
        } else {
          setComboPurchases(data || []);
          return data || [];
        }
      } else {
        setComboPurchases([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading combo purchases:', error);
      setComboPurchases([]);
      return [];
    }
  };

  const calculateStats = (eventRegs, comboRegs) => {
    const stats = {
      pending: 0,
      totalAmount: 0
    };

    // Count event registrations
    eventRegs.forEach(reg => {
      if (reg.payment_status === 'PENDING') stats.pending++;
      if (reg.payment_amount) stats.totalAmount += parseFloat(reg.payment_amount);
    });

    // Count combo purchases
    comboRegs.forEach(reg => {
      if (reg.payment_status === 'PENDING') stats.pending++;
      if (reg.payment_amount) stats.totalAmount += parseFloat(reg.payment_amount);
    });

    setStats(stats);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleStatusChange = (item) => {
    setSelectedItem(item);
    setNewStatus(item.payment_status);
    setShowStatusModal(true);
  };

  const updatePaymentStatus = async () => {
    if (!selectedItem || !newStatus) return;

    setUpdatingStatus(true);
    try {
      const tableName = selectedItem.type === 'event' ? 'event_registrations_config' : 'combo_purchases';
      
      const { error } = await supabase
        .from(tableName)
        .update({ payment_status: newStatus })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success(`Payment status updated to ${newStatus}`);
      setShowStatusModal(false);
      setSelectedItem(null);
      loadAllData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportToExcel = () => {
    // Export event registrations
    const eventExportData = filteredRegistrations.map(reg => ({
      'Type': 'Event Registration',
      'Registration ID': reg.id,
      'User Name': reg.profiles?.full_name || 'N/A',
      'Email': reg.profiles?.email || 'N/A',
      'Phone': reg.profiles?.mobile_number || 'N/A',
      'College': reg.profiles?.college_name || 'N/A',
      'Event Name': reg.event_name || reg.events?.name || 'N/A',
      'Category': reg.events?.category || 'N/A',
      'Payment Status': reg.payment_status,
      'Amount': reg.payment_amount ? `₹${reg.payment_amount}` : 'N/A',
      'Transaction ID': reg.transaction_id || 'N/A',
      'Registered At': reg.registered_at ? formatDate(reg.registered_at, 'dd/MM/yyyy HH:mm') : 'N/A',
      'Created At': reg.created_at ? formatDate(reg.created_at, 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    // Export combo purchases
    const comboExportData = filteredComboPurchases.map(combo => ({
      'Type': 'Combo Purchase',
      'Purchase ID': combo.id,
      'User Name': combo.profiles?.full_name || 'N/A',
      'Email': combo.profiles?.email || 'N/A',
      'Phone': combo.profiles?.mobile_number || 'N/A',
      'College': combo.profiles?.college_name || 'N/A',
      'Combo Name': combo.combos?.name || 'N/A',
      'Description': combo.combos?.description || 'N/A',
      'Payment Status': combo.payment_status,
      'Amount': combo.payment_amount ? `₹${combo.payment_amount}` : 'N/A',
      'Transaction ID': combo.transaction_id || 'N/A',
      'Explosion Completed': combo.explosion_completed ? 'Yes' : 'No',
      'Purchased At': combo.purchased_at ? formatDate(combo.purchased_at, 'dd/MM/yyyy HH:mm') : 'N/A'
    }));

    const wb = XLSX.utils.book_new();
    
    // Add event registrations sheet
    if (eventExportData.length > 0) {
      const ws1 = XLSX.utils.json_to_sheet(eventExportData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Event Registrations');
    }
    
    // Add combo purchases sheet
    if (comboExportData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(comboExportData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Combo Purchases');
    }
    
    XLSX.writeFile(wb, `pending_registrations_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: Clock },
      PAID: { bg: 'bg-green-500/10', text: 'text-green-500', icon: CheckCircle2 },
      FAILED: { bg: 'bg-red-500/10', text: 'text-red-500', icon: XCircle },
      REFUNDED: { bg: 'bg-gray-500/10', text: 'text-gray-500', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  const filteredRegistrations = pendingRegistrations.filter(reg => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      reg.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      reg.profiles?.email?.toLowerCase().includes(searchLower) ||
      reg.event_name?.toLowerCase().includes(searchLower) ||
      reg.events?.name?.toLowerCase().includes(searchLower) ||
      reg.transaction_id?.toLowerCase().includes(searchLower)
    );
  });

  const filteredComboPurchases = comboPurchases.filter(combo => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      combo.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      combo.profiles?.email?.toLowerCase().includes(searchLower) ||
      combo.combos?.name?.toLowerCase().includes(searchLower) ||
      combo.transaction_id?.toLowerCase().includes(searchLower)
    );
  });

  // Combined and filtered based on type filter
  const allFilteredData = [
    ...(typeFilter === 'ALL' || typeFilter === 'EVENTS' ? filteredRegistrations.map(r => ({ ...r, type: 'event' })) : []),
    ...(typeFilter === 'ALL' || typeFilter === 'COMBOS' ? filteredComboPurchases.map(c => ({ ...c, type: 'combo' })) : [])
  ].sort((a, b) => {
    const dateA = new Date(a.created_at || a.purchased_at);
    const dateB = new Date(b.created_at || b.purchased_at);
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="text-secondary" size={32} />
            Pending Registrations
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor and manage event registration status
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.pending}</p>
            </div>
            <Clock className="text-yellow-500" size={32} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary text-sm font-medium">Total Amount</p>
              <p className="text-3xl font-bold text-white mt-1">₹{stats.totalAmount.toFixed(2)}</p>
            </div>
            <IndianRupee className="text-secondary" size={32} />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, event, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
          />
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-secondary appearance-none cursor-pointer min-w-[200px]"
              style={{
                colorScheme: 'dark'
              }}
            >
              <option value="ALL" className="bg-slate-800 text-white">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id} className="bg-slate-800 text-white">
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-secondary appearance-none cursor-pointer min-w-[180px]"
              style={{
                colorScheme: 'dark'
              }}
            >
              <option value="ALL" className="bg-slate-800 text-white">All Types</option>
              <option value="EVENTS" className="bg-slate-800 text-white">Events Only</option>
              <option value="COMBOS" className="bg-slate-800 text-white">Combos Only</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-secondary appearance-none cursor-pointer min-w-[180px]"
              style={{
                colorScheme: 'dark'
              }}
            >
              <option value="ALL" className="bg-slate-800 text-white">All Status</option>
              <option value="PENDING" className="bg-slate-800 text-white">Pending</option>
              <option value="PAID" className="bg-slate-800 text-white">Paid</option>
              <option value="FAILED" className="bg-slate-800 text-white">Failed</option>
              <option value="REFUNDED" className="bg-slate-800 text-white">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-secondary" size={40} />
          </div>
        ) : allFilteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Clock size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No registrations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Event/Combo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {allFilteredData.map((item, index) => (
                  <motion.tr
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {item.type === 'event' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            <Ticket size={14} />
                            Event
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                            <Package size={14} />
                            Combo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                          <User className="text-secondary" size={20} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.profiles?.full_name || 'N/A'}</p>
                          <p className="text-gray-400 text-sm">{item.profiles?.email || 'N/A'}</p>
                          <p className="text-gray-500 text-xs">{item.profiles?.mobile_number || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.type === 'event' ? (
                        <div className="flex items-center gap-2">
                          <Ticket className="text-secondary" size={18} />
                          <div>
                            <p className="text-white font-medium">{item.event_name || item.events?.name || 'N/A'}</p>
                            <p className="text-gray-400 text-sm">{item.events?.category || 'N/A'}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Package className="text-purple-500" size={18} />
                          <div>
                            <p className="text-white font-medium">{item.combos?.name || 'N/A'}</p>
                            <p className="text-gray-400 text-sm">{item.combos?.description || 'N/A'}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="text-green-500" size={18} />
                        <span className="text-white font-semibold">
                          {item.payment_amount ? `₹${item.payment_amount}` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.payment_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={16} />
                        <div>
                          <p>{item.registered_at || item.purchased_at ? formatDate(new Date(item.registered_at || item.purchased_at), 'dd MMM yyyy') : 'N/A'}</p>
                          <p className="text-xs text-gray-500">
                            {item.registered_at || item.purchased_at ? formatDate(new Date(item.registered_at || item.purchased_at), 'HH:mm') : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusChange(item)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-secondary hover:text-secondary/80 transition-colors"
                        title="Change Payment Status"
                      >
                        <Edit3 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && allFilteredData.length > 0 && (
        <div className="text-center text-gray-400 text-sm">
          Showing {allFilteredData.length} registration(s) 
          {typeFilter !== 'ALL' && ` (${typeFilter.toLowerCase()})`}
          {statusFilter !== 'ALL' && ` with ${statusFilter.toLowerCase()} status`}
        </div>
      )}

      {/* Status Change Modal */}
      <AnimatePresence>
        {showStatusModal && selectedItem && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-6"
              >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Change Payment Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">User</p>
                  <p className="text-white font-medium">{selectedItem.profiles?.full_name || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">
                    {selectedItem.type === 'event' ? 'Event' : 'Combo'}
                  </p>
                  <p className="text-white font-medium">
                    {selectedItem.type === 'event' 
                      ? (selectedItem.event_name || selectedItem.events?.name)
                      : selectedItem.combos?.name
                    }
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Amount</p>
                  <p className="text-white font-medium">₹{selectedItem.payment_amount || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Current Status</p>
                  {getStatusBadge(selectedItem.payment_status)}
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-secondary"
                    style={{
                      colorScheme: 'dark'
                    }}
                  >
                    <option value="PENDING" className="bg-slate-800 text-white">Pending</option>
                    <option value="PAID" className="bg-slate-800 text-white">Paid</option>
                    <option value="FAILED" className="bg-slate-800 text-white">Failed</option>
                    <option value="REFUNDED" className="bg-slate-800 text-white">Refunded</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updatePaymentStatus}
                  disabled={updatingStatus || newStatus === selectedItem.payment_status}
                  className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingRegistrations;
