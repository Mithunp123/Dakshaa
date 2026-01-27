import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit2, 
  Save, 
  X, 
  Users, 
  CreditCard, 
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Settings,
  Plus,
  Trash2,
  DollarSign,
  UserCheck,
  TrendingUp,
  Calendar,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import eventConfigService from '../../../services/eventConfigService';

const EventConfig = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [stats, setStats] = useState({
    totalEvents: 0,
    openEvents: 0,
    totalRegistrations: 0,
    averageFillRate: 0
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const result = await eventConfigService.getEventsWithStats();
    if (result.success) {
      setEvents(result.data);
      calculateStats(result.data);
    }
    setLoading(false);
  };

  const calculateStats = (eventsData) => {
    const totalEvents = eventsData.length;
    const openEvents = eventsData.filter(e => e.is_open).length;
    const totalRegistrations = eventsData.reduce((sum, e) => sum + (e.current_registrations || 0), 0);
    const avgFill = eventsData.length > 0 
      ? eventsData.reduce((sum, e) => sum + ((e.current_registrations || 0) / e.capacity * 100), 0) / eventsData.length 
      : 0;
    
    setStats({
      totalEvents,
      openEvents,
      totalRegistrations,
      averageFillRate: avgFill.toFixed(1)
    });
  };

  const startEditing = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (eventId) => {
    const result = await eventConfigService.toggleEventStatus(eventId);
    if (result.success) {
      fetchEvents();
    } else {
      alert('Toggle failed: ' + result.error);
    }
  };

  const handleDelete = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    
    const result = await eventConfigService.deleteEvent(eventId);
    if (result.success) {
      fetchEvents();
    } else {
      alert('Delete failed: ' + result.error);
    }
  };

  const handleBulkStatusChange = async (status) => {
    // Get IDs of currently filtered events
    const eventIds = filteredEvents.map(e => e.id);
    
    if (eventIds.length === 0) {
      alert('No events selected to update');
      return;
    }
    
    const action = status ? 'open' : 'close';
    const confirmMessage = `Are you sure you want to ${action} ${eventIds.length} events?\n\nThis will affect all events currently visible in the list.`;
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    
    // Update each event individually
    let successCount = 0;
    let failCount = 0;
    
    for (const eventId of eventIds) {
      const event = events.find(e => e.id === eventId);
      // Only toggle if the event's current status is different from target status
      if (event && event.is_open !== status) {
        const result = await eventConfigService.toggleEventStatus(eventId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        successCount++; // Already in desired state
      }
    }
    
    // Refresh events list
    await fetchEvents();
    setLoading(false);
    
    if (failCount > 0) {
      alert(`Completed: ${successCount} events updated, ${failCount} failed`);
    }
  };

  const handleBulkCategoryStatusChange = async (category, status) => {
    // Get IDs of events in the specified category
    const categoryEvents = events.filter(e => 
      e.category && e.category.toLowerCase() === category.toLowerCase()
    );
    const eventIds = categoryEvents.map(e => e.id);
    
    if (eventIds.length === 0) {
      alert(`No events found in ${category} category`);
      return;
    }
    
    const action = status ? 'open' : 'close';
    const confirmMessage = `Are you sure you want to ${action} all ${eventIds.length} events in the ${category} category?`;
    
    if (!confirm(confirmMessage)) return;

    setLoading(true);
    
    // Update each event individually
    let successCount = 0;
    let failCount = 0;
    
    for (const eventId of eventIds) {
      const event = events.find(e => e.id === eventId);
      // Only toggle if the event's current status is different from target status
      if (event && event.is_open !== status) {
        const result = await eventConfigService.toggleEventStatus(eventId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        successCount++; // Already in desired state
      }
    }
    
    // Refresh events list
    await fetchEvents();
    setLoading(false);
    
    if (failCount > 0) {
      alert(`Completed: ${successCount} events updated, ${failCount} failed`);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (event.event_key || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'open' && event.is_open) ||
                         (filterStatus === 'closed' && !event.is_open);
    const matchesType = filterType === 'all' || 
                       (filterType === 'SOLO' && !event.is_team_event) ||
                       (filterType === 'TEAM' && event.is_team_event);
    const matchesCategory = filterCategory === 'all' || 
                           (event.category && event.category.toLowerCase() === filterCategory.toLowerCase());
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  const getFillRateColor = (fillRate) => {
    if (fillRate >= 90) return 'text-red-400';
    if (fillRate >= 70) return 'text-orange-400';
    return 'text-green-400';
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Event Configuration</h2>
          <p className="text-gray-400">Manage event metadata, pricing, capacity, and registration status</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-2xl font-bold hover:shadow-lg hover:shadow-secondary/30 transition-all"
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="text-blue-400" size={32} />
            <span className="text-3xl font-bold">{stats.totalEvents}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Events</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Unlock className="text-green-400" size={32} />
            <span className="text-3xl font-bold">{stats.openEvents}</span>
          </div>
          <p className="text-gray-400 text-sm">Open for Registration</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <UserCheck className="text-purple-400" size={32} />
            <span className="text-3xl font-bold">{stats.totalRegistrations}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Registrations</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-orange-400" size={32} />
            <span className="text-3xl font-bold">{stats.averageFillRate}%</span>
          </div>
          <p className="text-gray-400 text-sm">Average Fill Rate</p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or event key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-secondary transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <Filter size={20} className="text-gray-500" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent focus:outline-none"
          >
            <option value="all" className="bg-slate-900">All Status</option>
            <option value="open" className="bg-slate-900">Open</option>
            <option value="closed" className="bg-slate-900">Closed</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <Filter size={20} className="text-gray-500" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent focus:outline-none"
          >
            <option value="all" className="bg-slate-900">All Types</option>
            <option value="SOLO" className="bg-slate-900">Solo</option>
            <option value="TEAM" className="bg-slate-900">Team</option>
          </select>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
          <Filter size={20} className="text-gray-500" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent focus:outline-none"
          >
            <option value="all" className="bg-slate-900">All Categories</option>
            <option value="Technical" className="bg-slate-900">Technical</option>
            <option value="Non-Technical" className="bg-slate-900">Non-Technical</option>
            <option value="Workshop" className="bg-slate-900">Workshop</option>
            <option value="Conference" className="bg-slate-900">Conference</option>
            <option value="Hackathon" className="bg-slate-900">Hackathon</option>
            <option value="Sports" className="bg-slate-900">Sports</option>
          </select>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button 
             onClick={() => handleBulkStatusChange(true)}
             className="px-4 py-2 bg-white/5 hover:bg-green-500/20 hover:text-green-400 border border-white/10 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
             title="Open all filtered events"
          >
            <Unlock size={16} /> Open All
          </button>
          <button 
             onClick={() => handleBulkStatusChange(false)}
             className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap"
             title="Close all filtered events"
          >
            <Lock size={16} /> Close All
          </button>
        </div>
      </div>

      {/* Category Bulk Actions */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Settings size={20} className="text-secondary" />
          Bulk Actions by Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {['Technical', 'Non-Technical', 'Workshop', 'Conference', 'Hackathon', 'Sports'].map(category => (
            <div key={category} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-sm font-bold mb-3 text-gray-300">{category}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleBulkCategoryStatusChange(category, true)}
                  className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Unlock size={14} /> Open
                </button>
                <button
                  onClick={() => handleBulkCategoryStatusChange(category, false)}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Lock size={14} /> Close
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events Table - Desktop View */}
      <div className="hidden lg:block bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Event</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Category</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Type</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Team Size</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Price</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Capacity</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Fill Rate</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Status</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event) => {
                const fillRate = (event.current_registrations / event.capacity) * 100;

                return (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      <div>
                        <p className="font-bold">{event.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{event.event_key}</p>
                        {event.description && (
                          <div className="mt-1">
                            <p className={`text-xs text-gray-400 ${
                              !expandedDescriptions[event.id] ? 'line-clamp-2' : ''
                            }`}>
                              {event.description}
                            </p>
                            {event.description.length > 100 && (
                              <button
                                onClick={() => setExpandedDescriptions(prev => ({
                                  ...prev,
                                  [event.id]: !prev[event.id]
                                }))}
                                className="text-xs text-secondary hover:text-primary mt-1 flex items-center gap-1 transition-colors"
                              >
                                {expandedDescriptions[event.id] ? (
                                  <>
                                    <ChevronUp size={12} /> Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={12} /> Show More
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                        {event.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        event.is_team_event 
                          ? 'bg-purple-500/10 text-purple-400' 
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {event.is_team_event ? 'TEAM' : 'SOLO'}
                      </span>
                    </td>
                    <td className="p-6">
                      {event.is_team_event ? (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-purple-400" />
                          <span className="text-sm">
                            {event.min_team_size || 1} - {event.max_team_size || 1}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-gray-500" />
                        <span className="font-bold">₹{event.price}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-500" />
                        <span>{event.current_registrations || 0} / {event.capacity}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${fillRate}%` }}
                            className={`h-full ${
                              fillRate >= 90 ? 'bg-red-500' :
                              fillRate >= 70 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                          />
                        </div>
                        <span className={`text-sm font-bold ${getFillRateColor(fillRate)}`}>
                          {fillRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <button
                        onClick={() => handleToggleStatus(event.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          event.is_open
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        {event.is_open ? <Unlock size={12} /> : <Lock size={12} />}
                        {event.is_open ? 'Open' : 'Closed'}
                      </button>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEditing(event)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-secondary hover:text-white transition-all"
                          title="Edit Event"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          title="Delete Event"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Cards - Mobile View */}
      <div className="lg:hidden space-y-4">
        {filteredEvents.map((event) => {
          const fillRate = (event.current_registrations / event.capacity) * 100;
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl"
            >
              {/* Event Name & Key */}
              <div>
                <h3 className="text-base font-bold leading-snug">{event.name}</h3>
                <p className="text-[10px] text-gray-500 font-mono mt-1">{event.event_key}</p>
                {event.description && (
                  <div className="mt-2">
                    <p className={`text-xs text-gray-400 leading-relaxed ${
                      !expandedDescriptions[event.id] ? 'line-clamp-2' : ''
                    }`}>
                      {event.description}
                    </p>
                    {event.description.length > 100 && (
                      <button
                        onClick={() => setExpandedDescriptions(prev => ({
                          ...prev,
                          [event.id]: !prev[event.id]
                        }))}
                        className="text-[11px] text-secondary hover:text-primary mt-2 flex items-center gap-1 transition-colors font-medium"
                      >
                        {expandedDescriptions[event.id] ? (
                          <>
                            <ChevronUp size={12} /> Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> Show More
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wide">
                  {event.category || 'Uncategorized'}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  event.is_team_event 
                    ? 'bg-purple-500/10 text-purple-400' 
                    : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {event.is_team_event ? 'TEAM' : 'SOLO'}
                </span>
                <button
                  onClick={() => handleToggleStatus(event.id)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all uppercase tracking-wide ${
                    event.is_open
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                  }`}
                >
                  {event.is_open ? 'OPEN' : 'CLOSED'}
                </button>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
                  <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Price</p>
                  <p className="text-lg font-bold flex items-center gap-1">
                    <DollarSign size={16} className="text-gray-500" />
                    ₹{event.price}
                  </p>
                </div>
                
                <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
                  <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Capacity</p>
                  <p className="text-sm font-bold flex items-center gap-1">
                    <Users size={16} className="text-gray-500" />
                    {event.current_registrations || 0} / {event.capacity}
                  </p>
                </div>

                {event.is_team_event && (
                  <div className="col-span-2 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-3.5">
                    <p className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wide font-medium">Team Size</p>
                    <p className="text-sm font-bold flex items-center gap-1 text-purple-400">
                      <Users size={16} />
                      {event.min_team_size || 1} - {event.max_team_size || 1}
                    </p>
                  </div>
                )}
              </div>

              {/* Fill Rate */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Fill Rate</span>
                  <span className={`text-base font-bold ${getFillRateColor(fillRate)}`}>
                    {fillRate.toFixed(0)}%
                  </span>
                </div>
                <div className="bg-white/5 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillRate}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full ${
                      fillRate >= 90 ? 'bg-red-500' :
                      fillRate >= 70 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button 
                  onClick={() => startEditing(event)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-secondary/20 to-primary/20 hover:from-secondary/30 hover:to-primary/30 border border-secondary/30 hover:border-secondary rounded-2xl text-sm font-bold transition-all shadow-lg shadow-secondary/10"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(event.id)}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500 text-red-400 rounded-2xl text-sm font-bold transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-3xl">
          <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400">No events found matching your criteria.</p>
        </div>
      )}

      {/* Add Event Modal */}
      <AddEventModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchEvents}
      />

      {/* Edit Event Modal */}
      <EditEventModal 
        isOpen={showEditModal}
        event={editingEvent}
        onClose={() => {
          setShowEditModal(false);
          setEditingEvent(null);
        }}
        onSuccess={fetchEvents}
      />
    </div>
  );
};

// Edit Event Modal Component
const EditEventModal = ({ isOpen, event, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    venue: '',
    category: 'Technical',
    event_type: 'SOLO',
    price: 0,
    capacity: 100,
    is_team_event: false,
    min_team_size: 1,
    max_team_size: 1,
    is_open: true,
    is_active: true,
    current_status: 'upcoming',
    event_date: '',
    start_time: '',
    end_time: '',
    coordinator_name: '',
    coordinator_contact: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        venue: event.venue || '',
        category: event.category || 'Technical',
        event_type: event.is_team_event ? 'TEAM' : 'SOLO',
        price: event.price || 0,
        capacity: event.capacity || 100,
        is_team_event: event.is_team_event || false,
        min_team_size: event.min_team_size || 1,
        max_team_size: event.max_team_size || 1,
        is_open: event.is_open ?? true,
        is_active: event.is_active ?? true,
        current_status: event.current_status || 'upcoming',
        event_date: event.event_date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        coordinator_name: event.coordinator_name || '',
        coordinator_contact: event.coordinator_contact || ''
      });
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;
    
    setLoading(true);

    const result = await eventConfigService.updateEvent(event.id, formData);
    
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert('Failed to update event: ' + result.error);
    }
    
    setLoading(false);
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Edit Event</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event ID (read-only) */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Event ID
              </label>
              <input
                type="text"
                value={event.event_key || event.id}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                rows={3}
              />
            </div>

            {/* Category and Event Type */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                >
                  <option value="Technical" className="bg-slate-900">Technical</option>
                  <option value="Non-Technical" className="bg-slate-900">Non-Technical</option>
                  <option value="Workshop" className="bg-slate-900">Workshop</option>
                  <option value="Conference" className="bg-slate-900">Conference</option>
                  <option value="Hackathon" className="bg-slate-900">Hackathon</option>
                  <option value="Sports" className="bg-slate-900">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Event Type *
                </label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({
                    ...formData, 
                    event_type: e.target.value,
                    is_team_event: e.target.value === 'TEAM'
                  })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                >
                  <option value="SOLO" className="bg-slate-900">SOLO</option>
                  <option value="TEAM" className="bg-slate-900">TEAM</option>
                </select>
              </div>
            </div>

            {/* Price, Capacity, Venue */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({...formData, venue: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            {/* Registration Open, Event Active, Current Status */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Registration Open
                </label>
                <select
                  value={formData.is_open ? 'Yes' : 'No'}
                  onChange={(e) => setFormData({...formData, is_open: e.target.value === 'Yes'})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                >
                  <option value="Yes" className="bg-slate-900">Yes</option>
                  <option value="No" className="bg-slate-900">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Current Status
                </label>
                <select
                  value={formData.current_status}
                  onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                >
                  <option value="upcoming" className="bg-slate-900">Upcoming</option>
                  <option value="ongoing" className="bg-slate-900">Ongoing</option>
                  <option value="completed" className="bg-slate-900">Completed</option>
                  <option value="cancelled" className="bg-slate-900">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Team Settings (if team event) */}
            {formData.event_type === 'TEAM' && (
              <div className="grid grid-cols-3 gap-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    Is Team Event
                  </label>
                  <select
                    value={formData.is_team_event ? 'Yes' : 'No (Individual)'}
                    onChange={(e) => setFormData({...formData, is_team_event: e.target.value.startsWith('Yes')})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  >
                    <option value="Yes" className="bg-slate-900">Yes</option>
                    <option value="No (Individual)" className="bg-slate-900">No (Individual)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    Min Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_team_size}
                    onChange={(e) => setFormData({...formData, min_team_size: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    Max Team Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_team_size}
                    onChange={(e) => setFormData({...formData, max_team_size: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            )}

            {/* Event Date and Time */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            {/* Coordinator Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Coordinator Name
                </label>
                <input
                  type="text"
                  value={formData.coordinator_name}
                  onChange={(e) => setFormData({...formData, coordinator_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Coordinator Contact
                </label>
                <input
                  type="tel"
                  value={formData.coordinator_contact}
                  onChange={(e) => setFormData({...formData, coordinator_contact: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-2xl font-bold hover:shadow-lg hover:shadow-secondary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Saving Changes...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save size={20} />
                    Save Changes
                  </span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Add Event Modal Component
const AddEventModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    event_key: '',
    name: '',
    description: '',
    category: 'Technical',
    price: 0,
    type: 'SOLO',
    capacity: 100,
    min_team_size: 1,
    max_team_size: 4,
    is_open: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await eventConfigService.createEvent(formData);
    
    if (result.success) {
      onSuccess();
      onClose();
      setFormData({
        event_key: '',
        name: '',
        description: '',
        category: 'Technical',
        price: 0,
        type: 'SOLO',
        capacity: 100,
        min_team_size: 1,
        max_team_size: 4,
        is_open: true
      });
    } else {
      alert('Failed to create event: ' + result.error);
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">Add New Event</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Event Key / Slug *
              </label>
              <input
                type="text"
                required
                value={formData.event_key}
                onChange={(e) => setFormData({...formData, event_key: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                placeholder="paper-presentation"
              />
              <p className="text-xs text-gray-500 mt-1">Must match frontend design folder/ID</p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                placeholder="Paper Presentation"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
              >
                <option value="Technical" className="bg-slate-900">Technical</option>
                <option value="Non-Technical" className="bg-slate-900">Non-Technical</option>
                <option value="Workshop" className="bg-slate-900">Workshop</option>
                <option value="Conference" className="bg-slate-900">Conference</option>
                <option value="Hackathon" className="bg-slate-900">Hackathon</option>
                <option value="Sports" className="bg-slate-900">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                placeholder="Short description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Participation Type *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'SOLO'})}
                  className={`flex-1 py-3 px-6 rounded-2xl font-bold transition-all ${
                    formData.type === 'SOLO'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  SOLO
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'TEAM'})}
                  className={`flex-1 py-3 px-6 rounded-2xl font-bold transition-all ${
                    formData.type === 'TEAM'
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  TEAM
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="150"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">
                  Capacity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Team Size Settings (if TEAM type) */}
            {formData.type === 'TEAM' && (
              <div className="grid grid-cols-2 gap-6 bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    Min Team Size *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.min_team_size || 1}
                    onChange={(e) => setFormData({...formData, min_team_size: parseInt(e.target.value) || 1})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                    placeholder="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-400">
                    Max Team Size *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.max_team_size || 4}
                    onChange={(e) => setFormData({...formData, max_team_size: parseInt(e.target.value) || 4})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                    placeholder="4"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_open"
                checked={formData.is_open}
                onChange={(e) => setFormData({...formData, is_open: e.target.checked})}
                className="w-5 h-5"
              />
              <label htmlFor="is_open" className="text-sm font-bold">
                Open for registration immediately
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-2xl font-bold hover:shadow-lg hover:shadow-secondary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={20} />
                    Creating...
                  </span>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventConfig;
