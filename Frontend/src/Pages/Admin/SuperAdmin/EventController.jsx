import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Calendar,
  MapPin,
  Clock,
  X,
  Trash2
} from "lucide-react";
import { supabase } from "../../../supabase";

const EventController = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    message: "",
    type: "general"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEvents(), fetchAnnouncements()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const updateEventStatus = async (eventId, status) => {
    try {
      const updates = { current_status: status };
      
      // If starting an event, set start time
      if (status === "live" && !events.find(e => e.event_id === eventId)?.start_time) {
        updates.start_time = new Date().toISOString();
      }
      
      // If ending an event, set end time
      if (status === "ended") {
        updates.end_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from("events")
        .update(updates)
        .eq("event_id", eventId);

      if (error) throw error;

      await fetchEvents();
    } catch (error) {
      console.error("Error updating event status:", error);
      alert("Failed to update event status");
    }
  };

  const broadcastAnnouncement = async () => {
    if (!newAnnouncement.message.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("announcements")
        .insert({
          message: newAnnouncement.message,
          type: newAnnouncement.type,
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;

      setNewAnnouncement({ message: "", type: "general" });
      await fetchAnnouncements();
    } catch (error) {
      console.error("Error broadcasting announcement:", error);
      alert("Failed to broadcast announcement");
    }
  };

  const deleteAnnouncement = async (id) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      await fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("Failed to delete announcement");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "live":
        return "bg-green-500/20 text-green-500 border-green-500/50";
      case "delayed":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
      case "ended":
        return "bg-gray-500/20 text-gray-500 border-gray-500/50";
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Status Controller</h1>
          <p className="text-gray-400 text-sm mt-1">Control live event status board and announcements</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Broadcast Announcement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold mb-4">Broadcast Announcement</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <select
              value={newAnnouncement.type}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
            </select>
            <input
              type="text"
              placeholder="Type your announcement message..."
              value={newAnnouncement.message}
              onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
              onKeyPress={(e) => e.key === "Enter" && broadcastAnnouncement()}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
            />
            <button
              onClick={broadcastAnnouncement}
              className="flex items-center gap-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
            >
              <Send size={18} />
              <span>Broadcast</span>
            </button>
          </div>
          
          {/* Active Announcements */}
          {announcements.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm text-gray-400 mb-2">Active Announcements:</p>
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      announcement.type === "urgent" ? "bg-red-500/20 text-red-500" :
                      announcement.type === "success" ? "bg-green-500/20 text-green-500" :
                      announcement.type === "warning" ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-blue-500/20 text-blue-500"
                    }`}>
                      {announcement.type.toUpperCase()}
                    </span>
                    <p className="text-sm">{announcement.message}</p>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Events Control */}
      <div className="grid grid-cols-1 gap-4">
        {events.map((event, index) => (
          <motion.div
            key={event.event_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <h3 className="text-xl font-bold">{event.category}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.current_status)}`}>
                    {event.current_status?.toUpperCase() || "SCHEDULED"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  {event.venue && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{event.venue}</span>
                    </div>
                  )}
                  {event.start_time && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>
                        {new Date(event.start_time).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  )}
                  {event.current_status === "ended" && event.end_time && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <CheckCircle2 size={14} />
                      <span>
                        Ended at{" "}
                        {new Date(event.end_time).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                {event.current_status !== "live" && event.current_status !== "ended" && (
                  <button
                    onClick={() => updateEventStatus(event.event_id, "live")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-xl transition-colors"
                  >
                    <Play size={16} />
                    <span className="hidden md:inline">Start</span>
                  </button>
                )}

                {event.current_status === "live" && (
                  <button
                    onClick={() => updateEventStatus(event.event_id, "ended")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl transition-colors"
                  >
                    <Square size={16} />
                    <span className="hidden md:inline">End</span>
                  </button>
                )}

                {event.current_status !== "delayed" && event.current_status !== "ended" && (
                  <button
                    onClick={() => updateEventStatus(event.event_id, "delayed")}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-xl transition-colors"
                  >
                    <AlertTriangle size={16} />
                    <span className="hidden md:inline">Delay</span>
                  </button>
                )}

                {event.current_status === "delayed" && (
                  <button
                    onClick={() => updateEventStatus(event.event_id, "scheduled")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 rounded-xl transition-colors"
                  >
                    <X size={16} />
                    <span className="hidden md:inline">Clear Delay</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default EventController;
