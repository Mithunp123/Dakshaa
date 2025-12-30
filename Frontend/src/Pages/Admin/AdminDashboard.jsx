import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "../../supabase";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    totalCheckins: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchUserRole();
    fetchStats();
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
      // Fetch Total Registrations
      const { count: regCount } = await supabase
        .from("registrations")
        .select("*", { count: "exact", head: true });

      // Fetch Total Revenue
      const { data: payments } = await supabase
        .from("registrations")
        .select("events(price), combos(price)")
        .eq("payment_status", "completed");

      const revenue = payments?.reduce((acc, curr) => {
        return acc + (curr.events?.price || curr.combos?.price || 0);
      }, 0);

      // Fetch Total Check-ins
      const { count: checkinCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true });

      // Fetch Total Users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setStats({
        totalRegistrations: regCount || 0,
        totalRevenue: revenue || 0,
        totalCheckins: checkinCount || 0,
        totalUsers: userCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Registrations",
      value: stats.totalRegistrations,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Total Check-ins",
      value: stats.totalCheckins,
      icon: CheckCircle,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: TrendingUp,
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back! Here's an overview of your platform.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
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
