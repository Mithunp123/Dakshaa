import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  CreditCard,
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  X,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { supabase } from '../../../supabase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePageAuth } from '../../../hooks/usePageAuth';
import { useAuthenticatedRequest } from '../../../utils/silentRefresh';

const Overview = ({ coordinatorEvents, hideFinancials = false }) => {
  const location = useLocation();
  const { isLoading: authLoading } = usePageAuth('Super Admin Overview');
  const { makeRequest } = useAuthenticatedRequest();
  const [stats, setStats] = useState({
    totalRegistrations: 0,
    totalRevenue: 0,
    totalCheckins: 0,
    activeEvents: 0,
    totalEvents: 0,
    recentRegistrations: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [openingEvents, setOpeningEvents] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [allEventsOpen, setAllEventsOpen] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  
  const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-emerald-500/80 font-mono text-sm">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Function to open all events
  const openAllEvents = async () => {
    setOpeningEvents(true);
    try {
      console.log('🚀 Opening all events...');
      const { data, error } = await supabase
        .from('events')
        .update({ is_open: true })
        .neq('is_open', true);

      if (error) {
        console.error('❌ Error opening events:', error);
        alert('Failed to open events: ' + error.message);
      } else {
        console.log('✅ All events opened successfully!');
        setAllEventsOpen(true);
        setShowSuccessCelebration(true);
        // Refresh stats to show updated active events count
        fetchStats();
        // Hide celebration after 5 seconds
        setTimeout(() => setShowSuccessCelebration(false), 5000);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('An error occurred while opening events');
    } finally {
      setOpeningEvents(false);
    }
  };

  // Check if all events are already open
  const checkAllEventsOpen = async () => {
    try {
      const { count: closedCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', false);
      
      const { count: nullCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .is('is_open', null);
      
      const totalClosed = (closedCount || 0) + (nullCount || 0);
      setAllEventsOpen(totalClosed === 0);
    } catch (err) {
      console.error('Error checking events status:', err);
    }
  };

  // Check on mount if all events are open
  useEffect(() => {
    checkAllEventsOpen();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      setCountdown(10);
      // Open all events when countdown reaches 0
      openAllEvents();
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  const startCountdown = () => {
    setShowCountdown(true);
    setCountdown(10);
  };

  useEffect(() => {
    fetchStats();

    // Set up polling as primary method (every 5 seconds)
    const pollingInterval = setInterval(() => {
      console.log('⏱️ Polling stats update...');
      fetchStats();
    }, 5000);

    // Set up real-time subscriptions for live updates
    const attendanceChannel = supabase
      .channel('super-admin-attendance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance' },
        () => {
          console.log('🔄 Attendance updated - refreshing stats');
          fetchStats();
        }
      )
      .subscribe();

    const registrationChannel = supabase
      .channel('super-admin-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations_config' },
        () => {
          console.log('🔄 Registration updated - refreshing stats');
          fetchStats();
        }
      )
      .subscribe();

    const eventChannel = supabase
      .channel('super-admin-events')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          console.log('🔄 Events updated - refreshing stats');
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollingInterval);
      supabase.removeChannel(attendanceChannel);
      supabase.removeChannel(registrationChannel);
      supabase.removeChannel(eventChannel);
    };
  }, [coordinatorEvents]);

  // Auto-refresh on location change or visibility change (silent refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Tab visible, refreshing super admin stats...');
        fetchStats();
      }
    };
    
    // Refresh when navigating back to this page
    console.log('🔄 Page navigation detected, refreshing super admin stats...');
    fetchStats();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname]);

  const fetchStats = async () => {
    try {
      console.log('📊 SuperAdmin Overview: Fetching stats...');
      if (!loading) setRefreshing(true);

      // Coordinator Filter
      const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;
      const allowedEventIds = hasCoordinatorFilter ? coordinatorEvents.map(e => (e.id || e.event_id)) : null;
      console.log('📊 Overview - coordinatorEvents:', coordinatorEvents);
      console.log('🔍 Overview - hasCoordinatorFilter:', hasCoordinatorFilter);
      console.log('🎯 Overview - allowedEventIds:', allowedEventIds);

      const applyFilter = (query, column = 'event_id') => {
        if (hasCoordinatorFilter && allowedEventIds) {
          return query.in(column, allowedEventIds);
        }
        return query;
      };

      // Fetch Total Registrations (PAID only)
      console.log('👥 Fetching total paid registrations...');
      let regQuery = supabase
        .from('event_registrations_config')
        .select('*', { count: 'exact', head: true })
        .in('payment_status', ['PAID', 'completed']);
      
      regQuery = applyFilter(regQuery);
      const { count: regCount, error: regError } = await regQuery;

      if (regError) {
        console.error('❌ Error fetching registrations:', regError);
      } else {
        console.log('✅ Total paid registrations:', regCount);
      }

      // Fetch Total Revenue - get registrations with payment
      console.log('💰 Fetching paid registrations...');
      let paidQuery = supabase
        .from('event_registrations_config')
        .select('payment_amount')
        .in('payment_status', ['PAID', 'completed']);
      
      paidQuery = applyFilter(paidQuery);
      const { data: paidRegistrations, error: paidError } = await paidQuery;

      if (paidError) {
        console.error('❌ Error fetching paid registrations:', paidError);
      } else {
        console.log('✅ Paid registrations count:', paidRegistrations?.length || 0);
      }

      // Calculate revenue direct from payment_amount
      let revenue = 0;
      if (paidRegistrations && paidRegistrations.length > 0) {
        revenue = paidRegistrations.reduce((sum, r) => sum + (Number(r.payment_amount) || 0), 0);
      }

      // Fetch Total Check-ins
      console.log('✓ Fetching check-ins...');
      let checkinQuery = supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });
        
      checkinQuery = applyFilter(checkinQuery);
      const { count: checkinCount, error: checkinError } = await checkinQuery;

      if (checkinError) {
        console.error('❌ Error fetching check-ins:', checkinError);
      } else {
        console.log('✅ Total check-ins:', checkinCount);
      }

      // Fetch Active Events
      console.log('📅 Fetching active events...');
      let activeQuery = supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true);
        
      activeQuery = applyFilter(activeQuery, 'id');
      const { count: activeEventCount, error: activeError } = await activeQuery;

      if (activeError) {
        console.error('❌ Error fetching active events:', activeError);
      } else {
        console.log('✅ Active events:', activeEventCount);
      }

      // Fetch Total Events
      console.log('📅 Fetching total events...');
      let totalQuery = supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
        
      totalQuery = applyFilter(totalQuery, 'id');
      const { count: totalEventCount, error: totalError } = await totalQuery;

      if (totalError) {
        console.error('❌ Error fetching total events:', totalError);
      } else {
        console.log('✅ Total events:', totalEventCount);
      }

      // Fetch Recent Registrations (PAID only, with proper FK reference)
      console.log('📋 Fetching recent paid registrations...');
      let recentQuery = supabase
        .from('event_registrations_config')
        .select('*')
        .eq('payment_status', 'PAID')
        .order('registered_at', { ascending: false })
        .limit(5);

      recentQuery = applyFilter(recentQuery);
      const { data: recent, error: recentError } = await recentQuery;

      // Fetch user profiles separately for recent registrations
      let recentWithProfiles = [];
      if (recent && recent.length > 0) {
        const userIds = [...new Set(recent.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        recentWithProfiles = recent.map(reg => ({
          ...reg,
          profiles: profileMap.get(reg.user_id) || { full_name: 'Unknown', email: '' }
        }));
      }

      if (recentError) {
        console.error('❌ Error fetching recent registrations:', recentError);
      } else {
        console.log('✅ Recent registrations fetched:', recentWithProfiles?.length || 0);
      }

      const finalStats = {
        totalRegistrations: regCount || 0,
        totalRevenue: revenue || 0,
        totalCheckins: checkinCount || 0,
        activeEvents: activeEventCount || 0,
        totalEvents: totalEventCount || 0,
        recentRegistrations: recentWithProfiles || []
      };

      console.log('📊 Final stats:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch events for report modal
  const fetchEventsForReport = async () => {
    setLoadingEvents(true);
    try {
      // Coordinator Filter
      const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;
      const allowedEventIds = hasCoordinatorFilter ? coordinatorEvents.map(e => e.id) : null;

      let query = supabase
        .from('events')
        .select('id, name, category')
        .order('name');

      if (hasCoordinatorFilter && allowedEventIds) {
        query = query.in('id', allowedEventIds);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch events: ' + error.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Open report modal
  const handleOpenReportModal = () => {
    setShowReportModal(true);
    fetchEventsForReport();
  };

  // Generate PDF for single event
  const downloadSingleEventReport = async (event) => {
    setDownloadingReport(true);
    try {
      // Fetch registrations for this event - use event.id (UUID) not event_id (text)
      const { data: registrations, error } = await supabase
        .from('event_registrations_config')
        .select('*')
        .eq('event_id', event.id)
        .eq('payment_status', 'PAID');

      console.log('Fetching registrations for event:', event.name, 'ID:', event.id, 'Result:', registrations);

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(registrations?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, mobile_number, college_name, department, roll_number')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Format data
      const tableData = registrations?.map((reg, index) => {
        const profile = profileMap.get(reg.user_id) || {};
        return {
          sno: index + 1,
          name: profile.full_name || reg.participant_name || 'N/A',
          email: profile.email || reg.participant_email || 'N/A',
          mobile: profile.mobile_number || 'N/A',
          college: profile.college_name || 'N/A',
          department: profile.department || 'N/A',
          rollNumber: profile.roll_number || 'N/A',
          signature: ''
        };
      }) || [];

      // Generate PDF using jsPDF
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Load logos as base64 with high quality - returns image with dimensions
      const loadImageAsBase64 = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            // Use higher resolution canvas for better quality
            const scale = 4; // Higher scale for sharper image
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            // Disable smoothing to preserve sharp edges for logos
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

      // Try to load logos
      const dakshaaLogoData = await loadImageAsBase64('/dakshaa_logo.png');
      const ksrctLogoData = await loadImageAsBase64('/ksrct_logo2.png');

      // Header vertical center baseline
      const headerY = 22;
      // Dakshaa logo (left)
      if (dakshaaLogoData) {
        const logoHeight = 30;
        const aspectRatio = dakshaaLogoData.width / dakshaaLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(dakshaaLogoData.data, 'PNG', 32, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      // KSRCT logo (right)
      if (ksrctLogoData) {
        const logoHeight = 14;
        const aspectRatio = ksrctLogoData.width / ksrctLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(ksrctLogoData.data, 'PNG', pageWidth - logoWidth - 32, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      // Header text block (centered)
      doc.setFontSize(18);
      doc.setTextColor(26, 54, 93);
      doc.setFont('helvetica', 'bold');
      doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 4, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(230, 126, 34);
      doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(197, 48, 48);
      doc.text(event.name, pageWidth / 2, headerY + 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Attendance Sheet', pageWidth / 2, headerY + 16, { align: 'center' });

      // Add table using autoTable function
      autoTable(doc, {
        startY: headerY + 22,
        head: [['S.No', 'Name', 'Roll Number', 'Department', 'College', 'Mobile', 'Signature']],
        body: tableData.map(row => [
          row.sno,
          row.name,
          row.rollNumber,
          row.department,
          row.college,
          row.mobile,
          ''
        ]),
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
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' },
          1: { cellWidth: 44 },
          2: { cellWidth: 38 },
          3: { cellWidth: 38 },
          4: { cellWidth: 60 },
          5: { cellWidth: 32 },
          6: { cellWidth: 32 },
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        styles: {
          overflow: 'linebreak',
        },
      });

      // Download the PDF
      doc.save(`${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance.pdf`);
      
      // Close report modal after download
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setDownloadingReport(false);
    }
  };

  // Download all events report as Excel with separate sheets
  const downloadAllEventsReport = async () => {
    setDownloadingReport(true);
    try {
      console.log('Starting Excel report generation...');
      console.log('Total events to process:', events.length);
      
      const wb = XLSX.utils.book_new();
      let hasData = false;
      let processedEvents = 0;

      for (const event of events) {
        console.log(`Processing event: ${event.name} (ID: ${event.id})`);
        
        // Fetch registrations for this event - use event.id (UUID) not event_id (text)
        const { data: registrations, error: regError } = await supabase
          .from('event_registrations_config')
          .select('*')
          .eq('event_id', event.id)
          .eq('payment_status', 'PAID');

        if (regError) {
          console.error(`Error fetching registrations for ${event.name}:`, regError);
          continue;
        }

        console.log(`Found ${registrations?.length || 0} paid registrations for ${event.name}`);

        if (!registrations || registrations.length === 0) continue;

        hasData = true;
        processedEvents++;

        // Fetch user profiles
        const userIds = [...new Set(registrations.map(r => r.user_id))];
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name, department, roll_number')
          .in('id', userIds);

        if (profileError) {
          console.error(`Error fetching profiles for ${event.name}:`, profileError);
        }

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Format data for Excel
        const excelData = registrations.map((reg, index) => {
          const profile = profileMap.get(reg.user_id) || {};
          return {
            'S.No': index + 1,
            'Name': profile.full_name || reg.participant_name || 'N/A',
            'Email': profile.email || reg.participant_email || 'N/A',
            'Mobile': profile.mobile_number || 'N/A',
            'College': profile.college_name || 'N/A',
            'Department': profile.department || 'N/A',
            'Roll Number': profile.roll_number || 'N/A',
            'Registration Type': reg.registration_type || 'individual',
            'Team Name': reg.team_name || '-',
            'Payment Status': reg.payment_status || 'PAID',
            'Payment Amount': reg.payment_amount || 0,
            'Registered At': reg.registered_at ? new Date(reg.registered_at).toLocaleString() : 'N/A'
          };
        });

        // Create worksheet with event name (max 31 chars for Excel sheet name)
        // Remove invalid characters: : \ / ? * [ ]
        const sheetName = event.name.substring(0, 31).replace(/[:\\\/\*\?\[\]]/g, '');
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
          { wch: 15 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        console.log(`Added sheet for ${event.name}`);
      }

      console.log(`Processed ${processedEvents} events with data`);

      if (!hasData) {
        alert('No paid registrations found for any event. Only paid registrations are included in reports.');
        return;
      }

      // Download
      const filename = `All_Events_Paid_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('Downloading file:', filename);
      XLSX.writeFile(wb, filename);
      
      alert(`Report downloaded successfully! Includes ${processedEvents} events with paid registrations.`);
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating all events report:', error);
      alert('Failed to generate report: ' + (error.message || 'Unknown error'));
    } finally {
      setDownloadingReport(false);
    }
  };

  const statCards = [
    {
      label: 'Paid Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      trend: '+12%',
      isUp: true
    },
    // Only show Revenue if NOT hiding financials
    ...(!hideFinancials ? [{
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      trend: '+8%',
      isUp: true
    }] : []),
    {
      label: 'Live Check-ins',
      value: stats.totalCheckins,
      icon: CheckCircle,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      trend: 'Live',
      isUp: true
    },
    {
      label: 'Active Events',
      value: stats.activeEvents,
      icon: Calendar,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      trend: `${stats.totalEvents} total`,
      isUp: true
    },
  ];

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">{hasCoordinatorFilter ? "Event Coordinator Dashboard" : "System Overview"}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400">{hasCoordinatorFilter ? "Real-time updates for assigned events" : "Real-time analytics and system status"}</p>
            {!hasCoordinatorFilter && (
              <span className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Updates Active
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Open All Events Button - Epic Design - Only show if not all events are open and NOT hiding financials */}
          <AnimatePresence>
            {!allEventsOpen && !hideFinancials && (
              <motion.button
                onClick={startCountdown}
                disabled={openingEvents}
                className="group relative overflow-hidden px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 animate-gradient-x" />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>
                
                {/* Border Glow */}
                <div className="absolute inset-0 rounded-xl border-2 border-white/20 group-hover:border-white/40 transition-colors" />
                
                {/* Content */}
                <div className="relative flex items-center gap-3 text-white">
                  {openingEvents ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <motion.span
                      className="text-xl"
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    >
                      🚀
                    </motion.span>
                  )}
                  <span className="text-sm font-bold tracking-wide uppercase">
                    {openingEvents ? 'Opening...' : 'Launch Events'}
                  </span>
                  <motion.div
                    className="flex gap-0.5"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <span className="text-white/60">›</span>
                    <span className="text-white/80">›</span>
                    <span className="text-white">›</span>
                  </motion.div>
                </div>
                
                {/* Particle Effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100"
                      style={{ left: `${20 + i * 15}%`, bottom: '0' }}
                      animate={{
                        y: [0, -40, -60],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.15,
                      }}
                    />
                  ))}
                </div>
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Events Already Open Badge - Hide for Coordinator */}
          <AnimatePresence>
            {allEventsOpen && (!coordinatorEvents || coordinatorEvents.length === 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400 font-bold">All Events Live!</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!hasCoordinatorFilter && (
            <button
              onClick={() => fetchStats()}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-lg text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          )}
          {refreshing && <Loader2 className="w-4 h-4 animate-spin text-secondary" />}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-secondary/50 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.isUp ? 'text-green-400' : 'text-gray-400'}`}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={14} /> : null}
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Recent Paid Registrations</h3>
            <button className="text-secondary text-sm font-bold hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {stats.recentRegistrations.map((reg, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center font-bold">
                    {reg.profiles?.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{reg.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{reg.event_name || 'Event Registration'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-gray-400">
                    {new Date(reg.registered_at || reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${reg.payment_status?.toUpperCase() === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                    {reg.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {!hideFinancials && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-secondary/20 to-primary/20 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={handleOpenReportModal}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              >
                <FileSpreadsheet size={18} /> Generate Report
              </button>
              <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                <Users size={18} /> Export User List
              </button>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Database</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Auth Service</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Storage</span>
                <span className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Operational
                </span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Report Generation Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold">Generate Report</h2>
                  <p className="text-sm text-gray-400 mt-1">Select an event to download its registration report</p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Download All Events Button */}
                    <button
                      onClick={downloadAllEventsReport}
                      disabled={downloadingReport || events.length === 0}
                      className="w-full p-4 bg-gradient-to-r from-secondary/20 to-primary/20 hover:from-secondary/30 hover:to-primary/30 border border-secondary/30 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                          <FileSpreadsheet className="text-secondary" size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">All Events</p>
                          <p className="text-xs text-gray-400">Download all events in separate sheets</p>
                        </div>
                      </div>
                      {downloadingReport ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Download size={20} className="text-gray-400 group-hover:text-secondary transition-colors" />
                      )}
                    </button>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 bg-slate-900 text-sm text-gray-400">or select individual event (PDF)</span>
                      </div>
                    </div>

                    {/* Individual Events */}
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => downloadSingleEventReport(event)}
                        disabled={downloadingReport}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <FileText className="text-red-400" size={20} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{event.name}</p>
                            <p className="text-xs text-gray-500">{event.category} • Attendance Sheet</p>
                          </div>
                        </div>
                        <Download size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                      </button>
                    ))}

                    {events.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                        <p>No events found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Overlay */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
          >
            {/* Animated Stars/Particles Background */}
            <div className="absolute inset-0">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Animated Grid Background */}
            <motion.div 
              className="absolute inset-0 opacity-30"
              animate={{ 
                backgroundPosition: ['0px 0px', '50px 50px'],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: `
                  linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
              }}
            />

            {/* Cyber Hexagon Pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                    <polygon points="25,0 50,14.4 50,38.4 25,52.8 0,38.4 0,14.4" fill="none" stroke="#22d3ee" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hexagons)"/>
              </svg>
            </div>

            {/* Multiple Expanding Pulse Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border-2 border-secondary"
                  initial={{ width: 100, height: 100, opacity: 0.8 }}
                  animate={{ 
                    width: [100, 800],
                    height: [100, 800],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.6,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>

            {/* Rotating Orbital Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full border border-secondary/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-secondary rounded-full shadow-[0_0_20px_#22d3ee]" />
              </motion.div>
              <motion.div
                className="absolute w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full border border-primary/40"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_15px_#0ea5e9]" />
              </motion.div>
              <motion.div
                className="absolute w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full border-2 border-dashed border-white/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
            </div>

            {/* Center Glow Effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.1) 40%, transparent 70%)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Countdown Number with Epic Animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                className="relative z-10"
                initial={{ 
                  scale: 3,
                  opacity: 0,
                  rotateX: -90,
                  filter: 'blur(20px)',
                }}
                animate={{ 
                  scale: 1,
                  opacity: 1,
                  rotateX: 0,
                  filter: 'blur(0px)',
                }}
                exit={{ 
                  scale: 0.5,
                  opacity: 0,
                  rotateX: 90,
                  filter: 'blur(20px)',
                  transition: { duration: 0.3 }
                }}
                transition={{ 
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                }}
              >
                {/* Glitch Effect Layers */}
                <motion.span
                  className="absolute inset-0 text-[180px] md:text-[280px] lg:text-[380px] font-black text-cyan-500/30 flex items-center justify-center"
                  animate={{
                    x: [0, -5, 5, -5, 0],
                    opacity: [0, 1, 0, 1, 0],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  {countdown}
                </motion.span>
                <motion.span
                  className="absolute inset-0 text-[180px] md:text-[280px] lg:text-[380px] font-black text-red-500/30 flex items-center justify-center"
                  animate={{
                    x: [0, 5, -5, 5, 0],
                    opacity: [0, 1, 0, 1, 0],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    repeatDelay: 2,
                    delay: 0.1,
                  }}
                >
                  {countdown}
                </motion.span>
                
                {/* Main Number */}
                <motion.span 
                  className="text-[180px] md:text-[280px] lg:text-[380px] font-black text-transparent bg-clip-text relative"
                  style={{
                    backgroundImage: 'linear-gradient(180deg, #22d3ee 0%, #ffffff 50%, #0ea5e9 100%)',
                    textShadow: '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                    WebkitTextStroke: '2px rgba(34,211,238,0.3)',
                  }}
                  animate={{
                    textShadow: [
                      '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                      '0 0 150px rgba(34,211,238,1), 0 0 300px rgba(34,211,238,0.6)',
                      '0 0 100px rgba(34,211,238,0.8), 0 0 200px rgba(34,211,238,0.4)',
                    ],
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {countdown}
                </motion.span>

                {/* Scanning Line Effect */}
                <motion.div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ mixBlendMode: 'overlay' }}
                >
                  <motion.div
                    className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-white to-transparent"
                    animate={{
                      top: ['-10%', '110%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Circular Progress Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] lg:w-[450px] lg:h-[450px] -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="rgba(34,211,238,0.2)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ 
                    strokeDashoffset: 2 * Math.PI * 45,
                  }}
                  transition={{ duration: 1, ease: "linear" }}
                  key={countdown}
                  style={{ filter: 'drop-shadow(0 0 10px #22d3ee)' }}
                />
              </svg>
            </div>

            {/* Corner Decorations */}
            <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-secondary/50" />
            <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-secondary/50" />
            <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-secondary/50" />
            <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-secondary/50" />

            {/* Top Status Bar */}
            <motion.div
              className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-4"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-full">
                <motion.div
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <span className="text-xs text-secondary font-mono uppercase tracking-wider">System Active</span>
              </div>
            </motion.div>

            {/* Bottom Text with Typewriter Effect */}
            <motion.div
              className="absolute bottom-16 md:bottom-20 text-center"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="flex items-center justify-center gap-3 mb-4"
              >
                {['E', 'V', 'E', 'N', 'T', 'S', ' ', 'O', 'P', 'E', 'N', 'I', 'N', 'G'].map((letter, i) => (
                  <motion.span
                    key={i}
                    className="text-2xl md:text-3xl font-bold text-secondary"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    style={{ textShadow: '0 0 20px rgba(34,211,238,0.8)' }}
                  >
                    {letter === ' ' ? '\u00A0' : letter}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                className="h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"
                initial={{ width: 0 }}
                animate={{ width: '300px' }}
                transition={{ delay: 1, duration: 0.5 }}
              />
            </motion.div>

            {/* Floating Tech Elements */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-secondary/30 font-mono text-xs"
                style={{
                  left: `${10 + (i % 3) * 40}%`,
                  top: `${20 + Math.floor(i / 3) * 60}%`,
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              >
                {['<INIT/>', '{READY}', '[SYNC]', '//LOAD', '#EVENT', '@LIVE'][i]}
              </motion.div>
            ))}

            {/* Close button */}
            <motion.button
              onClick={() => {
                setShowCountdown(false);
                setCountdown(10);
              }}
              className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white text-2xl transition-all hover:bg-white/10 rounded-full border border-white/20 hover:border-white/40 z-50"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Celebration Overlay */}
      <AnimatePresence>
        {showSuccessCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
            style={{ background: 'radial-gradient(ellipse at center, rgba(0,50,0,0.95) 0%, rgba(0,0,0,0.98) 100%)' }}
          >
            {/* Firework Particles */}
            {[...Array(100)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: Math.random() * 8 + 4,
                  height: Math.random() * 8 + 4,
                  background: ['#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][Math.floor(Math.random() * 6)],
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * window.innerWidth,
                  y: (Math.random() - 0.5) * window.innerHeight,
                  opacity: [1, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* Confetti Rain */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={`confetti-${i}`}
                className="absolute"
                style={{
                  width: Math.random() * 15 + 8,
                  height: Math.random() * 15 + 8,
                  background: ['#22d3ee', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                  left: `${Math.random() * 100}%`,
                  top: '-5%',
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                }}
                animate={{
                  y: window.innerHeight + 100,
                  x: (Math.random() - 0.5) * 200,
                  rotate: Math.random() * 720,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeIn",
                }}
              />
            ))}

            {/* Expanding Rings */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute rounded-full border-4 border-green-500"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{
                  width: [0, 1000],
                  height: [0, 1000],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  ease: "easeOut",
                  repeat: 1,
                }}
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              />
            ))}

            {/* Main Success Content */}
            <motion.div
              className="relative z-10 text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            >
              {/* Big Checkmark */}
              <motion.div
                className="w-40 h-40 md:w-56 md:h-56 mx-auto mb-8 relative"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-500/20"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full bg-green-500/30"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.3, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.6)]">
                  <motion.svg
                    className="w-20 h-20 md:w-28 md:h-28 text-white"
                    viewBox="0 0 24 24"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    />
                  </motion.svg>
                </div>
              </motion.div>

              {/* Success Text */}
              <motion.h1
                className="text-5xl md:text-7xl font-black mb-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                style={{
                  background: 'linear-gradient(135deg, #22d3ee 0%, #10b981 50%, #34d399 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 60px rgba(16,185,129,0.5)',
                }}
              >
                🎉 EVENTS LIVE! 🎉
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-green-300 font-bold mb-2"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                All registrations are now open!
              </motion.p>

              <motion.p
                className="text-gray-400 text-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                Students can now register for events
              </motion.p>

              {/* Animated Stats */}
              <motion.div
                className="flex justify-center gap-8 mt-8"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.6 }}
              >
                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold text-green-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1.8 }}
                  >
                    {stats.totalEvents}
                  </motion.div>
                  <div className="text-sm text-gray-500">Events Opened</div>
                </div>
                <div className="text-center">
                  <motion.div
                    className="text-4xl font-bold text-cyan-400"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 2 }}
                  >
                    ✓
                  </motion.div>
                  <div className="text-sm text-gray-500">Status: Live</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Sparkle Effects */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              >
                ✨
              </motion.div>
            ))}

            {/* Close Button */}
            <motion.button
              onClick={() => setShowSuccessCelebration(false)}
              className="absolute top-8 right-8 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl text-white font-bold transition-all z-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Overview;
