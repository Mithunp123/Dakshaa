import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  Users,
  Filter
} from "lucide-react";
import {
  getWaitlist,
  promoteWaitlistUser,
  getAllEvents
} from "../../../services/adminService";

const WaitlistManagement = () => {
  const [waitlist, setWaitlist] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState('');
  
  const [stats, setStats] = useState({
    total: 0,
    byEvent: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadWaitlist();
  }, [selectedEvent]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadWaitlist(), loadEvents()]);
    setLoading(false);
  };

  const loadWaitlist = async () => {
    const { data } = await getWaitlist(selectedEvent || null);
    if (data) {
      setWaitlist(data);
      calculateStats(data);
    }
  };

  const loadEvents = async () => {
    const { data } = await getAllEvents();
    if (data) setEvents(data);
  };

  const calculateStats = (data) => {
    const byEvent = data.reduce((acc, item) => {
      const eventId = item.event_id;
      acc[eventId] = (acc[eventId] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      total: data.length,
      byEvent
    });
  };

  const handlePromote = async (waitlistId) => {
    if (!window.confirm('Promote this user from waitlist to registration?')) return;
    
    setLoading(true);
    const { data, error } = await promoteWaitlistUser(waitlistId);
    setLoading(false);
    
    if (data) {
      alert('User promoted successfully!');
      loadWaitlist();
    } else {
      alert('Error: ' + error?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Waitlist Management</h1>
        <p className="text-gray-400 mt-1">Manage and promote users from waitlist</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Waitlisted</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-xl">
              <Clock size={24} className="text-yellow-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Events with Waitlist</p>
              <p className="text-3xl font-bold mt-1">{Object.keys(stats.byEvent).length}</p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-xl">
              <Users size={24} className="text-blue-500" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg. per Event</p>
              <p className="text-3xl font-bold mt-1">
                {Object.keys(stats.byEvent).length > 0
                  ? Math.round(stats.total / Object.keys(stats.byEvent).length)
                  : 0}
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-xl">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-400" />
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.event_id} value={event.event_id}>
                {event.event_id} - {event.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Waitlist Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-10 h-10 animate-spin text-secondary" />
        </div>
      ) : waitlist.length > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Position</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Event</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Capacity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Joined At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {waitlist.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg font-bold">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{item.user?.full_name}</p>
                        <p className="text-sm text-gray-400">{item.user?.email}</p>
                        <p className="text-xs text-gray-500">{item.user?.mobile_number}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-sm">
                        {item.event?.event_id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {item.event?.capacity} seats
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePromote(item.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 size={16} />
                        Promote
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Clock size={64} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No users in waitlist</p>
        </div>
      )}
    </div>
  );
};

export default WaitlistManagement;
