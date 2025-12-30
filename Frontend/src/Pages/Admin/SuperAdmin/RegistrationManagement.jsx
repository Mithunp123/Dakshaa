import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Filter,
  Search,
  Plus,
  ArrowRightLeft,
  TrendingUp,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronRight,
  Package
} from "lucide-react";
import { supabase } from "../../../supabase";

const RegistrationManagement = () => {
  const [eventStats, setEventStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadEventStats();
  }, []);

  const loadEventStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events_config')
        .select(`
          id,
          name,
          event_key,
          category,
          capacity,
          price,
          is_open
        `)
        .order('name');

      if (error) throw error;

      // Get registration counts for each event
      const statsPromises = data.map(async (event) => {
        const { count, error: countError } = await supabase
          .from('event_registrations_config')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'PAID');

        return {
          ...event,
          totalRegistrations: count || 0,
          fillRate: event.capacity > 0 ? ((count || 0) / event.capacity * 100).toFixed(1) : 0
        };
      });

      const eventStatsData = await Promise.all(statsPromises);
      setEventStats(eventStatsData);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventRegistrations = async (eventId) => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('event_registrations_config')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            email,
            phone,
            college_name,
            department,
            roll_no
          )
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      setEventRegistrations(data || []);
    } catch (error) {
      console.error('Error loading event registrations:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    await loadEventRegistrations(event.id);
  };

  const handleBackToList = () => {
    setSelectedEvent(null);
    setEventRegistrations([]);
  };

  const filteredStats = eventStats.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.event_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(eventStats.map(e => e.category))];
  const totalRegistrations = eventStats.reduce((sum, e) => sum + e.totalRegistrations, 0);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  // Event List View
  if (!selectedEvent) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Registration Management</h2>
            <p className="text-gray-400">Event-wise registration overview</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Package className="text-blue-400" size={28} />
              <div className="text-3xl font-bold text-blue-400">{eventStats.length}</div>
            </div>
            <p className="text-gray-400 text-sm">Total Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="text-green-400" size={28} />
              <div className="text-3xl font-bold text-green-400">{totalRegistrations}</div>
            </div>
            <p className="text-gray-400 text-sm">Total Registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="text-purple-400" size={28} />
              <div className="text-3xl font-bold text-purple-400">
                {eventStats.length > 0 ? (totalRegistrations / eventStats.length).toFixed(0) : 0}
              </div>
            </div>
            <p className="text-gray-400 text-sm">Avg per Event</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-secondary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-secondary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Events Table */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-400 font-medium">Event Name</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Registrations</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Capacity</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Fill Rate</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((event, index) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold">{event.name}</p>
                        <p className="text-xs text-gray-500">{event.event_key}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                        {event.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-bold text-green-400">{event.totalRegistrations}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-gray-400">{event.capacity}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold">{event.fillRate}%</span>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              event.fillRate >= 90 ? 'bg-red-500' :
                              event.fillRate >= 70 ? 'bg-orange-500' :
                              event.fillRate >= 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(event.fillRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {event.is_open ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">
                          Open
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="flex items-center gap-2 ml-auto px-4 py-2 bg-secondary/20 text-secondary rounded-xl hover:bg-secondary/30 transition-colors">
                        View Details
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStats.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No events found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Event Details View
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronRight size={20} className="rotate-180" />
        Back to Events
      </button>

      {/* Event Header */}
      <div className="bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{selectedEvent.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
                {selectedEvent.category}
              </span>
              <span className="text-gray-400">Event Key: {selectedEvent.event_key}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-secondary">{selectedEvent.totalRegistrations}</p>
            <p className="text-gray-400">Total Registrations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Capacity</p>
            <p className="text-2xl font-bold">{selectedEvent.capacity}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Fill Rate</p>
            <p className="text-2xl font-bold">{selectedEvent.fillRate}%</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Price</p>
            <p className="text-2xl font-bold">₹{selectedEvent.price}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
            <p className={`text-2xl font-bold ${selectedEvent.is_open ? 'text-green-400' : 'text-red-400'}`}>
              {selectedEvent.is_open ? 'Open' : 'Closed'}
            </p>
          </div>
        </div>
      </div>

      {/* Registrations List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">Registered Participants</h3>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        {loadingDetails ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-secondary" />
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-gray-400 font-medium">Participant</th>
                    <th className="text-left p-4 text-gray-400 font-medium">College</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Department</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Contact</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-center p-4 text-gray-400 font-medium">Registered At</th>
                  </tr>
                </thead>
                <tbody>
                  {eventRegistrations
                    .filter(reg => {
                      const profile = reg.profiles;
                      return !searchTerm || 
                             profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             profile.roll_no.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((reg, index) => (
                      <motion.tr
                        key={reg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-bold">{reg.profiles.full_name}</p>
                            <p className="text-xs text-gray-500">{reg.profiles.roll_no}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{reg.profiles.college_name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm">{reg.profiles.department}</p>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <p>{reg.profiles.email}</p>
                            <p className="text-gray-500">{reg.profiles.phone}</p>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                            reg.payment_status === 'PAID' ? 'bg-green-500/20 text-green-400' :
                            reg.payment_status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {reg.payment_status}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm text-gray-400">
                          {new Date(reg.registered_at).toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                </tbody>
              </table>
            </div>

            {eventRegistrations.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No registrations yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationManagement;
