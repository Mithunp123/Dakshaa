import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  QrCode, 
  Award, 
  CheckCircle2, 
  Search, 
  Filter,
  Loader2,
  Camera,
  X,
  UserCheck,
  Trophy,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../../supabase';

const CoordinatorDashboard = () => {
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAssignedEvents();
  }, []);

  // Set up real-time subscriptions when event is selected
  useEffect(() => {
    if (selectedEvent) {
      // Use event.id for events_config (UUID) or event_id for events table
      const eventId = selectedEvent.id || selectedEvent.event_id;
      
      // Real-time subscription for registrations
      const registrationSub = supabase
        .channel(`reg-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'event_registrations_config',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            console.log('Registration change detected');
            handleSelectEvent(selectedEvent);
          }
        )
        .subscribe();

      // Real-time subscription for attendance
      const attendanceSub = supabase
        .channel(`att-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance',
            filter: `event_id=eq.${eventId}`
          },
          () => {
            console.log('Attendance change detected');
            handleSelectEvent(selectedEvent);
          }
        )
        .subscribe();

      // Polling fallback every 10 seconds
      const pollingInterval = setInterval(() => {
        handleSelectEvent(selectedEvent);
      }, 10000);

      return () => {
        supabase.removeChannel(registrationSub);
        supabase.removeChannel(attendanceSub);
        clearInterval(pollingInterval);
      };
    }
  }, [selectedEvent?.id || selectedEvent?.event_id]);

  const fetchAssignedEvents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch coordinator assignments
      const { data: coords, error: coordError } = await supabase
        .from('event_coordinators')
        .select('event_id')
        .eq('user_id', user.id);

      if (coordError) throw coordError;
      
      const assignedEventIds = coords?.map(c => c.event_id) || [];
      
      // Fetch events from events_config
      let events = [];
      if (assignedEventIds.length > 0) {
        const { data: configEvents } = await supabase
          .from('events_config')
          .select('*')
          .in('id', assignedEventIds);
        
        events = configEvents || [];
      }
      
      // If no assignments, check if user is admin/coordinator and show all events
      if (events.length === 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'super_admin' || profile?.role === 'event_coordinator') {
          const { data: allEvents } = await supabase
            .from('events_config')
            .select('*')
            .eq('is_open', true);
          events = allEvents || [];
        }
      }
      
      // Fetch registration counts for each event
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          // Use event.id (UUID) for events_config
          const eventId = event.id || event.event_id;
          
          const { count: registeredCount } = await supabase
            .from('event_registrations_config')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .in('payment_status', ['PAID', 'completed']);
          
          return {
            ...event,
            registeredCount: registeredCount || 0
          };
        })
      );
      
      setAssignedEvents(eventsWithCounts);
      
      if (eventsWithCounts.length > 0) {
        handleSelectEvent(eventsWithCounts[0]);
      }
    } catch (error) {
      console.error('Error fetching assigned events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = async (event) => {
    setSelectedEvent(event);
    setLoading(true);
    try {
      // Use event.id (UUID) for events_config
      const eventId = event.id || event.event_id;
      
      if (!eventId) {
        console.warn('No valid event ID');
        setLoading(false);
        return;
      }
      
      // Fetch registrations for this event (no join - FK is to auth.users not profiles)
      const { data: registrations, error: regError } = await supabase
        .from('event_registrations_config')
        .select('*')
        .eq('event_id', eventId)
        .in('payment_status', ['PAID', 'completed']);

      if (regError) throw regError;

      // Get unique user IDs
      const userIds = [...new Set((registrations || []).map(r => r.user_id))];
      
      // Fetch profiles separately
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, roll_number, college_name, roll_no')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // Fetch attendance separately
      const { data: attendanceData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_id', eventId);

      if (attError) console.warn('Attendance fetch error:', attError);

      // Combine registrations with profiles and attendance
      const participantsWithAttendance = (registrations || []).map(reg => ({
        ...reg,
        profiles: profilesMap[reg.user_id] || {},
        attendance: (attendanceData || []).filter(att => att.user_id === reg.user_id)
      }));

      setParticipants(participantsWithAttendance);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (userId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const eventId = selectedEvent.id || selectedEvent.event_id;
      
      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          event_id: eventId,
          marked_by: user.id
        });

      if (error) {
        if (error.code === '23505') {
          alert('Attendance already marked!');
        } else {
          throw error;
        }
      } else {
        // Update local state
        setParticipants(participants.map(p => 
          p.user_id === userId ? { ...p, attendance: [{ id: 'new' }] } : p
        ));
        alert('Attendance marked successfully!');
      }
    } catch (error) {
      alert('Failed to mark attendance: ' + error.message);
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles?.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && assignedEvents.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold">Coordinator Panel</h2>
          <p className="text-gray-400">Manage participants and attendance for your events</p>
        </div>
        
        {assignedEvents.length > 1 && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
            <Filter size={20} className="text-gray-500" />
            <select 
              value={selectedEvent?.event_id}
              onChange={(e) => handleSelectEvent(assignedEvents.find(ev => ev.event_id === e.target.value))}
              className="bg-transparent focus:outline-none capitalize font-bold"
            >
              {assignedEvents.map(ev => (
                <option key={ev.event_id} value={ev.event_id} className="bg-slate-900">{ev.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedEvent ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats & Actions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-secondary/20 to-primary/20 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-6">{selectedEvent.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Participants</p>
                  <p className="text-2xl font-bold">{participants.length}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-400">
                    {participants.filter(p => p.attendance && p.attendance.length > 0).length}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setScanning(true)}
                className="w-full mt-6 py-4 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all flex items-center justify-center gap-3 shadow-lg shadow-secondary/20"
              >
                <QrCode size={24} /> Launch Scanner
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} /> Winners
              </h3>
              <p className="text-sm text-gray-400 mb-6">Select winners after the event concludes.</p>
              <button className="w-full py-3 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-bold transition-all">
                Manage Winners
              </button>
            </div>
          </div>

          {/* Participant List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Participant</th>
                      <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Roll Number</th>
                      <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs">Status</th>
                      <th className="p-6 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredParticipants.map((p) => {
                      const isPresent = p.attendance && p.attendance.length > 0;
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {p.profiles?.full_name?.charAt(0)}
                              </div>
                              <span className="font-bold">{p.profiles?.full_name}</span>
                            </div>
                          </td>
                          <td className="p-6 font-mono text-sm text-gray-400">{p.profiles?.roll_number}</td>
                          <td className="p-6">
                            <span className={`flex items-center gap-2 text-xs font-bold ${isPresent ? 'text-green-400' : 'text-gray-500'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${isPresent ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                              {isPresent ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {!isPresent && (
                              <button 
                                onClick={() => markAttendance(p.user_id)}
                                className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                title="Mark Present"
                              >
                                <UserCheck size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-[3rem]">
          <AlertCircle className="mx-auto text-gray-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-400">No events assigned</h3>
          <p className="text-gray-500 mt-2">Contact the Super Admin to assign you to an event.</p>
        </div>
      )}

      {/* Scanner Modal Placeholder */}
      <AnimatePresence>
        {scanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full relative overflow-hidden">
              <button 
                onClick={() => setScanning(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Scan Participant QR</h3>
                <p className="text-gray-400">Point your camera at the student's ticket</p>
              </div>

              <div className="aspect-square bg-black rounded-3xl border-2 border-dashed border-secondary/50 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                <Camera size={48} className="text-secondary animate-pulse" />
                <p className="text-sm text-gray-500">Camera initialization...</p>
                
                {/* Scanning animation overlay */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-secondary/50 shadow-[0_0_15px_rgba(249,115,22,0.8)] z-20"
                />
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-xs text-center text-gray-500 uppercase tracking-widest">Or enter ID manually</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Registration ID..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-secondary transition-all"
                  />
                  <button className="px-6 py-3 bg-secondary text-white font-bold rounded-xl hover:bg-secondary-dark transition-all">
                    Check
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoordinatorDashboard;
