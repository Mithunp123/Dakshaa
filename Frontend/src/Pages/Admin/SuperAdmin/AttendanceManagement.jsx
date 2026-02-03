import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sun,
  Moon,
  Loader2,
  User
} from "lucide-react";
import { supabase } from "../../../supabase";
import * as XLSX from 'xlsx';

// Helper function to format dates
const formatDate = (date, formatStr) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  
  const formats = {
    'dd/MM/yyyy HH:mm': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
    'dd MMM yyyy': `${pad(d.getDate())} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}`,
    'HH:mm': `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    'yyyy-MM-dd': `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  };
  
  return formats[formatStr] || d.toLocaleString();
};

const AttendanceManagement = () => {
  const location = useLocation();
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMarked: 0,
    morningCount: 0,
    eveningCount: 0
  });

  useEffect(() => {
    loadEvents();
    if (selectedEvent) {
      loadAttendance();
    } else {
      loadEventStats();
    }
    
    // Set up real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          if (selectedEvent) {
            loadAttendance();
          } else {
            loadEventStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEvent]);

  // Auto-refresh on visibility change and location change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing attendance...');
        loadEvents();
        if (selectedEvent) {
          loadAttendance();
        } else {
          loadEventStats();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, selectedEvent]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, category')
        .order('name');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadEventStats = async () => {
    try {
      setLoading(true);
      
      // Get all attendance records grouped by event
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select('event_id, morning_attended, evening_attended');

      if (error) throw error;

      // Group by event and calculate stats
      const statsMap = {};
      (attendanceData || []).forEach(record => {
        if (!statsMap[record.event_id]) {
          statsMap[record.event_id] = {
            event_id: record.event_id,
            morning: 0,
            evening: 0,
            total: 0
          };
        }
        
        if (record.morning_attended) statsMap[record.event_id].morning++;
        if (record.evening_attended) statsMap[record.event_id].evening++;
        
        // Count unique attendance (if either morning or evening is attended)
        if (record.morning_attended || record.evening_attended) {
          statsMap[record.event_id].total++;
        }
      });

      const statsArray = Object.values(statsMap);
      setEventStats(statsArray);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            mobile_number,
            college_name,
            roll_number
          ),
          marked_by_profile:marked_by (
            full_name
          )
        `)
        .eq('event_id', selectedEvent)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      setAttendance(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      totalMarked: data.length,
      morningCount: 0,
      eveningCount: 0
    };

    data.forEach(record => {
      if (record.morning_attended) stats.morningCount++;
      if (record.evening_attended) stats.eveningCount++;
    });

    setStats(stats);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedEvent) {
      loadAttendance();
    } else {
      loadEventStats();
    }
  };

  const exportToExcel = () => {
    if (!selectedEvent) {
      // Export event stats
      const exportData = eventStats.map(stat => ({
        'Event': getEventName(stat.event_id),
        'Morning Attended': stat.morning,
        'Evening Attended': stat.evening,
        'Total Present': stat.total
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Event Statistics');
      XLSX.writeFile(wb, `attendance_stats_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } else {
      // Export attendance records
      const exportData = filteredAttendance.map(record => ({
        'User Name': record.profiles?.full_name || 'N/A',
        'Email': record.profiles?.email || 'N/A',
        'Phone': record.profiles?.mobile_number || 'N/A',
        'College': record.profiles?.college_name || 'N/A',
        'Roll Number': record.profiles?.roll_number || 'N/A',
        'Morning Attended': record.morning_attended ? 'Yes' : 'No',
        'Morning Time': record.morning_time ? formatDate(record.morning_time, 'dd/MM/yyyy HH:mm') : 'N/A',
        'Evening Attended': record.evening_attended ? 'Yes' : 'No',
        'Evening Time': record.evening_time ? formatDate(record.evening_time, 'dd/MM/yyyy HH:mm') : 'N/A',
        'Marked By': record.marked_by_profile?.full_name || 'N/A',
        'Created At': formatDate(record.created_at, 'dd/MM/yyyy HH:mm')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance_${getEventName(selectedEvent)}_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }
  };

  const filteredAttendance = attendance.filter(record => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      record.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      record.profiles?.email?.toLowerCase().includes(searchLower) ||
      record.profiles?.roll_number?.toLowerCase().includes(searchLower) ||
      record.profiles?.college_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredEventStats = eventStats.filter(stat => {
    if (!searchTerm) return true;
    
    const eventName = getEventName(stat.event_id);
    return eventName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event?.name || eventId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Attendance Management
          </h1>
        </div>
        
        {selectedEvent && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              ← Back to Events
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        )}
      </div>

      {!selectedEvent ? (
        <>
          {/* Event Selection View */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Event to Manage</h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-secondary" size={40} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Event Name
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Morning Attended
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Evening Attended
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total Present
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {events.map((event, index) => {
                      const stat = eventStats.find(s => s.event_id === event.id) || { morning: 0, evening: 0, total: 0 };
                      
                      if (searchTerm && !event.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                        return null;
                      }

                      return (
                        <motion.tr
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedEvent(event.id)}
                          className="hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-blue-500" size={18} />
                              <span className="text-white font-medium">{event.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{stat.morning}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{stat.evening}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-white font-semibold">{stat.total}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-white/5 border-t border-white/10">
                    <tr>
                      <td className="px-6 py-4 text-left font-bold text-white">
                        OVERALL TOTAL
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {eventStats.reduce((sum, stat) => sum + stat.morning, 0)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {eventStats.reduce((sum, stat) => sum + stat.evening, 0)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {eventStats.reduce((sum, stat) => sum + stat.total, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Event-Specific View */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Select Event to Manage</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
              <p className="text-white font-medium">{getEventName(selectedEvent)}</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">Total Marked</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalMarked}</p>
                </div>
                <CheckCircle2 className="text-blue-500" size={32} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Morning Session</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.morningCount}</p>
                </div>
                <Sun className="text-yellow-500" size={32} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">Evening Session</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.eveningCount}</p>
                </div>
                <Moon className="text-purple-500" size={32} />
              </div>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, roll number, or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
            />
          </div>

          {/* Attendance Records Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <CheckCircle2 className="text-secondary" size={20} />
              <h3 className="text-lg font-bold text-white">Attendance Records</h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-secondary" size={40} />
              </div>
            ) : filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Users size={48} className="mb-4 opacity-50" />
                <p className="text-lg">No attendance records for this event</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        College
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Morning
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Evening
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Marked At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredAttendance.map((record, index) => (
                      <motion.tr
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                              <User className="text-secondary" size={20} />
                            </div>
                            <div>
                              <p className="text-white font-medium">{record.profiles?.full_name || 'N/A'}</p>
                              <p className="text-gray-500 text-xs">Roll: {record.profiles?.roll_number || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-gray-300 text-sm">{record.profiles?.email || 'N/A'}</p>
                            <p className="text-gray-400 text-xs">{record.profiles?.mobile_number || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">{record.profiles?.college_name || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          {record.morning_attended ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="text-green-500" size={18} />
                              <div>
                                <p className="text-green-400 text-sm font-medium">Present</p>
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatDate(record.morning_time, 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="text-red-500" size={18} />
                              <span className="text-red-400 text-sm">Absent</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {record.evening_attended ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="text-green-500" size={18} />
                              <div>
                                <p className="text-green-400 text-sm font-medium">Present</p>
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                  <Clock size={12} />
                                  {formatDate(record.evening_time, 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="text-red-500" size={18} />
                              <span className="text-red-400 text-sm">Absent</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-400 text-sm">
                            <p>{formatDate(record.created_at, 'dd MMM yyyy')}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(record.created_at, 'HH:mm')}
                            </p>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Results Count */}
          {!loading && filteredAttendance.length > 0 && (
            <div className="text-center text-gray-400 text-sm">
              Showing {filteredAttendance.length} of {attendance.length} attendance record(s)
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceManagement;
