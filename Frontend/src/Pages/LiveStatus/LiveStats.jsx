import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TicketCheck, TrendingUp, Radio, ArrowLeft } from "lucide-react";
import { supabase } from "../../supabase";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";

// Helper to extract conference name from event_id
const getConferenceNameFromId = (rawId) => {
    if (!rawId) return null;
    const eid = rawId.toLowerCase();
    
    // Match pattern: conference-event-{name}
    const match = eid.match(/conference-event-(.+)/);
    if (match && match[1]) {
        return match[1].toUpperCase();
    }
    return null;
};

// Helper to extract department from event_id
const getDeptFromId = (rawId) => {
    if (!rawId) return null;
    const eid = rawId.toLowerCase();
    
    // Order matters - specific to general
    if (eid.includes("cse-aiml")) return "AIML";
    if (eid.includes("aiml")) return "AIML";
    if (eid.includes("ai-ds") || eid.includes("aids")) return "AI-DS";
    if (eid.includes("csbs")) return "CSBS";
    if (eid.includes("cse")) return "CSE";
    
    // For IT, ensure it's a standalone word segment to avoid partial matches
    if (/-it($|-)/.test(eid)) return "IT"; 
    
    if (eid.includes("ece")) return "ECE";
    if (eid.includes("eee")) return "EEE";
    if (eid.includes("mech")) return "MECH";
    if (eid.includes("mct")) return "MCT";
    if (eid.includes("civil")) return "CIVIL";
    
    if (/-bt($|-)/.test(eid) || eid.includes("biotech")) return "BT";
    if (/-ft($|-)/.test(eid) || eid.includes("food")) return "FT";
    if (eid.includes("txt") || eid.includes("textile")) return "TXT";
    
    if (eid.includes("vlsi")) return "EE(VLSI D&T)";
    if (eid.includes("mca")) return "MCA";
    if (eid.includes("edc")) return "EDC";
    if (eid.includes("ipr")) return "IPR";
    if (eid.includes("culturals") || eid.includes("cultural")) return "CULTURAL";
    if (eid.includes("school-of-life-science")) return "SOLS";
    
    return null; 
};

const fetchPaidRegistrationsByEventIds = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) return { data: [] };
    return supabase
        .from('event_registrations_config')
        .select('event_id')
        .in('event_id', eventIds)
        .ilike('payment_status', 'paid');
};

// Flip Card Component removed
// const FlipUnit = ...

const LiveStats = () => {
  const [stats, setStats] = useState({
    users: 0,
    registrations: 0,
    totalParticipants: 0,
    teamMembersCount: 0,
    uniquePaidUsers: 0,
    last_updated: null
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptEventDetails, setDeptEventDetails] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryEventDetails, setCategoryEventDetails] = useState({});
  const [expandedConference, setExpandedConference] = useState(null);
  const [conferenceEventDetails, setConferenceEventDetails] = useState({});
  const navigate = useNavigate();
  const eventLookupRef = useRef({});
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const [milestone, setMilestone] = useState(null);
  const prevStats = useRef(null);

  // Particle animation for background
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10
  }));

  // Detect Milestones
  useEffect(() => {
     // Only run if we have previous stats (skip initial load blast)
     if (prevStats.current) {
        // Check Students (Every 100)
        const prevUsers = prevStats.current.users;
        const currUsers = stats.users;
        if (Math.floor(currUsers / 100) > Math.floor(prevUsers / 100)) {
            setMilestone({
                type: 'users',
                value: Math.floor(currUsers / 100) * 100,
                label: 'STUDENTS ONBOARDED!',
                subLabel: 'New Batch Just Arrived 🚀',
                color: 'text-secondary'
            });
            setTimeout(() => setMilestone(null), 5000);
        }

        // Check Registrations (Every 50)
        const prevRegs = prevStats.current.registrations;
        const currRegs = stats.registrations;
        if (Math.floor(currRegs / 50) > Math.floor(prevRegs / 50)) {
            setMilestone({
                type: 'registrations',
                value: Math.floor(currRegs / 50) * 50,
                label: 'REGISTRATIONS!',
                subLabel: 'Events Filling Up Fast 🔥',
                color: 'text-primary'
            });
            setTimeout(() => setMilestone(null), 5000);
        }
     }
     
     // Update ref
     prevStats.current = stats;
  }, [stats]);

  useEffect(() => {
    preloadEventMetadata();
    fetchInitialStats();
    fetchCategoryStats();
    fetchDeptStats();
    setupRealtimeSubscriptions();

    return () => {
      if (channelRef.current) {
        console.log('🔄 Cleaning up real-time subscriptions');
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  const preloadEventMetadata = async () => {
      try {
          const { data } = await supabase.from('events').select('id, event_id, category');
          if (data) {
              const map = {};
              data.forEach(e => {
                  map[e.id] = {
                      slug: e.event_id,
                      category: e.category,
                      dept: getDeptFromId(e.event_id)
                  };
              });
              eventLookupRef.current = map;
          }
      } catch (e) {
          console.error("Error preloading events metadata", e);
      }
  };

  const fetchDeptStats = async () => {
    try {
        // Fetch ALL active events to categorize them locally (skipping RPC due to inconsistencies)
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        // Group events by department
        const deptEventMap = {};
        events.forEach(e => {
            const dept = getDeptFromId(e.event_id);
            if (dept) {
                if (!deptEventMap[dept]) {
                    deptEventMap[dept] = [];
                }
                deptEventMap[dept].push(e.id);
            }
        });

        const deptCounts = {};

        // Calculate totals for each department by summing individual event counts + team members
        for (const [dept, eventIds] of Object.entries(deptEventMap)) {
            if (eventIds.length === 0) {
                deptCounts[dept] = { registrations: 0, teamMembers: 0, total: 0 };
                continue;
            }

            // Fetch paid registrations for this department's events
            const { data: registrations } = await fetchPaidRegistrationsByEventIds(eventIds);

            // Count registrations per event, then sum them
            const eventCounts = {};
            (registrations || []).forEach(reg => {
                eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
            });

            // Sum all event counts for this department
            const regCount = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);

            // Fetch team members for teams associated with these events (non-leaders)
            const { data: teamMembers, error: teamMembersError } = await supabase
                .from('team_members')
                .select('id, role, status, teams!inner(event_id, is_active)')
                .in('teams.event_id', eventIds)
                .eq('teams.is_active', true)
                .neq('role', 'leader')
                .eq('status', 'joined');
            
            if (teamMembersError) {
                console.error('Error fetching team members for dept stats:', teamMembersError);
            }

            const teamMembersCount = teamMembers?.length || 0;

            deptCounts[dept] = {
                registrations: regCount,
                teamMembers: teamMembersCount,
                total: regCount + teamMembersCount
            };
        }

        const formatted = Object.entries(deptCounts)
            .map(([dept, counts]) => ({ 
                dept, 
                count: counts.total,
                registrations: counts.registrations,
                teamMembers: counts.teamMembers
            }))
            .sort((a, b) => b.count - a.count);
            
        setDeptStats(formatted);
    } catch (error) {
       console.error("Error fetching dept stats:", error);
    }
  };


    const fetchDeptEventDetails = async (deptName, forceRefresh = false) => {
    try {
        // Check if we already have this data cached
                if (deptEventDetails[deptName] && !forceRefresh) {
            return;
        }

        // Fetch all active events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        // Filter events by department
        const deptEvents = events.filter(e => {
            const dept = getDeptFromId(e.event_id);
            return dept === deptName;
        });

        const eventIds = deptEvents.map(e => e.id);

        if (eventIds.length === 0) {
            setDeptEventDetails(prev => ({ ...prev, [deptName]: [] }));
            return;
        }

        // Fetch registration counts for each event
        const { data: registrations } = await fetchPaidRegistrationsByEventIds(eventIds);

        // Count registrations per event
        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        // Fetch team members for each event (non-leaders only)
        const { data: teamMembers, error: teamMembersError } = await supabase
            .from('team_members')
            .select('id, team_id, role, status, teams!inner(event_id, is_active)')
            .in('teams.event_id', eventIds)
            .eq('teams.is_active', true)
            .neq('role', 'leader')
            .eq('status', 'joined');
        
        if (teamMembersError) {
            console.error('Error fetching team members for dept event details:', teamMembersError);
        }

        // Count team members per event
        const teamMemberCounts = {};
        (teamMembers || []).forEach(tm => {
            const eventId = tm.teams?.event_id;
            if (eventId) {
                teamMemberCounts[eventId] = (teamMemberCounts[eventId] || 0) + 1;
            }
        });

        // Format the data with both registrations and team members
        const eventDetails = deptEvents
            .map(event => {
                const regCount = eventCounts[event.id] || 0;
                const tmCount = teamMemberCounts[event.id] || 0;
                return {
                    id: event.id,
                    name: event.name,
                    registrations: regCount,
                    teamMembers: tmCount,
                    count: regCount + tmCount
                };
            })
            .sort((a, b) => b.count - a.count);

        setDeptEventDetails(prev => ({ ...prev, [deptName]: eventDetails }));

    } catch (err) {
        console.error("Error fetching dept event details:", err);
        setDeptEventDetails(prev => ({ ...prev, [deptName]: [] }));
    }
  };

    const toggleDeptExpansion = (deptName) => {
    if (expandedDept === deptName) {
        setExpandedDept(null);
    } else {
        setExpandedDept(deptName);
                fetchDeptEventDetails(deptName, true);
    }
  };

  const fetchConferenceEventDetails = async (conferenceName) => {
    try {
        console.log('🎪 Fetching events for conference:', conferenceName);
        // Check if we already have this data cached
        if (conferenceEventDetails[conferenceName]) {
            console.log('✅ Conference data already cached');
            return;
        }

        // Fetch all active conference events
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true)
            .eq('category', 'conference');

        console.log('📋 All conference events:', events);
        if (eventsError) throw eventsError;

        // Filter events by conference name
        const conferenceEvents = events.filter(e => {
            const confName = getConferenceNameFromId(e.event_id);
            console.log(`Checking event ${e.event_id}: extracted name = ${confName}, target = ${conferenceName}`);
            return confName === conferenceName;
        });

        console.log('🔍 Filtered events for', conferenceName, ':', conferenceEvents);
        const eventIds = conferenceEvents.map(e => e.id);

        if (eventIds.length === 0) {
            setConferenceEventDetails(prev => ({ ...prev, [conferenceName]: [] }));
            return;
        }

        // Fetch registration counts for each event
        const { data: registrations } = await fetchPaidRegistrationsByEventIds(eventIds);

        // Count registrations per event
        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        // Fetch team members for each event (non-leaders only)
        const { data: teamMembers, error: teamMembersError } = await supabase
            .from('team_members')
            .select('id, team_id, role, status, teams!inner(event_id, is_active)')
            .in('teams.event_id', eventIds)
            .eq('teams.is_active', true)
            .neq('role', 'leader')
            .eq('status', 'joined');
        
        if (teamMembersError) {
            console.error('Error fetching team members for conference event details:', teamMembersError);
        }

        // Count team members per event
        const teamMemberCounts = {};
        (teamMembers || []).forEach(tm => {
            const eventId = tm.teams?.event_id;
            if (eventId) {
                teamMemberCounts[eventId] = (teamMemberCounts[eventId] || 0) + 1;
            }
        });

        // Format the data with both registrations and team members
        const eventDetails = conferenceEvents
            .map(event => {
                const regCount = eventCounts[event.id] || 0;
                const tmCount = teamMemberCounts[event.id] || 0;
                return {
                    id: event.id,
                    name: event.name,
                    registrations: regCount,
                    teamMembers: tmCount,
                    count: regCount + tmCount
                };
            })
            .sort((a, b) => b.count - a.count);

        console.log('✅ Conference event details ready:', eventDetails);
        setConferenceEventDetails(prev => ({ ...prev, [conferenceName]: eventDetails }));

    } catch (err) {
        console.error("Error fetching conference event details:", err);
        setConferenceEventDetails(prev => ({ ...prev, [conferenceName]: [] }));
    }
  };

  const toggleConferenceExpansion = (conferenceName) => {
    if (expandedConference === conferenceName) {
        setExpandedConference(null);
    } else {
        setExpandedConference(conferenceName);
        if (!conferenceEventDetails[conferenceName]) {
            fetchConferenceEventDetails(conferenceName);
        }
    }
  };

  const fetchCategoryEventDetails = async (categoryName) => {
    try {
        // Check if we already have this data cached
        if (categoryEventDetails[categoryName]) {
            return;
        }

        // Special handling for Conference - show conference names instead of events
        if (categoryName === 'Conference') {
            console.log('🎯 Fetching Conference events...');
            // Fetch all active conference events
            const { data: events, error: eventsError } = await supabase
                .from('events')
                .select('id, event_id, name')
                .eq('is_active', true)
                .eq('category', 'conference');

            console.log('📊 Conference events fetched:', events);
            if (eventsError) throw eventsError;

            // Group by conference name
            const conferenceMap = {};
            events.forEach(e => {
                const confName = getConferenceNameFromId(e.event_id);
                if (confName) {
                    if (!conferenceMap[confName]) {
                        conferenceMap[confName] = [];
                    }
                    conferenceMap[confName].push(e.id);
                }
            });

            const allEventIds = Object.values(conferenceMap).flat();

            if (allEventIds.length === 0) {
                setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
                return;
            }

            // Fetch registration counts
            const { data: registrations } = await fetchPaidRegistrationsByEventIds(allEventIds);

            // Count registrations per conference
            const conferenceCounts = {};
            (registrations || []).forEach(reg => {
                // Find which conference this event belongs to
                for (const [confName, eventIds] of Object.entries(conferenceMap)) {
                    if (eventIds.includes(reg.event_id)) {
                        conferenceCounts[confName] = (conferenceCounts[confName] || 0) + 1;
                        break;
                    }
                }
            });

            // Fetch team members for conference events (non-leaders only)
            const { data: teamMembers, error: teamMembersError } = await supabase
                .from('team_members')
                .select('id, team_id, role, status, teams!inner(event_id, is_active)')
                .in('teams.event_id', allEventIds)
                .eq('teams.is_active', true)
                .neq('role', 'leader')
                .eq('status', 'joined');
            
            if (teamMembersError) {
                console.error('Error fetching team members for conference category:', teamMembersError);
            }

            // Count team members per conference
            const conferenceTeamMemberCounts = {};
            (teamMembers || []).forEach(tm => {
                const eventId = tm.teams?.event_id;
                if (eventId) {
                    // Find which conference this event belongs to
                    for (const [confName, eventIds] of Object.entries(conferenceMap)) {
                        if (eventIds.includes(eventId)) {
                            conferenceTeamMemberCounts[confName] = (conferenceTeamMemberCounts[confName] || 0) + 1;
                            break;
                        }
                    }
                }
            });

            // Format as event-like data for display with team members
            const conferenceDetails = Object.entries(conferenceMap)
                .map(([confName]) => {
                    const regCount = conferenceCounts[confName] || 0;
                    const tmCount = conferenceTeamMemberCounts[confName] || 0;
                    return {
                        id: confName,
                        name: confName,
                        registrations: regCount,
                        teamMembers: tmCount,
                        count: regCount + tmCount,
                        isConference: true // Flag to identify this as a conference group
                    };
                })
                .sort((a, b) => b.count - a.count);

            console.log('✅ Conference details formatted:', conferenceDetails);
            setCategoryEventDetails(prev => ({ ...prev, [categoryName]: conferenceDetails }));
            return;
        }

        // Map category display name to database values
        const categoryMap = {
            'Workshop': ['workshop', 'workshops'],
            'Non Tech': ['non-technical', 'non-tech', 'nontech', 'non tech'],
            'Tech': ['technical'],
            'Culturals': ['cultural', 'culturals'],
            'Sports': ['sports', 'sport'],
            'Hackathon': ['hackathon', 'hack']
        };

        const categoryVariants = categoryMap[categoryName] || [categoryName.toLowerCase()];

        // Fetch all active events with matching categories
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name, category')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        // Filter events by category (case-insensitive)
        const categoryEvents = events.filter(e => {
            const eventCategory = (e.category || '').toLowerCase().trim();
            return categoryVariants.some(variant => eventCategory.includes(variant));
        });

        const eventIds = categoryEvents.map(e => e.id);

        if (eventIds.length === 0) {
            setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
            return;
        }

        // Fetch registration counts for each event
        const { data: registrations } = await fetchPaidRegistrationsByEventIds(eventIds);

        // Count registrations per event
        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        // Fetch team members for each event (non-leaders only)
        const { data: teamMembers, error: teamMembersError } = await supabase
            .from('team_members')
            .select('id, team_id, role, status, teams!inner(event_id, is_active)')
            .in('teams.event_id', eventIds)
            .eq('teams.is_active', true)
            .neq('role', 'leader')
            .eq('status', 'joined');
        
        if (teamMembersError) {
            console.error('Error fetching team members for category event details:', teamMembersError);
        }

        // Count team members per event
        const teamMemberCounts = {};
        (teamMembers || []).forEach(tm => {
            const eventId = tm.teams?.event_id;
            if (eventId) {
                teamMemberCounts[eventId] = (teamMemberCounts[eventId] || 0) + 1;
            }
        });

        // Format the data with both registrations and team members
        const eventDetails = categoryEvents
            .map(event => {
                const regCount = eventCounts[event.id] || 0;
                const tmCount = teamMemberCounts[event.id] || 0;
                return {
                    id: event.id,
                    name: event.name,
                    registrations: regCount,
                    teamMembers: tmCount,
                    count: regCount + tmCount
                };
            })
            .sort((a, b) => b.count - a.count);

        setCategoryEventDetails(prev => ({ ...prev, [categoryName]: eventDetails }));

    } catch (err) {
        console.error("Error fetching category event details:", err);
        setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
    }
  };

  const toggleCategoryExpansion = (categoryName) => {
    if (expandedCategory === categoryName) {
        setExpandedCategory(null);
    } else {
        setExpandedCategory(categoryName);
        if (!categoryEventDetails[categoryName]) {
            fetchCategoryEventDetails(categoryName);
        }
    }
  };

    const fetchTeamParticipantStats = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiUrl}/api/live/participant-stats`);
            if (!response.ok) {
                throw new Error(`Team stats API failed: ${response.status}`);
            }

            const data = await response.json();
            if (!data?.success) {
                throw new Error('Team stats API returned no success flag');
            }

            return {
                extraPaidMembers: Number(data.extraPaidMembers) || 0,
                activeTeamCount: Number(data.activeTeamCount) || 0,
                totalPaidMembers: Number(data.totalPaidMembers) || 0
            };
        } catch (error) {
            console.error('❌ Error fetching team participant stats:', error);
            return {
                extraPaidMembers: 0,
                activeTeamCount: 0,
                totalPaidMembers: 0
            };
        }
    };

    const fetchCategoryStats = async () => {
        try {
            await fetchCategoryStatsFallback();
        } catch (error) {
            console.error("Error fetching category stats:", error);
        }
    };

  const fetchCategoryStatsFallback = async () => {
    try {
      // Helper to fetch all data with pagination to bypass 1000 row limit
      const fetchAllData = async (table, select, queryModifier) => {
          let allData = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;

          while (hasMore) {
              let query = supabase
                  .from(table)
                  .select(select);
              
              // Apply filters BEFORE range
              if (queryModifier) query = queryModifier(query);
              
              query = query.range(page * pageSize, (page + 1) * pageSize - 1);

              const { data, error } = await query;
              if (error) {
                  console.error(`fetchAllData error for ${table}:`, error);
                  throw error;
              }
              
              if (data && data.length > 0) {
                  allData = [...allData, ...data];
                  if (data.length < pageSize) hasMore = false;
                  else page++;
              } else {
                  hasMore = false;
              }
          }
          return allData;
      };

      // 1. Fetch all active events with their categories
      const events = await fetchAllData('events', 'id, category', q => q.eq('is_active', true));

      // Map event_id(uuid) -> category
      const eventCategoryMap = {};
      events.forEach(e => {
        eventCategoryMap[e.id] = (e.category || '').toLowerCase().trim();
      });

      // 2. Fetch all paid registrations
      // Need user_id for unique count calculation
      const validRegs = await fetchAllData('event_registrations_config', 'event_id, user_id', q => q.ilike('payment_status', 'paid'));

      // 3. Calculate Total Paid Participants (Matches Python Logic Exactly)
      // Formula: Total Paid Participants = (PAID Registrations) + (Total Team Paid Members - Active Team Count)
      // Note: If (Sum(paid_members) - Count(active_teams)) is negative, use 0.
      
            const teamStats = await fetchTeamParticipantStats();
            const totalTeamPaidMembers = teamStats.totalPaidMembers;
            const activeTeamCount = teamStats.activeTeamCount;
            const extraPaidMembers = teamStats.extraPaidMembers;
      
      const totalParticipants = validRegs.length + extraPaidMembers;
      console.log('👥 Participant Calculation (Python Logic Match):', {
        baseRegs: validRegs.length,
        teamMembersTotal: totalTeamPaidMembers,
        activeTeamsCount: activeTeamCount,
        CalculatedExtra: extraPaidMembers,
        total: totalParticipants
      });

      // Update global stats with corrected count
      setStats(prev => ({
          ...prev,
          uniquePaidUsers: totalParticipants,
          extraTeamMembers: extraPaidMembers
      }));

      // 4. Aggregate counts
      let workshopCount = 0;
      let nonTechCount = 0;
      let techCount = 0;
      let culturalCount = 0;
      let sportsCount = 0;
      let hackathonCount = 0;
      let conferenceCount = 0;

      validRegs.forEach(reg => {
         const category = eventCategoryMap[reg.event_id];
         if (category) {
            const val = category.toLowerCase().trim();
            
            if (val.includes('workshop')) {
                workshopCount++;
            } else if (val.includes('non-technical') || val.includes('non-tech') || val.includes('nontech') || val.includes('non tech')) {
                nonTechCount++;
            } else if (val.includes('technical') || val === 'tech') {
                techCount++;
            } else if (val.includes('cultural')) {
                culturalCount++;
            } else if (val.includes('sport')) {
                sportsCount++;
            } else if (val.includes('hack')) {
                hackathonCount++;
            } else if (val.includes('conference')) {
                conferenceCount++;
            }
         }
      });
      
       const finalStats = [
            { category: 'Workshop', count: workshopCount },
            { category: 'Non Tech', count: nonTechCount },
            { category: 'Tech', count: techCount },
            { category: 'Culturals', count: culturalCount },
            { category: 'Sports', count: sportsCount },
            { category: 'Hackathon', count: hackathonCount },
            { category: 'Conference', count: conferenceCount }
        ];

      setCategoryStats(finalStats);
      
    } catch (err) {
      console.error("Category stats fallback failed:", err);
    }
  };

  const fetchInitialStats = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 Fetching live stats...");
      
      // Always use fallback method for most accurate count
      console.log("⚡ Using direct database counting for accuracy...");
      await fetchStatsFallback();
      
      // Also try RPC for comparison
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_live_stats');
        if (!rpcError && rpcData) {
          console.log("📊 RPC Result for comparison:", rpcData);
          console.log("🔍 Count comparison - RPC vs Direct:", {
            rpc: rpcData.registrations,
            direct: "See fallback logs above"
          });
        }
      } catch (rpcErr) {
        console.log("⚠️ RPC comparison failed (using direct count):", rpcErr.message);
      }
      
    } catch (err) {
      console.error('❌ Error in fetchInitialStats:', err);
      try {
          await fetchStatsFallback();
      } catch (fallbackErr) {
          console.error('❌ Fallback also failed:', fallbackErr);
          setStats({ users: 0, registrations: 0, last_updated: new Date().toISOString() });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFallback = async () => {
    try {
        console.log("🔍 Using fallback counting method...");
        
        // Execute queries in parallel with manual join for teams to ensure accuracy
        const [
            regStats,
            studentStats,
            teamMemberCount
        ] = await Promise.all([
            // 1. Registrations stats (various payment status checks)
            Promise.all([
                supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).eq('payment_status', 'PAID'),
                supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).ilike('payment_status', 'paid'),
                supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }) // Total
            ]),
            // 2. Student profiles
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            // 3. Team Members (Use backend API to bypass RLS)
            (async () => {
                const teamStats = await fetchTeamParticipantStats();
                console.log(
                  `👥 Team Stats Debug (API): Active Teams=${teamStats.activeTeamCount}, ` +
                  `Total Paid Members Sum=${teamStats.totalPaidMembers}, Additional Members=${teamStats.extraPaidMembers}`
                );
                return teamStats.extraPaidMembers;
            })()
        ]);

        const [standardPaidCount, caseInsensitivePaidCount, allStatusesCount] = regStats;
        const studentCount = studentStats;
        const teamMembersCount = teamMemberCount;

        console.log("📊 Comprehensive Count Results:");
        console.log("- Standard 'PAID' count:", standardPaidCount.count);
        console.log("- Case-insensitive 'paid' count:", caseInsensitivePaidCount.count);
        console.log("- Total registrations (all statuses):", allStatusesCount.count);
        console.log("- Student profiles:", studentCount.count);
        console.log("- Team Members (calculated):", teamMembersCount);

        
        // Get a sample of payment statuses to debug
        const statusSample = await supabase
          .from('event_registrations_config')
          .select('payment_status, created_at, id')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (statusSample.data) {
          const statusCounts = {};
          statusSample.data.forEach(record => {
            const status = record.payment_status || 'NULL';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
          });
          console.log("📋 Recent payment statuses breakdown:", statusCounts);
          console.log("📝 Sample records:", statusSample.data.slice(0, 5));
        }

        // Try multiple queries to find the highest accurate count
        const queries = await Promise.all([
          supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).eq('payment_status', 'PAID'),
          supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
          supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).eq('payment_status', 'Paid'),
          supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).ilike('payment_status', 'paid')
        ]);
        
        const counts = queries.map(q => q.count || 0);
        console.log("🔍 All payment status variations:", {
          'PAID': counts[0],
          'paid': counts[1], 
          'Paid': counts[2],
          'ilike_paid': counts[3]
        });
        
        // Use the highest count as it's likely the most accurate
        const maxCount = Math.max(...counts);
        console.log("📈 Using maximum count:", maxCount);
        
        // If we're still seeing 315/316 discrepancy, do a manual verification
        if (maxCount === 315) {
          console.log("🚨 Still showing 315, investigating further...");
          
          // Get actual records to count manually
          const allRecords = await supabase
            .from('event_registrations_config')
            .select('payment_status, id')
            .not('payment_status', 'is', null);
            
          if (allRecords.data) {
            const manualCount = allRecords.data.filter(record => 
              record.payment_status && record.payment_status.toLowerCase() === 'paid'
            ).length;
            
            console.log("🔢 Manual count (case-insensitive):", manualCount);
            console.log("📦 Total records with payment_status:", allRecords.data.length);
            
            // Use manual count if it's different
            if (manualCount !== maxCount) {
              console.log("⚡ Using manual count as it differs from DB count");
              const totalParticipants = manualCount + teamMembersCount;
              console.log("📊 Total Participants (registrations + team members):", totalParticipants);
              setStats(prev => ({
                ...prev,
                users: studentCount.count || 0,
                registrations: manualCount,
                teamMembersCount: teamMembersCount,
                totalParticipants: totalParticipants,
                last_updated: new Date().toISOString()
              }));
              return;
            }
          }
        }

        const totalParticipants = maxCount + teamMembersCount;
        console.log("📊 Total Participants (registrations + team members):", totalParticipants);
        
        setStats(prev => ({
          ...prev,
          users: studentCount.count || 0,
          registrations: maxCount,
          teamMembersCount: teamMembersCount,
          totalParticipants: totalParticipants,
          last_updated: new Date().toISOString()
        }));
        
    } catch (error) {
         console.error("❌ Error in fallback:", error);
         setStats(prev => ({ ...prev, users: 0, registrations: 0, last_updated: new Date().toISOString() }));
    }
  };

  const setupRealtimeSubscriptions = () => {
    try {
      // Clean up existing channel first
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }

      // Create a channel with a unique name
      const channel = supabase.channel(`live-stats-${Date.now()}`);
      channelRef.current = channel;

      // Listen for new profiles (students joining)
      channel.on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'profiles',
          filter: 'role=eq.student'
        },
        (payload) => {
          console.log('🎓 New student onboarded!', payload);
          setStats(prev => ({
            ...prev,
            users: prev.users + 1,
            last_updated: new Date().toISOString()
          }));
          setIsLive(true);
          setTimeout(() => setIsLive(false), 2000);
        }
      );

      // Listen for new registrations (Confirmed/PAID) - Listen to ALL events
      channel.on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'event_registrations_config' 
        },
        (payload) => {
          try {
            console.log('📨 Raw registration event received:', payload);
            const oldStatus = payload.old?.payment_status;
            const newStatus = payload.new?.payment_status;
            
            console.log('📊 Payment Status Change:', { oldStatus, newStatus });

            // Handle both case variations and new records
            const isPaidNow = newStatus && (newStatus.toUpperCase() === 'PAID');
            const wasPaidBefore = oldStatus && (oldStatus.toUpperCase() === 'PAID');
            
            // Count if:
            // 1. New record with PAID status (INSERT)
            // 2. Status changed from non-PAID to PAID (UPDATE)
            if (isPaidNow && !wasPaidBefore) {
              console.log('🎉 New PAID registration detected!', payload);
              
              const eventId = payload.new.event_id;
              const meta = eventLookupRef.current[eventId];
              
              // Force state update with callback to ensure it happens
              setStats(prevStats => {
                const newStats = {
                  ...prevStats,
                  registrations: prevStats.registrations + 1,
                  last_updated: new Date().toISOString()
                };
                console.log('📊 Stats updated:', { old: prevStats.registrations, new: newStats.registrations });
                return newStats;
              });

           if (meta) {
               // Update Category
               if (meta.category) {
                   const catKey = meta.category.toLowerCase().trim();
                   setCategoryStats(prev => prev.map(c => {
                       // Check if this category matches any of our tracked categories
                       if ((catKey.includes('workshop') || catKey === 'workshops') && c.category === 'Workshop') {
                           return { ...c, count: c.count + 1 };
                       } else if ((catKey.includes('non-technical') || catKey === 'non-tech' || catKey === 'nontech' || catKey === 'non tech') && c.category === 'Non Tech') {
                           return { ...c, count: c.count + 1 };
                       } else if ((catKey === 'technical' || (catKey.includes('tech') && !catKey.includes('non'))) && c.category === 'Tech') {
                           return { ...c, count: c.count + 1 };
                       } else if ((catKey.includes('cultural') || catKey === 'culturals') && c.category === 'Culturals') {
                           return { ...c, count: c.count + 1 };
                       } else if ((catKey.includes('sport') || catKey === 'sports') && c.category === 'Sports') {
                           return { ...c, count: c.count + 1 };
                       } else if ((catKey.includes('hackathon') || catKey === 'hack') && c.category === 'Hackathon') {
                           return { ...c, count: c.count + 1 };
                       } else if (catKey.includes('conference') && c.category === 'Conference') {
                           return { ...c, count: c.count + 1 };
                       }
                       return c;
                   }));
               }
               
               // Update Dept
               if (meta.dept) {
                   setDeptStats(prev => {
                       const exists = prev.find(d => d.dept === meta.dept);
                       if (exists) {
                           return prev.map(d => d.dept === meta.dept ? { ...d, count: d.count + 1 } : d)
                                      .sort((a,b) => b.count - a.count);
                       }
                       return [...prev, { dept: meta.dept, count: 1 }].sort((a,b) => b.count - a.count);
                   });
               }
           }
           
           // Background Refresh (with reduced frequency to avoid spam)
           setTimeout(() => {
             fetchInitialStats();
             fetchCategoryStats(); 
             fetchDeptStats();
           }, 1000);
           
             setIsLive(true);
             setTimeout(() => setIsLive(false), 2000);
            }
          } catch (error) {
            console.error('❌ Error processing registration update:', error);
          }
        }
      );

      // Listen for team member changes (Joining/Leaving)
      channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'team_members'
        },
        async (payload) => {
            console.log('👥 Team member change detected:', payload);
            // Re-run stats to get accurate participants count
            await fetchStatsFallback();
        }
      );

      // Listen for team changes (specifically paid_members count updates)
      channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'teams'
        },
        async (payload) => {
             console.log('🛡️ Team data changed:', payload);
             await fetchStatsFallback();
        }
      );

      channel.subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        setConnectionStatus(status.toLowerCase());
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscriptions active');
          // Start heartbeat to ensure connection stays alive
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current);
          }
          heartbeatRef.current = setInterval(() => {
            // Ping the connection every 30 seconds
            if (channelRef.current && channelRef.current.state === 'joined') {
              console.log('💓 Heartbeat: connection active');
            } else {
              console.warn('💔 Heartbeat: connection lost, reconnecting...');
              setupRealtimeSubscriptions();
            }
          }, 30000);
          
          // Start periodic refresh as backup (every 2 minutes)
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }
          refreshIntervalRef.current = setInterval(() => {
            console.log('🔄 Periodic refresh to ensure accuracy...');
            fetchInitialStats();
          }, 120000); // 2 minutes
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error:', err);
          setConnectionStatus('error');
          // Retry subscription after a delay
          setTimeout(() => {
            console.log('🔄 Retrying real-time subscription...');
            setupRealtimeSubscriptions();
          }, 5000);
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Subscription timed out, retrying...');
          setConnectionStatus('timeout');
          setTimeout(() => setupRealtimeSubscriptions(), 2000);
        } else if (status === 'CLOSED') {
          console.warn('🔒 Subscription closed');
          setConnectionStatus('closed');
        }
      });
    } catch (error) {
      console.error('❌ Error setting up real-time subscriptions:', error);
      // Retry after a delay
      setTimeout(() => {
        console.log('🔄 Retrying real-time subscription setup...');
        setupRealtimeSubscriptions();
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl text-gray-400">Loading Live Stats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50 flex items-center gap-4 md:gap-8">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/20 w-fit"
        >
          <ArrowLeft size={24} className="md:w-8 md:h-8" />
        </button>
      </div>

      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute bg-primary/20 rounded-full opacity-10"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Live Indicator */}
      <motion.div 
        className={`absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 rounded-full z-10 ${
          connectionStatus === 'subscribed' ? 'bg-green-500/20 border border-green-500/40' :
          connectionStatus === 'error' || connectionStatus === 'timeout' ? 'bg-red-500/20 border border-red-500/40' :
          connectionStatus === 'closed' ? 'bg-yellow-500/20 border border-yellow-500/40' :
          'bg-blue-500/20 border border-blue-500/40'
        }`}
        animate={{ scale: isLive ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Radio className={`w-4 h-4 md:w-5 md:h-5 ${
          connectionStatus === 'subscribed' ? 'text-green-500' :
          connectionStatus === 'error' || connectionStatus === 'timeout' ? 'text-red-500' :
          connectionStatus === 'closed' ? 'text-yellow-500' :
          'text-blue-500'
        } ${isLive || connectionStatus === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className={`font-bold uppercase tracking-wider text-xs md:text-sm ${
          connectionStatus === 'subscribed' ? 'text-green-500' :
          connectionStatus === 'error' || connectionStatus === 'timeout' ? 'text-red-500' :
          connectionStatus === 'closed' ? 'text-yellow-500' :
          'text-blue-500'
        }`}>
          {isLive ? 'UPDATING...' : 
           connectionStatus === 'subscribed' ? 'LIVE' :
           connectionStatus === 'error' ? 'ERROR' :
           connectionStatus === 'timeout' ? 'TIMEOUT' :
           connectionStatus === 'closed' ? 'RECONNECTING' :
           'CONNECTING'}
        </span>
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 w-full h-screen flex flex-col px-6 py-4 overflow-hidden">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-6 shrink-0 pt-4"
        >
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent mb-1">
            DAKSHAA 2026
          </h1>
          <p className="text-base md:text-xl text-gray-400 font-light tracking-wider">
            Live Statistics Dashboard
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 xl:gap-6 w-full flex-grow min-h-0 pb-4 overflow-y-auto xl:overflow-visible">
            {/* Left Column: Big Stats & Categories */}
            <div className="xl:col-span-3 flex flex-col gap-4 xl:gap-6 h-full min-h-0">
                
                {/* Big Cards - Horizontal on mobile, larger on desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 shrink-0">
                    {/* Students Onboarded Card */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-orange-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-2xl md:rounded-3xl p-3 md:p-6 h-full flex flex-col justify-center min-h-[140px] md:min-h-[220px]">
                        {/* Icon */}
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
                            </div>
                        </div>

                        {/* Label */}
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Students Joined
                        </h2>

                        {/* Counter */}
                        <div className="text-center">
                            <div className="text-2xl md:text-5xl lg:text-6xl font-black text-secondary mb-1 md:mb-2 tabular-nums">
                            <CountUp 
                                end={stats.users} 
                                duration={2}
                                separator=","
                                preserveValue
                            />
                            </div>
                            <div className="flex items-center justify-center gap-1 md:gap-2 text-green-400">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-semibold">Total Onboarded</span>
                            </div>
                        </div>
                        </div>
                    </motion.div>

                    {/* Total Registrations Card (Original) */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-blue-500/30 rounded-2xl md:rounded-3xl p-3 md:p-6 h-full flex flex-col justify-center min-h-[140px] md:min-h-[220px]">
                        {/* Icon */}
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <TicketCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                            </div>
                        </div>

                        {/* Label */}
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Registrations
                        </h2>

                        {/* Counter */}
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-2xl md:text-5xl lg:text-6xl font-black text-blue-500 mb-1 md:mb-2 tabular-nums tracking-tight">
                            <CountUp 
                                end={stats.registrations} 
                                duration={2}
                                separator=","
                                preserveValue
                            />
                            </div>
                            <div className="flex items-center justify-center gap-1 md:gap-2 text-green-400">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-semibold">Confirmed Seats</span>
                            </div>
                        </div>
                        </div>
                    </motion.div>

                    {/* Total Participants Card (New) */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative group col-span-2 md:col-span-1"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl md:rounded-3xl p-3 md:p-6 h-full flex flex-col justify-center min-h-[140px] md:min-h-[220px]">
                        {/* Icon */}
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                        </div>

                        {/* Label */}
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Total Participants
                        </h2>

                        {/* Counter - Total Participants */}
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-2xl md:text-5xl lg:text-6xl font-black text-primary mb-1 md:mb-2 tabular-nums tracking-tight">
                            <CountUp 
                                end={stats.totalParticipants} 
                                duration={2}
                                separator=","
                                preserveValue
                            />
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                            background: 'radial-gradient(circle at center, rgba(147,51,234,0.1), transparent 70%)'
                            }}
                        />
                        </div>
                    </motion.div>
                </div>

                {/* Category Stats Grid - Show on all screens */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex md:grid md:grid-cols-7 gap-2 md:gap-4 shrink-0 overflow-x-auto md:overflow-visible pb-1 md:pb-0 mb-4 md:mb-0"
                >
                    {categoryStats.map((stat, index) => (
                    <motion.div 
                        key={stat.category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        className="relative bg-gray-900 border border-gray-700/50 rounded-xl md:rounded-2xl p-2 md:p-3 hover:border-primary/30 transition-all group overflow-hidden cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-primary/20 shrink-0 w-20 md:w-auto"
                        onClick={() => toggleCategoryExpansion(stat.category)}
                    >
                        <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity hidden md:block">
                        <TicketCheck className="w-6 h-6 rotate-[-15deg]" />
                        </div>
                        <div className="text-gray-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1 h-3 md:h-4 flex items-end group-hover:text-primary transition-colors truncate">{stat.category}</div>
                        <div className="text-base md:text-xl lg:text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent font-mono">
                            <CountUp end={stat.count} duration={2} separator="," />
                        </div>
                    </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Right Column: Department Leaderboard - Below on mobile */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="xl:col-span-2 min-h-0 flex flex-col pl-0 xl:pl-4 mt-6 md:mt-4 xl:mt-0"
            >
                 <div className="flex items-center justify-between mb-3 md:mb-4 px-2 shrink-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <TrendingUp className="text-white w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base md:text-xl uppercase tracking-wider italic">Leaderboard</h3>
                            <p className="text-[10px] md:text-xs text-yellow-500 font-bold tracking-widest uppercase">Live Rankings</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-2 overflow-y-auto xl:overflow-visible overflow-x-hidden content-start pr-1 max-h-[250px] md:max-h-[calc(100vh-450px)] xl:max-h-none scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {deptStats.map((stat, index) => (
                            <motion.div
                                key={stat.dept}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`relative p-2 rounded-lg group cursor-pointer ${
                                    index === 0 ? 'bg-gradient-to-r from-yellow-600/80 to-amber-400/80 border border-yellow-400/50 shadow-lg shadow-yellow-500/20' : 
                                    index === 1 ? 'bg-gradient-to-r from-slate-600/80 to-slate-400/80 border border-slate-400/50 shadow-lg shadow-slate-500/20' :
                                    index === 2 ? 'bg-gradient-to-r from-orange-800/80 to-orange-600/80 border border-orange-500/50 shadow-lg shadow-orange-700/20' :
                                    'bg-gray-900 border border-gray-700/50 hover:border-primary/40 hover:bg-gray-800'
                                }`}
                                onClick={() => toggleDeptExpansion(stat.dept)}
                            >
                                {/* Glass Shine Effect - REMOVED */}

                                <div className="relative flex items-center justify-between z-10 w-full">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className={`font-black text-xs w-6 h-6 shrink-0 rounded-md flex items-center justify-center ${
                                            index < 3 ? 'bg-black/40 text-white' : 'bg-black/60 text-gray-400'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <span className={`font-bold text-xs tracking-wide truncate ${index < 3 ? 'text-white' : 'text-gray-200'}`}>
                                            {stat.dept}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 z-10 shrink-0 ml-1">
                                        <span className={`font-mono text-lg font-black tabular-nums ${
                                            index < 3 ? 'text-white' : 'text-gray-400 group-hover:text-white transition-colors'
                                        }`}>
                                            {stat.count}
                                        </span>
                                        {/* Down arrow removed as requested */}
                                    </div>
                                </div>
                                
                                {/* Rank Icons */}
                                {index === 0 && <div className="absolute top-0.5 right-0.5 text-xl opacity-20 rotate-12 pointer-events-none">👑</div>}
                                {index === 1 && <div className="absolute top-0.5 right-0.5 text-xl opacity-20 rotate-12 pointer-events-none">🥈</div>}
                                {index === 2 && <div className="absolute top-0.5 right-0.5 text-xl opacity-20 rotate-12 pointer-events-none">🥉</div>}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                 </div>
                 
                 {/* Department Events Details Overlay Card */}
                 <AnimatePresence>
                    {expandedDept && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setExpandedDept(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-gradient-to-br from-gray-900 to-black border border-primary/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-primary/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/30">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-primary to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                            <TicketCheck className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-wide">
                                                {expandedDept}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-semibold">Event Breakdown</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setExpandedDept(null)}
                                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-lg"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto max-h-[calc(80vh-140px)] pr-2">
                                    {deptEventDetails[expandedDept] === undefined ? (
                                        <div className="text-center py-12">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-400">Loading events...</p>
                                        </div>
                                    ) : deptEventDetails[expandedDept]?.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4 opacity-30">📊</div>
                                            <p className="text-gray-400 font-semibold">No events found for this department</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {deptEventDetails[expandedDept]?.map((event, idx) => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 hover:bg-gradient-to-br hover:from-gray-800/70 hover:to-black/70 border border-gray-700/30 hover:border-primary/30 rounded-xl p-4 transition-all"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-white font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                                                    {event.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400">
                                                                    {event.registrations || 0} Regs + {event.teamMembers || 0} Team Members
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`bg-gradient-to-r rounded-lg px-4 py-2 shrink-0 ${
                                                            event.count > 0 
                                                                ? 'from-primary/20 to-purple-600/20 border border-primary/30' 
                                                                : 'from-gray-600/20 to-gray-500/20 border border-gray-500/30'
                                                        }`}>
                                                            <span className={`text-2xl font-black font-mono tabular-nums ${
                                                                event.count > 0 ? 'text-primary' : 'text-gray-400'
                                                            }`}>
                                                                {event.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Summary */}
                                {deptEventDetails[expandedDept]?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/30">
                                        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-semibold">Total Participants</span>
                                                <span className="text-xs text-gray-500">
                                                    {deptEventDetails[expandedDept]?.reduce((sum, e) => sum + (e.registrations || 0), 0)} Registrations + {deptEventDetails[expandedDept]?.reduce((sum, e) => sum + (e.teamMembers || 0), 0)} Team Members
                                                </span>
                                            </div>
                                            <span className="text-3xl font-black text-primary font-mono">
                                                {deptEventDetails[expandedDept]?.reduce((sum, e) => sum + e.count, 0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Category Events Details Overlay Card */}
                 <AnimatePresence>
                    {expandedCategory && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setExpandedCategory(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-gradient-to-br from-gray-900 to-black border border-secondary/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-secondary/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/30">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-secondary to-orange-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-secondary/30">
                                            <TicketCheck className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-wide">
                                                {expandedCategory}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-semibold">Event Breakdown</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setExpandedCategory(null)}
                                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-lg"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto max-h-[calc(80vh-140px)] pr-2">
                                    {categoryEventDetails[expandedCategory] === undefined ? (
                                        <div className="text-center py-12">
                                            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-400">Loading events...</p>
                                        </div>
                                    ) : categoryEventDetails[expandedCategory]?.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4 opacity-30">📋</div>
                                            <p className="text-gray-400 font-semibold">No events found for this category</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoryEventDetails[expandedCategory]?.map((event, idx) => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`group relative bg-gradient-to-br from-gray-900/50 to-black/50 hover:bg-gradient-to-br hover:from-gray-800/70 hover:to-black/70 border border-gray-700/30 hover:border-secondary/30 rounded-xl p-4 transition-all ${
                                                        event.isConference ? 'cursor-pointer' : ''
                                                    }`}
                                                    onClick={() => {
                                                        if (event.isConference) {
                                                            toggleConferenceExpansion(event.name);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="bg-secondary/20 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-secondary font-bold text-sm">#{idx + 1}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-white font-semibold text-sm group-hover:text-secondary transition-colors truncate">
                                                                    {event.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400">
                                                                    {event.isConference ? 'Conference • Click for Events' : 
                                                                     `${event.registrations || 0} Regs + ${event.teamMembers || 0} Team Members`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`bg-gradient-to-r rounded-lg px-4 py-2 shrink-0 ${
                                                            event.count > 0 
                                                                ? 'from-secondary/20 to-orange-600/20 border border-secondary/30' 
                                                                : 'from-gray-600/20 to-gray-500/20 border border-gray-500/30'
                                                        }`}>
                                                            <span className={`text-2xl font-black font-mono tabular-nums ${
                                                                event.count > 0 ? 'text-secondary' : 'text-gray-400'
                                                            }`}>
                                                                {event.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Summary */}
                                {categoryEventDetails[expandedCategory]?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/30">
                                        <div className="flex items-center justify-between bg-gradient-to-r from-secondary/10 to-orange-600/10 rounded-lg p-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-semibold">Total Participants</span>
                                                <span className="text-xs text-gray-500">
                                                    {categoryEventDetails[expandedCategory]?.reduce((sum, e) => sum + (e.registrations || 0), 0)} Registrations + {categoryEventDetails[expandedCategory]?.reduce((sum, e) => sum + (e.teamMembers || 0), 0)} Team Members
                                                </span>
                                            </div>
                                            <span className="text-3xl font-black text-secondary font-mono">
                                                {categoryEventDetails[expandedCategory]?.reduce((sum, e) => sum + e.count, 0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Conference Events Details Overlay Card */}
                 <AnimatePresence>
                    {expandedConference && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                            onClick={() => setExpandedConference(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-gradient-to-br from-gray-900 to-black border border-primary/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-primary/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-700/30">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gradient-to-r from-primary to-purple-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                                            <TicketCheck className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-wide">
                                                {expandedConference}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-semibold">Conference Events</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setExpandedConference(null)}
                                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800/30 rounded-lg"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto max-h-[calc(80vh-140px)] pr-2">
                                    {conferenceEventDetails[expandedConference] === undefined ? (
                                        <div className="text-center py-12">
                                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-400">Loading events...</p>
                                        </div>
                                    ) : conferenceEventDetails[expandedConference]?.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4 opacity-30">📊</div>
                                            <p className="text-gray-400 font-semibold">No events found for this conference</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {conferenceEventDetails[expandedConference]?.map((event, idx) => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 hover:bg-gradient-to-br hover:from-gray-800/70 hover:to-black/70 border border-gray-700/30 hover:border-primary/30 rounded-xl p-4 transition-all"
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="bg-primary/20 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                                                <span className="text-primary font-bold text-sm">#{idx + 1}</span>
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-white font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                                                    {event.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-400">
                                                                    {event.registrations || 0} Regs + {event.teamMembers || 0} Team Members
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`bg-gradient-to-r rounded-lg px-4 py-2 shrink-0 ${
                                                            event.count > 0 
                                                                ? 'from-primary/20 to-purple-600/20 border border-primary/30' 
                                                                : 'from-gray-600/20 to-gray-500/20 border border-gray-500/30'
                                                        }`}>
                                                            <span className={`text-2xl font-black font-mono tabular-nums ${
                                                                event.count > 0 ? 'text-primary' : 'text-gray-400'
                                                            }`}>
                                                                {event.count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer Summary */}
                                {conferenceEventDetails[expandedConference]?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-700/30">
                                        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-300 font-semibold">Total Participants</span>
                                                <span className="text-xs text-gray-500">
                                                    {conferenceEventDetails[expandedConference]?.reduce((sum, e) => sum + (e.registrations || 0), 0)} Registrations + {conferenceEventDetails[expandedConference]?.reduce((sum, e) => sum + (e.teamMembers || 0), 0)} Team Members
                                                </span>
                                            </div>
                                            <span className="text-3xl font-black text-primary font-mono">
                                                {conferenceEventDetails[expandedConference]?.reduce((sum, e) => sum + e.count, 0)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </motion.div>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 space-y-4"
        >
          <p className="text-gray-500 text-sm">
            Last Updated: {stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Just now'}
          </p>
          <div className="flex items-center justify-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold uppercase tracking-wider">
              Real-time Updates Active
            </span>
          </div>
        </motion.div>
      </div>

      {/* Milestone Celebration Overlay */}
      <AnimatePresence>
        {milestone && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                {/* Confetti / Particle Burst */}
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full ${Math.random() > 0.5 ? 'bg-primary' : 'bg-secondary'}`}
                            initial={{ 
                                x: "50vw", 
                                y: "50vh", 
                                opacity: 1, 
                                scale: 0 
                            }}
                            animate={{ 
                                x: `${Math.random() * 100}vw`, 
                                y: `${Math.random() * 100}vh`, 
                                opacity: 0, 
                                scale: Math.random() * 2 
                            }}
                            transition={{ 
                                duration: 2, 
                                ease: "circOut",
                                repeat: Infinity 
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 text-center p-12 border-y-4 border-primary/30 bg-black/50 w-full transform rotate-[-2deg]">
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                    >
                        <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 text-white`}>
                            Milestone Reached!
                        </h2>
                        
                        <div className="flex items-baseline justify-center gap-4 mb-4">
                             <motion.span 
                                className={`text-8xl md:text-9xl font-black ${milestone.color} drop-shadow-[0_0_30px_currentColor]`}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                             >
                                {milestone.value}+
                             </motion.span>
                        </div>
                        
                        <h3 className={`text-3xl md:text-4xl font-bold text-white uppercase tracking-wider`}>
                             {milestone.label}
                        </h3>
                        
                        <p className="text-xl md:text-2xl text-gray-300 mt-4 font-mono">
                             {milestone.subLabel}
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveStats;
