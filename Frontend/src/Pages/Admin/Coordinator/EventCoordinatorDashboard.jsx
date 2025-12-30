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
  Clock
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';

const EventCoordinatorDashboard = () => {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scanner');
  const [searchTerm, setSearchTerm] = useState('');
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    registered: 0,
    checkedIn: 0,
    remaining: 0
  });

  // Winner selection
  const [selectedWinners, setSelectedWinners] = useState({
    first: null,
    second: null,
    third: null
  });

  const scannerRef = useRef(null);
  const html5QrCodeScannerRef = useRef(null);

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchParticipants();
      fetchStats();

      // Set up real-time subscription for attendance changes
      const attendanceSubscription = supabase
        .channel(`attendance-${selectedEvent.event_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance',
            filter: `event_id=eq.${selectedEvent.event_id}`
          },
          (payload) => {
            console.log('Attendance change detected:', payload);
            fetchParticipants();
            fetchStats();
          }
        )
        .subscribe();

      // Set up real-time subscription for registration changes
      const registrationSubscription = supabase
        .channel(`registrations-${selectedEvent.event_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `event_id=eq.${selectedEvent.event_id}`
          },
          (payload) => {
            console.log('Registration change detected:', payload);
            fetchParticipants();
            fetchStats();
          }
        )
        .subscribe();

      // Polling fallback: refresh stats every 10 seconds
      // This ensures counts update even if realtime subscription isn't working
      const pollingInterval = setInterval(() => {
        fetchStats();
      }, 10000);

      // Cleanup subscriptions and interval on unmount or event change
      return () => {
        supabase.removeChannel(attendanceSubscription);
        supabase.removeChannel(registrationSubscription);
        clearInterval(pollingInterval);
      };
    }
  }, [selectedEvent]);

  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Get user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const isAdminOrCoordinator = profile?.role === 'super_admin' || profile?.role === 'event_coordinator';

      // Get all active events from events_config
      // For coordinators/admins, we show all events (they can manage any)
      // For specific assignments, we filter later
      let events = [];
      
      if (isAdminOrCoordinator) {
        const { data: allEvents, error: eventsError } = await supabase
          .from('events_config')
          .select('*')
          .eq('is_open', true);
        
        if (eventsError) throw eventsError;
        events = allEvents || [];
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

      // Fetch attendance for this event separately
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', eventId);

      if (attError) console.warn('Attendance fetch error:', attError);

      // Combine registrations with profiles and attendance data
      const participantsWithAttendance = (registrations || []).map(reg => {
        const profile = profilesMap[reg.user_id] || {};
        const attendance = (attendanceData || []).filter(att => att.user_id === reg.user_id);
        return {
          ...reg,
          profiles: profile,
          attendance: attendance
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
      // Use event.id (UUID) for events_config table
      const eventId = selectedEvent.id || selectedEvent.event_id;
      
      if (!eventId) {
        console.warn('No valid event ID for stats');
        return;
      }
      
      const { count: registered } = await supabase
        .from('event_registrations_config')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('payment_status', ['PAID', 'completed']);

      const { count: checkedIn } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      setStats({
        registered: registered || 0,
        checkedIn: checkedIn || 0,
        remaining: (registered || 0) - (checkedIn || 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startScanning = () => {
    setScanning(true);
    setActiveTab('scanner');

    setTimeout(() => {
      if (scannerRef.current && !html5QrCodeScannerRef.current) {
        try {
          const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
          );

          scanner.render(onScanSuccess, onScanError);
          html5QrCodeScannerRef.current = scanner;
        } catch (error) {
          console.error('Scanner error:', error);
          alert('Camera access failed. Please allow camera permissions.');
          setScanning(false);
        }
      }
    }, 100);
  };

  const stopScanning = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear();
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log('QR Scanned:', decodedText);
    
    // Stop scanner immediately
    stopScanning();

    // Mark attendance
    await markAttendance(decodedText, 'qr_scan');
  };

  const onScanError = (error) => {
    // Silent error handling
  };

  const markAttendance = async (userId, markType = 'qr_scan') => {
    try {
      setSubmitting(true);
      const { data: { user: coordinator } } = await supabase.auth.getUser();

      // Check if user is registered for this event
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .select('*, profiles!user_id(id, full_name, roll_number, college_name)')
        .eq('user_id', userId)
        .eq('event_id', selectedEvent.event_id)
        .eq('payment_status', 'completed')
        .single();

      if (regError || !registration) {
        playBuzzSound();
        alert('❌ INVALID: User not registered for this event or payment not completed!');
        return;
      }

      // Check if already marked
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', selectedEvent.event_id)
        .single();

      if (existingAttendance) {
        playBuzzSound();
        alert('⚠️ ALREADY MARKED: Attendance already recorded!');
        return;
      }

      // Mark attendance
      const { error: attendanceError } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          event_id: selectedEvent.event_id,
          marked_by: coordinator.id,
          mark_type: markType
        });

      if (attendanceError) throw attendanceError;

      playTingSound();
      showSuccessNotification(registration.profiles.full_name);
      
      fetchParticipants();
      fetchStats();
    } catch (error) {
      console.error('Error marking attendance:', error);
      playBuzzSound();
      alert('❌ Error: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualAttendance = async (userId) => {
    const confirmed = confirm('Mark attendance manually for this user?');
    if (!confirmed) return;
    
    await markAttendance(userId, 'manual');
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
      const { data: { user } } = await supabase.auth.getUser();

      const winners = [];
      if (selectedWinners.first) winners.push({ user_id: selectedWinners.first, position: 1 });
      if (selectedWinners.second) winners.push({ user_id: selectedWinners.second, position: 2 });
      if (selectedWinners.third) winners.push({ user_id: selectedWinners.third, position: 3 });

      if (winners.length === 0) {
        alert('Please select at least one winner');
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
          alert('Winners already submitted for this event!');
        } else {
          throw error;
        }
      } else {
        alert('✅ Winners submitted successfully! Certificates will be unlocked for winners.');
        setSelectedWinners({ first: null, second: null, third: null });
      }
    } catch (error) {
      console.error('Error submitting winners:', error);
      alert('Failed to submit winners');
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

  const showSuccessNotification = (name) => {
    // Show green flash notification
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-green-500/80 z-[9999] flex items-center justify-center backdrop-blur-sm';
    notification.innerHTML = `
      <div class="text-center">
        <div class="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg class="w-20 h-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-5xl font-bold text-white mb-2">VALID</h2>
        <p class="text-3xl text-white font-bold">${name}</p>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  const filteredParticipants = participants.filter(p =>
    p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles?.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 p-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
          <Users className="mx-auto text-blue-500 mb-2" size={24} />
          <p className="text-2xl font-bold text-blue-500">{stats.registered}</p>
          <p className="text-xs text-gray-400 uppercase">Registered</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
          <p className="text-2xl font-bold text-green-500">{stats.checkedIn}</p>
          <p className="text-xs text-gray-400 uppercase">Checked In</p>
        </div>
        <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-4 text-center">
          <Clock className="mx-auto text-secondary mb-2" size={24} />
          <p className="text-2xl font-bold text-secondary">{stats.remaining}</p>
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
                {!scanning ? (
                  <div className="space-y-6">
                    <div className="w-32 h-32 mx-auto bg-secondary/10 rounded-[2rem] flex items-center justify-center border-4 border-secondary/20">
                      <Camera className="text-secondary" size={64} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Ready to Scan</h3>
                      <p className="text-gray-400">Tap below to start QR code scanner</p>
                    </div>
                    <button
                      onClick={startScanning}
                      className="w-full py-5 bg-secondary text-white font-bold text-lg rounded-2xl hover:bg-secondary-dark transition-all shadow-lg shadow-secondary/20 flex items-center justify-center gap-3"
                    >
                      <Camera size={24} />
                      Start Scanning
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      id="qr-reader" 
                      ref={scannerRef}
                      className="rounded-2xl overflow-hidden"
                    />
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
                          <p className="text-xs text-gray-400">{p.profiles?.roll_number}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(p.attendance[0]?.marked_at).toLocaleTimeString()}
                      </p>
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
                  placeholder="Search by name or roll number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-secondary transition-all"
                />
              </div>

              <div className="space-y-3">
                {filteredParticipants.map(p => {
                  const hasAttended = p.attendance && p.attendance.length > 0;
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border ${
                        hasAttended
                          ? 'bg-green-500/10 border-green-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            hasAttended ? 'bg-green-500/20' : 'bg-white/10'
                          }`}>
                            {hasAttended ? (
                              <CheckCircle2 className="text-green-500" size={24} />
                            ) : (
                              <UserCheck className="text-gray-400" size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold">{p.profiles?.full_name}</p>
                            <p className="text-xs text-gray-400">{p.profiles?.roll_number}</p>
                          </div>
                        </div>
                        {!hasAttended && (
                          <button
                            onClick={() => handleManualAttendance(p.user_id)}
                            disabled={submitting}
                            className="px-4 py-2 bg-secondary text-white rounded-xl font-bold text-sm hover:bg-secondary-dark transition-all disabled:opacity-50"
                          >
                            Mark Present
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
                          {p.profiles?.full_name} - {p.profiles?.roll_number}
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

export default EventCoordinatorDashboard;
