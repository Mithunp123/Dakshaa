import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Users,
  Navigation
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabaseService } from '../../../services/supabaseService';
import { supabase } from '../../../supabase';
import notificationService from '../../../services/notificationService';
import toast from 'react-hot-toast';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ref to track mounted state for async operations
  const mountedRef = useRef(true);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setUserId(user.id);
        
        // Sync team member registrations first
        // This ensures team members see events they're part of
        await syncUserTeamRegistrations(user.id);
        
        const data = await supabaseService.getUserRegistrations(user.id);
        // Filter to only show registrations that exist (have valid data)
        const validRegistrations = (data || []).filter(reg => reg && reg.id);
        
        // For team events, calculate cumulative totals
        // Each registration is processed individually with error handling
        const registrationsWithTotals = await Promise.all(
          validRegistrations.map(async (reg) => {
            // Wrap each registration processing in try-catch to prevent one bad record from failing all
            try {
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
            } catch (regError) {
              // If processing this registration fails, return it without totals
              console.error(`Error processing registration ${reg.id}:`, regError);
              return reg;
            }
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

  const downloadCertificate = async (reg) => {
    try {
      if (reg.certificate_url) {
        window.open(reg.certificate_url, "_blank");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const doc = new jsPDF("landscape", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Border
      doc.setDrawColor(20, 20, 80); // Dark blue
      doc.setLineWidth(5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      // Inner Border
      doc.setDrawColor(200, 150, 50); // Gold
      doc.setLineWidth(1);
      doc.rect(17, 17, pageWidth - 34, pageHeight - 34);

      // Title
      doc.setTextColor(20, 20, 80);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(40);
      doc.text("Certificate of Participation", pageWidth / 2, 60, { align: "center" });

      // Subtitle
      doc.setFontSize(16);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text("This is to certify that", pageWidth / 2, 85, { align: "center" });

      // Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(200, 150, 50); // Gold
      const userName = user?.user_metadata?.full_name || "Participant";
      doc.text(userName.toUpperCase(), pageWidth / 2, 110, { align: "center" });
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 60, 115, pageWidth / 2 + 60, 115);

      // Event Text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text("has successfully participated in the event", pageWidth / 2, 135, { align: "center" });

      // Event Name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(20, 20, 80);
      const eventName = reg.event_name || reg.events?.name || "Event";
      doc.text(eventName, pageWidth / 2, 155, { align: "center" });

      // Date
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      const eventDate = reg.events?.event_date 
        ? new Date(reg.events.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.text(`Held on ${eventDate}`, pageWidth / 2, 175, { align: "center" });

      // Footer
      doc.setFontSize(12);
      doc.text("Dakshaa '26 | K.S.Rangasamy College of Technology", pageWidth / 2, pageHeight - 30, { align: "center" });

      doc.save(`${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`);
      
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error("Error generating certificate:", err);
      toast.error("Could not generate certificate. Please try again.");
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
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors"
                >
                  <Navigation size={14} /> View Map
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


