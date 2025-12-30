import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CreditCard, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { supabase } from '../../../supabase';

const Overview = () => {
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    totalCheckins: 0,
    recentRegistrations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch Total Registrations
      const { count: regCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      // Fetch Total Revenue
      const { data: payments } = await supabase
        .from('registrations')
        .select('events(price), combos(price)')
        .eq('payment_status', 'completed');

      const revenue = payments?.reduce((acc, curr) => {
        return acc + (curr.events?.price || curr.combos?.price || 0);
      }, 0);

      // Fetch Total Check-ins
      const { count: checkinCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });

      // Fetch Recent Registrations
      const { data: recent } = await supabase
        .from('registrations')
        .select('*, profiles(full_name), events(title)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalRegistrations: regCount || 0,
        totalRevenue: revenue || 0,
        totalCheckins: checkinCount || 0,
        recentRegistrations: recent || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      label: 'Total Registrations', 
      value: stats.totalRegistrations, 
      icon: Users, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10',
      trend: '+12%',
      isUp: true
    },
    { 
      label: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: CreditCard, 
      color: 'text-green-400', 
      bg: 'bg-green-400/10',
      trend: '+8%',
      isUp: true
    },
    { 
      label: 'Live Check-ins', 
      value: stats.totalCheckins, 
      icon: CheckCircle, 
      color: 'text-purple-400', 
      bg: 'bg-purple-400/10',
      trend: 'Live',
      isUp: true
    },
    { 
      label: 'Active Events', 
      value: '12', 
      icon: Calendar, 
      color: 'text-orange-400', 
      bg: 'bg-orange-400/10',
      trend: '0',
      isUp: false
    },
  ];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">System Overview</h2>
        <p className="text-gray-400">Real-time analytics and system status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-green-400' : 'text-gray-400'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={14} /> : null}
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Registrations</h3>
            <button className="text-secondary text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {stats.recentRegistrations.map((reg, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center font-bold">
                    {reg.profiles?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{reg.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{reg.events?.title || 'Combo Pass'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gray-400">
                    {new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    reg.payment_status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {reg.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-secondary/20 to-primary/20 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                <TrendingUp size={18} /> Generate Revenue Report
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                <Users size={18} /> Export User List
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Database</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Auth Service</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Storage</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
