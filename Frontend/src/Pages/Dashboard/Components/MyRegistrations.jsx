import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Users
} from 'lucide-react';
import { supabaseService } from '../../../services/supabaseService';
import { supabase } from '../../../supabase';
import notificationService from '../../../services/notificationService';
import toast from 'react-hot-toast';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle payment success - refresh registrations with delay to allow webhook processing
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      console.log('✅ Payment success detected on MyRegistrations page');
      toast.success('Payment successful! Refreshing your registrations...', {
        duration: 3000,
        position: 'top-center',
      });
      
      // Clear the URL parameter
      setSearchParams({});
      
      // Delay refresh slightly to allow webhook to process
      const timer = setTimeout(() => {
        setLoading(true);
        fetchRegistrations();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Sync registrations for teams where this user is a member
  const syncUserTeamRegistrations = async (userId) => {
    try {
      console.log('🔄 Syncing team registrations for user:', userId);
      
      // Get all teams where user is a member
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId)
        .in('status', ['active', 'joined']);
      
      if (!memberships || memberships.length === 0) {
        console.log('No team memberships found');
        return;
      }
      
      const teamIds = memberships.map(m => m.team_id);
      console.log('Found team memberships:', teamIds.length);
      
      // Fetch teams with their members and events
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id,
          team_name,
          event_id,
          leader_id,
          is_active,
          team_members (user_id, role, status)
        `)
        .in('id', teamIds)
        .eq('is_active', true);
      
      if (!teams || teams.length === 0) {
        console.log('No active teams found');
        return;
      }
      
      // For each team, sync registrations
      for (const team of teams) {
        const teamData = {
          id: team.id,
          name: team.team_name,
          team_name: team.team_name,
          event_id: team.event_id,
          members: (team.team_members || []).filter(m => m.status === 'active' || m.status === 'joined')
        };
        console.log('Syncing team:', teamData.name);
        await notificationService.syncTeamMemberRegistrations(teamData);
      }
      
      console.log('✅ Team registration sync complete');
    } catch (err) {
      console.error('Error syncing team registrations:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  // Set up real-time subscription for dynamic updates
  useEffect(() => {
    if (!userId) return;

    // Subscribe to changes in event_registrations_config table for this user
    const subscription = supabase
      .channel(`user-registrations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'event_registrations_config',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Registration change detected:', payload);
          // Refresh registrations when any change occurs
          fetchRegistrations();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  const fetchRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Sync team member registrations first
        // This ensures team members see events they're part of
        await syncUserTeamRegistrations(user.id);
        
        const data = await supabaseService.getUserRegistrations(user.id);
        // Filter to only show registrations that exist (have valid data)
        const validRegistrations = (data || []).filter(reg => reg && reg.id);
        
        // For team events, calculate cumulative totals
        const registrationsWithTotals = await Promise.all(
          validRegistrations.map(async (reg) => {
            if (reg.event_name) {
              // This is a team registration
              let cumulativeTotal = 0;
              let totalMembers = 0;
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
              
              // 1. Try to find Team ID
              let teamId = null;
              try {
                  // Strategy A: Direct Membership check
                  const { data: userTeams } = await supabase
                      .from('team_members')
                      .select('team_id')
                      .eq('user_id', user.id);
                      
                  if (userTeams?.length > 0) {
                      // Check which of these teams corresponds to our event
                      const { data: eventTeam } = await supabase
                          .from('teams')
                          .select('id')
                          .in('id', userTeams.map(t => t.team_id))
                          .eq('event_id', reg.event_id)
                          .maybeSingle();
                      if (eventTeam) teamId = eventTeam.id;
                  }

                  // Strategy B: Name Lookup (Fallback)
                  if (!teamId) {
                       const { data: teamByName } = await supabase
                          .from('teams')
                          .select('id')
                          .eq('event_id', reg.event_id)
                          .ilike('team_name', reg.event_name.trim())
                          .maybeSingle();
                       if (teamByName) teamId = teamByName.id;
                  }
              } catch (e) {
                  console.error('Team lookup error:', e);
              }

              // 2. Fetch Amount using API (Source of Truth)
              if (teamId) {
                  try {
                    const response = await fetch(`${apiUrl}/payment/calculate-team-amount`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ team_id: teamId, event_id: reg.event_id }),
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        // Show FULL TEAM FEE (Team Size * Price Per Member)
                        cumulativeTotal = result.team_size * result.price_per_member;
                        totalMembers = result.team_size;
                    } 
                  } catch (err) {
                     console.error('API Error:', err);
                  }
              }

              // 3. Fallback calculation if API failed or returned 0 (unexpectedly)
              if (cumulativeTotal === 0) {
                  const price = Number(reg.events?.price || 0);
                  let count = 1;
                  
                  if (teamId) {
                      // Count actual members in DB
                      const { count: dbCount } = await supabase
                          .from('team_members')
                          .select('*', { count: 'exact', head: true })
                          .eq('team_id', teamId);
                      count = dbCount || 1;
                  } else {
                      // Count registrations sharing same event_name
                      const { count: regCount } = await supabase
                          .from('event_registrations_config')
                          .select('*', { count: 'exact', head: true })
                          .eq('event_id', reg.event_id)
                          .eq('event_name', reg.event_name);
                      count = regCount || 1;
                  }
                  
                  totalMembers = count;
                  cumulativeTotal = count * price;
              }
              
              return {
                ...reg,
                cumulative_total: cumulativeTotal,
                team_member_count: totalMembers
              };
            }
            return reg;
          })
        );
        
        setRegistrations(registrationsWithTotals);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase();
    switch (statusUpper) {
      case 'PAID':
      case 'COMPLETED': 
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'PENDING': 
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default: 
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
    }
  };

  if (loading) return <div className="text-center p-10">Loading your registrations...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">My Registrations</h2>
      
      {registrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
          <p className="text-gray-400">You haven't registered for any events yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {registrations.map((reg) => (
            <motion.div 
              key={reg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-blue-500/50 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(reg.payment_status)}`}>
                    {reg.payment_status}
                  </span>
                  <h3 className="text-lg font-bold mt-2">
                    {reg.events?.name || reg.events?.title || 'Event'}
                  </h3>
                  {reg.event_name && (
                    <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                      <Users size={12} /> Team: {reg.event_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-400 capitalize">
                    {reg.events?.category || ''}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>
                    {reg.events?.event_date 
                      ? new Date(reg.events.event_date).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })
                      : 'March 12-14, 2026'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} />
                  <span>{reg.events?.start_time || '09:00 AM onwards'}</span>
                </div>
                {reg.events?.venue && (
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{reg.events.venue}</span>
                  </div>
                )}
                {reg.payment_amount && (
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      ₹{reg.cumulative_total || reg.payment_amount}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  disabled={reg.payment_status?.toUpperCase() !== 'PAID'}
                  className="flex-1 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} /> Certificate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;


