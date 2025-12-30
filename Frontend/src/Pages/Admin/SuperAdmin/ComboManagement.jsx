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
      fetchCombos();
    } else {
      alert('Failed to toggle status: ' + result.error);
    }
  };

  const handleDelete = async (comboId) => {
    if (!confirm('Are you sure you want to delete this combo? This cannot be undone.')) return;
    
    const result = await comboService.deleteCombo(comboId);
    if (result.success) {
      fetchCombos();
    } else {
      alert('Delete failed: ' + result.error);
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
              {combos.reduce((sum, c) => sum + c.total_purchases, 0)}
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
              key={combo.combo_id}
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
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{combo.combo_name}</h3>
          <p className="text-sm text-gray-400">{combo.combo_description}</p>
        </div>
        <button
          onClick={() => onToggleStatus(combo.combo_id)}
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
        <span className="text-3xl font-bold text-secondary">₹{combo.combo_price}</span>
        <span className="text-lg text-gray-500 line-through">₹{combo.original_price}</span>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
          <TrendingDown size={12} className="inline mr-1" />
          Save {combo.savings_percentage}%
        </span>
      </div>

      {/* Events Included */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Includes {combo.event_count} Events:</p>
        <div className="space-y-2">
          {combo.events && combo.events.slice(0, 3).map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Check size={14} className="text-green-400" />
              <span>{event.event_name}</span>
              <span className="text-gray-500">•</span>
              <span className="text-xs text-gray-500">{event.event_category}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">₹{event.event_price}</span>
            </div>
          ))}
          {combo.event_count > 3 && (
            <p className="text-xs text-gray-500">+ {combo.event_count - 3} more events</p>
          )}
        </div>
      </div>

      {/* Category Quotas */}
      {combo.category_quotas && Object.keys(combo.category_quotas).length > 0 && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-xs text-blue-400 mb-2 font-bold">Selection Requirements:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(combo.category_quotas).map(([category, count]) => (
              count > 0 && (
                <span key={category} className="text-xs px-2 py-1 bg-blue-500/20 rounded-lg">
                  {count} {category}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-gray-500" />
          <span>{combo.total_purchases} purchases</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign size={16} className="text-gray-500" />
          <span>₹{combo.savings} savings/combo</span>
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
          onClick={() => onDelete(combo.combo_id)}
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
  const CATEGORIES = ['Technical', 'Non-Technical', 'Workshop', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other'];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    eventIds: [],
    isActive: true,
    categoryQuotas: {} // e.g., { "Workshop": 2, "Technical": 3 }
  });
  const [availableEvents, setAvailableEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableEvents();
      if (editingCombo) {
        setFormData({
          name: editingCombo.combo_name,
          description: editingCombo.combo_description || '',
          price: editingCombo.combo_price,
          eventIds: editingCombo.events ? editingCombo.events.map(e => e.event_id) : [],
          isActive: editingCombo.is_active,
          categoryQuotas: editingCombo.category_quotas || {}
        });
      } else {
        setFormData({
          name: '',
          description: '',
          price: 0,
          eventIds: [],
          isActive: true,
          categoryQuotas: {}
        });
      }
    }
  }, [isOpen, editingCombo]);

  const fetchAvailableEvents = async () => {
    setLoadingEvents(true);
    const result = await comboService.getSoloEventsForCombo();
    if (result.success) {
      setAvailableEvents(result.data);
    }
    setLoadingEvents(false);
  };

  const toggleEvent = (eventId) => {
    setFormData(prev => ({
      ...prev,
      eventIds: prev.eventIds.includes(eventId)
        ? prev.eventIds.filter(id => id !== eventId)
        : [...prev.eventIds, eventId]
    }));
  };

  const calculateSuggestedPrice = () => {
    const selectedEvents = availableEvents.filter(e => formData.eventIds.includes(e.id));
    const total = selectedEvents.reduce((sum, e) => sum + e.price, 0);
    const suggested = Math.floor(total * 0.8); // 20% discount
    setFormData(prev => ({ ...prev, price: suggested }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    const result = editingCombo
      ? await comboService.updateCombo(editingCombo.combo_id, formData)
      : await comboService.createCombo(formData);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert('Operation failed: ' + result.error);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  const selectedEvents = availableEvents.filter(e => formData.eventIds.includes(e.id));
  const originalPrice = selectedEvents.reduce((sum, e) => sum + e.price, 0);
  const savings = originalPrice - formData.price;
  const savingsPercent = originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(1) : 0;

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

              {/* Price Summary */}
              {formData.eventIds.length > 0 && (
                <div className="mt-3 p-4 bg-white/5 rounded-2xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Original Total:</span>
                    <span className="font-bold">₹{originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Combo Price:</span>
                    <span className="font-bold text-secondary">₹{formData.price}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                    <span className="text-green-400">Savings:</span>
                    <span className="font-bold text-green-400">
                      ₹{savings} ({savingsPercent}% off)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Category Quotas */}
            <div>
              <label className="block text-sm font-bold mb-2 text-gray-400">
                Category Quotas (Optional)
                <span className="text-xs font-normal ml-2 text-gray-500">
                  Define how many events from each category students must select
                </span>
              </label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map(category => (
                  <div key={category} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <label className="block text-xs text-gray-400 mb-1">{category}</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.categoryQuotas[category] || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData({
                          ...formData,
                          categoryQuotas: {
                            ...formData.categoryQuotas,
                            [category]: value === 0 ? undefined : value
                          }
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center focus:outline-none focus:border-secondary"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              
              {/* Quota Summary */}
              {Object.keys(formData.categoryQuotas).some(k => formData.categoryQuotas[k] > 0) && (
                <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400 mb-2 font-bold">Student Selection Requirements:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.categoryQuotas)
                      .filter(([_, count]) => count > 0)
                      .map(([category, count]) => (
                        <span key={category} className="text-xs px-2 py-1 bg-blue-500/20 rounded-lg">
                          {count} {category}
                        </span>
                      ))}
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
