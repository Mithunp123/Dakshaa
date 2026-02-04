import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, DollarSign, TrendingUp, Shield, AlertTriangle } from "lucide-react";
import TeamManagementTable from "../../Components/TeamManagement/TeamManagementTable";
import { getCurrentUserProfile } from "../../utils/userUtils";
import { supabase } from "../../supabase";
import { API_BASE_URL } from "../../config/api";

const TeamsPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [statistics, setStatistics] = useState({
    team_count: 0,
    paid_team_count: 0,
    leader_count: 0,
    member_count: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch events for filter
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_id')
        .order('name');

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch overall statistics
  const fetchStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEvent) {
        params.append('event_id', selectedEvent);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/teams/statistics?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };\n\n  useEffect(() => {\n    fetchEvents();\n  }, []);\n\n  useEffect(() => {\n    fetchStatistics();\n  }, [selectedEvent]);\n\n  const statCards = [\n    {\n      title: \"Total Teams\",\n      value: statistics.team_count,\n      icon: Users,\n      color: \"from-blue-500 to-cyan-500\",\n      bgColor: \"bg-blue-500/10\",\n      textColor: \"text-blue-400\"\n    },\n    {\n      title: \"Paid Teams\",\n      value: statistics.paid_team_count,\n      icon: Trophy,\n      color: \"from-green-500 to-emerald-500\",\n      bgColor: \"bg-green-500/10\",\n      textColor: \"text-green-400\"\n    },\n    {\n      title: \"Total Members\",\n      value: statistics.member_count,\n      icon: Users,\n      color: \"from-purple-500 to-pink-500\",\n      bgColor: \"bg-purple-500/10\",\n      textColor: \"text-purple-400\"\n    },\n    {\n      title: \"Revenue\",\n      value: `₹${statistics.total_revenue.toLocaleString()}`,\n      icon: DollarSign,\n      color: \"from-yellow-500 to-orange-500\",\n      bgColor: \"bg-yellow-500/10\",\n      textColor: \"text-yellow-400\"\n    }\n  ];\n\n  if (loading) {\n    return (\n      <div className=\"min-h-screen bg-gray-950 flex items-center justify-center\">\n        <div className=\"text-center\">\n          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4\"></div>\n          <p className=\"text-white\">Loading teams data...</p>\n        </div>\n      </div>\n    );\n  }\n\n  return (\n    <div className=\"min-h-screen bg-gray-950 text-white p-6\">\n      <div className=\"max-w-7xl mx-auto\">\n        {/* Header */}\n        <motion.div\n          initial={{ opacity: 0, y: -20 }}\n          animate={{ opacity: 1, y: 0 }}\n          className=\"mb-8\"\n        >\n          <div className=\"flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4\">\n            <div>\n              <h1 className=\"text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent\">\n                Team Management\n              </h1>\n              <p className=\"text-gray-400 mt-2\">\n                Monitor and manage event teams, members, and payments\n              </p>\n            </div>\n\n            {/* Event Filter */}\n            <div className=\"flex items-center gap-4\">\n              <label className=\"text-gray-400 text-sm\">Filter by Event:</label>\n              <select\n                value={selectedEvent || ''}\n                onChange={(e) => setSelectedEvent(e.target.value || null)}\n                className=\"px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none min-w-[200px]\"\n              >\n                <option value=\"\">All Events</option>\n                {events.map(event => (\n                  <option key={event.id} value={event.id}>\n                    {event.name}\n                  </option>\n                ))}\n              </select>\n            </div>\n          </div>\n        </motion.div>\n\n        {/* Statistics Cards */}\n        <motion.div\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ delay: 0.1 }}\n          className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8\"\n        >\n          {statCards.map((stat, index) => {\n            const Icon = stat.icon;\n            return (\n              <motion.div\n                key={stat.title}\n                initial={{ opacity: 0, scale: 0.95 }}\n                animate={{ opacity: 1, scale: 1 }}\n                transition={{ delay: 0.1 + index * 0.05 }}\n                className={`${stat.bgColor} backdrop-blur-sm border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors`}\n              >\n                <div className=\"flex items-center justify-between mb-4\">\n                  <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>\n                    <Icon className=\"w-6 h-6 text-white\" />\n                  </div>\n                  <TrendingUp className=\"w-4 h-4 text-gray-500\" />\n                </div>\n                <div>\n                  <h3 className=\"text-gray-400 text-sm font-medium\">{stat.title}</h3>\n                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>\n                    {stat.value}\n                  </p>\n                </div>\n              </motion.div>\n            );\n          })}\n        </motion.div>\n\n        {/* Team Management Table */}\n        <motion.div\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          transition={{ delay: 0.2 }}\n        >\n          <TeamManagementTable \n            eventId={selectedEvent}\n            onlyPaid={false}\n          />\n        </motion.div>\n      </div>\n    </div>\n  );\n};\n\nexport default TeamsPage;