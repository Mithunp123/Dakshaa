import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  RefreshCw,
  Trophy,
  UserCheck,
  Calendar
} from 'lucide-react';
import { supabase } from '../../../supabase';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePageAuth } from '../../../hooks/usePageAuth';
import ksrctLogo from '../../../assets/ksrct.webp';
import dakshaaLogo from '../../../assets/logo.webp';

const TeamReport = () => {
  const { isLoading: authLoading } = usePageAuth('Super Admin Team Reports');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [individualRegistrations, setIndividualRegistrations] = useState([]);
  const [eventWiseStats, setEventWiseStats] = useState([]);
  const [loadingEventStats, setLoadingEventStats] = useState(false);
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalHeadcount: 0,
    individualCount: 0,
    grandTotal: 0,
    avgTeamSize: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchEventWiseStats();
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventData(selectedEvent.id);
    } else {
      setTeams([]);
      setIndividualRegistrations([]);
      setStats({ totalTeams: 0, totalHeadcount: 0, individualCount: 0, grandTotal: 0, avgTeamSize: 0 });
    }
  }, [selectedEvent]);

  const fetchAvailableCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .order('category');
      
      if (error) throw error;
      
      // Normalize category names to Title Case
      const normalizeCategoryName = (category) => {
        if (!category) return '';
        return category.toLowerCase().split(/[\s-]+/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      };
      
      // Get unique categories (case-insensitive)
      const categoryMap = new Map();
      data?.forEach(item => {
        if (item.category) {
          const lowerKey = item.category.toLowerCase();
          if (!categoryMap.has(lowerKey)) {
            categoryMap.set(lowerKey, normalizeCategoryName(item.category));
          }
        }
      });
      
      const uniqueCategories = Array.from(categoryMap.values()).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      );
      console.log('Available categories:', uniqueCategories);
      setAvailableCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('id, name, category')
        .order('name');
      
      if (selectedCategory !== 'all') {
        query = query.ilike('category', selectedCategory);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      console.log('Fetched events for category:', selectedCategory, 'Count:', data?.length || 0);
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchEventData = async (eventId) => {
    setLoading(true);
    try {
      // 1. Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_active', true);

      if (teamsError) throw teamsError;

      // 2. Fetch Individual Registrations (non-team participants)
      const { data: individualRegs, error: individualError } = await supabase
        .from('event_registrations_config')
        .select('*')
        .eq('event_id', eventId)
        .eq('payment_status', 'PAID');

      if (individualError) throw individualError;

      // 3. Process Teams if they exist
      const teamIds = teamsData?.map(t => t.id) || [];
      let enrichedTeams = [];
      let teamHeadcount = 0;

      if (teamsData && teamsData.length > 0 && teamIds.length > 0) {
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .in('team_id', teamIds);

        if (membersError) throw membersError;

        // Collect all unique User IDs (Leaders + Members)
        const userIds = new Set();
        
        teamsData.forEach(team => {
          if (team.leader_id) userIds.add(team.leader_id);
        });

        membersData.forEach(member => {
          if (member.user_id) userIds.add(member.user_id);
        });

        // Fetch Profiles for team members
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name, roll_number, department, year_of_study')
          .in('id', Array.from(userIds));

        if (profilesError) throw profilesError;

        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Construct enriched team objects
        enrichedTeams = teamsData.map(team => {
          const leaderProfile = profileMap.get(team.leader_id);
          const teamMembers = membersData.filter(m => m.team_id === team.id);
          
          // Map members to profiles
          const memberDetails = teamMembers.map(m => {
            const profile = profileMap.get(m.user_id);
            return {
              ...m,
              profile
            };
          });

          // Calculate headcount: ALWAYS use paid_members as the source of truth
          // paid_members is based on payment amount and doesn't change when members are added
          // This represents the actual paid headcount from the leader's payment
          let headCount = 0;
          
          if (team.paid_members && team.paid_members > 0) {
            // Use paid_members count - this is the authoritative count based on payment
            headCount = team.paid_members;
          } else if (teamMembers.length > 0) {
            // Fallback: count actual members if paid_members is not available
            const teamUserIds = new Set();
            if (team.leader_id) teamUserIds.add(team.leader_id);
            teamMembers.forEach(m => {
              if (m.user_id) teamUserIds.add(m.user_id);
            });
            headCount = teamUserIds.size;
          } else {
            // Last resort: just count leader if exists
            headCount = team.leader_id ? 1 : 0;
          }

          return {
            ...team,
            leaderProfile,
            members: memberDetails,
            headCount: headCount,
            hasMembersAdded: teamMembers.length > 0
          };
        });

        teamHeadcount = enrichedTeams.reduce((sum, team) => sum + team.headCount, 0);
      }

      // 4. Collect all user IDs that are part of teams (to exclude from individual count)
      const teamUserIdsSet = new Set();
      if (teamsData && teamsData.length > 0) {
        // Add all leaders
        teamsData.forEach(team => {
          if (team.leader_id) teamUserIdsSet.add(team.leader_id);
        });
        
        // Add all members if we have members data
        if (teamIds.length > 0) {
          const { data: allMembers } = await supabase
            .from('team_members')
            .select('user_id')
            .in('team_id', teamIds);
          
          allMembers?.forEach(member => {
            if (member.user_id) teamUserIdsSet.add(member.user_id);
          });
        }
      }

      // 5. Process Individual Registrations (EXCLUDING team members)
      let individualParticipants = [];
      if (individualRegs && individualRegs.length > 0) {
        // Filter out registrations that belong to team members
        const trulyIndividualRegs = individualRegs.filter(reg => !teamUserIdsSet.has(reg.user_id));
        
        if (trulyIndividualRegs.length > 0) {
          const userIds = [...new Set(trulyIndividualRegs.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, mobile_number, college_name, roll_number, department, year_of_study')
            .in('id', userIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

          individualParticipants = trulyIndividualRegs.map(reg => ({
            ...reg,
            profile: profileMap.get(reg.user_id)
          }));
        }
      }

      setTeams(enrichedTeams);
      setIndividualRegistrations(individualParticipants);

      // Calculate Stats
      const totalTeams = enrichedTeams.length;
      const individualCount = individualParticipants.length;
      const grandTotal = teamHeadcount + individualCount;
      const avgTeamSize = totalTeams > 0 ? (teamHeadcount / totalTeams).toFixed(1) : 0;

      setStats({
        totalTeams,
        totalHeadcount: teamHeadcount,
        individualCount,
        grandTotal,
        avgTeamSize
      });

    } catch (error) {
      console.error('Error fetching team data:', error);
      alert('Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventWiseStats = async () => {
    setLoadingEventStats(true);
    try {
      let query = supabase
        .from('events')
        .select('id, name, category')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (selectedCategory !== 'all') {
        query = query.ilike('category', selectedCategory);
      }

      const { data: allEvents, error: eventsError } = await query;
      if (eventsError) throw eventsError;

      if (!allEvents || allEvents.length === 0) {
        setEventWiseStats([]);
        setLoadingEventStats(false);
        return;
      }

      const eventStats = await Promise.all(
        allEvents.map(async (event) => {
          // Fetch teams for this event
          const { data: teamsData } = await supabase
            .from('teams')
            .select('id, paid_members, leader_id')
            .eq('event_id', event.id)
            .eq('is_active', true);

          // Fetch team members to get user IDs
          const teamIds = teamsData?.map(t => t.id) || [];
          const teamUserIds = new Set();
          
          // Add leaders to the set
          teamsData?.forEach(team => {
            if (team.leader_id) teamUserIds.add(team.leader_id);
          });
          
          if (teamIds.length > 0) {
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('user_id')
              .in('team_id', teamIds);

            teamMembers?.forEach(m => {
              if (m.user_id) teamUserIds.add(m.user_id);
            });
          }

          const teamHeadcount = teamsData?.reduce((sum, team) => {
            return sum + (team.paid_members || 0);
          }, 0) || 0;

          // Fetch individual registrations
          const { data: individualRegs } = await supabase
            .from('event_registrations_config')
            .select('user_id')
            .eq('event_id', event.id)
            .eq('payment_status', 'PAID');

          // Filter out team members from individual count
          const trulyIndividualCount = individualRegs?.filter(
            reg => !teamUserIds.has(reg.user_id)
          ).length || 0;

          return {
            eventId: event.id,
            eventName: event.name,
            category: event.category,
            teamCount: teamsData?.length || 0,
            teamHeadcount,
            individualCount: trulyIndividualCount,
            totalHeadcount: teamHeadcount + trulyIndividualCount
          };
        })
      );

      setEventWiseStats(eventStats);
    } catch (error) {
      console.error('Error fetching event-wise stats:', error);
    } finally {
      setLoadingEventStats(false);
    }
  };

  const downloadAllEventsExcel = async () => {
    if (eventWiseStats.length === 0) return;

    setLoading(true);
    try {
      const allData = [];

      // Fetch detailed data for each event
      for (const eventStat of eventWiseStats) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, team_name, leader_id, paid_members, created_at')
          .eq('event_id', eventStat.eventId)
          .eq('is_active', true);

        const teamIds = teamsData?.map(t => t.id) || [];
        let teamMembers = [];
        
        if (teamIds.length > 0) {
          const { data: membersData } = await supabase
            .from('team_members')
            .select('team_id, user_id')
            .in('team_id', teamIds);
          teamMembers = membersData || [];
        }

        // Get all user IDs
        const userIds = new Set();
        teamsData?.forEach(team => {
          if (team.leader_id) userIds.add(team.leader_id);
        });
        teamMembers.forEach(m => {
          if (m.user_id) userIds.add(m.user_id);
        });

        const { data: individualRegs } = await supabase
          .from('event_registrations_config')
          .select('user_id, registered_at')
          .eq('event_id', eventStat.eventId)
          .eq('payment_status', 'PAID');

        individualRegs?.forEach(reg => {
          if (reg.user_id) userIds.add(reg.user_id);
        });

        // Fetch all profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, mobile_number, college_name, roll_number, department, year_of_study')
          .in('id', Array.from(userIds));

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Add team data
        teamsData?.forEach(team => {
          const leaderProfile = profileMap.get(team.leader_id);
          if (leaderProfile) {
            allData.push({
              'Event Name': eventStat.eventName,
              'Category': eventStat.category,
              'Team Name': team.team_name,
              'Team ID': team.id,
              'Role': 'LEADER',
              'Name': leaderProfile.full_name,
              'Email': leaderProfile.email,
              'Mobile': leaderProfile.mobile_number,
              'College': leaderProfile.college_name,
              'Department': leaderProfile.department,
              'Roll Number': leaderProfile.roll_number,
              'Year': leaderProfile.year_of_study
            });
          }

          const members = teamMembers.filter(m => m.team_id === team.id);
          members.forEach(member => {
            if (member.user_id === team.leader_id) return;
            const profile = profileMap.get(member.user_id);
            if (profile) {
              allData.push({
                'Event Name': eventStat.eventName,
                'Category': eventStat.category,
                'Team Name': team.team_name,
                'Team ID': team.id,
                'Role': 'MEMBER',
                'Name': profile.full_name,
                'Email': profile.email,
                'Mobile': profile.mobile_number,
                'College': profile.college_name,
                'Department': profile.department,
                'Roll Number': profile.roll_number,
                'Year': profile.year_of_study
              });
            }
          });
        });

        // Add individual registrations
        const teamUserIds = new Set();
        teamsData?.forEach(team => {
          if (team.leader_id) teamUserIds.add(team.leader_id);
        });
        teamMembers.forEach(m => {
          if (m.user_id) teamUserIds.add(m.user_id);
        });

        individualRegs?.forEach(reg => {
          if (!teamUserIds.has(reg.user_id)) {
            const profile = profileMap.get(reg.user_id);
            if (profile) {
              allData.push({
                'Event Name': eventStat.eventName,
                'Category': eventStat.category,
                'Team Name': 'INDIVIDUAL',
                'Team ID': '-',
                'Role': 'INDIVIDUAL',
                'Name': profile.full_name,
                'Email': profile.email,
                'Mobile': profile.mobile_number,
                'College': profile.college_name,
                'Department': profile.department,
                'Roll Number': profile.roll_number,
                'Year': profile.year_of_study
              });
            }
          }
        });
      }

      const ws = XLSX.utils.json_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All Events Report");
      const fileName = selectedCategory !== 'all' 
        ? `${selectedCategory}_All_Events_Report.xlsx`
        : 'All_Categories_Report.xlsx';
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Failed to generate Excel report');
    } finally {
      setLoading(false);
    }
  };

  const downloadAllEventsPDF = async () => {
    if (eventWiseStats.length === 0) return;

    setLoading(true);
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
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

      const dakshaaLogoData = await loadImageAsBase64(dakshaaLogo);
      const ksrctLogoData = await loadImageAsBase64(ksrctLogo);

      const headerY = 22;
      
      if (ksrctLogoData) {
        const logoHeight = 35;
        const aspectRatio = ksrctLogoData.width / ksrctLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(ksrctLogoData.data, 'PNG', 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      
      if (dakshaaLogoData) {
        const logoHeight = 30;
        const aspectRatio = dakshaaLogoData.width / dakshaaLogoData.height;
        const logoWidth = logoHeight * aspectRatio;
        doc.addImage(dakshaaLogoData.data, 'PNG', pageWidth - logoWidth - 14, headerY - logoHeight/2, logoWidth, logoHeight, undefined, 'NONE');
      }
      
      doc.setFontSize(18);
      doc.setTextColor(26, 54, 93);
      doc.setFont('helvetica', 'bold');
      doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 4, { align: 'center' });
      doc.setFontSize(11);
      doc.setTextColor(230, 126, 34);
      doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(197, 48, 48);
      const title = selectedCategory !== 'all' 
        ? `${selectedCategory} - All Events Report`
        : 'All Categories - Complete Report';
      doc.text(title, pageWidth / 2, headerY + 10, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Comprehensive Headcount Report', pageWidth / 2, headerY + 16, { align: 'center' });
      
      const totalStats = eventWiseStats.reduce((acc, e) => ({
        teams: acc.teams + e.teamCount,
        teamHeadcount: acc.teamHeadcount + e.teamHeadcount,
        individual: acc.individual + e.individualCount,
        total: acc.total + e.totalHeadcount
      }), { teams: 0, teamHeadcount: 0, individual: 0, total: 0 });
      
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Events: ${eventWiseStats.length} | Teams: ${totalStats.teams} | Team Headcount: ${totalStats.teamHeadcount} | Individual: ${totalStats.individual} | Grand Total: ${totalStats.total}`, pageWidth / 2, headerY + 22, { align: 'center' });

      const tableRows = eventWiseStats.map(event => [
        event.eventName,
        event.category,
        event.teamCount.toString(),
        event.teamHeadcount.toString(),
        event.individualCount.toString(),
        event.totalHeadcount.toString()
      ]);

      // Add total row
      tableRows.push([
        'TOTAL',
        '',
        totalStats.teams.toString(),
        totalStats.teamHeadcount.toString(),
        totalStats.individual.toString(),
        totalStats.total.toString()
      ]);

      autoTable(doc, {
        head: [['Event Name', 'Category', 'Teams', 'Team Headcount', 'Individual', 'Total']],
        body: tableRows,
        startY: 50,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        bodyStyles: {
          0: { fontStyle: 'bold' }
        },
        didParseCell: function(data) {
          if (data.row.index === tableRows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [200, 200, 200];
          }
        }
      });

      const fileName = selectedCategory !== 'all' 
        ? `${selectedCategory}_All_Events_Report.pdf`
        : 'All_Categories_Report.pdf';
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      alert('Failed to generate PDF report');
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!selectedEvent || teams.length === 0) return;

    // Create a flat list of all participants
    const flatData = [];

    teams.forEach(team => {
      // Add Leader
      if (team.leaderProfile) {
        flatData.push({
          'Team Name': team.team_name,
          'Team ID': team.id,
          'Role': 'LEADER',
          'Name': team.leaderProfile.full_name,
          'Email': team.leaderProfile.email,
          'Mobile': team.leaderProfile.mobile_number,
          'College': team.leaderProfile.college_name,
          'Department': team.leaderProfile.department,
          'Roll Number': team.leaderProfile.roll_number,
          'Year': team.leaderProfile.year_of_study
        });
      }

      // Add Members (check duplications with leader if leader is also in members list)
      team.members.forEach(member => {
        // Skip if this member record is actually the leader (compare IDs)
        // Some systems duplicate leader in members table.
        // If leader is NOT in members table, we added them above.
        // If leader IS in members table, we might add them twice if we aren't careful.
        // Let's rely on uniqueUserIds logic, but constructing the report line by line is safer to iterate profiles.
        
        const isLeader = member.user_id === team.leader_id;
        if (isLeader) return; // Already added as leader above

        if (member.profile) {
          flatData.push({
            'Team Name': team.team_name,
            'Team ID': team.id,
            'Role': 'MEMBER',
            'Name': member.profile.full_name,
            'Email': member.profile.email,
            'Mobile': member.profile.mobile_number,
            'College': member.profile.college_name,
            'Department': member.profile.department,
            'Roll Number': member.profile.roll_number,
            'Year': member.profile.year_of_study
          });
        }
      });

      // If team has paid members but they haven't been added yet
      if (!team.hasMembersAdded && team.paid_members > 1) {
        flatData.push({
          'Team Name': team.team_name,
          'Team ID': team.id,
          'Role': 'NOTE',
          'Name': `${team.paid_members - 1} paid members not added yet`,
          'Email': '-',
          'Mobile': '-',
          'College': '-',
          'Department': '-',
          'Roll Number': '-',
          'Year': '-'
        });
      }
    });

    // Add Individual Registrations
    individualRegistrations.forEach(reg => {
      if (reg.profile) {
        flatData.push({
          'Team Name': 'INDIVIDUAL',
          'Team ID': '-',
          'Role': 'INDIVIDUAL',
          'Name': reg.profile.full_name,
          'Email': reg.profile.email,
          'Mobile': reg.profile.mobile_number,
          'College': reg.profile.college_name,
          'Department': reg.profile.department,
          'Roll Number': reg.profile.roll_number,
          'Year': reg.profile.year_of_study
        });
      }
    });

    const ws = XLSX.utils.json_to_sheet(flatData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Participants");
    XLSX.writeFile(wb, `${selectedEvent.name}_Headcount_Report.xlsx`);
  };

  const downloadPDF = async () => {
    if (!selectedEvent || teams.length === 0) return;
  
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

    // Try to load logos from assets
    const dakshaaLogoData = await loadImageAsBase64(dakshaaLogo);
    const ksrctLogoData = await loadImageAsBase64(ksrctLogo);

    // Header vertical center baseline
    const headerY = 22;
    
    // KSRCT logo (left) - larger size
    if (ksrctLogoData) {
      const logoHeight = 35;
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
    doc.text('Team Headcount Report', pageWidth / 2, headerY + 16, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Total Teams: ${stats.totalTeams} | Team Headcount: ${stats.totalHeadcount} | Individual: ${stats.individualCount} | Grand Total: ${stats.grandTotal}`, pageWidth / 2, headerY + 22, { align: 'center' });
  
    const tableRows = [];
    
    teams.forEach(team => {
        // Add Leader Row with Team Span visually represented by grouping or just listing
        if (team.leaderProfile) {
            tableRows.push([
                team.team_name,
                'LEADER',
                team.leaderProfile.full_name,
                team.leaderProfile.mobile_number || 'N/A',
                team.leaderProfile.college_name || 'N/A'
            ]);
        }
        
        team.members.forEach(member => {
            if (member.user_id === team.leader_id) return;
            if (member.profile) {
                tableRows.push([
                    '', // Empty team name for members to show grouping
                    'MEMBER',
                    member.profile.full_name,
                    member.profile.mobile_number || 'N/A',
                    member.profile.college_name || 'N/A'
                ]);
            }
        });

        // If team has paid members but they haven't been added yet
        if (!team.hasMembersAdded && team.paid_members > 1) {
          tableRows.push([
              '',
              'NOTE',
              `${team.paid_members - 1} paid members not added yet`,
              '-',
              '-'
          ]);
        }

        // Add separator row
        tableRows.push(['', '', '', '', '']); 
    });

    // Add Individual Registrations Section
    if (individualRegistrations.length > 0) {
      tableRows.push([
        'INDIVIDUAL REGISTRATIONS',
        '',
        '',
        '',
        ''
      ]);
      
      individualRegistrations.forEach(reg => {
        if (reg.profile) {
          tableRows.push([
            '',
            'INDIVIDUAL',
            reg.profile.full_name,
            reg.profile.mobile_number || 'N/A',
            reg.profile.college_name || 'N/A'
          ]);
        }
      });
    }
  
    autoTable(doc, {
      head: [['Team Name', 'Role', 'Name', 'Mobile', 'College']],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
  
    doc.save(`${selectedEvent.name}_Headcount_Report.pdf`);
  };

  if (authLoading) {
     return (
       <div className="min-h-screen bg-slate-950 flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
       </div>
     );
  }

  const filteredTeams = teams.filter(team => 
    team.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.leaderProfile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Event Headcount Report
          </h1>
          <p className="text-slate-400 mt-1">Track team events and individual registrations with detailed participant counts</p>
        </div>
      </div>

      {/* Filter and Event Selection */}
      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Category</label>
            <div className="relative">
              <select
                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg pl-4 pr-10 py-3 appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedEvent(null);
                }}
                value={selectedCategory}
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Event to Analyze</label>
            <div className="relative">
              <select
                className="w-full bg-slate-800 border-slate-700 text-white rounded-lg pl-4 pr-10 py-3 appearance-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                onChange={(e) => {
                  const event = events.find(ev => ev.id === e.target.value);
                  setSelectedEvent(event);
                }}
                value={selectedEvent?.id || ''}
              >
                <option value="">-- Select Event --</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Event-Wise Statistics Card */}
      {!selectedEvent && (
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="text-cyan-400" size={20} />
              Event-Wise Headcount {selectedCategory !== 'all' && `(${selectedCategory})`}
            </h3>
            <div className="flex items-center gap-3">
              {eventWiseStats.length > 0 && (
                <>
                  <button 
                    onClick={downloadAllEventsExcel}
                    disabled={loading || loadingEventStats}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet size={14} />
                    Export Excel
                  </button>
                  <button 
                    onClick={downloadAllEventsPDF}
                    disabled={loading || loadingEventStats}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={14} />
                    Export PDF
                  </button>
                </>
              )}
              {loadingEventStats && <Loader2 className="animate-spin text-emerald-500" size={20} />}
            </div>
          </div>
          
          {loadingEventStats ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="animate-spin text-emerald-500" size={48} />
              <p className="text-slate-400 text-sm">Loading event statistics...</p>
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : eventWiseStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Teams</th>
                    <th className="px-6 py-4">Team Headcount</th>
                    <th className="px-6 py-4">Individual</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {eventWiseStats.map((eventStat, idx) => (
                    <tr 
                      key={eventStat.eventId} 
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => {
                        const event = events.find(e => e.id === eventStat.eventId);
                        setSelectedEvent(event);
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-white">{eventStat.eventName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                          {eventStat.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{eventStat.teamCount}</td>
                      <td className="px-6 py-4 text-emerald-400 font-semibold">{eventStat.teamHeadcount}</td>
                      <td className="px-6 py-4 text-orange-400 font-semibold">{eventStat.individualCount}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm font-bold">
                          {eventStat.totalHeadcount}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Summary Row */}
                  <tr className="bg-slate-800/50 font-bold">
                    <td className="px-6 py-4 text-white" colSpan="2">TOTAL</td>
                    <td className="px-6 py-4 text-white">
                      {eventWiseStats.reduce((sum, e) => sum + e.teamCount, 0)}
                    </td>
                    <td className="px-6 py-4 text-emerald-400">
                      {eventWiseStats.reduce((sum, e) => sum + e.teamHeadcount, 0)}
                    </td>
                    <td className="px-6 py-4 text-orange-400">
                      {eventWiseStats.reduce((sum, e) => sum + e.individualCount, 0)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-sm">
                        {eventWiseStats.reduce((sum, e) => sum + e.totalHeadcount, 0)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Calendar className="mb-4" size={48} strokeWidth={1} />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm mt-1">Try selecting a different category</p>
            </div>
          )}
        </div>
      )}

      {selectedEvent && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 p-6 rounded-xl relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <Trophy size={64} className="text-blue-400" />
              </div>
              <h3 className="text-blue-400 font-medium mb-1">Total Teams</h3>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.totalTeams}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 p-6 rounded-xl relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <Users size={64} className="text-emerald-400" />
              </div>
              <h3 className="text-emerald-400 font-medium mb-1">Team Headcount</h3>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.totalHeadcount}</p>
              <p className="text-sm text-emerald-500/60 mt-2">From team registrations</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-900/40 to-slate-900 border border-orange-500/20 p-6 rounded-xl relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <UserCheck size={64} className="text-orange-400" />
              </div>
              <h3 className="text-orange-400 font-medium mb-1">Individual</h3>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.individualCount}</p>
              <p className="text-sm text-orange-500/60 mt-2">Solo participants</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 p-6 rounded-xl relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <Users size={64} className="text-purple-400" />
              </div>
              <h3 className="text-purple-400 font-medium mb-1">Grand Total</h3>
              <p className="text-4xl font-bold text-white">{loading ? '...' : stats.grandTotal}</p>
              <p className="text-sm text-purple-500/60 mt-2">All participants</p>
            </motion.div>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search teams or leaders..." 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="flex gap-3">
               <button 
                 onClick={downloadExcel}
                 disabled={loading || teams.length === 0}
                 className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <FileSpreadsheet size={16} />
                 Download Excel
               </button>
               <button 
                 onClick={downloadPDF}
                 disabled={loading || teams.length === 0}
                 className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <FileText size={16} />
                 Download PDF
               </button>
             </div>
          </div>

          {/* Teams Table */}
          {teams.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
               {loading ? (
                  <div className="p-12 flex justify-center">
                     <Loader2 className="animate-spin text-emerald-500" size={32} />
                  </div>
               ) : (
                  <>
                     <div className="px-6 py-4 bg-slate-950 border-b border-slate-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                           <Trophy className="text-blue-400" size={20} />
                           Team Registrations ({teams.length} teams)
                        </h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
                              <tr>
                                 <th className="px-6 py-4">Team Name</th>
                                 <th className="px-6 py-4">Leader</th>
                                 <th className="px-6 py-4">Members</th>
                                 <th className="px-6 py-4">Total Heads</th>
                                 <th className="px-6 py-4">Created At</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800 text-sm">
                              {filteredTeams.map((team, idx) => (
                                 <tr key={team.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">{team.team_name}</td>
                                    <td className="px-6 py-4">
                                       {team.leaderProfile ? (
                                         <div className="flex flex-col">
                                            <span className="text-white">{team.leaderProfile.full_name}</span>
                                            <span className="text-xs text-slate-500">{team.leaderProfile.email}</span>
                                         </div>
                                       ) : <span className="text-red-400">Unknown</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                       {team.hasMembersAdded ? (
                                         <div className="flex -space-x-2">
                                            {team.members.slice(0, 5).map((m, i) => (
                                              <div 
                                                key={i} 
                                                className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300"
                                                title={m.profile?.full_name || 'Member'}
                                              >
                                                 {m.profile?.full_name?.charAt(0) || 'M'}
                                              </div>
                                            ))}
                                            {team.members.length > 5 && (
                                              <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-400">
                                                 +{team.members.length - 5}
                                              </div>
                                            )}
                                         </div>
                                       ) : (
                                         <span className="text-xs text-amber-400">
                                           {team.paid_members > 1 ? `${team.paid_members - 1} paid (not added yet)` : 'No members yet'}
                                         </span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-bold">
                                         {team.headCount}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                       {new Date(team.created_at).toLocaleDateString()}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </>
               )}
            </div>
          )}

          {/* Individual Registrations Table */}
          {individualRegistrations.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
               <div className="px-6 py-4 bg-slate-950 border-b border-slate-800">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                     <UserCheck className="text-orange-400" size={20} />
                     Individual Registrations ({individualRegistrations.length} participants)
                  </h3>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                           <th className="px-6 py-4">Name</th>
                           <th className="px-6 py-4">Email</th>
                           <th className="px-6 py-4">Mobile</th>
                           <th className="px-6 py-4">College</th>
                           <th className="px-6 py-4">Registered At</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800 text-sm">
                        {individualRegistrations.map((reg, idx) => (
                           <tr key={reg.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">
                                 {reg.profile?.full_name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 text-slate-300">
                                 {reg.profile?.email || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-300">
                                 {reg.profile?.mobile_number || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                 {reg.profile?.college_name || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                 {new Date(reg.registered_at).toLocaleDateString()}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {/* No Data Message */}
          {!loading && teams.length === 0 && individualRegistrations.length === 0 && (
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-12 text-center text-slate-500">
               <Users size={48} className="mx-auto mb-3 opacity-20" />
               <p>No registrations found for this event</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeamReport;
