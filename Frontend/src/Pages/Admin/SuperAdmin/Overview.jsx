import React, { useState, useEffect } from 'react';
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

const Overview = () => {
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
  }, []);

  const fetchStats = async () => {
    try {
      console.log('📊 SuperAdmin Overview: Fetching stats...');
      if (!loading) setRefreshing(true);

      // Fetch Total Registrations
      console.log('👥 Fetching total registrations...');
      const { count: regCount, error: regError } = await supabase
        .from('event_registrations_config')
        .select('*', { count: 'exact', head: true });

      if (regError) {
        console.error('❌ Error fetching registrations:', regError);
      } else {
        console.log('✅ Total registrations:', regCount);
      }

      // Fetch Total Revenue - get registrations with payment
      console.log('💰 Fetching paid registrations...');
      const { data: paidRegistrations, error: paidError } = await supabase
        .from('event_registrations_config')
        .select('payment_amount')
        .eq('payment_status', 'PAID');

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
      const { count: checkinCount, error: checkinError } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true });

      if (checkinError) {
        console.error('❌ Error fetching check-ins:', checkinError);
      } else {
        console.log('✅ Total check-ins:', checkinCount);
      }

      // Fetch Active Events
      console.log('📅 Fetching active events...');
      const { count: activeEventCount, error: activeError } = await supabase
        .from('events_config')
        .select('*', { count: 'exact', head: true })
        .eq('is_open', true);

      if (activeError) {
        console.error('❌ Error fetching active events:', activeError);
      } else {
        console.log('✅ Active events:', activeEventCount);
      }

      // Fetch Total Events
      console.log('📅 Fetching total events...');
      const { count: totalEventCount, error: totalError } = await supabase
        .from('events_config')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('❌ Error fetching total events:', totalError);
      } else {
        console.log('✅ Total events:', totalEventCount);
      }

      // Fetch Recent Registrations (with proper FK reference)
      console.log('📋 Fetching recent registrations...');
      const { data: recent, error: recentError } = await supabase
        .from('event_registrations_config')
        .select('*')
        .order('registered_at', { ascending: false })
        .limit(5);

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
      const { data, error } = await supabase
        .from('events')
        .select('id, event_id, name, category')
        .order('name');

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
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
        .eq('event_id', event.id);

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
      const wb = XLSX.utils.book_new();
      let hasData = false;

      for (const event of events) {
        // Fetch registrations for this event - use event.id (UUID) not event_id (text)
        const { data: registrations } = await supabase
          .from('event_registrations_config')
          .select('*')
          .eq('event_id', event.id);

        if (!registrations || registrations.length === 0) continue;

        hasData = true;

        // Fetch user profiles
        const userIds = [...new Set(registrations.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name, department, roll_number')
          .in('id', userIds);

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
            'Payment Status': reg.payment_status || 'PENDING',
            'Payment Amount': reg.payment_amount || 0,
            'Registered At': reg.registered_at ? new Date(reg.registered_at).toLocaleString() : 'N/A'
          };
        });

        // Create worksheet with event name (max 31 chars for Excel sheet name)
        const sheetName = event.name.substring(0, 31).replace(/[\\/*?[\]]/g, '');
        const ws = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        ws['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 30 },
          { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
          { wch: 15 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      if (!hasData) {
        alert('No registration data found for any event');
        return;
      }

      // Download
      XLSX.writeFile(wb, `All_Events_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error generating all events report:', error);
      alert('Failed to generate report');
    } finally {
      setDownloadingReport(false);
    }
  };

  const statCards = [
    {
      label: 'Total Registrations',
      value: stats.totalRegistrations,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      trend: '+12%',
      isUp: true
    },
    {
      label: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      trend: '+8%',
      isUp: true
    },
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
          <h2 className="text-3xl font-bold">System Overview</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-400">Real-time analytics and system status</p>
            <span className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Updates Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats()}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/20 hover:bg-secondary/30 border border-secondary/50 rounded-lg text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
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
            <h3 className="text-xl font-bold">Recent Registrations</h3>
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
    </div>
  );
};

export default Overview;
