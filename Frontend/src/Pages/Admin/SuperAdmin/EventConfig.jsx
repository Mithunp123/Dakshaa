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
  Unlock
} from 'lucide-react';
import eventConfigService from '../../../services/eventConfigService';

const EventConfig = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
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
    setEditingId(event.id);
    setEditForm({
      name: event.name,
      description: event.description || '',
      category: event.category || 'Technical',
      price: event.price,
      capacity: event.capacity,
      type: event.type,
      is_open: event.is_open
    });
  };

  const handleUpdate = async (eventId) => {
    const result = await eventConfigService.updateEvent(eventId, editForm);
    if (result.success) {
      setEditingId(null);
      fetchEvents();
    } else {
      alert('Update failed: ' + result.error);
    }
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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.event_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'open' && event.is_open) ||
                         (filterStatus === 'closed' && !event.is_open);
    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
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
            <option value="Cultural" className="bg-slate-900">Cultural</option>
            <option value="Sports" className="bg-slate-900">Sports</option>
            <option value="Gaming" className="bg-slate-900">Gaming</option>
            <option value="Other" className="bg-slate-900">Other</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Event</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Category</th>
                <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Type</th>
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
                const isEditing = editingId === event.id;

                return (
                  <tr key={event.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-6">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 w-full focus:border-secondary outline-none"
                            placeholder="Event Name"
                          />
                          <input 
                            type="text" 
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 w-full focus:border-secondary outline-none text-sm"
                            placeholder="Description"
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold">{event.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{event.event_key}</p>
                          {event.description && (
                            <p className="text-xs text-gray-400 mt-1">{event.description}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      {isEditing ? (
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                          className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 focus:border-secondary outline-none"
                        >
                          <option value="Technical">Technical</option>
                          <option value="Non-Technical">Non-Technical</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Conference">Conference</option>
                          <option value="Cultural">Cultural</option>
                          <option value="Sports">Sports</option>
                          <option value="Gaming">Gaming</option>
                          <option value="Other">Other</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                          {event.category || 'Uncategorized'}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      {isEditing ? (
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                          className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 focus:border-secondary outline-none"
                        >
                          <option value="SOLO">SOLO</option>
                          <option value="TEAM">TEAM</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          event.type === 'SOLO' 
                            ? 'bg-blue-500/10 text-blue-400' 
                            : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {event.type}
                        </span>
                      )}
                    </td>
                    <td className="p-6">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.price}
                          onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value)})}
                          className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 w-24 focus:border-secondary outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-gray-500" />
                          <span className="font-bold">₹{event.price}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editForm.capacity}
                          onChange={(e) => setEditForm({...editForm, capacity: parseInt(e.target.value)})}
                          className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 w-24 focus:border-secondary outline-none"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-500" />
                          <span>{event.current_registrations || 0} / {event.capacity}</span>
                        </div>
                      )}
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
                        onClick={() => !isEditing && handleToggleStatus(event.id)}
                        disabled={isEditing}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                          event.is_open
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        } ${isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {event.is_open ? <Unlock size={12} /> : <Lock size={12} />}
                        {event.is_open ? 'Open' : 'Closed'}
                      </button>
                    </td>
                    <td className="p-6 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdate(event.id)}
                            className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                          >
                            <Save size={18} />
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
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
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
    </div>
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
                <option value="Cultural" className="bg-slate-900">Cultural</option>
                <option value="Sports" className="bg-slate-900">Sports</option>
                <option value="Gaming" className="bg-slate-900">Gaming</option>
                <option value="Other" className="bg-slate-900">Other</option>
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
