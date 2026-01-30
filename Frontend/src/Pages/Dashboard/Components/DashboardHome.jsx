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
import DakshaaCoin from '../../../assets/DakshaaCoin.webp';

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

  // Try to load from cache immediately for instant display
  const getInitialState = () => {
    try {
      const cachedData = sessionStorage.getItem('dashboard_data');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        // Use cache if less than 5 minutes old for initial render
        if (cacheAge < 300000) {
          return {
            profile: parsed.profile,
            registrations: parsed.registrations || [],
            teamsCount: parsed.teamsCount || 0,
            referralCount: parsed.referralCount || 0,
            loading: false,
            hasCache: true
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached dashboard data');
    }
    return {
      profile: null,
      registrations: [],
      teamsCount: 0,
      referralCount: 0,
      loading: true,
      hasCache: false
    };
  };

  const initialState = getInitialState();
  
  const [profile, setProfile] = useState(initialState.profile);
  const [registrations, setRegistrations] = useState(initialState.registrations);
  const [teamsCount, setTeamsCount] = useState(initialState.teamsCount);
  const [referralCount, setReferralCount] = useState(initialState.referralCount);
  const [loading, setLoading] = useState(initialState.loading);
  
  // Ref to prevent double-fetch in React StrictMode
  const isFetchingRef = React.useRef(false);

  useEffect(() => {
    // Prevent double-fetch in StrictMode
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    
    // If we loaded from cache, do a background refresh
    if (initialState.hasCache) {
      console.log('⚡ Dashboard loaded instantly from cache, background refresh...');
      // Background refresh without showing loading
      fetchDashboardData(true).finally(() => {
        isFetchingRef.current = false;
      });
    } else {
      fetchDashboardData().finally(() => {
        isFetchingRef.current = false;
      });
    }
  }, []);

  // Separate useEffect for real-time subscription to avoid cleanup issues
  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;

    let subscribed = false;
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
          if (subscribed) {
            fetchDashboardData();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscribed = true;
        }
      });

    return () => {
      subscribed = false;
      supabase.removeChannel(registrationSubscription);
    };
  }, []);

  const fetchDashboardData = async (skipLoading = false) => {
    // Don't show loading spinner if we have fresh cache or skipLoading is true
    const cachedData = sessionStorage.getItem('dashboard_data');
    let hasValidCache = skipLoading;
    
    if (!skipLoading && cachedData) {
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter for paid registrations only
  const paidRegistrations = registrations.filter(r => r.payment_status?.toUpperCase() === 'PAID');

  const stats = [
    { 
      label: 'Events Registered', 
      value: paidRegistrations.length.toString(), 
      icon: Trophy, 
      color: 'text-secondary', 
      bg: 'bg-secondary/10' 
    },
    { 
      label: 'Workshops', 
      value: paidRegistrations.filter(r => r.events?.category === 'workshop').length.toString(), 
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
      value: `0/${paidRegistrations.length}`, 
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
        <div className="lg:col-span-3 space-y-4">
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
      </div>
    </motion.div>
  );
};

export default DashboardHome;

