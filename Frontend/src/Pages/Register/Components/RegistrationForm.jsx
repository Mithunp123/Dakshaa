import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock,
  CheckCircle2,
  Download,
  RefreshCw,
  Users,
  Lock,
  XCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { supabaseService } from '../../../services/supabaseService';
import { supabase } from '../../../supabase';
import certificateTemplate from '../../../assets/cerficate.png';
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
        
        // Fetch attendance records for this user to check eligibility
        let attendedEventIds = new Set();
        try {
          const { data: attendanceLogs } = await supabase
            .from('attendance_logs')
            .select('event_id')
            .eq('user_id', user.id);
          if (attendanceLogs) {
            attendanceLogs.forEach(log => attendedEventIds.add(log.event_id));
          }
        } catch (attErr) {
          console.warn('Could not fetch attendance logs:', attErr);
        }

        // Attach attendance flag to each registration
        const registrationsWithAttendance = registrationsWithTotals.map(reg => ({
          ...reg,
          has_attendance: attendedEventIds.has(reg.event_id),
        }));

        setRegistrations(registrationsWithAttendance);
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
      toast.loading('Processing certificate...', { id: 'cert-gen' });

      // Fetch user profile from DB
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        toast.dismiss('cert-gen');
        toast.error('Please log in to download your certificate.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, gender, college_name, department, year_of_study, user_code')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const userName = profile?.full_name || user?.user_metadata?.full_name || 'Participant';
      const gender = (profile?.gender || '').toLowerCase();
      const collegeName = profile?.college_name || 'K. S. Rangasamy College of Technology';
      const department = profile?.department || '';
      const yearOfStudy = profile?.year_of_study || '';
      const collegeText = `${collegeName}${department ? ' - ' + department : ''}${yearOfStudy ? ' - ' + yearOfStudy : ''}`;
      const eventName = reg.events?.name || reg.events?.title || reg.event_name || 'Event';
      const eventCategory = (reg.events?.category || '').trim().toLowerCase();
      // Map category to display label (case-insensitive)
      const categoryMap = {
        'technical': 'Technical',
        'workshop': 'Workshop',
        'conference': 'Conference',
        'cultural': 'Cultural',
        'hackathon': 'Hackathon',
        'sports': 'Sports',
      };
      const eventType = categoryMap[eventCategory] || (eventCategory ? eventCategory.charAt(0).toUpperCase() + eventCategory.slice(1) : '');
      const eventDate = reg.events?.event_date
        ? new Date(reg.events.event_date)
        : new Date();
      // Format: February-12-2026
      const formattedDate = `${eventDate.toLocaleString('en-US', { month: 'long' })}-${String(eventDate.getDate()).padStart(2, '0')}-${eventDate.getFullYear()}`;

      // ---- Store / retrieve certificate from certificate_data table ----
      // Ensure data exists in certificate_data before download/generation
      let ksrctId = null;

      // Check if certificate already exists for this user + event
      const { data: existingCert } = await supabase
        .from('certificate_data')
        .select('ksrct_id')
        .eq('user_id', user.id)
        .eq('event_name', eventName)
        .maybeSingle();

      if (existingCert) {
        // Reuse existing certificate ID
        ksrctId = existingCert.ksrct_id;
        console.log('📜 Reusing existing certificate:', ksrctId);
      } else {
        // Insert new certificate record (ksrct_id auto-generated by DB trigger)
        const { data: newCert, error: insertError } = await supabase
          .from('certificate_data')
          .insert({
            user_id: user.id,
            user_code: profile?.user_code || null,
            full_name: userName,
            gender: profile?.gender || null,
            college_name: collegeName,
            department: department || null,
            year_of_study: yearOfStudy || null,
            event_name: eventName,
            event_type: eventType || null,
            event_date: formattedDate,
          })
          .select('ksrct_id')
          .single();

        if (insertError) {
          console.error('Certificate insert error:', insertError);
          // If unique constraint violation, try fetching the existing one
          if (insertError.code === '23505') {
            const { data: retryFetch } = await supabase
              .from('certificate_data')
              .select('ksrct_id')
              .eq('user_id', user.id)
              .eq('event_name', eventName)
              .maybeSingle();
            ksrctId = retryFetch?.ksrct_id;
          }
          if (!ksrctId) {
            toast.dismiss('cert-gen');
            toast.error('Could not save certificate data. Please try again.');
            return;
          }
        } else {
          ksrctId = newCert.ksrct_id;
          console.log('📜 New certificate created:', ksrctId);
        }
      }

      // Check if we have a pre-generated URL to use
      if (reg.certificate_url) {
        toast.dismiss('cert-gen');
        window.open(reg.certificate_url, "_blank");
        return;
      }

      toast.loading('Generating certificate...', { id: 'cert-gen' });

      // ---- Generate QR code as data URL ----
      const qrUrl = `https://authenticate.ksrctdigipro.in/?certid=${ksrctId}`;
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });

      // Load QR image
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });

      // ---- Load template image ----
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = certificateTemplate;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw template
      ctx.drawImage(img, 0, 0);

      const width = canvas.width;
      const height = canvas.height;

      // Font setup
      const fontSize = Math.round(width / 55);
      const textColor = '#000000';

      // Helper to center text at a given x center
      const getCenteredX = (text, font, centerX) => {
        ctx.font = font;
        const metrics = ctx.measureText(text);
        return centerX - metrics.width / 2;
      };

      // Coordinates matching the Python analysis (approximate for new template)
      const nameY = height * 0.595;    // Changed from 0.53 based on 0.533 line
      const collegeY = height * 0.645;  // Changed from 0.60 based on 0.597 line
      const eventY = height * 0.69;    // Changed from 0.67 based on 0.646 line
      const typeY = height * 0.74;     // Changed from 0.75 based on 0.695/0.737 lines
      const dateY = height * 0.886;     // Changed from 0.755 based on 0.737 line

      const nameLineCenter = width * 0.50;    // Adjusted center slightly left as most certs center align
      const collegeLineCenter = width * 0.50; // Center align
      const eventLineCenter = width * 0.50;   // Center align

      const boldFont = `bold ${fontSize}px Arial, sans-serif`;

      // Draw strike-through on Mr./Ms. based on gender
      const tickSymbol = '----';
      const mrX = width * 0.130;
      const msX = width * 0.165;
      const tickYPos = nameY - 0.9;
      ctx.font = boldFont;
      ctx.fillStyle = textColor;

      if (gender.includes('female')) {
        // Female: strike out Mr.
        ctx.fillText(tickSymbol, mrX, tickYPos);
      } else if (gender) {
        // Male: strike out Ms.
        ctx.fillText(tickSymbol, msX, tickYPos);
      }

      // Draw Name (centered on line)
      ctx.font = boldFont;
      ctx.fillStyle = textColor;
      const nameX = getCenteredX(userName, boldFont, nameLineCenter);
      ctx.fillText(userName, nameX, nameY);

      // Draw College (with dynamic font sizing)
      const maxCollegeWidth = width * 0.70;
      let collegeFontSize = fontSize;
      let collegeFont = `bold ${collegeFontSize}px Arial, sans-serif`;
      ctx.font = collegeFont;
      while (ctx.measureText(collegeText).width > maxCollegeWidth && collegeFontSize > 10) {
        collegeFontSize -= 2;
        collegeFont = `bold ${collegeFontSize}px Arial, sans-serif`;
        ctx.font = collegeFont;
      }
      const collegeX = getCenteredX(collegeText, collegeFont, collegeLineCenter);
      ctx.fillText(collegeText, collegeX, collegeY);

      // Draw Event Name (centered)
      ctx.font = boldFont;
      const eventX = getCenteredX(eventName, boldFont, eventLineCenter);
      ctx.fillText(eventName, eventX, eventY);

      // Draw Event Type (left aligned)
      if (eventType) {
        ctx.font = boldFont;
        const typeX = width * 0.14;
        ctx.fillText(eventType, typeX, typeY);
      }

      // Draw Date (smaller font)
      const dateFont = `bold ${Math.round(fontSize * 0.7)}px Arial, sans-serif`;
      ctx.font = dateFont;
      const dateFontX = width * 0.20;
      ctx.fillText(formattedDate, dateFontX, dateY);

      // ---- Draw Certificate ID next to "Certificate ID:" label (bottom-left) ----
      const certIdFont = `bold ${Math.round(fontSize * 0.75)}px Arial, sans-serif`;
      ctx.font = certIdFont;
      ctx.fillStyle = '#000000';
      const certIdX = width * 0.261; // right after the "Certificate ID:" text
      const certIdY = height * 0.9282; // same line as "Certificate ID:" label
      ctx.fillText(ksrctId, certIdX, certIdY);

      // ---- Draw QR Code on certificate (bottom-left area) ----
      const qrSize = Math.round(width * 0.10); // 10% of image width
      const qrX = width * 0.05;  // left side
      const qrY = height * 0.82; // bottom area
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Download as PDF
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = canvas.width;
      const pdfHeight = canvas.height;
      // Use landscape if wider than tall, portrait otherwise
      const orientation = pdfWidth > pdfHeight ? 'landscape' : 'portrait';
      const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [pdfWidth, pdfHeight],
      });
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`);

      toast.dismiss('cert-gen');
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error('Error generating certificate:', err);
      toast.dismiss('cert-gen');
      toast.error('Could not generate certificate. Please try again.');
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

              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-2">
                  {'FAILED'?.toUpperCase() === 'PAID' ? (
                    <button 
                      onClick={() => downloadCertificate(reg)}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
                    >
                      <Download size={14} /> Download Certificate
                    </button>
                  ) : (
                    <button 
                      disabled
                      className="flex-1 py-2 bg-gray-700 text-gray-400 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <Lock size={20} />The certificate will be available for download soon.
                    </button>
                  )}
                </div>
                {/* Show reason why certificate is locked */}

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;


