import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Package,
  TrendingDown,
  Users,
  DollarSign,
  Loader2,
  X,
  Check,
  AlertCircle,
  Tag
} from 'lucide-react';
import comboService from '../../../services/comboService';
import { supabase } from '../../../supabase';

const ComboManagement = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    setLoading(true);
    const result = await comboService.getCombosWithDetails();
    if (result.success) {
      setCombos(result.data);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (comboId) => {
    const result = await comboService.toggleComboStatus(comboId);
    if (result.success) {
      alert(result.message || 'Status updated successfully');
      fetchCombos();
    } else {
      alert('Failed to toggle status: ' + (result.message || result.error));
    }
  };

  const handleDelete = async (comboId) => {
    if (!confirm('Are you sure you want to delete this combo? This cannot be undone.')) return;
    
    const result = await comboService.deleteCombo(comboId);
    if (result.success) {
      alert(result.message || 'Combo deleted successfully');
      fetchCombos();
    } else {
      alert(result.message || result.error || 'Delete failed');
    }
  };

  const openAddModal = () => {
    setEditingCombo(null);
    setShowModal(true);
  };

  const openEditModal = (combo) => {
    setEditingCombo(combo);
    setShowModal(true);
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
          <h2 className="text-3xl font-bold">Combo & Package Management</h2>
          <p className="text-gray-400">Bundle multiple events into discounted packages</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-2xl font-bold hover:shadow-lg hover:shadow-secondary/30 transition-all"
        >
          <Plus size={20} />
          Create Combo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Package className="text-purple-400" size={32} />
            <span className="text-3xl font-bold">{combos.length}</span>
          </div>
          <p className="text-gray-400 text-sm">Total Combos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Unlock className="text-green-400" size={32} />
            <span className="text-3xl font-bold">
              {combos.filter(c => c.is_active).length}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Active Combos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-3xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="text-orange-400" size={32} />
            <span className="text-3xl font-bold">
              {combos.reduce((sum, c) => sum + (c.total_purchases || c.current_purchases || 0), 0)}
            </span>
          </div>
          <p className="text-gray-400 text-sm">Total Purchases</p>
        </motion.div>
      </div>

      {/* Combos Grid */}
      {combos.length === 0 ? (
        <div className="text-center py-12 bg-white/5 border border-white/10 rounded-3xl">
          <Package className="mx-auto text-gray-500 mb-4" size={48} />
          <p className="text-gray-400 mb-4">No combos created yet</p>
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-secondary rounded-2xl font-bold hover:bg-secondary/80 transition-all"
          >
            Create Your First Combo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {combos.map((combo) => (
            <ComboCard
              key={combo.id || combo.combo_id}
              combo={combo}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <ComboModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchCombos}
        editingCombo={editingCombo}
      />
    </div>
  );
};

// Combo Card Component
const ComboCard = ({ combo, onEdit, onDelete, onToggleStatus }) => {
  const [eventNames, setEventNames] = React.useState({});

  // Helper to check if value is UUID
  const isUUID = (value) => {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  // Fetch event names for UUIDs in quotas
  React.useEffect(() => {
    const fetchEventNames = async () => {
      if (!combo.category_quotas) return;
      
      const uuids = Object.values(combo.category_quotas).filter(val => isUUID(val));
      if (uuids.length === 0) return;

      try {
        const { data } = await supabase
          .from('events')
          .select('id, name')
          .in('id', uuids);
        
        const namesMap = {};
        data?.forEach(event => {
          namesMap[event.id] = event.name;
        });
        setEventNames(namesMap);
      } catch (error) {
        console.error('Error fetching event names:', error);
      }
    };

    fetchEventNames();
  }, [combo.category_quotas]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{combo.name || combo.combo_name}</h3>
          <p className="text-sm text-gray-400">{combo.description || 'No description'}</p>
        </div>
        <button
          onClick={() => onToggleStatus(combo.id || combo.combo_id)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            combo.is_active
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
          }`}
        >
          {combo.is_active ? <Unlock size={12} className="inline mr-1" /> : <Lock size={12} className="inline mr-1" />}
          {combo.is_active ? 'Active' : 'Inactive'}
        </button>
      </div>

      {/* Pricing */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-3xl font-bold text-secondary">₹{combo.price}</span>
        <span className="text-sm text-gray-400">
          {combo.total_events_required || 0} events required
        </span>
      </div>

      {/* Category Quotas with UUID/Count Detection */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Category Requirements:</p>
        <div className="space-y-2">
          {combo.category_quotas && Object.entries(combo.category_quotas).map(([category, value]) => {
            const isSpecificEvent = isUUID(value);
            return (
              value && (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <Check size={14} className={isSpecificEvent ? "text-purple-400" : "text-green-400"} />
                  {isSpecificEvent ? (
                    <>
                      <span className="font-medium text-purple-400">Specific:</span>
                      <span className="text-gray-300">{eventNames[value] || 'Loading...'}</span>
                      <span className="text-xs text-gray-500">({category})</span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium">{value}x</span>
                      <span>{category}</span>
                      <span className="text-xs text-gray-500">events</span>
                    </>
                  )}
                </div>
              )
            );
          })}
          {(!combo.category_quotas || Object.keys(combo.category_quotas).length === 0) && (
            <p className="text-xs text-gray-500">No category requirements set</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-purple-400" />
          <span className="font-bold text-purple-400">{combo.total_purchases || combo.current_purchases || 0}</span>
          <span className="text-gray-400">purchases</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Package size={16} className="text-gray-500" />
          <span>{combo.total_events_required || 0} events required</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(combo)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all"
        >
          <Edit2 size={16} />
          Edit
        </button>
        <button
          onClick={() => onDelete(combo.id || combo.combo_id)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </motion.div>
  );
};

// Combo Modal Component
const ComboModal = ({ isOpen, onClose, onSuccess, editingCombo }) => {
  const CATEGORIES = ['Technical', 'Non-Technical', 'Workshop', 'Hackathon', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other'];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discountPercentage: 0,
    isActive: true,
    displayOrder: 0,
    maxPurchases: 100,
    badgeText: '',
    badgeColor: '#10b981',
    categoryQuotas: {}, // Can store either UUID or count: { "Workshop": "uuid-123" } or { "Workshop": 2 }
    totalEventsRequired: 2
  });
  const [categorySpecificEvents, setCategorySpecificEvents] = useState({}); // { "Technical": "uuid", ... }
  const [categoryCounts, setCategoryCounts] = useState({}); // { "Technical": 2, ... }
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Fetch available events for dropdowns
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase.from('events').select('id, name, event_key, category').eq('is_active', true);
      if (error) {
        console.error('Error fetching events:', error);
      } else {
        console.log('Fetched events:', data);
        setAvailableEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
    setEventsLoading(false);
  };

  // Helper to check if a value is a UUID
  const isUUID = (value) => {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  useEffect(() => {
    if (isOpen) {
      if (editingCombo) {
        const quotas = editingCombo.category_quotas || {};
        const specificEvents = {};
        const counts = {};

        // Separate UUIDs and counts
        Object.entries(quotas).forEach(([category, value]) => {
          if (isUUID(value)) {
            specificEvents[category] = value;
          } else if (typeof value === 'number' && value > 0) {
            counts[category] = value;
          }
        });

        setCategorySpecificEvents(specificEvents);
        setCategoryCounts(counts);

        setFormData({
          name: editingCombo.name || editingCombo.combo_name,
          description: editingCombo.description || '',
          price: editingCombo.price,
          originalPrice: editingCombo.original_price || 0,
          discountPercentage: editingCombo.discount_percentage || 0,
          isActive: editingCombo.is_active,
          displayOrder: editingCombo.display_order || 0,
          maxPurchases: editingCombo.max_purchases || 100,
          badgeText: editingCombo.badge_text || '',
          badgeColor: editingCombo.badge_color || '#10b981',
          categoryQuotas: quotas,
          totalEventsRequired: editingCombo.total_events_required || 2
        });
      } else {
        setCategorySpecificEvents({});
        setCategoryCounts({});
        setFormData({
          name: '',
          description: '',
          price: 0,
          originalPrice: 0,
          discountPercentage: 0,
          isActive: true,
          displayOrder: 0,
          maxPurchases: 100,
          badgeText: '',
          badgeColor: '#10b981',
          categoryQuotas: {},
          totalEventsRequired: 2
        });
      }
    }
  }, [isOpen, editingCombo]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build category quotas based on priority: specific event > count
    const finalCategoryQuotas = {};
    let totalEvents = 0;

    CATEGORIES.forEach(category => {
      // Priority 1: Check if a specific event is selected
      if (categorySpecificEvents[category]) {
        finalCategoryQuotas[category] = categorySpecificEvents[category]; // Store UUID
        totalEvents += 1; // Each specific event counts as 1
      }
      // Priority 2: Check if a count is specified
      else if (categoryCounts[category] && categoryCounts[category] > 0) {
        finalCategoryQuotas[category] = parseInt(categoryCounts[category]); // Store count
        totalEvents += parseInt(categoryCounts[category]);
      }
    });

    if (totalEvents < 2) {
      alert('Category quotas must total at least 2 events (either specific events or counts)');
      return;
    }

    if (formData.price <= 0) {
      alert('Please enter a valid combo price');
      return;
    }

    setLoading(true);

    // Prepare data for API
    const apiData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      originalPrice: formData.originalPrice,
      discountPercentage: formData.discountPercentage,
      categoryQuotas: finalCategoryQuotas,
      totalEventsRequired: totalEvents,
      isActive: formData.isActive,
      displayOrder: formData.displayOrder,
      maxPurchases: formData.maxPurchases,
      badgeText: formData.badgeText,
      badgeColor: formData.badgeColor
    };

    const result = editingCombo
      ? await comboService.updateCombo(editingCombo.id || editingCombo.combo_id, apiData)
      : await comboService.createCombo(apiData);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert('Operation failed: ' + result.error);
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
          className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold">
              {editingCombo ? 'Edit Combo' : 'Create New Combo'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">Combo Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                placeholder="Tech Trio Pass"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                placeholder="Access to all premium technical workshops..."
                rows={3}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Combo Price (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="399"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Original Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="599"
                />
                <p className="text-xs text-gray-500 mt-1">For showing discount</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="33"
                />
              </div>
            </div>

            {/* Additional Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower = shown first</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Max Purchases</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPurchases}
                  onChange={(e) => setFormData({ ...formData, maxPurchases: parseInt(e.target.value) || 100 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-gray-400">Badge Text</label>
                <input
                  type="text"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary"
                  placeholder="POPULAR"
                />
              </div>
            </div>

            {/* Pricing note */}
            <div className="text-xs text-gray-500 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              Students will select events matching the category quotas at purchase time
            </div>

            {/* Category Quotas - Dual Input System */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Category Quotas * (Required - minimum 2 events total)
                <span className="text-xs font-normal ml-2 text-gray-500">
                  Select a specific event OR set a count for each category
                </span>
              </label>
              
              {eventsLoading && (
                <div className="text-center py-4 text-gray-400">
                  <Loader2 className="animate-spin inline mr-2" size={16} />
                  Loading events...
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.filter(category => {
                  // Only show categories that have events in the database
                  return availableEvents.some(event => 
                    event.category?.toLowerCase().replace(/[-_\s]/g, '') === category.toLowerCase().replace(/[-_\s]/g, '')
                  );
                }).map(category => {
                  // Get events for this category with flexible matching
                  const categoryEvents = availableEvents.filter(event => 
                    event.category?.toLowerCase().replace(/[-_\s]/g, '') === category.toLowerCase().replace(/[-_\s]/g, '')
                  );
                  
                  return (
                  <div key={category} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-300 mb-3 capitalize">{category}</h4>
                    
                    {/* Specific Event Dropdown */}
                    <div className="mb-3">
                      <label className="block text-xs text-gray-400 mb-2">Specific Event</label>
                      <select
                        value={categorySpecificEvents[category] || ''}
                        onChange={(e) => {
                          setCategorySpecificEvents({
                            ...categorySpecificEvents,
                            [category]: e.target.value || undefined
                          });
                          // Clear count when specific event is selected
                          if (e.target.value) {
                            setCategoryCounts({
                              ...categoryCounts,
                              [category]: undefined
                            });
                          }
                        }}
                        className="w-full bg-gray-800 text-white border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-secondary"
                        style={{ backgroundColor: '#1f2937', color: 'white' }}
                      >
                        <option value="" style={{ backgroundColor: '#1f2937', color: 'white' }}>-- None --</option>
                        {categoryEvents.map(event => (
                          <option key={event.id} value={event.id} style={{ backgroundColor: '#1f2937', color: 'white' }}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                      {categoryEvents.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{categoryEvents.length} event{categoryEvents.length > 1 ? 's' : ''} available</p>
                      )}
                    </div>
                    
                    {/* OR Separator */}
                    <div className="text-center text-xs text-gray-500 font-bold my-2">- OR -</div>
                    
                    {/* Count Input */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Event Count</label>
                      <input
                        type="number"
                        min="0"
                        value={categoryCounts[category] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setCategoryCounts({
                            ...categoryCounts,
                            [category]: value === 0 ? undefined : value
                          });
                          // Clear specific event when count is set
                          if (value > 0) {
                            setCategorySpecificEvents({
                              ...categorySpecificEvents,
                              [category]: undefined
                            });
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center focus:outline-none focus:border-secondary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {!eventsLoading && availableEvents.length === 0 && (
                <div className="text-center py-4 text-gray-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <AlertCircle className="inline mr-2" size={16} />
                  No active events found. Please create and activate events first.
                </div>
              )}
              
              {/* Quota Summary */}
              {(Object.keys(categorySpecificEvents).some(k => categorySpecificEvents[k]) || 
                Object.keys(categoryCounts).some(k => categoryCounts[k] > 0)) && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400 mb-2 font-bold">Student Selection Requirements:</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(category => {
                      if (categorySpecificEvents[category]) {
                        const event = availableEvents.find(e => e.id === categorySpecificEvents[category]);
                        return (
                          <span key={category} className="text-xs px-2 py-1 bg-green-500/20 rounded-lg">
                            Specific: {event ? event.name : 'Loading...'}
                          </span>
                        );
                      } else if (categoryCounts[category] > 0) {
                        return (
                          <span key={category} className="text-xs px-2 py-1 bg-blue-500/20 rounded-lg">
                            {categoryCounts[category]} {category}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="is_active" className="text-sm font-bold">
                Activate combo immediately
              </label>
            </div>

            {/* Actions */}
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
                    {editingCombo ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span>{editingCombo ? 'Update Combo' : 'Create Combo'}</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComboManagement;
