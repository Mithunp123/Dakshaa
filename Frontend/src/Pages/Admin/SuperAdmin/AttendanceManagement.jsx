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
  Loader2,
  User,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { supabase } from "../../../supabase";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchAllRecords, fetchAllRecordsWithJoins } from '../../../utils/bulkFetch';
import ksrctImg from '../../../assets/ksrct.webp';
import logoImg from '../../../assets/logo.webp';

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

const AttendanceManagement = ({ coordinatorEvents }) => {
  const location = useLocation();
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalMarked: 0,
    morningCount: 0
  });
  
  // Check if this is a coordinator view
  const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;

  // Helper function to extract event type from event_id
  const getEventType = (eventId) => {
    if (!eventId) return null;
    const eventIdLower = eventId.toLowerCase();
    if (eventIdLower.includes('paper')) return 'paper';
    if (eventIdLower.includes('poster')) return 'poster';
    if (eventIdLower.includes('project')) return 'project';
    return null;
  };

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
      let data;
      
      if (hasCoordinatorFilter) {
        // coordinatorEvents come with event_id (text slug) from AttendancePage
        // Try both UUID and text slug matching
        const coordIds = coordinatorEvents.map(e => e.event_id || e.id).filter(Boolean);
        const coordUUIDs = coordinatorEvents.map(e => e.id).filter(Boolean);
        console.log('🎯 AttendanceManagement - Coordinator event_ids:', coordIds);
        console.log('🎯 AttendanceManagement - Coordinator UUIDs:', coordUUIDs);
        
        // First try by UUID
        const { data: filteredData, error } = await supabase
          .from('events')
          .select('id, name, event_id, category')
          .in('id', coordUUIDs)
          .order('name');

        if (error) throw error;
        
        if (filteredData && filteredData.length > 0) {
          data = filteredData;
        } else {
          // Fallback: try by event_id text slug
          const { data: fallbackData, error: fbErr } = await supabase
            .from('events')
            .select('id, name, event_id, category')
            .in('event_id', coordIds)
            .order('name');
          if (fbErr) throw fbErr;
          data = fallbackData;
        }
      } else {
        // For super admin, get all events
        const { data: allData, error } = await supabase
          .from('events')
          .select('id, name, event_id, category')
          .order('name');

        if (error) throw error;
        data = allData;
      }
      
      console.log('📋 Events loaded:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Sample event:', { id: data[0].id, event_id: data[0].event_id, name: data[0].name });
      }
      setEvents(data || []);
    } catch (error) {
      console.error('❌ Error loading events:', error);
    }
  };

  const loadEventStats = async () => {
    try {
      setLoading(true);
      
      let attendanceData;
      
      if (hasCoordinatorFilter) {
        // For coordinators, filter by their assigned events
        // Use text event_id slugs since attendance table stores text slugs
        const textEventIds = coordinatorEvents.map(e => e.event_id || e.id).filter(Boolean);
        console.log('📊 AttendanceManagement - Loading stats for coordinator text event_ids:', textEventIds);
        
        const { data, error } = await fetchAllRecords(supabase, 'attendance', 'event_id, morning_attended, evening_attended', {
          filters: [{ column: 'event_id', operator: 'in', value: textEventIds }]
        });

        if (error) throw error;
        attendanceData = data;
        console.log('📊 Attendance data fetched (coordinator):', data?.length || 0, 'records');
      } else {
        // For super admin, get all attendance records
        const { data, error } = await fetchAllRecords(supabase, 'attendance', 'event_id, morning_attended, evening_attended');

        if (error) throw error;
        attendanceData = data;
        console.log('📊 Attendance data fetched (all):', data?.length || 0, 'records');
      }

      // Debug: log sample attendance records
      if (attendanceData && attendanceData.length > 0) {
        console.log('📊 Sample attendance event_id:', attendanceData[0].event_id);
      } else {
        console.warn('⚠️ No attendance records found!');
      }

      // Group by event_id (text slug) and calculate stats
      const statsMap = {};
      (attendanceData || []).forEach(record => {
        const eventIdKey = String(record.event_id);
        
        if (!statsMap[eventIdKey]) {
          statsMap[eventIdKey] = {
            event_id: eventIdKey,
            morning: 0,
            total: 0
          };
        }
        
        if (record.morning_attended) {
          statsMap[eventIdKey].morning++;
          statsMap[eventIdKey].total++;
        }
      });

      const statsArray = Object.values(statsMap);
      console.log('📊 Event stats calculated:', statsArray.length, 'events with data');
      if (statsArray.length > 0) {
        console.log('📊 Sample stat:', statsArray[0]);
      }
      setEventStats(statsArray);
    } catch (error) {
      console.error('❌ Error loading event stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      
      // selectedEvent is now the text slug (e.g., 'workshop-event-aiml')
      const eventIdStr = selectedEvent;
      console.log('📋 Loading attendance for event (text slug):', eventIdStr);
      
      const { data, error } = await fetchAllRecordsWithJoins(supabase, 'attendance', `
          *,
          profiles:user_id (
            full_name,
            email,
            mobile_number,
            college_name,
            roll_number,
            department
          ),
          marked_by_profile:marked_by (
            full_name
          )
        `, {
          filters: [{ column: 'event_id', operator: 'eq', value: eventIdStr }],
          orderBy: 'created_at',
          orderAscending: false
        });

      if (error) throw error;

      console.log('📋 Attendance records loaded:', data?.length || 0);
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
      totalMarked: 0,
      morningCount: 0
    };

    data.forEach(record => {
      if (record.morning_attended) {
        stats.morningCount++;
        stats.totalMarked++;
      }
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

  const exportToCSV = () => {
    if (!selectedEvent) {
      // Export event stats
      const exportData = eventStats.map(stat => ({
        'Event': getEventName(stat.event_id),
        'Morning Attended': stat.morning,
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
        'Department': record.profiles?.department || 'N/A',
        'Morning Attended': record.morning_attended ? 'Yes' : 'No',
        'Morning Time': record.morning_time ? formatDate(record.morning_time, 'dd/MM/yyyy HH:mm') : 'N/A',
        'Marked By': record.marked_by_profile?.full_name || 'N/A',
        'Created At': formatDate(record.created_at, 'dd/MM/yyyy HH:mm')
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, `attendance_${getEventName(selectedEvent)}_${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx`);
    }
  };

  // Load image as base64 for PDF
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const scale = 4;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        resolve({
          data: canvas.toDataURL('image/png', 1.0),
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const exportToPDF = async () => {
    try {
      if (!selectedEvent) {
        // Export event-wise summary
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Load logos from src/assets
        const ksrctData = await loadImageAsBase64(ksrctImg);
        const logoData = await loadImageAsBase64(logoImg);

        const headerY = 22;

        // Left logo (ksrct.webp)
        if (ksrctData) {
          const logoHeight = 20;
          const aspectRatio = ksrctData.width / ksrctData.height;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(ksrctData.data, 'PNG', 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
        }

        // Right logo (logo.webp) - larger size
        if (logoData) {
          const logoHeight = 28;
          const aspectRatio = logoData.width / logoData.height;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(logoData.data, 'PNG', pageWidth - logoWidth - 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
        }

        // Header text
        doc.setFontSize(18);
        doc.setTextColor(26, 54, 93);
        doc.setFont('helvetica', 'bold');
        doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 4, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(230, 126, 34);
        doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(197, 48, 48);
        doc.text('Attendance Summary - All Events', pageWidth / 2, headerY + 10, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on ${formatDate(new Date(), 'dd MMM yyyy')}`, pageWidth / 2, headerY + 16, { align: 'center' });

        // Table data with event_id and total attendance
        const tableData = filteredEventStats.map((stat, index) => [
          index + 1,
          stat.event_id,
          getEventName(stat.event_id),
          stat.morning,
          stat.total
        ]);

        // Add totals row
        const totalRow = [
          'TOTAL',
          '',
          '',
          eventStats.reduce((sum, stat) => sum + stat.morning, 0),
          eventStats.reduce((sum, stat) => sum + stat.total, 0)
        ];

        autoTable(doc, {
          startY: headerY + 22,
          head: [['S.No', 'Event ID', 'Event Name', 'Morning', 'Total']],
          body: tableData,
          foot: [totalRow],
          theme: 'grid',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
          },
          footStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 30, halign: 'center' },
            4: { cellWidth: 30, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
        });

        doc.save(`attendance_summary_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
      } else {
        // Export detailed attendance for selected event
        const doc = new jsPDF('landscape', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Load logos from src/assets
        const ksrctData = await loadImageAsBase64(ksrctImg);
        const logoData = await loadImageAsBase64(logoImg);

        const headerY = 22;

        // Left logo (ksrct.webp)
        if (ksrctData) {
          const logoHeight = 20;
          const aspectRatio = ksrctData.width / ksrctData.height;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(ksrctData.data, 'PNG', 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
        }

        // Right logo (logo.webp) - larger size
        if (logoData) {
          const logoHeight = 28;
          const aspectRatio = logoData.width / logoData.height;
          const logoWidth = logoHeight * aspectRatio;
          doc.addImage(logoData.data, 'PNG', pageWidth - logoWidth - 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
        }

        // Header text
        doc.setFontSize(18);
        doc.setTextColor(26, 54, 93);
        doc.setFont('helvetica', 'bold');
        doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 4, { align: 'center' });
        doc.setFontSize(11);
        doc.setTextColor(230, 126, 34);
        doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(197, 48, 48);
        doc.text(`${getEventName(selectedEvent)} (${selectedEvent})`, pageWidth / 2, headerY + 10, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Attendance Report | Total Attendance: ${stats.totalMarked}`, pageWidth / 2, headerY + 16, { align: 'center' });

        // Table data
        const tableData = filteredAttendance.map((record, index) => [
          index + 1,
          record.profiles?.full_name || 'N/A',
          record.profiles?.roll_number || 'N/A',
          record.profiles?.department || 'N/A',
          record.profiles?.college_name || 'N/A',
          record.profiles?.mobile_number || 'N/A',
          record.morning_attended ? '✓' : '✗',
        ]);

        autoTable(doc, {
          startY: headerY + 22,
          head: [['S.No', 'Name', 'Roll No', 'Dept', 'College', 'Mobile', 'Morning']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35 },
            4: { cellWidth: 60 },
            5: { cellWidth: 35 },
            6: { cellWidth: 25, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
        });

        // Add footer with stats
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Marked: ${stats.totalMarked} | Morning: ${stats.morningCount}`, 14, finalY);
        doc.text(`Generated on ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, finalY + 5);

        doc.save(`attendance_${getEventName(selectedEvent)}_${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report');
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

  // Get unique categories from events (case-insensitive, normalized to Title Case)
  const normalizeCategoryName = (category) => {
    if (!category) return '';
    return category.toLowerCase().split(/[\s-]+/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const categoryMap = new Map();
  events.forEach(e => {
    if (e.category) {
      const lowerKey = e.category.toLowerCase();
      if (!categoryMap.has(lowerKey)) {
        categoryMap.set(lowerKey, normalizeCategoryName(e.category));
      }
    }
  });
  const categories = Array.from(categoryMap.values()).sort((a, b) => 
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // Filter events by category, event type, and search (case-insensitive for category)
  const filteredEvents = events.filter(event => {
    const matchesCategory = !selectedCategory || 
      event.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesEventType = selectedEventType === 'all' || 
      getEventType(event.event_id) === selectedEventType;
    const matchesSearch = !searchTerm || 
      event.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesEventType && matchesSearch;
  });

  // Get filtered event ids for stats filtering
  const filteredEventIds = new Set(filteredEvents.map(e => e.event_id || e.id));

  const filteredEventStats = eventStats.filter(stat => {
    return filteredEventIds.has(stat.event_id);
  });

  const getEventName = (eventId) => {
    // Match by text event_id slug first, then by UUID id
    const event = events.find(e => e.event_id === eventId || e.id === eventId);
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
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <FileSpreadsheet size={18} />
              CSV
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-white flex items-center gap-2 transition-colors"
            >
              <FileText size={18} />
              PDF
            </button>
          </div>
        )}
      </div>

      {!selectedEvent ? (
        <>
          {/* Event Selection View */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Select Event to Manage</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  <FileSpreadsheet size={18} />
                  CSV
                </button>
                <button
                  onClick={exportToPDF}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  <FileText size={18} />
                  PDF
                </button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-secondary"
                />
              </div>
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-secondary cursor-pointer"
                >
                  <option value="" className="bg-gray-900 text-white">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="relative min-w-[200px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white appearance-none focus:outline-none focus:border-secondary cursor-pointer"
                >
                  <option value="all" className="bg-gray-900 text-white">All Types</option>
                  <option value="paper" className="bg-gray-900 text-white">Paper</option>
                  <option value="poster" className="bg-gray-900 text-white">Poster</option>
                  <option value="project" className="bg-gray-900 text-white">Project</option>
                </select>
              </div>
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
                        Total Present
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredEvents.map((event, index) => {
                      // Use event_id (text slug) to match attendance stats
                      const textEventId = event.event_id || event.id;
                      const stat = eventStats.find(s => s.event_id === textEventId) || { morning: 0, evening: 0, total: 0 };

                      return (
                        <motion.tr
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedEvent(textEventId)}
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
                            <span className="text-white font-semibold">{stat.total}</span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-white/5 border-t border-white/10">
                    <tr>
                      <td className="px-6 py-4 text-left font-bold text-white">
                        {selectedCategory && selectedEventType !== 'all' ? `TOTAL (${selectedCategory} - ${selectedEventType.charAt(0).toUpperCase() + selectedEventType.slice(1)})` : 
                         selectedCategory ? `TOTAL (${selectedCategory})` : 
                         selectedEventType !== 'all' ? `TOTAL (${selectedEventType.charAt(0).toUpperCase() + selectedEventType.slice(1)})` : 
                         'OVERALL TOTAL'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {filteredEventStats.reduce((sum, stat) => sum + stat.morning, 0)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-white">
                        {filteredEventStats.reduce((sum, stat) => sum + stat.total, 0)}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
