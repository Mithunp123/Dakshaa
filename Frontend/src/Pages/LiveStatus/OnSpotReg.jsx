import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TicketCheck, TrendingUp, Radio, ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "../../supabase";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";

// Helper to extract department from event_id
const getDeptFromId = (rawId) => {
    if (!rawId) return null;
    const eid = rawId.toLowerCase();
    if (eid.includes("cse-aiml")) return "AIML";
    if (eid.includes("aiml")) return "AIML";
    if (eid.includes("ai-ds") || eid.includes("aids")) return "AI-DS";
    if (eid.includes("csbs")) return "CSBS";
    if (eid.includes("cse")) return "CSE";
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

const SPECIAL_EVENT_BASES = [
    'Paper Presentation',
    'Poster Presentation',
    'Project Presentation'
];

const ALLOWED_TECH_EVENTS = [
    'AI Mystery Box Challenge',
    'Bioblitz- Map (Bio Treasure Hunt)',
    'Reel-O-Science',
    '3D Arena',
    'System Sense',
    'Zero Component',
    'DrapeX: Fabric Draping in Action',
    'CoreX(Project Presentation)'
];

const normalizeName = (value) => (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const getSpecialBaseFromEventName = (name) => {
    if (!name) return null;
    const normalized = normalizeName(name);
    return SPECIAL_EVENT_BASES.find(base => normalized.startsWith(normalizeName(base))) || null;
};

const getDeptFromEventName = (name) => {
    if (!name) return null;
    const match = name.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim().toUpperCase();
    return null;
};

// Get today's date range in ISO format (UTC start of day)
const getTodayRange = () => {
    const now = new Date();
    // Use IST (UTC+5:30) for "today"
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const istStartOfDay = new Date(istNow.getFullYear(), istNow.getMonth(), istNow.getDate());
    // Convert back to UTC
    const utcStart = new Date(istStartOfDay.getTime() - istOffset);
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);
    return {
        start: utcStart.toISOString(),
        end: utcEnd.toISOString()
    };
};

// Fetch today's paid registrations by event IDs
const fetchTodayPaidRegistrationsByEventIds = async (eventIds) => {
    if (!eventIds || eventIds.length === 0) return { data: [] };
    const { start, end } = getTodayRange();
    return supabase
        .from('event_registrations_config')
        .select('event_id')
        .in('event_id', eventIds)
        .ilike('payment_status', 'paid')
        .gte('created_at', start)
        .lt('created_at', end);
};

const OnSpotReg = () => {
  const [stats, setStats] = useState({
    users: 0,
    registrations: 0,
    totalParticipants: 0,
    teamMembersCount: 0,
    last_updated: null
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [specialCategoryStats, setSpecialCategoryStats] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptEventDetails, setDeptEventDetails] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryEventDetails, setCategoryEventDetails] = useState({});

  const navigate = useNavigate();
  const eventLookupRef = useRef({});
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const [milestone, setMilestone] = useState(null);
  const prevStats = useRef(null);

  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 20 + 10
  }));

  // Detect Milestones
  useEffect(() => {
     if (prevStats.current) {
        const prevRegs = prevStats.current.registrations;
        const currRegs = stats.registrations;
        if (Math.floor(currRegs / 50) > Math.floor(prevRegs / 50)) {
            setMilestone({
                type: 'registrations',
                value: Math.floor(currRegs / 50) * 50,
                label: 'ON-SPOT REGISTRATIONS!',
                subLabel: 'Events Filling Up Fast Today! 🔥',
                color: 'text-emerald-400'
            });
            setTimeout(() => setMilestone(null), 5000);
        }
     }
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

  // ========== TODAY-ONLY DEPT STATS ==========
  const fetchDeptStats = async () => {
    try {
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        const deptEventMap = {};
        events.forEach(e => {
            const dept = getDeptFromId(e.event_id);
            if (dept) {
                if (!deptEventMap[dept]) deptEventMap[dept] = [];
                deptEventMap[dept].push(e.id);
            }
        });

        const deptCounts = {};

        for (const [dept, eventIds] of Object.entries(deptEventMap)) {
            if (eventIds.length === 0) {
                deptCounts[dept] = { registrations: 0, teamMembers: 0, total: 0 };
                continue;
            }

            const { data: registrations } = await fetchTodayPaidRegistrationsByEventIds(eventIds);

            const eventCounts = {};
            (registrations || []).forEach(reg => {
                eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
            });

            const regCount = Object.values(eventCounts).reduce((sum, count) => sum + count, 0);
            deptCounts[dept] = { registrations: regCount, teamMembers: 0, total: regCount };
        }

        const formatted = Object.entries(deptCounts)
            .map(([dept, counts]) => ({ 
                dept, 
                count: counts.total,
                registrations: counts.registrations,
                teamMembers: counts.teamMembers
            }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count);
            
        setDeptStats(formatted);
    } catch (error) {
       console.error("Error fetching dept stats:", error);
    }
  };

  const fetchDeptEventDetails = async (deptName, forceRefresh = false) => {
    try {
        if (deptEventDetails[deptName] && !forceRefresh) return;

        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        const deptEvents = events.filter(e => getDeptFromId(e.event_id) === deptName);
        const eventIds = deptEvents.map(e => e.id);

        if (eventIds.length === 0) {
            setDeptEventDetails(prev => ({ ...prev, [deptName]: [] }));
            return;
        }

        const { data: registrations } = await fetchTodayPaidRegistrationsByEventIds(eventIds);

        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        const eventDetails = deptEvents
            .map(event => ({
                id: event.id,
                name: event.name,
                registrations: eventCounts[event.id] || 0,
                teamMembers: 0,
                count: eventCounts[event.id] || 0
            }))
            .filter(e => e.count > 0)
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
        fetchDeptStats();
        fetchDeptEventDetails(deptName, true);
    }
  };

  // ========== TODAY-ONLY CATEGORY EVENT DETAILS ==========
  const fetchCategoryEventDetails = async (categoryName) => {
    try {
        if (categoryEventDetails[categoryName]) return;

        if (SPECIAL_EVENT_BASES.some(base => normalizeName(base) === normalizeName(categoryName))) {
            await fetchSpecialCategoryDetails(categoryName);
            return;
        }

        // Conference
        if (categoryName === 'Conference') {
            const { data: events, error: eventsError } = await supabase
                .from('events')
                .select('id, event_id, name')
                .eq('is_active', true)
                .eq('category', 'conference');

            if (eventsError) throw eventsError;

            const conferenceMap = {};
            events.forEach(e => {
                const confName = getConferenceNameFromId(e.event_id);
                if (confName) {
                    if (!conferenceMap[confName]) conferenceMap[confName] = [];
                    conferenceMap[confName].push(e.id);
                }
            });

            const allEventIds = Object.values(conferenceMap).flat();
            if (allEventIds.length === 0) {
                setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
                return;
            }

            const { data: registrations } = await fetchTodayPaidRegistrationsByEventIds(allEventIds);

            const conferenceCounts = {};
            (registrations || []).forEach(reg => {
                for (const [confName, eventIds] of Object.entries(conferenceMap)) {
                    if (eventIds.includes(reg.event_id)) {
                        conferenceCounts[confName] = (conferenceCounts[confName] || 0) + 1;
                        break;
                    }
                }
            });

            const conferenceDetails = Object.entries(conferenceMap)
                .map(([confName]) => ({
                    id: confName,
                    name: confName,
                    registrations: conferenceCounts[confName] || 0,
                    teamMembers: 0,
                    count: conferenceCounts[confName] || 0,
                    isConference: true
                }))
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count);

            setCategoryEventDetails(prev => ({ ...prev, [categoryName]: conferenceDetails }));
            return;
        }

        const categoryMap = {
            'Non Tech': ['non-technical', 'non-tech', 'nontech', 'non tech'],
            'Tech': ['technical'],
            'Culturals': ['cultural', 'culturals'],
            'Sports': ['sports', 'sport'],
            'Hackathon': ['hackathon', 'hack']
        };

        const categoryVariants = categoryMap[categoryName] || [categoryName.toLowerCase()];

        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name, category')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        let categoryEvents = events.filter(e => {
            const eventCategory = (e.category || '').toLowerCase().trim();
            return categoryVariants.some(variant => eventCategory.includes(variant));
        });

        if (categoryName === 'Tech') {
            const normalizeForMatch = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const allowedNormalized = ALLOWED_TECH_EVENTS.map(normalizeForMatch);
            categoryEvents = categoryEvents.filter(e => allowedNormalized.includes(normalizeForMatch(e.name)));
        }

        const eventIds = categoryEvents.map(e => e.id);
        if (eventIds.length === 0) {
            setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
            return;
        }

        const { data: registrations } = await fetchTodayPaidRegistrationsByEventIds(eventIds);

        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        const eventDetails = categoryEvents
            .map(event => ({
                id: event.id,
                name: event.name,
                registrations: eventCounts[event.id] || 0,
                teamMembers: 0,
                count: eventCounts[event.id] || 0
            }))
            .filter(e => e.count > 0)
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
        if (!categoryEventDetails[categoryName]) fetchCategoryEventDetails(categoryName);
    }
  };

  // ========== TODAY-ONLY CATEGORY STATS ==========
  const fetchCategoryStats = async () => {
    try { await fetchCategoryStatsFallback(); } catch (error) { console.error("Error fetching category stats:", error); }
  };

  const fetchCategoryStatsFallback = async () => {
    try {
      const { start, end } = getTodayRange();

      const fetchAllTodayData = async (table, select, queryModifier) => {
          let allData = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;
          while (hasMore) {
              let query = supabase.from(table).select(select);
              if (queryModifier) query = queryModifier(query);
              query = query.gte('created_at', start).lt('created_at', end);
              query = query.range(page * pageSize, (page + 1) * pageSize - 1);
              const { data, error } = await query;
              if (error) throw error;
              if (data && data.length > 0) {
                  allData = [...allData, ...data];
                  if (data.length < pageSize) hasMore = false;
                  else page++;
              } else { hasMore = false; }
          }
          return allData;
      };

      const events = await (async () => {
          let allData = [];
          let page = 0;
          const pageSize = 1000;
          let hasMore = true;
          while (hasMore) {
              const { data, error } = await supabase
                  .from('events')
                  .select('id, category, name, event_id')
                  .eq('is_active', true)
                  .range(page * pageSize, (page + 1) * pageSize - 1);
              if (error) throw error;
              if (data && data.length > 0) {
                  allData = [...allData, ...data];
                  if (data.length < pageSize) hasMore = false;
                  else page++;
              } else { hasMore = false; }
          }
          return allData;
      })();

      const eventCategoryMap = {};
      const eventNameMap = {};
      events.forEach(e => {
        eventCategoryMap[e.id] = (e.category || '').toLowerCase().trim();
        eventNameMap[e.id] = e.name || '';
      });

      // Only today's paid registrations
      const validRegs = await fetchAllTodayData('event_registrations_config', 'event_id, user_id', q => q.ilike('payment_status', 'paid'));

      const totalParticipants = validRegs.length;

      setStats(prev => ({
          ...prev,
          uniquePaidUsers: validRegs.length,
          teamMembersCount: 0,
          totalParticipants: totalParticipants,
      }));

      let nonTechCount = 0, techCount = 0, culturalCount = 0,
          sportsCount = 0, hackathonCount = 0;

      validRegs.forEach(reg => {
         const category = eventCategoryMap[reg.event_id];
         const eventName = eventNameMap[reg.event_id];
         if (category) {
            const val = category.toLowerCase().trim();
            if (val.includes('workshop')) { /* skip workshop */ }
            else if (val.includes('non-technical') || val.includes('non-tech') || val.includes('nontech') || val.includes('non tech')) nonTechCount++;
            else if (val.includes('technical') || val === 'tech') {
                const normalizeForMatch = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const eventNameNormalized = normalizeForMatch(eventName);
                const isAllowedTechEvent = ALLOWED_TECH_EVENTS.some(allowedName => normalizeForMatch(allowedName) === eventNameNormalized);
                if (isAllowedTechEvent) techCount++;
            }
            else if (val.includes('cultural')) culturalCount++;
            else if (val.includes('sport')) sportsCount++;
            else if (val.includes('hack')) hackathonCount++;
         }
      });

      // Build special category stats (today only)
      const buildSpecialCategoryStats = async () => {
        const specialEvents = events.filter(e => getSpecialBaseFromEventName(e.name));
        const specialEventIds = specialEvents.map(e => e.id);
        if (specialEventIds.length === 0) { setSpecialCategoryStats([]); return; }

        const specialEventIdSet = new Set(specialEventIds);
        const regCounts = {};
        validRegs.forEach(reg => {
            if (specialEventIdSet.has(reg.event_id)) {
                regCounts[reg.event_id] = (regCounts[reg.event_id] || 0) + 1;
            }
        });

        const deptTotalsByBase = {};
        specialEvents.forEach(event => {
            const base = getSpecialBaseFromEventName(event.name);
            if (!base) return;
            const regCount = regCounts[event.id] || 0;
            const dept = getDeptFromEventName(event.name) || getDeptFromId(event.event_id) || 'OTHER';
            if (!deptTotalsByBase[base]) deptTotalsByBase[base] = {};
            if (!deptTotalsByBase[base][dept]) deptTotalsByBase[base][dept] = { registrations: 0, count: 0 };
            deptTotalsByBase[base][dept].registrations += regCount;
            deptTotalsByBase[base][dept].count += regCount;
        });

        const specialStats = SPECIAL_EVENT_BASES.map(base => {
            const deptMap = deptTotalsByBase[base] || {};
            const details = Object.entries(deptMap)
                .map(([dept, counts]) => ({
                    id: `${base}-${dept}`,
                    name: dept,
                    registrations: counts.registrations,
                    teamMembers: 0,
                    count: counts.count
                }))
                .sort((a, b) => b.count - a.count);
            const total = details.reduce((sum, item) => sum + item.count, 0);
            return { category: base, count: total, details };
        });

        setSpecialCategoryStats(specialStats.filter(s => s.count > 0).map(({ category, count }) => ({ category, count })));
        setCategoryEventDetails(prev => {
            const next = { ...prev };
            specialStats.forEach(stat => { next[stat.category] = stat.details; });
            return next;
        });
      };

      const finalStats = [
            { category: 'Non Tech', count: nonTechCount },
            { category: 'Tech', count: techCount },
            { category: 'Culturals', count: culturalCount },
            { category: 'Sports', count: sportsCount },
            { category: 'Hackathon', count: hackathonCount }
      ];

      setCategoryStats(finalStats);
      await buildSpecialCategoryStats();
    } catch (err) {
      console.error("Category stats fallback failed:", err);
    }
  };

  // ========== TODAY-ONLY INITIAL STATS ==========
  const fetchInitialStats = async () => {
    try {
      setLoading(true);
      await fetchStatsFallback();
    } catch (err) {
      console.error('Error in fetchInitialStats:', err);
      setStats({ users: 0, registrations: 0, totalParticipants: 0, teamMembersCount: 0, last_updated: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFallback = async () => {
    try {
        const { start, end } = getTodayRange();

        // Today's paid registrations (count)
        const { count: paidCount } = await supabase
            .from('event_registrations_config')
            .select('*', { count: 'exact', head: true })
            .ilike('payment_status', 'paid')
            .gte('created_at', start)
            .lt('created_at', end);

        // Today's new students
        const { count: studentCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
            .gte('created_at', start)
            .lt('created_at', end);

        const registrations = paidCount || 0;
        const totalParticipants = registrations;

        setStats(prev => ({
          ...prev,
          users: studentCount || 0,
          registrations,
          teamMembersCount: 0,
          totalParticipants,
          last_updated: new Date().toISOString()
        }));
    } catch (error) {
         console.error("Error in fallback:", error);
         setStats(prev => ({ ...prev, users: 0, registrations: 0, totalParticipants: 0, last_updated: new Date().toISOString() }));
    }
  };

  const fetchSpecialCategoryDetails = async (categoryName) => {
    try {
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id, name')
            .eq('is_active', true);
        if (eventsError) throw eventsError;

        const matchingEvents = events.filter(e => {
            const base = getSpecialBaseFromEventName(e.name);
            return base && normalizeName(base) === normalizeName(categoryName);
        });

        const eventIds = matchingEvents.map(e => e.id);
        if (eventIds.length === 0) {
            setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
            return;
        }

        const { data: registrations } = await fetchTodayPaidRegistrationsByEventIds(eventIds);

        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        const deptTotals = {};
        matchingEvents.forEach(event => {
            const dept = getDeptFromEventName(event.name) || getDeptFromId(event.event_id) || 'OTHER';
            if (!deptTotals[dept]) deptTotals[dept] = { registrations: 0, count: 0 };
            const regCount = eventCounts[event.id] || 0;
            deptTotals[dept].registrations += regCount;
            deptTotals[dept].count += regCount;
        });

        const details = Object.entries(deptTotals)
            .map(([dept, counts]) => ({
                id: `${categoryName}-${dept}`,
                name: dept,
                registrations: counts.registrations,
                teamMembers: 0,
                count: counts.count
            }))
            .filter(d => d.count > 0)
            .sort((a, b) => b.count - a.count);

        setCategoryEventDetails(prev => ({ ...prev, [categoryName]: details }));
    } catch (err) {
        console.error('Error fetching special category details:', err);
        setCategoryEventDetails(prev => ({ ...prev, [categoryName]: [] }));
    }
  };

  // ========== REALTIME (today filter applied on event) ==========
  const setupRealtimeSubscriptions = () => {
    try {
      if (channelRef.current) channelRef.current.unsubscribe();

      const channel = supabase.channel(`onspot-stats-${Date.now()}`);
      channelRef.current = channel;

      // New students today
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: 'role=eq.student' },
        () => {
          // Check if this was created today
          const { start, end } = getTodayRange();
          const now = new Date().toISOString();
          if (now >= start && now < end) {
            setStats(prev => ({
              ...prev,
              users: prev.users + 1,
              last_updated: new Date().toISOString()
            }));
            setIsLive(true);
            setTimeout(() => setIsLive(false), 2000);
          }
        }
      );

      // New registrations today
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_registrations_config' },
        (payload) => {
          try {
            const oldStatus = payload.old?.payment_status;
            const newStatus = payload.new?.payment_status;
            const isPaidNow = newStatus && (newStatus.toUpperCase() === 'PAID');
            const wasPaidBefore = oldStatus && (oldStatus.toUpperCase() === 'PAID');

            if (isPaidNow && !wasPaidBefore) {
              // Check if created_at is today
              const createdAt = payload.new?.created_at;
              const { start, end } = getTodayRange();
              if (createdAt && createdAt >= start && createdAt < end) {
                const eventId = payload.new.event_id;
                const meta = eventLookupRef.current[eventId];

                setStats(prevStats => {
                  const newRegistrations = prevStats.registrations + 1;
                  return {
                    ...prevStats,
                    registrations: newRegistrations,
                    totalParticipants: newRegistrations,
                    last_updated: new Date().toISOString()
                  };
                });

                if (meta) {
                    if (meta.category) {
                        const catKey = meta.category.toLowerCase().trim();
                        setCategoryStats(prev => prev.map(c => {
                            if ((catKey.includes('non-technical') || catKey === 'non-tech') && c.category === 'Non Tech') return { ...c, count: c.count + 1 };
                            if ((catKey === 'technical' || (catKey.includes('tech') && !catKey.includes('non'))) && c.category === 'Tech') return { ...c, count: c.count + 1 };
                            if (catKey.includes('cultural') && c.category === 'Culturals') return { ...c, count: c.count + 1 };
                            if (catKey.includes('sport') && c.category === 'Sports') return { ...c, count: c.count + 1 };
                            if (catKey.includes('hack') && c.category === 'Hackathon') return { ...c, count: c.count + 1 };
                            return c;
                        }));
                    }
                    if (meta.dept) {
                        setDeptStats(prev => {
                            const exists = prev.find(d => d.dept === meta.dept);
                            if (exists) return prev.map(d => d.dept === meta.dept ? { ...d, count: d.count + 1 } : d).sort((a,b) => b.count - a.count);
                            return [...prev, { dept: meta.dept, count: 1 }].sort((a,b) => b.count - a.count);
                        });
                    }
                }

                setTimeout(() => {
                  fetchInitialStats();
                  fetchCategoryStats();
                  fetchDeptStats();
                }, 1000);

                setIsLive(true);
                setTimeout(() => setIsLive(false), 2000);
              }
            }
          } catch (error) {
            console.error('Error processing registration update:', error);
          }
        }
      );

      channel.subscribe((status, err) => {
        setConnectionStatus(status.toLowerCase());
        if (status === 'SUBSCRIBED') {
          if (heartbeatRef.current) clearInterval(heartbeatRef.current);
          heartbeatRef.current = setInterval(() => {
            if (channelRef.current && channelRef.current.state === 'joined') { /* active */ }
            else setupRealtimeSubscriptions();
          }, 30000);

          if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
          refreshIntervalRef.current = setInterval(() => {
            fetchInitialStats();
            fetchCategoryStats();
            fetchDeptStats();
          }, 120000);
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
          setTimeout(() => setupRealtimeSubscriptions(), 5000);
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('timeout');
          setTimeout(() => setupRealtimeSubscriptions(), 2000);
        } else if (status === 'CLOSED') {
          setConnectionStatus('closed');
        }
      });
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setTimeout(() => setupRealtimeSubscriptions(), 5000);
    }
  };

  // ========== TODAY DATE DISPLAY ==========
  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl text-gray-400">Loading On-Spot Data...</p>
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
            className="absolute bg-emerald-400/20 rounded-full opacity-10"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size
            }}
            animate={{ y: [0, -100, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: particle.duration, repeat: Infinity, ease: "linear" }}
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
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent mb-1">
            ON-SPOT REG
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Calendar className="w-4 h-4 text-emerald-400/60" />
            <p className="text-base md:text-xl text-emerald-400/60 font-light tracking-wider">
              {todayLabel}
            </p>
          </div>
          <p className="text-sm md:text-base text-gray-500 font-light tracking-wider mt-1">
            Today&apos;s Registrations Only
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="w-full flex-grow min-h-0 pb-4 overflow-y-auto">
            <div className="flex flex-col gap-4 xl:gap-6 h-full min-h-0 max-w-5xl mx-auto">
                
                {/* Big Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 shrink-0">
                    {/* Students Joined Today */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-emerald-500/30 rounded-2xl md:rounded-3xl p-2.5 md:p-6 h-full flex flex-col justify-center min-h-[110px] md:min-h-[200px]">
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-emerald-500/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <Users className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
                            </div>
                        </div>
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Students Today
                        </h2>
                        <div className="text-center">
                            <div className="text-xl md:text-5xl lg:text-6xl font-black text-emerald-400 mb-1 md:mb-2 tabular-nums">
                            <CountUp end={stats.users} duration={2} separator="," preserveValue />
                            </div>
                            <div className="flex items-center justify-center gap-1 md:gap-2 text-green-400">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-semibold">Joined Today</span>
                            </div>
                        </div>
                        </div>
                    </motion.div>

                    {/* Registrations Today */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-2xl md:rounded-3xl p-2.5 md:p-6 h-full flex flex-col justify-center min-h-[110px] md:min-h-[200px]">
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-cyan-500/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <TicketCheck className="w-4 h-4 md:w-6 md:h-6 text-cyan-400" />
                            </div>
                        </div>
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Registrations
                        </h2>
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-xl md:text-5xl lg:text-6xl font-black text-cyan-400 mb-1 md:mb-2 tabular-nums tracking-tight">
                            <CountUp end={stats.registrations} duration={2} separator="," preserveValue />
                            </div>
                            <div className="flex items-center justify-center gap-1 md:gap-2 text-green-400">
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                            <span className="text-[10px] md:text-xs font-semibold">Today&apos;s Seats</span>
                            </div>
                        </div>
                        </div>
                    </motion.div>

                    {/* Total Participants Today */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative group col-span-2 md:col-span-1"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl md:rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-violet-500/30 rounded-2xl md:rounded-3xl p-2.5 md:p-6 h-full flex flex-col justify-center min-h-[110px] md:min-h-[200px]">
                        <div className="flex justify-center mb-2 md:mb-4">
                            <div className="w-9 h-9 md:w-12 md:h-12 bg-violet-500/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <Users className="w-4 h-4 md:w-6 md:h-6 text-violet-400" />
                            </div>
                        </div>
                        <h2 className="text-xs md:text-sm lg:text-lg font-bold text-gray-300 text-center mb-1 md:mb-3 uppercase tracking-wider">
                            Total Participants
                        </h2>
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-xl md:text-5xl lg:text-6xl font-black text-violet-400 mb-1 md:mb-2 tabular-nums tracking-tight">
                            <CountUp end={stats.totalParticipants} duration={2} separator="," preserveValue />
                            </div>
                        </div>
                        <motion.div
                            className="absolute inset-0 rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: 'radial-gradient(circle at center, rgba(139,92,246,0.1), transparent 70%)' }}
                        />
                        </div>
                    </motion.div>
                </div>

                {/* Category Stats */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex md:grid md:grid-cols-5 gap-2 md:gap-4 shrink-0 overflow-x-auto md:overflow-visible pb-3 md:pb-0 mb-4 md:mb-3"
                >
                    {categoryStats.map((stat, index) => (
                    <motion.div 
                        key={stat.category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        className="relative bg-gray-900 border border-gray-700/50 rounded-xl md:rounded-2xl p-2 md:p-3 hover:border-emerald-400/30 transition-all group overflow-hidden hover:scale-105 hover:shadow-lg hover:shadow-emerald-400/20 shrink-0 w-20 md:w-auto"
                    >
                        <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity hidden md:block">
                        <TicketCheck className="w-6 h-6 rotate-[-15deg]" />
                        </div>
                        <div className="text-gray-400 text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-0.5 md:mb-1 h-3 md:h-4 flex items-end group-hover:text-emerald-400 transition-colors truncate">{stat.category}</div>
                        <div className="text-base md:text-xl lg:text-3xl font-bold bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent font-mono">
                            <CountUp end={stat.count} duration={2} separator="," />
                        </div>
                    </motion.div>
                    ))}
                </motion.div>

                {/* Special Category Stats Row */}
                {specialCategoryStats.length > 0 && (
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.65 }}
                        className="hidden md:grid md:grid-cols-3 gap-4 shrink-0"
                    >
                        {specialCategoryStats.map((stat, index) => (
                        <motion.div 
                            key={stat.category}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + (index * 0.1) }}
                            className="relative bg-gray-900 border border-gray-700/50 rounded-2xl p-3 hover:border-emerald-400/30 transition-all group overflow-hidden hover:scale-105 hover:shadow-lg hover:shadow-emerald-400/20"
                        >
                            <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                            <TicketCheck className="w-6 h-6 rotate-[-15deg]" />
                            </div>
                            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 h-4 flex items-end group-hover:text-emerald-400 transition-colors truncate">
                                {stat.category}
                            </div>
                            <div className="text-xl lg:text-3xl font-bold bg-gradient-to-br from-emerald-400 to-teal-400 bg-clip-text text-transparent font-mono">
                                <CountUp end={stat.count} duration={2} separator="," />
                            </div>
                        </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 space-y-4"
        >
          <p className="text-gray-500 text-sm">
            Last Updated: {stats.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Just now'}
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-400">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold uppercase tracking-wider">
              On-Spot Real-time Updates Active
            </span>
          </div>
        </motion.div>
      </div>

      {/* Milestone Celebration */}
      <AnimatePresence>
        {milestone && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-3 h-3 rounded-full ${Math.random() > 0.5 ? 'bg-emerald-400' : 'bg-teal-400'}`}
                            initial={{ x: "50vw", y: "50vh", opacity: 1, scale: 0 }}
                            animate={{ x: `${Math.random() * 100}vw`, y: `${Math.random() * 100}vh`, opacity: 0, scale: Math.random() * 2 }}
                            transition={{ duration: 2, ease: "circOut", repeat: Infinity }}
                        />
                    ))}
                </div>
                <div className="relative z-10 text-center p-12 border-y-4 border-emerald-400/30 bg-black/50 w-full transform rotate-[-2deg]">
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", bounce: 0.6 }}>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4 text-white">Milestone Reached!</h2>
                        <div className="flex items-baseline justify-center gap-4 mb-4">
                             <motion.span 
                                className={`text-8xl md:text-9xl font-black ${milestone.color} drop-shadow-[0_0_30px_currentColor]`}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                             >{milestone.value}+</motion.span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wider">{milestone.label}</h3>
                        <p className="text-xl md:text-2xl text-gray-300 mt-4 font-mono">{milestone.subLabel}</p>
                    </motion.div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnSpotReg;
