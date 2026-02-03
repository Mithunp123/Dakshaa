import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import {
  Users,
  Filter,
  Search,
  Plus,
  ArrowRightLeft,
  TrendingUp,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  ChevronRight,
  Package,
  Phone,
  ArrowRight,
  Download
} from "lucide-react";
import { supabase } from "../../../supabase";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventDetailsWithTeams from '../../../Components/Registration/EventDetailsWithTeams';
import logo1 from '../../../assets/logo1.webp';
import ksrctLogo from '../../../assets/ksrct.webp';

const RegistrationManagement = ({ coordinatorEvents, hideFinancials = false }) => {
  const location = useLocation();
  const [eventStats, setEventStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [downloadingOverallReport, setDownloadingOverallReport] = useState(false);
  
  // New states for registration counts
  const [registrationCounts, setRegistrationCounts] = useState({
    individual: 0,
    team: 0,
    teamLeader: 0,
    teamMember: 0
  });

  // Transfer Logic States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSearch, setTransferSearch] = useState('');
  const [transferUser, setTransferUser] = useState(null);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [selectedSourceReg, setSelectedSourceReg] = useState(null);
  const [availableTargetEvents, setAvailableTargetEvents] = useState([]);
  const [selectedTargetEvent, setSelectedTargetEvent] = useState(null);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  const refreshData = () => {
    console.log('🔄 Refreshing Registration Data...');
    loadEventStats();
    loadRegistrationCounts();
    if (selectedEvent) {
      loadEventRegistrations(selectedEvent.id);
    }
  };

  // Auto-refresh on navigation or visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    refreshData();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, coordinatorEvents]);

  useEffect(() => {
    loadEventStats();
    loadRegistrationCounts();

    // Set up real-time subscription for registration changes
    const registrationChannel = supabase
      .channel('registration-management')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          console.log('Registration updated, refreshing stats');
          loadEventStats();
          loadRegistrationCounts();
          if (selectedEvent) {
            loadEventRegistrations(selectedEvent.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(registrationChannel);
    };
  }, [selectedEvent]);

  const handleTransferClose = () => {
    setShowTransferModal(false);
    setTransferSearch('');
    setTransferUser(null);
    setUserRegistrations([]);
    setSelectedSourceReg(null);
    setAvailableTargetEvents([]);
    setSelectedTargetEvent(null);
    setTransferError('');
    setTransferSuccess('');
  };

  const handleUserSearch = async () => {
    if (!transferSearch) return;
    setTransferLoading(true);
    setTransferError('');
    setTransferUser(null);
    setUserRegistrations([]);
    
    try {
      // 1. Find user by phone OR email
      // We use ilike for loose matching, checking both fields
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .or(`mobile_number.ilike.%${transferSearch.trim()}%,email.ilike.%${transferSearch.trim()}%`)
        .limit(1)
        .single();
      
      if (userError || !userData) {
        setTransferError('User not found. Try entering exact Phone or Email.');
        setTransferLoading(false);
        return;
      }

      setTransferUser(userData);

      // 2. Find user's registrations 
      // Strategy: Check BOTH 'event_registrations_config' (New System) and 'registrations' (Old System)
      let allRegistrations = [];
      const paymentStatuses = ['PAID', 'paid', 'completed', 'COMPLETED', 'verified', 'VERIFIED'];
      
      // A. Check New System (event_registrations_config)
      const { data: newRegs, error: newRegError } = await supabase
        .from('event_registrations_config')
        .select(`
          *,
          events (
             id,
             name,
             price,
             event_key
          )
        `)
        .eq('user_id', userData.id)
        .in('payment_status', paymentStatuses);

      if (!newRegError && newRegs) {
        // Tag them
        const taggedNew = newRegs.map(r => ({ ...r, sourceTable: 'event_registrations_config', tableId: 'new' }));
        allRegistrations = [...allRegistrations, ...taggedNew];
      }

      // B. Check Old System (registrations)
      const { data: oldRegs, error: oldRegError } = await supabase
        .from('registrations')
        .select(`
          *,
          events (
            event_id,
            name,
            price,
            event_key
          )
        `)
        .eq('user_id', userData.id)
        .in('payment_status', paymentStatuses);

       if (!oldRegError && oldRegs) {
         // Tag them
         const taggedOld = oldRegs.map(r => ({ ...r, sourceTable: 'registrations', tableId: 'old' }));
         allRegistrations = [...allRegistrations, ...taggedOld];
       }

      if (allRegistrations.length === 0) {
         console.warn("No regs found. Errors:", newRegError, oldRegError);
         setTransferError('No paid registrations found for this user');
      } else {
        // De-duplicate if necessary (based on event_id or something) - usually not needed if migration didn't duplicate
        setUserRegistrations(allRegistrations);
      }

    } catch (err) {
      console.error(err);
      setTransferError('An error occurred during search');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleSelectSourceReg = (reg) => {
    setSelectedSourceReg(reg);
    setSelectedTargetEvent(null);
    
    // Logic: 
    // Target event must:
    // 1. Have SAME price (current fee == transfer event fee)
    // 2. NOT be the current event
    // 3. Be OPEN/Available
    
    // 'reg.events' might be array or object depending on relationship. 
    // Assuming object based on select.
    const currentPrice = reg.events?.price || 0;
    const currentEventKey = reg.events?.event_key; // Using event_key for comparison if used in 'events' table

    const compatibleEvents = eventStats.filter(ev => 
      ev.price === currentPrice && 
      ev.event_key !== currentEventKey && 
      ev.is_open
    );
    
    setAvailableTargetEvents(compatibleEvents);
  };

  // Generate PDF Report for selected event
  const generateRegistrationReport = async () => {
    if (!selectedEvent) return;

    setDownloadingReport(true);
    try {
      // Fetch detailed registrations for the selected event
      let registrations = [];
      
      // Check if it's a team event based on event name/category
      const teamEventKeywords = ['paper presentation', 'team', 'group', 'mct'];
      const eventName = selectedEvent?.name?.toLowerCase() || '';
      const isTeamEvent = teamEventKeywords.some(keyword => eventName.includes(keyword));

      if (isTeamEvent) {
        // For team events, first get PAID registrations to filter teams
        const { data: paidRegistrations, error: regError } = await supabase
          .from('event_registrations_config')
          .select('user_id')
          .eq('event_id', selectedEvent.id)
          .in('payment_status', ['PAID', 'completed']);

        if (regError) throw regError;

        const paidUserIds = paidRegistrations?.map(reg => reg.user_id) || [];
        
        // Fetch only teams where the leader has PAID status
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('event_id', selectedEvent.id)
          .in('leader_id', paidUserIds);

        if (teamError) throw teamError;

        // Get all team IDs and leader IDs
        const teamIds = teamData?.map(team => team.id) || [];
        const leaderIds = teamData?.map(team => team.leader_id).filter(Boolean) || [];
        
        // Fetch team members for all teams
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id, team_id')
          .in('team_id', teamIds);
        
        // Get all unique user IDs (leaders + members)
        const memberIds = teamMembers?.map(member => member.user_id) || [];
        const allUserIds = [...new Set([...leaderIds, ...memberIds])];

        // Fetch user profiles for all participants
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name, department, roll_number')
          .in('id', allUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const teamMemberMap = new Map();
        
        // Create team member mapping
        teamMembers?.forEach(member => {
          if (!teamMemberMap.has(member.team_id)) {
            teamMemberMap.set(member.team_id, []);
          }
          teamMemberMap.get(member.team_id).push(member.user_id);
        });

        // Convert team data to individual participant format
        registrations = [];
        teamData?.forEach((team, teamIndex) => {
          // Add team leader
          if (team.leader_id) {
            const leaderProfile = profileMap.get(team.leader_id);
            if (leaderProfile) {
              registrations.push({
                sno: registrations.length + 1,
                name: leaderProfile.full_name || 'N/A',
                email: leaderProfile.email || 'N/A',
                mobile: leaderProfile.mobile_number || 'N/A',
                college: leaderProfile.college_name || 'N/A',
                department: leaderProfile.department || 'N/A',
                rollNumber: leaderProfile.roll_number || 'N/A',
                teamName: team.team_name || `Team ${teamIndex + 1}`,
                role: 'Leader',
                signature: ''
              });
            }
          }
          
          // Add team members (excluding leader to avoid duplication)
          const teamMemberIds = teamMemberMap.get(team.id) || [];
          teamMemberIds.forEach(memberId => {
            if (memberId !== team.leader_id) { // Don't duplicate leader
              const memberProfile = profileMap.get(memberId);
              if (memberProfile) {
                registrations.push({
                  sno: registrations.length + 1,
                  name: memberProfile.full_name || 'N/A',
                  email: memberProfile.email || 'N/A',
                  mobile: memberProfile.mobile_number || 'N/A',
                  college: memberProfile.college_name || 'N/A',
                  department: memberProfile.department || 'N/A',
                  rollNumber: memberProfile.roll_number || 'N/A',
                  teamName: team.team_name || `Team ${teamIndex + 1}`,
                  role: 'Member',
                  signature: ''
                });
              }
            }
          });
        });
      } else {
        // For individual events, fetch individual registrations
        const { data: individualRegs, error: regError } = await supabase
          .from('event_registrations_config')
          .select(`
            *,
            profiles(
              full_name, email, mobile_number, college_name, department, roll_number
            )
          `)
          .eq('event_id', selectedEvent.id)
          .eq('payment_status', 'PAID');

        if (regError) throw regError;

        registrations = individualRegs?.map((reg, index) => ({
          sno: index + 1,
          name: reg.profiles?.full_name || reg.participant_name || 'N/A',
          email: reg.profiles?.email || reg.participant_email || 'N/A',
          mobile: reg.profiles?.mobile_number || 'N/A',
          college: reg.profiles?.college_name || 'N/A',
          department: reg.profiles?.department || 'N/A',
          rollNumber: reg.profiles?.roll_number || 'N/A',
          teamName: '',
          role: 'Individual',
          signature: ''
        })) || [];
      }

      // Generate PDF using jsPDF
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Load logos as base64 with high quality
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

      // Load logos
      const dakshaaLogoData = await loadImageAsBase64(logo1);
      const ksrctLogoData = await loadImageAsBase64(ksrctLogo);

      // Header vertical center baseline
      const headerY = 22;
      
      // KSRCT logo (left)
      if (ksrctLogoData) {
        const logoHeight = 30;
        const aspectRatio = ksrctLogoData.width / ksrctLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(ksrctLogoData.data, 'PNG', 32, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      
      // Dakshaa logo (right)
      if (dakshaaLogoData) {
        const logoHeight = 30;
        const aspectRatio = dakshaaLogoData.width / dakshaaLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(dakshaaLogoData.data, 'PNG', pageWidth - logoWidth - 10, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
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
      doc.text(selectedEvent.name, pageWidth / 2, headerY + 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Registration Report - ${new Date().toLocaleDateString()}`, pageWidth / 2, headerY + 16, { align: 'center' });

      // Prepare table columns based on event type
      let columns, tableData;
      
      if (isTeamEvent) {
        columns = ['S.No', 'Name', 'Roll Number', 'Department', 'College', 'Team', 'Role', 'Mobile', 'Signature'];
        tableData = registrations.map(row => [
          row.sno,
          row.name,
          row.rollNumber,
          row.department,
          row.college,
          row.teamName,
          row.role,
          row.mobile,
          ''
        ]);
      } else {
        columns = ['S.No', 'Name', 'Roll Number', 'Department', 'College', 'Mobile', 'Signature'];
        tableData = registrations.map(row => [
          row.sno,
          row.name,
          row.rollNumber,
          row.department,
          row.college,
          row.mobile,
          ''
        ]);
      }

      // Add table using autoTable
      autoTable(doc, {
        startY: headerY + 22,
        head: [columns],
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
          valign: 'middle',
        },
        columnStyles: isTeamEvent ? {
          0: { cellWidth: 16, halign: 'center' }, // S.No
          1: { cellWidth: 40 }, // Name
          2: { cellWidth: 32 }, // Roll Number
          3: { cellWidth: 32 }, // Department
          4: { cellWidth: 50 }, // College
          5: { cellWidth: 32 }, // Team
          6: { cellWidth: 20, halign: 'center' }, // Role
          7: { cellWidth: 28 }, // Mobile
          8: { cellWidth: 32 }, // Signature
        } : {
          0: { cellWidth: 16, halign: 'center' }, // S.No
          1: { cellWidth: 44 }, // Name
          2: { cellWidth: 38 }, // Roll Number
          3: { cellWidth: 38 }, // Department
          4: { cellWidth: 60 }, // College
          5: { cellWidth: 32 }, // Mobile
          6: { cellWidth: 32 }, // Signature
        },
        margin: { left: 14, right: 14 },
        tableWidth: 'auto',
        styles: {
          overflow: 'linebreak',
        },
      });

      // Download the PDF
      const fileName = `${selectedEvent.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Report.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setDownloadingReport(false);
    }
  };

  // Generate Overall Report for All Assigned Events
  const generateOverallReport = async () => {
    if (eventStats.length === 0) {
      alert('No events available to generate report');
      return;
    }

    setDownloadingOverallReport(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Load logos as base64 with high quality
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

      // Load logos
      const dakshaaLogoData = await loadImageAsBase64(logo1);
      const ksrctLogoData = await loadImageAsBase64(ksrctLogo);

      // Header vertical center baseline
      const headerY = 22;
      
      // KSRCT logo (left)
      if (ksrctLogoData) {
        const logoHeight = 30;
        const aspectRatio = ksrctLogoData.width / ksrctLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(ksrctLogoData.data, 'PNG', 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      
      // Dakshaa logo (right)
      if (dakshaaLogoData) {
        const logoHeight = 30;
        const aspectRatio = dakshaaLogoData.width / dakshaaLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(dakshaaLogoData.data, 'PNG', pageWidth - logoWidth - 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      
      // Header text block (centered)
      doc.setFontSize(20);
      doc.setTextColor(26, 54, 93);
      doc.setFont('helvetica', 'bold');
      doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 5, { align: 'center' });
      doc.setFontSize(12);
      doc.setTextColor(230, 126, 34);
      doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
      doc.setFontSize(16);
      doc.setTextColor(197, 48, 48);
      doc.setFont('helvetica', 'bold');
      doc.text('Dakshaa 2025 - Overall Registration Report', pageWidth / 2, headerY + 11, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, headerY + 18, { align: 'center' });

      // Summary Statistics Section
      const summaryY = headerY + 28;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary Statistics', 14, summaryY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Events: ${eventStats.length}`, 14, summaryY + 7);
      doc.text(`Total Registrations: ${totalRegistrations}`, 14, summaryY + 13);
      doc.text(`Individual Registrations: ${registrationCounts.individual}`, 90, summaryY + 7);
      doc.text(`Total Teams: ${registrationCounts.team}`, 90, summaryY + 13);
      doc.text(`Team Leaders: ${registrationCounts.teamLeader}`, 170, summaryY + 7);
      doc.text(`Team Members: ${registrationCounts.teamMember}`, 170, summaryY + 13);

      // Event-wise Registration Table
      const tableStartY = summaryY + 22;
      
      // Prepare table data
      const columns = [
        { header: 'S.No', dataKey: 'sno' },
        { header: 'Event Name', dataKey: 'eventName' },
        { header: 'Category', dataKey: 'category' },
        { header: 'Registrations', dataKey: 'registrations' },
        { header: 'Capacity', dataKey: 'capacity' }
      ];

      const tableData = eventStats.map((event, index) => ({
        sno: index + 1,
        eventName: event.name || 'N/A',
        category: event.category || 'N/A',
        registrations: event.totalRegistrations || 0,
        capacity: event.capacity || 0
      }));

      // Generate table
      autoTable(doc, {
        columns: columns,
        body: tableData,
        startY: tableStartY,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'middle'
        },
        headStyles: {
          fillColor: [26, 54, 93],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 120 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40, halign: 'center' },
          4: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer on every page
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(
            `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
          doc.text('Generated by Dakshaa Admin Portal', 14, pageHeight - 10);
          doc.text(
            `© ${new Date().getFullYear()} KSRCT`,
            pageWidth - 14,
            pageHeight - 10,
            { align: 'right' }
          );
        }
      });

      // Download the PDF
      const fileName = `Dakshaa_Overall_Registration_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating overall report:', error);
      alert('Failed to generate overall report: ' + error.message);
    } finally {
      setDownloadingOverallReport(false);
    }
  };

  const executeTransfer = async () => {
    if (!selectedSourceReg || !selectedTargetEvent) return;
    
    setTransferLoading(true);
    setTransferError('');

    try {
      // Get current admin user for logging
      const { data: { user: adminUser } } = await supabase.auth.getUser();

      // 1. Get current registration details
      const oldEventName = selectedSourceReg.events?.name || selectedSourceReg.event_name || 'Unknown';
      const userEmail = transferUser.email;

      // 2. Perform Transfer Update
      // Determine which table to update based on the source
      const tableToUpdate = selectedSourceReg.sourceTable || 'event_registrations_config'; // Default to new if unknown
      
      let updatePayload = {
          event_name: selectedTargetEvent.name
      };

      // Handle ID differences
      if (tableToUpdate === 'registrations') {
          // 'registrations' uses text event_id (event_key)
          updatePayload.event_id = selectedTargetEvent.event_key;
      } else {
          // 'event_registrations_config' uses UUID event_id (id)
          updatePayload.event_id = selectedTargetEvent.id;
      }

      const { error: updateError } = await supabase
        .from(tableToUpdate)
        .update(updatePayload)
        .eq('id', selectedSourceReg.id);

      if (updateError) throw updateError;
      
      // If updating 'registrations', we might want to also TRY updating 'event_registrations_config' just in case of sync,
      // but usually stick to the source is safer.

      // 4. Log Action
      if (adminUser) {
        try {
            await supabase.from('admin_logs').insert({
                admin_id: adminUser.id,
                action_type: 'transfer_registration',
                target_user_id: transferUser.id, 
                details: `Transferred from ${oldEventName} to ${selectedTargetEvent.name} for user ${userEmail}`
            });
        } catch (logError) {
            console.error('Failed to log admin action:', logError);
        }
      }

      setTransferSuccess(`Successfully transferred registration from "${oldEventName}" to "${selectedTargetEvent.name}"`);
      
      // Refresh
      await loadEventStats();
      
      setTimeout(() => {
        handleTransferClose();
      }, 2000);

    } catch (err) {
      console.error('Transfer failed:', err);
      setTransferError('Transfer failed. Please check logs.');
    } finally {
      setTransferLoading(false);
    }
  };

  const loadEventStats = async () => {
    setLoading(true);
    try {
      const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;
      // Extract both UUID id and TEXT event_id for flexible filtering
      const allowedUUIDs = hasCoordinatorFilter ? coordinatorEvents.map(e => e.id).filter(Boolean) : null;
      const allowedEventIds = hasCoordinatorFilter ? coordinatorEvents.map(e => e.event_id).filter(Boolean) : null;
      
      console.log('📊 RegistrationManagement - coordinatorEvents count:', coordinatorEvents?.length);
      console.log('📊 RegistrationManagement - coordinatorEvents:', coordinatorEvents?.map(e => ({ id: e.id, event_id: e.event_id, name: e.name })));
      console.log('🔍 RegistrationManagement - hasCoordinatorFilter:', hasCoordinatorFilter);
      console.log('🎯 RegistrationManagement - allowedUUIDs:', allowedUUIDs);
      console.log('🎯 RegistrationManagement - allowedEventIds (TEXT):', allowedEventIds);

      let query = supabase
        .from('events')
        .select(`
          id,
          name,
          event_id,
          event_key,
          category,
          capacity,
          price,
          is_open
        `)
        .order('name');
        
      if (hasCoordinatorFilter && allowedUUIDs && allowedUUIDs.length > 0) {
        // Use the UUID id field for filtering (coordinator events have full data including UUID)
        query = query.in('id', allowedUUIDs);
        console.log('🔍 Filtering events by UUID ids:', allowedUUIDs.length);
      }

      const { data, error } = await query;

      console.log('📊 Events query result:', data?.length, 'events found');

      if (error) throw error;

      // Get registration counts for each event
      const statsPromises = data.map(async (event) => {
        const { count, error: countError } = await supabase
          .from('event_registrations_config')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('payment_status', 'PAID');

        return {
          ...event,
          totalRegistrations: count || 0,
          fillRate: event.capacity > 0 ? ((count || 0) / event.capacity * 100).toFixed(1) : 0
        };
      });

      const eventStatsData = await Promise.all(statsPromises);
      setEventStats(eventStatsData);
    } catch (error) {
      console.error('Error loading event stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationCounts = async () => {
    try {
      console.log('📊 Loading registration counts...');
      const hasCoordinatorFilter = coordinatorEvents && coordinatorEvents.length > 0;
      const allowedEventIds = hasCoordinatorFilter ? coordinatorEvents.map(e => (e.id || e.event_id)) : null;
      console.log('📊 Registration Counts - Coordinator Filter:', hasCoordinatorFilter, 'Allowed Event IDs:', allowedEventIds);
      
      // 1. Count individual PAID registrations
      let individualQuery = supabase
        .from('event_registrations_config')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'PAID');

      if (hasCoordinatorFilter && allowedEventIds) {
        individualQuery = individualQuery.in('event_id', allowedEventIds);
      }
      
      const { count: individualCount, error: individualError } = await individualQuery;

      if (individualError) {
        console.error('❌ Error loading individual registrations:', individualError);
      } else {
        console.log('✅ Individual PAID registrations:', individualCount);
      }

      // 2. Count total active teams
      let teamQuery = supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (hasCoordinatorFilter && allowedEventIds) {
        teamQuery = teamQuery.in('event_id', allowedEventIds);
      }
        
      const { count: teamCount, error: teamError } = await teamQuery;

      if (teamError) {
        console.error('❌ Error loading teams:', teamError);
      } else {
        console.log('✅ Total active teams:', teamCount);
      }

      // Fetch team IDs if filtered, to filter members
      let allowedTeamIds = null;
      if (hasCoordinatorFilter && allowedEventIds) {
          const { data: teamsData } = await supabase.from('teams').select('id').in('event_id', allowedEventIds);
          if (teamsData) allowedTeamIds = teamsData.map(t => t.id);
      }

      // 3. Count team leaders (teams with leader_id are active teams)
      let leaderQuery = supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .not('leader_id', 'is', null)
        .eq('is_active', true);

      if (hasCoordinatorFilter && allowedEventIds) {
          leaderQuery = leaderQuery.in('event_id', allowedEventIds);
      }
        
      const { count: teamLeaderCount, error: leaderError } = await leaderQuery;

      if (leaderError) {
        console.error('❌ Error loading team leaders:', leaderError);
      } else {
        console.log('✅ Team leaders:', teamLeaderCount);
      }

      // 4. Count team members (role='member' in team_members)
      let memberQuery = supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .in('status', ['joined', 'active']);

      if (allowedTeamIds) {
          memberQuery = memberQuery.in('team_id', allowedTeamIds);
      }
        
      const { count: teamMemberCount, error: memberError } = await memberQuery;

      if (memberError) {
        console.error('❌ Error loading team members:', memberError);
      } else {
        console.log('✅ Team members:', teamMemberCount);
      }

      const counts = {
        individual: individualCount || 0,
        team: teamCount || 0,
        teamLeader: teamLeaderCount || 0,
        teamMember: teamMemberCount || 0
      };

      console.log('📊 Final registration counts:', counts);
      setRegistrationCounts(counts);
    } catch (error) {
      console.error('❌ Error loading registration counts:', error);
    }
  };

  const loadEventRegistrations = async (eventId) => {
    setLoadingDetails(true);
    try {
      // 1. Fetch registrations
      const { data: regs, error: regsError } = await supabase
        .from('event_registrations_config')
        .select('*')
        .eq('event_id', eventId)
        .eq('payment_status', 'PAID')
        .order('registered_at', { ascending: false });

      if (regsError) throw regsError;

      if (!regs || regs.length === 0) {
        setEventRegistrations([]);
        setLoadingDetails(false);
        return;
      }

      // 2. Fetch profiles manualy to avoid join errors on missing columns
      const userIds = [...new Set(regs.map(r => r.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, mobile_number, college_name, department, roll_number')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles.map(p => [p.id, p]));

      // 3. Combine data
      const combined = regs.map(r => {
        const profile = profileMap.get(r.user_id) || {};
        return {
          ...r,
          profiles: {
            full_name: profile.full_name || 'Unknown',
            email: profile.email || 'N/A',
            phone: profile.mobile_number || 'N/A',
            college_name: profile.college_name || 'N/A',
            department: profile.department || 'N/A',
            roll_no: profile.roll_number || 'N/A'
          }
        };
      });

      setEventRegistrations(combined);
    } catch (error) {
      console.error('Error loading event registrations:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!eventRegistrations || eventRegistrations.length === 0) {
        alert("No data to download");
        return;
    }

    const dataToExport = eventRegistrations.map(reg => ({
        "Name": reg.profiles.full_name,
        "Roll Number": reg.profiles.roll_no,
        "College": reg.profiles.college_name,
        "Department": reg.profiles.department,
        "Email": reg.profiles.email,
        "Phone": reg.profiles.phone,
        "Payment Status": reg.payment_status,
        "Registered At": new Date(reg.registered_at).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");

    // Generate filename
    const eventName = selectedEvent?.name || "Event";
    const fileName = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_participants.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    await loadEventRegistrations(event.id);
  };

  const handleBackToList = () => {
    setSelectedEvent(null);
    setEventRegistrations([]);
  };

  const filteredStats = eventStats.filter(event => {
    const matchesSearch = event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.event_key || event.event_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(eventStats.map(e => e.category))];
  const totalRegistrations = eventStats.reduce((sum, e) => sum + e.totalRegistrations, 0);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-secondary" />
      </div>
    );
  }

  // Event List View
  if (!selectedEvent) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">Registration Management</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-400">Event-wise registration overview</p>
              <span className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-xs text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Overall Report Button */}
            <button
              onClick={generateOverallReport}
              disabled={downloadingOverallReport || eventStats.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingOverallReport ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Download size={20} />
              )}
              <span className="font-medium">
                {downloadingOverallReport ? 'Generating...' : 'Overall Report'}
              </span>
            </button>
            
            {!hideFinancials && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors shadow-lg shadow-secondary/20"
              >
                <ArrowRightLeft size={20} />
                Transfer Event
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Package className="text-blue-400" size={28} />
              <div className="text-3xl font-bold text-blue-400">{eventStats.length}</div>
            </div>
            <p className="text-gray-400 text-sm">Total Events</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <Users className="text-green-400" size={28} />
              <div className="text-3xl font-bold text-green-400">{totalRegistrations}</div>
            </div>
            <p className="text-gray-400 text-sm">Total Registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-3xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="text-purple-400" size={28} />
              <div className="text-3xl font-bold text-purple-400">
                {eventStats.length > 0 ? (totalRegistrations / eventStats.length).toFixed(0) : 0}
              </div>
            </div>
            <p className="text-gray-400 text-sm">Avg per Event</p>
          </motion.div>
        </div>

        {/* Registration Type Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <UserPlus className="text-cyan-400" size={24} />
              <div className="text-2xl font-bold text-cyan-400">{registrationCounts.individual}</div>
            </div>
            <p className="text-gray-400 text-xs">Individual Registrations</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="text-orange-400" size={24} />
              <div className="text-2xl font-bold text-orange-400">{registrationCounts.team}</div>
            </div>
            <p className="text-gray-400 text-xs">Total Teams</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="text-yellow-400" size={24} />
              <div className="text-2xl font-bold text-yellow-400">{registrationCounts.teamLeader}</div>
            </div>
            <p className="text-gray-400 text-xs">Team Leaders</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="text-pink-400" size={24} />
              <div className="text-2xl font-bold text-pink-400">{registrationCounts.teamMember}</div>
            </div>
            <p className="text-gray-400 text-xs">Team Members</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-secondary"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-secondary"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Events Table */}
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-gray-400 font-medium">Event Name</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Category</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Registrations</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Capacity</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Fill Rate</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right p-4 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStats.map((event, index) => (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-bold">{event.name}</p>
                        <p className="text-xs text-gray-500">{event.event_key || event.event_id || '-'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold">
                        {event.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-lg font-bold text-green-400">{event.totalRegistrations}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-gray-400">{event.capacity}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold">{event.fillRate}%</span>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              event.fillRate >= 90 ? 'bg-red-500' :
                              event.fillRate >= 70 ? 'bg-orange-500' :
                              event.fillRate >= 50 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(event.fillRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {event.is_open ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold">
                          Open
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="flex items-center gap-2 ml-auto px-4 py-2 bg-secondary/20 text-secondary rounded-xl hover:bg-secondary/30 transition-colors">
                        View Details
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStats.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No events found</p>
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {!hideFinancials && showTransferModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-[#1a1f37] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ArrowRightLeft className="text-secondary" />
                  Transfer User Event
                </h3>
                <button 
                  onClick={handleTransferClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* 1. Find User */}
                <div className="space-y-4">
                  <label className="text-sm text-gray-400 uppercase font-bold">1. Find User (Phone or Email)</label>
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      <input
                        type="text"
                        placeholder="Enter phone or email..."
                        value={transferSearch}
                        onChange={(e) => setTransferSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-secondary"
                        onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                      />
                    </div>
                    <button
                      onClick={handleUserSearch}
                      disabled={transferLoading}
                      className="px-6 py-3 bg-secondary text-white rounded-xl font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50"
                    >
                      {transferLoading ? <Loader2 className="animate-spin" /> : 'Search'}
                    </button>
                  </div>
                  
                  {transferError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                      {transferError}
                    </div>
                  )}

                  {transferSuccess && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm flex items-center gap-2">
                       <CheckCircle2 size={16} />
                       {transferSuccess}
                    </div>
                  )}
                </div>

                {/* 2. User & Registrations */}
                {transferUser && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                   <div className="flex items-start justify-between bg-white/5 p-4 rounded-xl">
                      <div>
                        <h4 className="font-bold text-lg">{transferUser.full_name}</h4>
                        <p className="text-gray-400">{transferUser.college_name}</p>
                        <p className="text-sm text-gray-500 mt-1">{transferUser.email} • {transferUser.mobile_number}</p>
                      </div>
                      <div className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                        User Found
                      </div>
                   </div>

                   <label className="text-sm text-gray-400 uppercase font-bold block mt-4">2. Select Registration to Transfer</label>
                   {userRegistrations.length > 0 ? (
                     <div className="grid gap-3">
                       {userRegistrations.map(reg => (
                         <div 
                           key={reg.id}
                           onClick={() => handleSelectSourceReg(reg)}
                           className={`p-4 border rounded-xl cursor-pointer transition-all ${
                             selectedSourceReg?.id === reg.id 
                               ? 'bg-secondary/20 border-secondary' 
                               : 'bg-white/5 border-white/10 hover:border-white/30'
                           }`}
                         >
                           <div className="flex justify-between items-center">
                             <div>
                               <p className="font-bold">{reg.events?.name || 'Unknown Event'}</p>
                               <p className="text-sm text-gray-400">{reg.events?.event_key || 'N/A'}</p>
                             </div>
                             <div className="text-right">
                               <p className="font-bold text-lg">₹{reg.events?.price || 0}</p>
                               <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">PAID</span>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-gray-500 italic">No paid registrations found.</p>
                   )}
                  </div>
                )}

                {/* 3. Target Events */}
                {selectedSourceReg && (
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <label className="text-sm text-gray-400 uppercase font-bold block">
                        3. Select New Event (Same Fee: ₹{selectedSourceReg.events?.price})
                    </label>
                    
                    {availableTargetEvents.length > 0 ? (
                      <div className="grid gap-3 max-h-48 overflow-y-auto custom-scrollbar">
                        {availableTargetEvents.map(ev => (
                           <div 
                             key={ev.id}
                             onClick={() => setSelectedTargetEvent(ev)}
                             className={`p-4 border rounded-xl cursor-pointer transition-all flex justify-between items-center ${
                               selectedTargetEvent?.id === ev.id 
                                 ? 'bg-green-500/20 border-green-500' 
                                 : 'bg-white/5 border-white/10 hover:border-white/30'
                             }`}
                           >
                             <div>
                               <p className="font-bold text-white">{ev.name}</p>
                               <p className="text-xs text-gray-400">{ev.category} • Capacity: {ev.fillRate}% Full</p>
                             </div>
                             {selectedTargetEvent?.id === ev.id && <CheckCircle2 className="text-green-500" />}
                           </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-sm">
                        No other open events found with the same price (₹{selectedSourceReg.events?.price}).
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                <button
                  onClick={handleTransferClose}
                  className="px-6 py-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeTransfer}
                  disabled={!selectedTargetEvent || transferLoading}
                  className="px-6 py-2 bg-secondary text-white rounded-xl font-bold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {transferLoading ? <Loader2 className="animate-spin" size={18} /> : (
                     <>
                       Confirm Transfer <ArrowRight size={18} />
                     </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  // Event Details View
  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={handleBackToList}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronRight size={20} className="rotate-180" />
        Back to Events
      </button>

      {/* Event Header */}
      <div className="bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/20 rounded-3xl p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{selectedEvent.name}</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg font-bold">
                {selectedEvent.category}
              </span>
              <span className="text-gray-400">Event Key: {selectedEvent.event_key || selectedEvent.event_id || '-'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-4xl font-bold text-secondary">{selectedEvent.totalRegistrations}</p>
              <p className="text-gray-400">Total Registrations</p>
            </div>
            <button
              onClick={generateRegistrationReport}
              disabled={downloadingReport || selectedEvent.totalRegistrations === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary/20 to-primary/20 border border-secondary/30 rounded-xl hover:from-secondary/30 hover:to-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingReport ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Download size={16} />
              )}
              <span className="text-sm font-medium">
                {downloadingReport ? 'Generating...' : 'Download Report'}
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Capacity</p>
            <p className="text-2xl font-bold">{selectedEvent.capacity}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Fill Rate</p>
            <p className="text-2xl font-bold">{selectedEvent.fillRate}%</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Price</p>
            <p className="text-2xl font-bold">₹{selectedEvent.price}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
            <p className={`text-2xl font-bold ${selectedEvent.is_open ? 'text-green-400' : 'text-red-400'}`}>
              {selectedEvent.is_open ? 'Open' : 'Closed'}
            </p>
          </div>
        </div>
      </div>

      {/* Event Details with Teams Support */}
      <EventDetailsWithTeams 
        event={selectedEvent}
        registrations={eventRegistrations}
        showTeamDetails={true}
      />
    </div>
  );
};

export default RegistrationManagement;
