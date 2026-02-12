import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Camera, 
  UserCheck, 
  Award, 
  Search, 
  CheckCircle2, 
  X, 
  Users, 
  Trophy, 
  Medal, 
  Loader2,
  AlertCircle,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  Sun,
  Moon,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../supabase';
import toast, { Toaster } from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  checkCameraSupport,
  getCameraErrorMessage,
  getCameraConfig,
  selectBestCamera,
  requestCameraPermission,
  vibrate
} from '../../../utils/scannerConfig';
import { usePageAuth } from '../../../hooks/usePageAuth';
import { useAuthenticatedRequest } from '../../../utils/silentRefresh';

// Helper function to format UUID as Dakshaa ID (first 8 characters uppercase)
const formatDakshaaId = (uuid) => {
  if (!uuid) return 'N/A';
  return `DK-${uuid.substring(0, 8).toUpperCase()}`;
};

const CoordinatorDashboard = () => {
  const { isLoading: authLoading } = usePageAuth('Event Coordinator Dashboard');
  const { makeRequest } = useAuthenticatedRequest();
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  
  // Session type for attendance
  const [selectedSession, setSelectedSession] = useState('morning');
  const selectedSessionRef = useRef(selectedSession);
  const selectedEventRef = useRef(selectedEvent);
  
  // Keep refs in sync with state (for use in scanner callback to avoid stale closures)
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
    console.log('Session updated to:', selectedSession);
  }, [selectedSession]);
  
  useEffect(() => {
    selectedEventRef.current = selectedEvent;
    console.log('Event updated to:', selectedEvent?.name || selectedEvent?.id);
  }, [selectedEvent]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="text-purple-500/80 font-mono text-sm">Loading Coordinator Dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Stats - now with session breakdown
  const [stats, setStats] = useState({
    registered: 0,
    morningCheckedIn: 0,
    eveningCheckedIn: 0,
    totalCheckedIn: 0,
    morningRemaining: 0,
    eveningRemaining: 0
  });

  // Winner selection
  const [selectedWinners, setSelectedWinners] = useState({
    first: null,
    second: null,
    third: null
  });

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    fetchAssignedEvents();
    getCameras();
    return () => {
      stopScanning();
    };
  }, []);

  const getCameras = async () => {
    const support = checkCameraSupport();
    if (!support.isSecureContext) {
      const error = getCameraErrorMessage({ message: 'HTTPS required' });
      setCameraError(error.message);
      return;
    }

    const permissionResult = await requestCameraPermission();
    if (!permissionResult.success) {
      setCameraError(permissionResult.error.message);
      return;
    }

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        const error = getCameraErrorMessage({ message: 'No cameras found' });
        setCameraError(error.message);
        return;
      }

      setCameras(devices);
      const bestCameraId = selectBestCamera(devices);
      setCameraId(bestCameraId);
      setCameraError(null);
    } catch (error) {
      console.error('Error getting cameras:', error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      // Initial fetch
      console.log('📊 Loading participants and stats for:', selectedEvent.name);
      fetchParticipants();
      fetchStats();

      // Set up real-time subscription for attendance changes
      const attendanceSubscription = supabase
        .channel(`attendance-${selectedEvent.event_key || selectedEvent.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance'
          },
          (payload) => {
            console.log('🔄 Attendance change detected:', payload);
            fetchParticipants();
            fetchStats();
          }
        )
        .subscribe();

      // Set up real-time subscription for registration changes
      const registrationSubscription = supabase
        .channel(`registrations-${selectedEvent.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_registrations_config',
            filter: `event_id=eq.${selectedEvent.id}`
          },
          (payload) => {
            console.log('🔄 Registration change detected:', payload);
            fetchParticipants();
            fetchStats();
          }
        )
        .subscribe();

      // Polling fallback: refresh both participants and stats every 5 seconds
      const pollingInterval = setInterval(() => {
        console.log('⏱️ Polling update...');
        fetchParticipants();
        fetchStats();
      }, 5000);

      // Cleanup subscriptions and interval on unmount or event change
      return () => {
        console.log('🧹 Cleaning up subscriptions for:', selectedEvent.name);
        supabase.removeChannel(attendanceSubscription);
        supabase.removeChannel(registrationSubscription);
        clearInterval(pollingInterval);
      };
    }
  }, [selectedEvent]);

  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      let events = [];
      
      // Super admins can see all events
      if (profile?.role === 'super_admin') {
        const { data: allEvents, error: eventsError } = await supabase
          .from('events_config')
          .select('*')
          .eq('is_open', true);
        
        if (eventsError) throw eventsError;
        events = allEvents || [];
      } else if (profile?.role === 'event_coordinator') {
        // Coordinators ONLY see their assigned events
        const { data: coords, error: coordError } = await supabase
          .from('event_coordinators')
          .select('event_id')
          .eq('user_id', user.id);
        
        if (coordError) throw coordError;
        
        const assignedEventIds = coords?.map(c => c.event_id) || [];
        
        if (assignedEventIds.length > 0) {
          // Check if event_ids are UUIDs or text event_keys
          const isUUID = assignedEventIds[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          
          let eventsError, assignedEvents;
          if (isUUID) {
            // Query by UUID id
            const result = await supabase
              .from('events_config')
              .select('*')
              .in('id', assignedEventIds);
            eventsError = result.error;
            assignedEvents = result.data;
          } else {
            // Query by text event_key
            const result = await supabase
              .from('events_config')
              .select('*')
              .in('event_key', assignedEventIds);
            eventsError = result.error;
            assignedEvents = result.data;
          }
          
          if (eventsError) throw eventsError;
          events = assignedEvents || [];
        }
      }
      
      // If no events found, return early
      if (events.length === 0) {
        setAssignedEvents([]);
        setLoading(false);
        return;
      }

      // Fetch registration counts for each event (using UUID from events_config)
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          // event.id is the UUID from events_config
          if (!event.id) {
            return { ...event, registeredCount: 0, attendedCount: 0 };
          }
          
          const { count: registeredCount } = await supabase
            .from('event_registrations_config')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .in('payment_status', ['PAID', 'completed']);

          const { count: attendedCount } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            registeredCount: registeredCount || 0,
            attendedCount: attendedCount || 0
          };
        })
      );

      setAssignedEvents(eventsWithCounts);

      if (eventsWithCounts.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching assigned events:', error);
      alert('Failed to load assigned events');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!selectedEvent) return;

    try {
      // Use event.id (UUID) for events_config table
      const eventId = selectedEvent.id || selectedEvent.event_id;
      const eventKey = selectedEvent.event_key;
      
      if (!eventId) {
        console.warn('No valid event ID found');
        return;
      }
      
      // Fetch registrations from event_registrations_config (no join - FK is to auth.users)
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations_config')
        .select('*')
        .eq('event_id', eventId)
        .in('payment_status', ['PAID', 'completed']);

      if (regError) throw regError;

      // Get unique user IDs from registrations
      const userIds = [...new Set((registrations || []).map(r => r.user_id))];
      
      // Fetch profiles separately for these users
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, roll_number, college_name, department, mobile_number, roll_no')
          .in('id', userIds);
        
        if (!profileError && profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Fetch attendance for this event using event_key (TEXT)
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', eventKey);

      if (attError) console.warn('Attendance fetch error:', attError);

      // Combine registrations with profiles and attendance data (using columns for sessions)
      const participantsWithAttendance = (registrations || []).map(reg => {
        const profile = profilesMap[reg.user_id] || {};
        // With column-based approach, there's only one attendance row per user/event
        const userAttendance = (attendanceData || []).find(att => att.user_id === reg.user_id);
        return {
          ...reg,
          profiles: profile,
          attendance: userAttendance ? [userAttendance] : [],
          morningAttended: userAttendance?.morning_attended || false,
          eveningAttended: userAttendance?.evening_attended || false,
          morningTime: userAttendance?.morning_time,
          eveningTime: userAttendance?.evening_time
        };
      });

      setParticipants(participantsWithAttendance);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;

    try {
      const eventId = selectedEvent.id || selectedEvent.event_id;
      
      if (!eventId) {
        console.warn('No valid event ID for stats');
        return;
      }

      // Always fetch the paid registration count directly
      const { count: paidRegisteredCount } = await supabase
          .from('event_registrations_config')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .in('payment_status', ['PAID', 'completed']);
          
      const registeredCount = paidRegisteredCount || 0;
      
      // Use RPC function for dynamic stats with session breakdown
      const { data: statsData, error: statsError } = await supabase.rpc('get_event_stats', {
        p_event_id: eventId
      });
      
      if (statsError) {
        console.warn('Stats RPC error, falling back to direct queries:', statsError);
        // Fallback to direct queries using column-based session tracking
        const eventKey = selectedEvent.event_key;
        
        // Count morning attendance using morning_attended column
        const { count: morningCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventKey)
          .eq('morning_attended', true);
          
        // Count evening attendance using evening_attended column
        const { count: eveningCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventKey)
          .eq('evening_attended', true);

        // Count total unique attendees (anyone who has morning OR evening = true)
        // This is a single count - not morning + evening
        const { count: totalUniqueCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventKey)
          .or('morning_attended.eq.true,evening_attended.eq.true');

        setStats({
          registered: registeredCount,
          morningCheckedIn: morningCount || 0,
          eveningCheckedIn: eveningCount || 0,
          totalCheckedIn: totalUniqueCount || 0,
          morningRemaining: registeredCount - (morningCount || 0),
          eveningRemaining: registeredCount - (eveningCount || 0)
        });
      } else {
        setStats({
          registered: registeredCount,
          morningCheckedIn: statsData.morning_attended || 0,
          eveningCheckedIn: statsData.evening_attended || 0,
          totalCheckedIn: statsData.total_attended || 0,
          morningRemaining: registeredCount - (statsData.morning_attended || 0),
          eveningRemaining: registeredCount - (statsData.evening_attended || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Use effect to initialize scanner when scanning state becomes true
  useEffect(() => {
    if (scanning && !html5QrCodeRef.current?.isScanning) {
      initializeScanner();
    }
  }, [scanning]);

  const startScanning = () => {
    setScanning(true);
    setActiveTab('scanner');
    setCameraError(null);
  };

  const initializeScanner = async () => {
    // Wait a brief moment for the DOM to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const scannerElement = document.getElementById('qr-reader');
    if (!scannerElement) {
      console.error('Scanner element not found');
      setCameraError('Scanner element not found. Please try again.');
      setScanning(false);
      return;
    }

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-reader", { verbose: false });
      }

      // Get device-optimized config
      const support = checkCameraSupport();
      const config = getCameraConfig(support.isMobile);

      // Force back camera on mobile devices (regardless of viewport)
      const isMobileDevice = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const cameraConfig = cameraId 
        ? cameraId 
        : isMobileDevice 
          ? { facingMode: { exact: "environment" } } // Force back camera
          : { facingMode: "user" }; // Front camera for desktop

      console.log('📸 Starting camera:', {
        isMobile: isMobileDevice,
        cameraId: cameraId,
        facingMode: cameraConfig.facingMode
      });

      await html5QrCodeRef.current.start(
        cameraConfig,
        config,
        onScanSuccess,
        () => {} // Silent error handler
      );
      
      setCameraError(null);
    } catch (error) {
      console.error('Scanner error:', error);
      const errorInfo = getCameraErrorMessage(error);
      setCameraError(errorInfo.message);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
      setScanning(false);
    } catch (error) {
      console.error('Error stopping scanner:', error);
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText) => {
    // Use refs to get the current values (avoids stale closure from scanner callback)
    const currentSession = selectedSessionRef.current;
    const currentEvent = selectedEventRef.current;
    console.log('QR Scanned:', decodedText);
    console.log('Current Session (from ref):', currentSession);
    console.log('Current Event (from ref):', currentEvent?.name || currentEvent?.id);
    
    // Vibrate on scan using utility
    vibrate(100);
    
    // Stop scanner temporarily to process
    await stopScanning();

    // Mark attendance with current session and event from refs
    await markAttendanceWithSessionAndEvent(decodedText, currentSession, currentEvent);
    
    // Auto-restart scanning after 1 second for quick successive scans
    setTimeout(() => {
      startScanning();
    }, 1000);
  };
  // Helper to detect duplicate key errors from any error shape
  const isDuplicateAttendanceError = (err) => {
    if (!err) return false;
    // Check for explicit duplicate session code from RPC
    if (err.code === 'DUPLICATE_SESSION' || err.status === 'duplicate') return true;
    // Check for database-level duplicate key errors only
    const str = typeof err === 'string' ? err : JSON.stringify(err);
    return str.includes('duplicate key') || str.includes('attendance_user_id_event_id_key') || str.includes('23505');
  };

  // This function uses explicit parameters to avoid closure issues
  const markAttendanceWithSessionAndEvent = async (userId, session, event) => {
    try {
      setSubmitting(true);
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const coordinator = authSession?.user;

      // Get the event UUID from passed event (from ref)
      const eventUuid = event?.id || event?.event_id;
      const eventName = event?.name || 'Unknown Event';
      
      if (!eventUuid) {
        playBuzzSound();
        toast.error('No event selected');
        return;
      }

      console.log('Marking attendance:', { userId, eventUuid, eventName, session });

      // Use the RPC function for marking attendance with session type
      const { data: result, error: rpcError } = await supabase.rpc('mark_manual_attendance', {
        p_user_id: userId,
        p_event_uuid: eventUuid,
        p_marked_by: coordinator.id,
        p_session_type: session
      });

      console.log('RPC Result:', result);

      // Handle RPC-level error (network/auth issues)
      if (rpcError) {
        if (isDuplicateAttendanceError(rpcError)) {
          playBuzzSound();
          toast('⚠️ Already marked for this session', { 
            duration: 2000, 
            icon: '⚠️', 
            style: { background: '#fed7aa', color: '#92400e' } 
          });
          return;
        }
        throw rpcError;
      }

      // Handle duplicate session (same session scanned twice)
      if (result.status === 'duplicate') {
        playBuzzSound();
        const sessionLabel = result.session_type === 'evening' ? 'Afternoon' : 'Forenoon';
        toast(`⚠️ ${sessionLabel} already marked for ${result.student_name || 'student'}`, { 
          duration: 2000, 
          icon: '⚠️', 
          style: { background: '#fed7aa', color: '#92400e' } 
        });
        return;
      }

      // Handle other errors/warnings
      if (result.status === 'error' || result.status === 'warning') {
        playBuzzSound();
        toast.error(result.message || 'Failed to mark attendance', { duration: 2000, icon: '❌' });
        return;
      }

      // Success - show toast notification with the session from the result
      playTingSound();
      showSuccessToast(result.student_name, result.session_type || session);
      
      // Immediately refresh stats and participants
      await Promise.all([fetchParticipants(), fetchStats()]);
    } catch (error) {
      console.error('Error marking attendance:', error);
      playBuzzSound();
      
      if (isDuplicateAttendanceError(error)) {
        toast('⚠️ Already marked for this session', { 
          duration: 2000, 
          icon: '⚠️', 
          style: { background: '#fed7aa', color: '#92400e' } 
        });
      } else {
        toast.error(typeof error === 'object' ? (error.message || 'Failed to mark attendance') : String(error), { duration: 2000 });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // This wrapper uses the current state for manual attendance (not from scanner callback)
  const markAttendance = async (userId) => {
    await markAttendanceWithSessionAndEvent(userId, selectedSession, selectedEvent);
  };

  const handleManualAttendance = async (userId) => {
    await markAttendance(userId);
  };

  const handleSelectWinner = async (userId, position) => {
    setSelectedWinners({
      ...selectedWinners,
      [position]: userId
    });
  };

  const submitWinners = async () => {
    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const winners = [];
      if (selectedWinners.first) winners.push({ user_id: selectedWinners.first, position: 1 });
      if (selectedWinners.second) winners.push({ user_id: selectedWinners.second, position: 2 });
      if (selectedWinners.third) winners.push({ user_id: selectedWinners.third, position: 3 });

      if (winners.length === 0) {
        toast.error('Please select at least one winner');
        return;
      }

      const { error } = await supabase
        .from('event_winners')
        .insert(winners.map(w => ({
          ...w,
          event_id: selectedEvent.event_id,
          marked_by: user.id
        })));

      if (error) {
        if (error.code === '23505') {
          toast.error('Winners already submitted for this event!');
        } else {
          throw error;
        }
      } else {
        toast.success('Winners submitted successfully! Certificates will be unlocked.', { duration: 3000 });
        setSelectedWinners({ first: null, second: null, third: null });
      }
    } catch (error) {
      console.error('Error submitting winners:', error);
      toast.error('Failed to submit winners');
    } finally {
      setSubmitting(false);
    }
  };

  const playTingSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyCz/LZiTUIFWi67OefTRALUKbj8LJeGwU5ktjvuXQjBSp5yO6ejD0IEWCy6OyrXBoCTqPh7K9fHQQ//SQFJYfK7t2UPwoSY7Xn6LFgGQU1k9bwxmsjBCR6xu+hlzwIEV+z5+qsWxsFUpbn8LBcHQQ4iNTwyGokBSV+xe+gl0AIEWGy5OqsWxQGUJjo7LJeGwU4iNXwyWojBCZ9xO+fl0AIEWGy5+usYBsCUpXm7rBdGgU0jtfwu24iBCR6xO6djTUIEV+z5+qrXRoFUpXm7a9fGgQ2jdXwv2wiBCV7w+6djTQIEF+y5+qrXRsEUpTn7bBdGgQ1j9jwv3QkBCV7xO+djjUIEV+y5+qrXRsEUpPm7K9fGgQ0jdjwyHAkBSN7xO2gjTYIEF+y5uqpWxkFUZPl7K9dGwQ2jtfwyHAkBSN7w+2hjTYIEF6y5+qpWhkFUZPl7K9dGwQ1jtfwyG4jBiJ7xO2hjDUJD1+y5uqpWxkFUZTm7K9dGwQ1jtfwyG4jBiJ7xO2hjDUJD1+y5uqoWxkFUZPm7K9dGwQ1jdfwyG4jBiJ7xO2hjDUJD16y5uqoWxkFUZPm66lbGgU0jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpXm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQIEF6y5umrXRsFUpTm7K9dGgQ1jtfwyG4jBSJ7xO2hjDQI=');
    audio.play().catch(() => {});
  };

  const playBuzzSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    audio.play().catch(() => {});
  };

  // Toast notification for success (replaces full-screen notification)
  const showSuccessToast = (name, session = 'morning') => {
    const sessionLabel = session === 'evening' ? 'PM' : 'AM';
    const sessionColor = session === 'evening' ? '#6366f1' : '#f59e0b';
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-green-500 shadow-lg rounded-2xl pointer-events-auto flex items-center p-4`}>
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 flex-shrink-0">
          <CheckCircle2 className="text-green-500" size={28} />
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-lg">{name}</p>
          <p className="text-white/80 text-sm flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white" style={{ backgroundColor: sessionColor }}>
              {sessionLabel}
            </span>
            Attendance Marked ✓
          </p>
        </div>
      </div>
    ), { duration: 1500 });
  };

  const filteredParticipants = participants.filter(p =>
    p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles?.roll_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles?.roll_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDakshaaId(p.user_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendedParticipants = participants.filter(p => p.attendance && p.attendance.length > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    );
  }

  if (assignedEvents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-gray-600 mb-4" size={64} />
          <h2 className="text-2xl font-bold mb-2">No Events Assigned</h2>
          <p className="text-gray-400">You are not assigned as coordinator for any event yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24 md:pb-8">
      {/* Toast notifications */}
      <Toaster position="top-center" toastOptions={{ duration: 2000 }} />
      
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold font-orbitron text-secondary">COORDINATOR</h1>
            <p className="text-xs text-gray-400">Mobile Action Panel</p>
          </div>
          <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
            <QrCode className="text-secondary" size={24} />
          </div>
        </div>

        {/* Event Selector with Registration Count */}
        <select
          value={selectedEvent?.id || selectedEvent?.event_id || ''}
          onChange={(e) => {
            const event = assignedEvents.find(ev => (ev.id || ev.event_id) === e.target.value);
            setSelectedEvent(event);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:border-secondary transition-all font-bold"
        >
          {assignedEvents.map(event => (
            <option key={event.id || event.event_id} value={event.id || event.event_id} className="bg-slate-900">
              {event.name || event.event_id} ({event.registeredCount || 0} registered)
            </option>
          ))}
        </select>
      </div>



      {/* Stats Row - Single attendance count with session indicators */}
      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
          <Users className="mx-auto text-blue-500 mb-2" size={24} />
          <p className="text-2xl font-bold text-blue-500">{stats.registered}</p>
          <p className="text-xs text-gray-400 uppercase">Registered</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
          <p className="text-2xl font-bold text-green-500">{stats.totalCheckedIn}</p>
          <p className="text-xs text-gray-400 uppercase">Attended</p>
        </div>
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center">
          <Clock className="mx-auto text-secondary mb-2" size={24} />
          <p className="text-2xl font-bold text-secondary">
            {stats.registered - stats.totalCheckedIn}
          </p>
          <p className="text-xs text-gray-400 uppercase">Remaining</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white/5 border-y border-white/10 overflow-x-auto">
        {[
          { id: 'scanner', label: 'QR Scanner', icon: Camera },
          { id: 'manual', label: 'Manual', icon: Search },
          { id: 'winners', label: 'Winners', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'text-secondary border-b-2 border-secondary'
                : 'text-gray-400'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* QR SCANNER TAB */}
          {activeTab === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center">
                {cameraError && (
                  <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                    <div className="flex items-start gap-3 text-left">
                      <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5\" size={20} />
                      <div>
                        <p className="text-amber-400 font-medium text-sm mb-1">Camera Unavailable</p>
                        <p className="text-amber-300/80 text-xs">{cameraError}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!scanning ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                      <Camera className="text-secondary" size={64} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Ready to Scan</h3>
                      <p className="text-gray-400">Tap below to start QR code scanner</p>

                    </div>
                    {cameraError ? (
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={getCameras}
                          className="w-full py-4 bg-white/5 border border-white/10 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={18} />
                          Retry Camera Access
                        </button>
                        <p className="text-xs text-gray-500">
                          💡 Tip: Use the "Manual Entry" in the Participants tab to mark attendance without camera
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={startScanning}
                        className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                      >
                        <Camera size={24} />
                        Start Scanning
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Event & Session Indicator while scanning */}
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
                      <p className="text-xs text-gray-400 uppercase mb-1">Scanning for Event</p>
                      <p className="text-secondary font-bold text-lg">{selectedEvent?.name || 'No Event Selected'}</p>
                    </div>

                    <div 
                      id="qr-reader" 
                      ref={scannerRef}
                      className="rounded-2xl overflow-hidden bg-black min-h-[300px]"
                      style={{ minHeight: '300px' }}
                    />
                    <p className="text-sm text-gray-400">
                      Point camera at QR code • Auto-scanning enabled
                    </p>
                    <button
                      onClick={stopScanning}
                      className="w-full py-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      <X size={20} />
                      Stop Scanning
                    </button>
                  </div>
                )}
              </div>

              {/* Recent Check-ins */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500" size={20} />
                  Recent Check-ins
                </h4>
                <div className="space-y-2">
                  {attendedParticipants.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="text-green-500" size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.profiles?.full_name}</p>
                          <p className="text-xs text-secondary font-mono">{formatDakshaaId(p.user_id)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(p.morningAttended || p.eveningAttended) && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">✓ Present</span>}
                        <p className="text-xs text-gray-500 mt-1">
                          {p.attendance[0]?.created_at ? new Date(p.attendance[0].created_at).toLocaleTimeString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* MANUAL ATTENDANCE TAB */}
          {activeTab === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >


              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or Dakshaa ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="space-y-3">
                {filteredParticipants.map(p => {
                  const hasCurrentSessionAttendance = p.morningAttended || p.eveningAttended;
                  const hasAnyAttendance = p.morningAttended || p.eveningAttended;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border ${
                        hasCurrentSessionAttendance
                          ? 'bg-green-500/10 border-green-500/20'
                          : hasAnyAttendance
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            hasCurrentSessionAttendance ? 'bg-green-500/20' : 'bg-white/10'
                          }`}>
                            {hasCurrentSessionAttendance ? (
                              <CheckCircle2 className="text-green-500" size={24} />
                            ) : (
                              <UserCheck className="text-gray-400" size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{p.profiles?.full_name}</p>
                            <p className="text-xs text-secondary font-mono">{formatDakshaaId(p.user_id)}</p>
                            {/* Attendance badge */}
                            {(p.morningAttended || p.eveningAttended) && <div className="mt-1"><span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded">✓ Present</span></div>}
                          </div>
                        </div>
                        {!hasCurrentSessionAttendance && (
                          <button
                            onClick={() => handleManualAttendance(p.user_id)}
                            disabled={submitting}
                            className="px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 bg-green-500 text-white hover:bg-green-600"
                          >
                            Mark
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* WINNERS TAB */}
          {activeTab === 'winners' && (
            <motion.div
              key="winners"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-[2.5rem] p-6 text-center">
                <Trophy className="mx-auto text-yellow-500 mb-3" size={48} />
                <h3 className="text-xl font-bold mb-2">Select Winners</h3>
                <p className="text-sm text-gray-400">Only students who attended can win</p>
              </div>

              {/* Winner Selection */}
              <div className="space-y-4">
                {['first', 'second', 'third'].map((position, index) => (
                  <div key={position} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                      {position === 'first' && <Trophy className="text-yellow-500" size={24} />}
                      {position === 'second' && <Medal className="text-gray-400" size={24} />}
                      {position === 'third' && <Medal className="text-orange-500" size={24} />}
                      <h4 className="font-bold">
                        {position === 'first' ? '1st Place' : position === 'second' ? '2nd Place' : '3rd Place'}
                      </h4>
                    </div>
                    <select
                      value={selectedWinners[position] || ''}
                      onChange={(e) => handleSelectWinner(e.target.value, position)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-all"
                    >
                      <option value="" className="bg-slate-900">Select Winner...</option>
                      {attendedParticipants.map(p => (
                        <option key={p.user_id} value={p.user_id} className="bg-slate-900">
                          {p.profiles?.full_name} - {formatDakshaaId(p.user_id)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button
                onClick={submitWinners}
                disabled={submitting || !selectedWinners.first}
                className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <Award size={24} />
                    Submit Results
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
