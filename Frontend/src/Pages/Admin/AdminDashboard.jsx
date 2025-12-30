import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Calendar,
  Settings,
  UserCog,
  BarChart3,
  Shield,
  Loader2,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../supabase";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    totalCheckins: 0,
    totalUsers: 0,
    morningCheckins: 0,
    eveningCheckins: 0,
    totalEvents: 0,
    openEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchUserRole();
    fetchStats();

    // Set up real-time subscriptions for live updates
    const attendanceSubscription = supabase
      .channel('admin-attendance-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => fetchStats()
      )
      .subscribe();

    const registrationSubscription = supabase
      .channel('admin-registration-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations_config' },
        () => fetchStats()
      )
      .subscribe();

    const profileSubscription = supabase
      .channel('admin-profile-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .subscribe();

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => {
      supabase.removeChannel(attendanceSubscription);
      supabase.removeChannel(registrationSubscription);
      supabase.removeChannel(profileSubscription);
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || "user");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const fetchStats = async () => {
    try {
      if (!loading) setRefreshing(true);

      // Try to use RPC function for comprehensive stats
      const { data: rpcStats, error: rpcError } = await supabase.rpc('get_admin_dashboard_stats');
      
      if (!rpcError && rpcStats) {
        setStats({
          totalRegistrations: rpcStats.total_registrations || 0,
          totalRevenue: rpcStats.total_revenue || 0,
          totalCheckins: rpcStats.total_checkins || 0,
          totalUsers: rpcStats.total_users || 0,
          morningCheckins: rpcStats.morning_checkins || 0,
          eveningCheckins: rpcStats.evening_checkins || 0,
          totalEvents: rpcStats.total_events || 0,
          openEvents: rpcStats.open_events || 0,
        });
        setLastUpdated(new Date());
      } else {
        // Fallback to direct queries
        const { count: regCount } = await supabase
          .from("event_registrations_config")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "PAID");

        // Fetch Total Revenue
        const { data: payments } = await supabase
          .from("event_registrations_config")
          .select("payment_amount")
          .eq("payment_status", "PAID");

        const revenue = payments?.reduce((acc, curr) => {
          return acc + (curr.payment_amount || 0);
        }, 0);

        // Fetch Morning Check-ins (using column-based session tracking)
        const { count: morningCount } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("morning_attended", true);

        // Fetch Evening Check-ins (using column-based session tracking)
        const { count: eveningCount } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("evening_attended", true);

        // Fetch Total Check-ins (count unique attendance rows)
        const { count: checkinCount } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .or("morning_attended.eq.true,evening_attended.eq.true");

        // Fetch Total Users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch Events
        const { count: eventCount } = await supabase
          .from("events_config")
          .select("*", { count: "exact", head: true });

        const { count: openEventCount } = await supabase
          .from("events_config")
          .select("*", { count: "exact", head: true })
          .eq("is_open", true);

        setStats({
          totalRegistrations: regCount || 0,
          totalRevenue: revenue || 0,
          totalCheckins: checkinCount || 0,
          totalUsers: userCount || 0,
          morningCheckins: morningCount || 0,
          eveningCheckins: eveningCount || 0,
          totalEvents: eventCount || 0,
          openEvents: openEventCount || 0,
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchStats();
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Registrations",
      value: stats.totalRegistrations,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      label: "Morning Check-ins",
      value: stats.morningCheckins,
      icon: Sun,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
    },
    {
      label: "Evening Check-ins",
      value: stats.eveningCheckins,
      icon: Moon,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      label: "Total Check-ins",
      value: stats.totalCheckins,
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
    },
    {
      label: "Open Events",
      value: stats.openEvents,
      icon: Calendar,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  const quickActions = [
    {
      label: "User Management",
      icon: UserCog,
      path: "/admin/users",
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Event Configuration",
      icon: Calendar,
      path: "/admin/events",
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Finance Manager",
      icon: CreditCard,
      path: "/admin/finance",
      color: "from-green-500 to-green-600",
    },
    {
      label: "Role Management",
      icon: Shield,
      path: "/admin/roles",
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Reports & Analytics",
      icon: BarChart3,
      path: "/admin/reports",
      color: "from-pink-500 to-pink-600",
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
      color: "from-gray-500 to-gray-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Refresh */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-400">
                Welcome back! Here's an overview of your platform.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-xs text-gray-400">Live - Auto-updating every 10 seconds</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className={`p-2 md:p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-gray-400 text-xs md:text-sm mb-1">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl bg-gradient-to-r ${action.color} text-white flex flex-col items-center justify-center gap-2 shadow-lg`}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium text-center">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Role-based Info */}
        {userRole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Your Role</h2>
            </div>
            <p className="text-gray-300">
              You are logged in as:{" "}
              <span className="text-blue-400 font-semibold capitalize">
                {userRole}
              </span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
