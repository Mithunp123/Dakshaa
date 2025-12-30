import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  Download,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import eventConfigService from "../../../services/eventConfigService";

const EventConfiguration = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    event_key: "",
    name: "",
    description: "",
    price: 0,
    type: "SOLO",
    capacity: 100,
    is_open: true
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const result = await eventConfigService.getEventsWithStats();
      if (result.success) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = () => {
    setFormData({
      event_key: "",
      name: "",
      description: "",
      price: 0,
      type: "SOLO",
      capacity: 100,
      is_open: true
    });
    setShowAddModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setFormData({
      event_key: event.event_key,
      name: event.name,
      description: event.description || "",
      price: event.price,
      type: event.type,
      capacity: event.capacity,
      is_open: event.is_open
    });
    setShowEditModal(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await eventConfigService.createEvent(formData);
      
      if (result.success) {
        alert("Event created successfully!");
        setShowAddModal(false);
        fetchEvents();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await eventConfigService.updateEvent(selectedEvent.id, formData);
      
      if (result.success) {
        alert("Event updated successfully!");
        setShowEditModal(false);
        fetchEvents();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (eventId) => {
    try {
      const result = await eventConfigService.toggleEventStatus(eventId);
      
      if (result.success) {
        fetchEvents();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await eventConfigService.deleteEvent(eventId);
      
      if (result.success) {
        alert("Event deleted successfully!");
        fetchEvents();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      filterType === "ALL" ||
      (filterType === "OPEN" && event.is_open) ||
      (filterType === "CLOSED" && !event.is_open) ||
      event.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const getCapacityColor = (current, total) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-orange-500";
    return "text-green-500";
  };

  const getCapacityBgColor = (current, total) => {
    const percentage = (current / total) * 100;
    if (percentage >= 90) return "bg-red-500/20 border-red-500/50";
    if (percentage >= 70) return "bg-orange-500/20 border-orange-500/50";
    return "bg-green-500/20 border-green-500/50";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Configuration</h1>
          <p className="text-gray-400 mt-1">Manage event metadata and capacity</p>
        </div>
        <button
          onClick={handleAddEvent}
          className="px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-secondary/50 transition-all"
        >
          <Plus size={20} />
          Add Event
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Open Events</p>
              <p className="text-2xl font-bold">
                {events.filter((e) => e.is_open).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Users className="text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Registrations</p>
              <p className="text-2xl font-bold">
                {events.reduce((sum, e) => sum + Number(e.current_registrations), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Fill Rate</p>
              <p className="text-2xl font-bold">
                {events.length > 0
                  ? Math.round(
                      (events.reduce(
                        (sum, e) =>
                          sum + (Number(e.current_registrations) / e.capacity) * 100,
                        0
                      ) /
                        events.length)
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary"
          />
        </div>

        <div className="flex gap-2">
          {["ALL", "OPEN", "CLOSED", "SOLO", "TEAM"].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                filterType === filter
                  ? "bg-secondary text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Event Details
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{event.name}</p>
                      <p className="text-sm text-gray-400 font-mono">{event.event_key}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.type === "SOLO"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} className="text-green-400" />
                      <span className="font-semibold">
                        {event.price === 0 ? "FREE" : `₹${event.price}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${getCapacityBgColor(event.current_registrations, event.capacity)}`}>
                      <Users size={16} className={getCapacityColor(event.current_registrations, event.capacity)} />
                      <span className={`font-bold ${getCapacityColor(event.current_registrations, event.capacity)}`}>
                        {event.current_registrations} / {event.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(event.id)}
                      className="flex items-center gap-2 group"
                    >
                      {event.is_open ? (
                        <>
                          <ToggleRight
                            className="text-green-500 group-hover:scale-110 transition-transform"
                            size={32}
                          />
                          <span className="text-green-500 font-semibold">Open</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft
                            className="text-gray-500 group-hover:scale-110 transition-transform"
                            size={32}
                          />
                          <span className="text-gray-500 font-semibold">Closed</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.name)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
            <p className="text-gray-400">No events found</p>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddModal && (
          <EventFormModal
            title="Add New Event"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitAdd}
            onClose={() => setShowAddModal(false)}
            submitting={submitting}
            isEdit={false}
          />
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {showEditModal && (
          <EventFormModal
            title="Edit Event"
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmitEdit}
            onClose={() => setShowEditModal(false)}
            submitting={submitting}
            isEdit={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Event Form Modal Component
const EventFormModal = ({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  submitting,
  isEdit
}) => {
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-2xl w-full bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-bold mb-6">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Event Key */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Event Key/Slug *
              {!isEdit && (
                <span className="text-gray-500 text-xs ml-2">
                  (Must match frontend folder/ID)
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.event_key}
              onChange={(e) => handleChange("event_key", e.target.value)}
              disabled={isEdit}
              required
              placeholder="e.g., paper-pres, debug-code"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Event Name */}
          <div>
            <label className="block text-sm font-semibold mb-2">Event Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              placeholder="e.g., Paper Presentation"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Brief description of the event"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Participation Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleChange("type", "SOLO")}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  formData.type === "SOLO"
                    ? "bg-secondary text-white shadow-lg shadow-secondary/50"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                SOLO
              </button>
              <button
                type="button"
                onClick={() => handleChange("type", "TEAM")}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  formData.type === "TEAM"
                    ? "bg-secondary text-white shadow-lg shadow-secondary/50"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                TEAM
              </button>
            </div>
          </div>

          {/* Price and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange("price", parseInt(e.target.value) || 0)}
                min="0"
                required
                placeholder="0 for free"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Total Capacity *
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) =>
                  handleChange("capacity", parseInt(e.target.value) || 100)
                }
                min="1"
                required
                placeholder="100"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Is Open */}
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="is_open"
              checked={formData.is_open}
              onChange={(e) => handleChange("is_open", e.target.checked)}
              className="w-5 h-5 rounded accent-secondary"
            />
            <label htmlFor="is_open" className="font-semibold">
              Open for registration
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary to-primary rounded-xl font-semibold hover:shadow-lg hover:shadow-secondary/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Event"
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EventConfiguration;
