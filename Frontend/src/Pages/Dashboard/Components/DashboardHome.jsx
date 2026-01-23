import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Cpu, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Calendar,
  MapPin,
  Loader2,
  Copy
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { supabaseService } from '../../../services/supabaseService';
import toast from 'react-hot-toast';
import DakshaaCoin from '../../../assets/DakshaaCoin.png';

const DashboardHome = () => {
  // Get user from localStorage synchronously for instant load
  const getStoredUser = () => {
    try {
      const session = localStorage.getItem('sb-ltmyqtcirhsgfyortgfo-auth-token');
      if (session) {
        const sessionData = JSON.parse(session);
        return sessionData?.user || null;
      }
    } catch (error) {
      console.warn('Error reading stored session:', error);
    }
    return null;
  };

  const [profile, setProfile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Ref to prevent double-fetch in React StrictMode
  const isFetchingRef = React.useRef(false);

  useEffect(() => {
    // Prevent double-fetch in StrictMode
    if (isFetchingRef.current) {
      console.log('⏭️ Skipping duplicate dashboard fetch');
      return;
    }
    isFetchingRef.current = true;
    
    fetchDashboardData().finally(() => {
      isFetchingRef.current = false;
    });

    // Set up real-time subscription for registration updates
    const storedUser = getStoredUser();
    if (storedUser) {
      const registrationSubscription = supabase
        .channel('student-registration-updates')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'registrations',
            filter: `user_id=eq.${storedUser.id}`
          },
          () => {
            fetchDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(registrationSubscription);
      };
    }
  }, []);

  const fetchDashboardData = async () => {
    // Don't show loading spinner if we have fresh cache
    const cachedData = sessionStorage.getItem('dashboard_data');
    let hasValidCache = false;
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        // Use cache if less than 30 seconds old (increased from 10s)
        if (cacheAge < 30000) {
          setProfile(parsed.profile);
          setRegistrations(parsed.registrations);
          setTeamsCount(parsed.teamsCount);
          setReferralCount(parsed.referralCount || 0);
          setLoading(false);
          hasValidCache = true;
          console.log(`✅ Dashboard loaded from cache (${Math.round(cacheAge / 1000)}s old)`);
          
          // Background refresh if older than 10 seconds
          if (cacheAge > 10000) {
            console.log('🔄 Background refresh triggered...');
            // Continue to fetch in background without showing loading
          } else {
            return; // Cache is very fresh, don't fetch
          }
        }
      } catch (e) {
        console.warn('Failed to parse cached dashboard data');
      }
    }
    
    // Only show loading if we don't have valid cache
    if (!hasValidCache) {
      setLoading(true);
    }
    
    try {
      const storedUser = getStoredUser();
      if (!storedUser) {
        setLoading(false);
        return;
      }

      // Fetch profile, registrations, teams with proper error handling
      const [{ data: profileData, error: profileError }, registrationsData, { count: teamsCountValue, error: teamsError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, college_name, role')
          .eq('id', storedUser.id)
          .single(),
        (async () => {
          try {
            return await supabaseService.getUserRegistrations(storedUser.id);
          } catch (err) {
            console.error('Failed to load registrations:', err);
            return [];
          }
        })(),
        supabase
          .from('team_members')
          .select('team_id', { count: 'exact', head: true })
          .eq('user_id', storedUser.id)
      ]);

      if (profileError) {
        console.warn('Profile fetch error:', profileError.message);
      }
      if (teamsError) {
        console.warn('Teams count fetch error:', teamsError.message);
      }

      // Fetch referral count for this user's referral code
      let referralUsageCount = 0;
      if (profileData?.id) {
        const referralCode = `DAK26-${profileData.id.substring(0, 8).toUpperCase()}`;
        const { data: referralData, error: referralError } = await supabase
          .from('referral_code')
          .select('usage_count')
          .eq('referral_id', referralCode)
          .maybeSingle();
        
        if (!referralError && referralData) {
          referralUsageCount = referralData.usage_count || 0;
        }
      }

      const dashboardData = {
        profile: profileData || null,
        registrations: registrationsData || [],
        teamsCount: teamsCountValue || 0,
        referralCount: referralUsageCount,
        timestamp: Date.now()
      };

      // Update state
      setProfile(dashboardData.profile);
      setRegistrations(dashboardData.registrations);
      setTeamsCount(dashboardData.teamsCount);
      setReferralCount(dashboardData.referralCount);

      // Cache for quick reload (short duration)
      sessionStorage.setItem('dashboard_data', JSON.stringify(dashboardData));
      console.log('✅ Dashboard data fetched and cached');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Events Registered', 
      value: registrations.length.toString(), 
      icon: Trophy, 
      color: 'text-secondary', 
      bg: 'bg-secondary/10' 
    },
    { 
      label: 'Workshops', 
      value: registrations.filter(r => r.events?.category === 'workshop').length.toString(), 
      icon: Cpu, 
      color: 'text-primary-light', 
      bg: 'bg-primary/10' 
    },
    { 
      label: 'Teams', 
      value: teamsCount.toString(),
      icon: Users, 
      color: 'text-secondary-light', 
      bg: 'bg-secondary/10' 
    },
    { 
      label: 'Attendance', 
      value: `0/${registrations.length}`, 
      icon: CheckCircle2, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10' 
    },
  ];

  const alerts = [
    { 
      title: 'Welcome to DaKshaa!', 
      message: 'Complete your registration for events to get your entry tickets.', 
      type: 'info',
      action: 'Browse Events'
    }
  ];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-dark/20 to-secondary-dark/20 border border-white/10 p-8">
        <div className="relative z-10">
          <motion.h1 variants={itemVariants} className="text-3xl md:text-4xl font-bold mb-2">
            Welcome, {profile?.full_name || 'Student'} 👋
          </motion.h1>
          <motion.p variants={itemVariants} className="text-gray-400">
            {profile?.college_name || 'College Name'}
          </motion.p>
          
          {/* Referral Code - shown directly under college name */}
          {profile?.id && (
            <motion.div variants={itemVariants} className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 text-sm">Referral Code:</span>
              <span className="text-secondary font-mono font-bold">
                DAK26-{profile.id.substring(0, 8).toUpperCase()}
              </span>
              <button
                onClick={() => {
                  const referralCode = `DAK26-${profile.id.substring(0, 8).toUpperCase()}`;
                  navigator.clipboard.writeText(referralCode);
                  toast.success('Referral code copied!', {
                    icon: '📋',
                    style: {
                      background: '#0ea5e9',
                      color: '#fff',
                      borderRadius: '10px',
                      padding: '12px',
                    }
                  });
                }}
                className="p-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
                title="Copy referral code"
              >
                <Copy size={14} className="text-secondary" />
              </button>
              <span className="text-gray-500 text-sm ml-2">|</span>
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <img src={DakshaaCoin} alt="Dakshaa Coin" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                <span className="text-yellow-400 font-bold text-lg md:text-xl">{referralCount * 4}</span>
                <span className="text-gray-500 text-base">/100</span>
              </span>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="mt-4 flex flex-wrap gap-3">
            {registrations.some(r => r.combo_id) && (
              <span className="px-4 py-1.5 rounded-full bg-secondary/20 border border-secondary/30 text-secondary text-sm font-medium">
                Combo Pass Holder
              </span>
            )}
          </motion.div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full"></div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm"
          >
            <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts & Announcements */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <AlertCircle className="text-secondary" size={20} />
              Alerts & Announcements
            </h2>
            <button className="text-sm text-secondary hover:underline">Mark all as read</button>
          </div>
          
          {alerts.map((alert, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-all duration-300"
            >
              <div className={`mt-1 p-2 rounded-lg ${
                alert.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 
                alert.type === 'success' ? 'bg-green-500/10 text-green-500' : 
                'bg-primary/10 text-primary-light'
              }`}>
                <AlertCircle size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white group-hover:text-secondary transition-colors">{alert.title}</h4>
                <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                <button className="mt-3 text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-secondary hover:text-secondary-light">
                  {alert.action} <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Upcoming Event Card */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-secondary" size={20} />
            Next Up
          </h2>
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-b from-secondary/20 to-transparent border border-secondary/30 rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-bold uppercase tracking-widest">Technical</span>
                <span className="text-xs text-gray-400">Today, 10:30 AM</span>
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-secondary transition-colors">Web-O-Thon 2026</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <MapPin size={16} className="text-secondary" />
                  <span>IT Lab 3, Block B</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <Users size={16} className="text-secondary" />
                  <span>Team: Web Wizards</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-secondary hover:text-white transition-all duration-300">
                View Details
              </button>
            </div>
            {/* Background Glow */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/20 blur-3xl rounded-full group-hover:bg-secondary/40 transition-all duration-500"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHome;

