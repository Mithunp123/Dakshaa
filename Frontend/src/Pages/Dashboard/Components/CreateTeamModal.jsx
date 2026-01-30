import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Loader2, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '../../../supabase';
import paymentService from '../../../services/paymentService'; // Payment service handles team creation now

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated, preSelectedEventId, preSelectedEventName }) => {
  const [formData, setFormData] = useState({
    teamName: '',
    eventId: '',
    memberCount: '',
    maxMembers: 4,
    minMembers: 2
  });
  const [events, setEvents] = useState([]);
  const [selectedEventObj, setSelectedEventObj] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTeamEvents();
    }
  }, [isOpen]);

  // Pre-select event if provided via navigation
  useEffect(() => {
    if (preSelectedEventId) {
      // Set eventId immediately
      setFormData(prev => ({
        ...prev,
        eventId: preSelectedEventId
      }));
    }
  }, [preSelectedEventId]);

  // Update selectedEventObj when events or eventId changes
  useEffect(() => {
    if (events.length > 0 && formData.eventId) {
      const selected = events.find(e => e.event_id === formData.eventId);
      if (selected) {
        setSelectedEventObj(selected);
        setFormData(prev => ({
          ...prev,
          maxMembers: selected.max_team_size || 4,
          minMembers: selected.min_team_size || 2
        }));
      }
    }
  }, [formData.eventId, events]);

  const fetchTeamEvents = async () => {
    try {
      setFetchingEvents(true);
      // Fetch events that allow teams with price
      const { data, error } = await supabase
        .from('events')
        .select('event_id, title, name, event_name, max_team_size, min_team_size, price')
        .eq('is_team_event', 'true')
        .eq('is_active', 'true')
        .order('title'); 

      if (error) throw error;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setFetchingEvents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotal = () => {
    if (!selectedEventObj || !formData.memberCount) return 0;
    const price = selectedEventObj.price || 0;
    return price * parseInt(formData.memberCount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.teamName.trim()) {
      setError('Please enter a team name');
      setLoading(false);
      return;
    }

    if (!formData.eventId) {
      setError('Please select an event');
      setLoading(false);
      return;
    }

    if (!formData.memberCount) {
      setError('Please enter team member count');
      setLoading(false);
      return;
    }

    const count = parseInt(formData.memberCount);
    const min = selectedEventObj?.min_team_size || 2;
    const max = selectedEventObj?.max_team_size || 4;

    if (count < min || count > max) {
      setError(`Team size must be between ${min} and ${max} members`);
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setError("You need to be logged in.");
        setLoading(false);
        return;
      }

      // Initiate Payment Flow
      const amount = calculateTotal();
      
      const result = await paymentService.initiateTeamPayment({
        userId: user.id,
        eventId: formData.eventId,
        teamName: formData.teamName,
        memberCount: count,
        amount: amount
      });

      if (result.success && result.payment_url) {
        // Redirect to custom payment gateway
        window.location.href = result.payment_url;
      } else {
        setError(result.error || 'Failed to initiate payment.');
        setLoading(false); 
      }
    } catch (err) {
      console.error('Error initiating team registration:', err);
      // setError('An unexpected error occurred. Please try again.');
      // For debugging, show error
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ teamName: '', eventId: '', memberCount: '', maxMembers: 4, minMembers: 2 });
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                <Users className="text-secondary" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Register Team</h2>
                <p className="text-xs text-gray-400">Team Event Registration</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Pre-selected Event Info */}
            {preSelectedEventId && preSelectedEventName && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-blue-400">Event Selected</p>
                  <p className="text-xs text-gray-300 mt-1">
                    Registration for: <span className="font-semibold">{preSelectedEventName}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="teamName"
                value={formData.teamName}
                onChange={handleChange}
                placeholder="Enter your team name"
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all disabled:opacity-50"
                required
              />
            </div>

            {/* Event Selection - Hidden when pre-selected */}
            {!preSelectedEventId && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Event <span className="text-red-500">*</span>
                </label>
                {fetchingEvents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <p className="text-gray-400 text-sm">No team events available</p>
                  </div>
                ) : (
                  <select
                    name="eventId"
                    value={formData.eventId}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all disabled:opacity-50"
                    required
                  >
                    <option value="" className="bg-slate-900">Select an event</option>
                    {events.map(event => {
                      const eventName = event.title || event.name || event.event_name || (event.event_id ? event.event_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown Event');
                      return (
                        <option key={event.event_id} value={event.event_id} className="bg-slate-900">
                          {eventName}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            )}

            {/* Member Count & Price Info */}
            {formData.eventId && selectedEventObj && (
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Team Members <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="memberCount"
                      value={formData.memberCount}
                      onChange={handleChange}
                      min={formData.minMembers}
                      max={formData.maxMembers}
                      placeholder={`Between ${formData.minMembers} and ${formData.maxMembers}`}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all disabled:opacity-50"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Min: {formData.minMembers}, Max: {formData.maxMembers}
                    </p>
                  </div>

                  <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">Price per head:</span>
                        <span className="text-sm font-bold text-white">₹{selectedEventObj.price || 0}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-secondary/20">
                        <span className="text-base font-bold text-secondary">Total Amount:</span>
                        <span className="text-xl font-bold text-secondary">₹{calculateTotal()}</span>
                    </div>
                  </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-green-400">{success}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || fetchingEvents || events.length === 0 || !formData.memberCount}
                className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary-dark text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay ₹{calculateTotal()}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTeamModal;
