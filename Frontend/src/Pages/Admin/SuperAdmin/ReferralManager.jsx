import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  RefreshCw,
  Crown,
  Medal,
  Trophy,
  UserPlus,
  School,
  Phone,
  Mail,
  Calendar,
  TrendingUp
} from "lucide-react";
import { supabase } from "../../../supabase";

const ReferralManager = () => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [filteredReferrals, setFilteredReferrals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [topReferrers, setTopReferrers] = useState([]);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    uniqueReferrers: 0
  });

  useEffect(() => {
    fetchReferralData();
  }, []);

  useEffect(() => {
    filterReferrals();
  }, [searchQuery, referrals]);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      // Fetch all users who have a referred_by value (meaning they were referred)
      const { data: referredUsers, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile_number, roll_number, college_name, department, year_of_study, referred_by, created_at")
        .not("referred_by", "is", null)
        .neq("referred_by", "")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setReferrals(referredUsers || []);

      // Calculate referral counts per referrer
      const referrerCounts = {};
      referredUsers?.forEach(user => {
        const referrer = user.referred_by;
        if (referrer) {
          if (!referrerCounts[referrer]) {
            referrerCounts[referrer] = {
              referrer_roll: referrer,
              count: 0,
              referredUsers: []
            };
          }
          referrerCounts[referrer].count++;
          referrerCounts[referrer].referredUsers.push(user.full_name);
        }
      });

      // Get top 3 referrers
      const sortedReferrers = Object.values(referrerCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Fetch referrer details for top 3
      const topReferrerDetails = await Promise.all(
        sortedReferrers.map(async (referrer) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, college_name, department")
            .or(`roll_number.eq.${referrer.referrer_roll},roll_no.eq.${referrer.referrer_roll}`)
            .single();

          return {
            ...referrer,
            full_name: profile?.full_name || "Unknown",
            email: profile?.email || "",
            college_name: profile?.college_name || "",
            department: profile?.department || ""
          };
        })
      );

      setTopReferrers(topReferrerDetails);

      // Calculate stats
      setStats({
        totalReferrals: referredUsers?.length || 0,
        uniqueReferrers: Object.keys(referrerCounts).length
      });

    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterReferrals = () => {
    if (!searchQuery) {
      setFilteredReferrals(referrals);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = referrals.filter(user =>
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.roll_number?.toLowerCase().includes(query) ||
      user.referred_by?.toLowerCase().includes(query) ||
      user.college_name?.toLowerCase().includes(query) ||
      user.mobile_number?.includes(query)
    );
    setFilteredReferrals(filtered);
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="text-yellow-500" size={28} />;
      case 1:
        return <Medal className="text-gray-300" size={28} />;
      case 2:
        return <Medal className="text-orange-400" size={28} />;
      default:
        return null;
    }
  };

  const getRankColor = (index) => {
    switch (index) {
      case 0:
        return "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30";
      case 1:
        return "from-gray-300/20 to-gray-400/5 border-gray-300/30";
      case 2:
        return "from-orange-400/20 to-orange-500/5 border-orange-400/30";
      default:
        return "from-white/5 to-white/0 border-white/10";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="text-secondary" size={32} />
            Referral Management
          </h1>
          <p className="text-gray-400 text-sm mt-1">Track and manage student referrals</p>
        </div>
        <button
          onClick={fetchReferralData}
          className="flex items-center gap-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <UserPlus className="text-blue-500" size={24} />
            <span className="text-2xl font-bold">{stats.totalReferrals}</span>
          </div>
          <p className="text-sm text-gray-400">Total Referred Users</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <Users className="text-purple-500" size={24} />
            <span className="text-2xl font-bold">{stats.uniqueReferrers}</span>
          </div>
          <p className="text-sm text-gray-400">Unique Referrers</p>
        </motion.div>
      </div>

      {/* Top 3 Referrers */}
      {topReferrers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="text-green-500" size={24} />
            Top Referrers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topReferrers.map((referrer, index) => (
              <motion.div
                key={referrer.referrer_roll}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${getRankColor(index)} border rounded-2xl p-6`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg truncate">{referrer.full_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{referrer.referrer_roll}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-400">
                  {referrer.college_name && (
                    <p className="truncate">{referrer.college_name}</p>
                  )}
                  {referrer.department && (
                    <p className="truncate">{referrer.department}</p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Referrals</span>
                  <span className="text-3xl font-bold text-secondary">{referrer.count}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, email, roll number, referrer, college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold">Referred Users ({filteredReferrals.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 font-semibold">Student</th>
                <th className="text-left p-4 font-semibold">Roll Number</th>
                <th className="text-left p-4 font-semibold">College</th>
                <th className="text-left p-4 font-semibold">Mobile</th>
                <th className="text-left p-4 font-semibold">Referred By</th>
                <th className="text-left p-4 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredReferrals.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm text-gray-400">{user.roll_number || '-'}</span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-gray-400 text-sm">{user.college_name || '-'}</p>
                      <p className="text-xs text-gray-500">{user.department} • {user.year_of_study}</p>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{user.mobile_number || '-'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-lg text-sm font-mono">
                      {user.referred_by}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReferrals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p>No referrals found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralManager;
