import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, TicketCheck, TrendingUp, Radio, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../supabase";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";

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

// Flip Card Component removed
// const FlipUnit = ...

const LiveStats = () => {
  const [stats, setStats] = useState({
    users: 0,
    registrations: 0,
    last_updated: null
  });
  const [categoryStats, setCategoryStats] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState(null);
  const [deptEventDetails, setDeptEventDetails] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryEventDetails, setCategoryEventDetails] = useState({});
  const navigate = useNavigate();
  const eventLookupRef = useRef({});

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
      supabase.channel('live-stats').unsubscribe();
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
       const { data, error } = await supabase.rpc("get_live_dept_stats");
       if (!error && data) {
         // Post-processing to merge CSE-AIML into AIML
         const mergedMap = {};
         
         data.forEach(item => {
             let deptName = item.dept;
             // Normalize variants
             if (deptName === 'CSE-AIML' || deptName === 'Aiml') {
                 deptName = 'AIML';
             }
             if (deptName === 'VLSI') {
                 deptName = 'EE(VLSI D&T)';
             }
             
             mergedMap[deptName] = (mergedMap[deptName] || 0) + item.count;
         });

         const processedData = Object.keys(mergedMap)
            .map(key => ({ dept: key, count: mergedMap[key] }))
            .sort((a, b) => b.count - a.count);

         setDeptStats(processedData);
       } else {
         console.warn("RPC dept stats fetch failed, attempting client-side fallback...", error);
         await fetchDeptStatsFallback();
       }
     } catch (error) {
       console.error("Error calling get_live_dept_stats:", error);
       await fetchDeptStatsFallback();
     }
  };

  const fetchDeptStatsFallback = async () => {
    try {
        // Fetch ALL active events to categorize them locally
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, event_id')
            .eq('is_active', true);

        if (eventsError) throw eventsError;

        // Map uuid -> dept name using global helper
        const eventDeptMap = {};
        events.forEach(e => {
            const dept = getDeptFromId(e.event_id);
            if (dept) {
                eventDeptMap[e.id] = dept;
            }
        });

        const targetEventIds = Object.keys(eventDeptMap);

        if (targetEventIds.length === 0) {
            setDeptStats([]);
            return;
        }

        // 2. Fetch paid registrations for these events
        const { data: paidRegs } = await supabase
            .from('event_registrations_config')
            .select('event_id')
            .eq('payment_status', 'PAID')
            .in('event_id', targetEventIds); 

        const counts = {};
        
        (paidRegs || []).forEach(reg => {
            const dept = eventDeptMap[reg.event_id];
            if (dept) {
                counts[dept] = (counts[dept] || 0) + 1;
            }
        });

        const formatted = Object.entries(counts)
            .map(([dept, count]) => ({ dept, count }))
            .sort((a, b) => b.count - a.count);
            
        setDeptStats(formatted);

    } catch (err) {
        console.error("Dept stats fallback failed:", err);
    }
  };

  const fetchDeptEventDetails = async (deptName) => {
    try {
        // Check if we already have this data cached
        if (deptEventDetails[deptName]) {
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
        const { data: registrations } = await supabase
            .from('event_registrations_config')
            .select('event_id')
            .eq('payment_status', 'PAID')
            .in('event_id', eventIds);

        // Count registrations per event
        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        // Format the data
        const eventDetails = deptEvents
            .map(event => ({
                id: event.id,
                name: event.name,
                count: eventCounts[event.id] || 0
            }))
            .filter(e => e.count > 0) // Only show events with registrations
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
        if (!deptEventDetails[deptName]) {
            fetchDeptEventDetails(deptName);
        }
    }
  };

  const fetchCategoryEventDetails = async (categoryName) => {
    try {
        // Check if we already have this data cached
        if (categoryEventDetails[categoryName]) {
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
        const { data: registrations } = await supabase
            .from('event_registrations_config')
            .select('event_id')
            .eq('payment_status', 'PAID')
            .in('event_id', eventIds);

        // Count registrations per event
        const eventCounts = {};
        (registrations || []).forEach(reg => {
            eventCounts[reg.event_id] = (eventCounts[reg.event_id] || 0) + 1;
        });

        // Format the data
        const eventDetails = categoryEvents
            .map(event => ({
                id: event.id,
                name: event.name,
                count: eventCounts[event.id] || 0
            }))
            .filter(e => e.count > 0) // Only show events with registrations
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

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase.rpc("get_live_category_stats");
      
      const processCategoryData = (rawData) => {
        // Initialize counts for required categories
        const finalStats = [
            { category: 'Workshop', count: 0, dbKey: 'workshop' },
            { category: 'Non Tech', count: 0, dbKey: 'non-technical' },
            { category: 'Tech', count: 0, dbKey: 'technical' },
            { category: 'Culturals', count: 0, dbKey: 'cultural' },
            { category: 'Sports', count: 0, dbKey: 'sports' },
            { category: 'Hackathon', count: 0, dbKey: 'hackathon' }
        ];

        // Map DB data to our structure with case-insensitive matching
        if (rawData && Array.isArray(rawData)) {
            rawData.forEach(item => {
                const category = (item.category || '').toLowerCase().trim();
                const count = item.count || 0;
                
                // Case-insensitive category matching
                if (category.includes('workshop') || category === 'workshops') {
                    finalStats[0].count += count;
                } else if (category.includes('non-technical') || category === 'non-tech' || category === 'nontech' || category === 'non tech') {
                    finalStats[1].count += count;
                } else if (category === 'technical' || (category.includes('tech') && !category.includes('non'))) {
                    finalStats[2].count += count;
                } else if (category.includes('cultural') || category === 'culturals') {
                    finalStats[3].count += count;
                } else if (category.includes('sport') || category === 'sports') {
                    finalStats[4].count += count;
                } else if (category.includes('hackathon') || category === 'hack') {
                    finalStats[5].count += count;
                }
            });
        }
        
        return finalStats;
      };

      if (!error && data) {
        setCategoryStats(processCategoryData(data));
      } else {
        await fetchCategoryStatsFallback();
      }
    } catch (error) {
      console.error("Error calling get_live_category_stats:", error);
      await fetchCategoryStatsFallback();
    }
  };

  const fetchCategoryStatsFallback = async () => {
    try {
      // 1. Fetch all active events with their categories
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, category')
        .eq('is_active', true);
        
      if (eventsError) throw eventsError;

      // Map event_id(uuid) -> category
      const eventCategoryMap = {};
      events.forEach(e => {
        eventCategoryMap[e.id] = e.category; // Uses UUID ID now
      });

      // 2. Fetch all paid registrations that belong to students
      /* ... same fallback logic ... */
      
      const { data: joinData, error: joinError } = await supabase
         .from('event_registrations_config')
         .select(`
            event_id,
            profiles!inner ( role )
         `)
         .eq('payment_status', 'PAID')
         .filter('profiles.role', 'eq', 'student');

      let validRegs = [];

      if (!joinError && joinData) {
        validRegs = joinData;
      } else {
         const { data: paidRegs } = await supabase
            .from('event_registrations_config')
            .select('event_id, user_id')
            .eq('payment_status', 'PAID');
            
         // Without profiles join, we can't filter role easily in fallback
         // We'll just take them
         validRegs = paidRegs || [];
      }

      // 4. Aggregate counts
      const counts = {};
      
      validRegs.forEach(reg => {
         const category = eventCategoryMap[reg.event_id];
         if (category) {
            const normalized = category.toLowerCase().trim();
            counts[normalized] = (counts[normalized] || 0) + 1;
         }
      });
      
      // Construct final formatted array with case-insensitive matching
      const workshopCount = (counts['workshop'] || 0) + (counts['workshops'] || 0);
      const nonTechCount = (counts['non-technical'] || 0) + (counts['non-tech'] || 0) + (counts['nontech'] || 0) + (counts['non tech'] || 0);
      const techCount = counts['technical'] || 0;
      const culturalCount = (counts['cultural'] || 0) + (counts['culturals'] || 0);
      const sportsCount = (counts['sports'] || 0) + (counts['sport'] || 0);
      const hackathonCount = (counts['hackathon'] || 0) + (counts['hack'] || 0);
      
       const finalStats = [
            { category: 'Workshop', count: workshopCount },
            { category: 'Non Tech', count: nonTechCount },
            { category: 'Tech', count: techCount },
            { category: 'Culturals', count: culturalCount },
            { category: 'Sports', count: sportsCount },
            { category: 'Hackathon', count: hackathonCount }
        ];

      setCategoryStats(finalStats);
      
    } catch (err) {
      console.error("Category stats fallback failed:", err);
    }
  };

  const fetchInitialStats = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching live stats...");
      // Call the secure RPC function
      const { data, error } = await supabase.rpc('get_live_stats');
      
      if (error) {
        console.error('Error fetching stats via RPC:', error);
        // Fallback to direct count if RPC not available
        await fetchStatsFallback();
      } else {
        console.log("Stats fetched via RPC:", data);
        setStats(data);
      }
    } catch (err) {
      console.error('Error in fetchInitialStats:', err);
      // Try fallback if main try fails
      try {
          await fetchStatsFallback();
      } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatsFallback = async () => {

    try {
        // Fallback method using head count
        // Using event_registrations_config as it seems to be the main table now
        const [usersResult, regsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('event_registrations_config').select('*', { count: 'exact', head: true }).eq('payment_status', 'PAID')
        ]);

        setStats({
        users: usersResult.count || 0,
        registrations: regsResult.count || 0,
        last_updated: new Date().toISOString()
        });
    } catch (error) {
         console.error("Error in fallback:", error);
         // Set zero if everything fails to avoid loading loop
         setStats({ users: 0, registrations: 0, last_updated: new Date().toISOString() });
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Create a channel for both tables
    const channel = supabase.channel('live-stats');

    // Listen for new profiles (students joining)
    channel.on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'profiles' 
      },
      (payload) => {
        console.log('New student onboarded!', payload);
        setStats(prev => ({
          ...prev,
          users: prev.users + 1,
          last_updated: new Date().toISOString()
        }));
        setIsLive(true);
        setTimeout(() => setIsLive(false), 2000);
      }
    );

    // Listen for new registrations (Confirmed/PAID)
    channel.on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'event_registrations_config' 
      },
      (payload) => {
        const oldStatus = payload.old?.payment_status;
        const newStatus = payload.new?.payment_status;

        // Only count if status transitions to PAID (or is new and PAID)
        if (oldStatus !== 'PAID' && newStatus === 'PAID') {
           // Optimistic update
           console.log("Realtime registration detected", payload);
           
           const eventId = payload.new.event_id;
           const meta = eventLookupRef.current[eventId];
           
           setStats(prev => ({
             ...prev,
             registrations: prev.registrations + 1,
             last_updated: new Date().toISOString()
           }));

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
           
           // Background Refresh
           fetchInitialStats();
           fetchCategoryStats();
           fetchDeptStats();
           
           setIsLive(true);
           setTimeout(() => setIsLive(false), 2000);
        }
      }
    );

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscriptions active');
      }
    });
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
      {/* Back Button & Countdown Container - Horizontal Layout */}
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
        className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 md:gap-3 px-4 py-2 md:px-6 md:py-3 bg-red-500/20 border border-red-500/40 rounded-full z-10"
        animate={{ scale: isLive ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Radio className={`w-4 h-4 md:w-5 md:h-5 text-red-500 ${isLive ? 'animate-pulse' : ''}`} />
        <span className="text-red-500 font-bold uppercase tracking-wider text-xs md:text-sm">
          {isLive ? 'UPDATING...' : 'LIVE'}
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
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 w-full flex-grow min-h-0 pb-4">
            {/* Left Column: Big Stats & Categories */}
            <div className="xl:col-span-3 flex flex-col gap-6 h-full min-h-0">
                
                {/* Big Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
                    {/* Students Onboarded Card */}
                    <motion.div
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative group h-full hidden lg:block"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-orange-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 rounded-3xl p-6 h-full flex flex-col justify-center">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center">
                            <Users className="w-8 h-8 text-secondary" />
                            </div>
                        </div>

                        {/* Label */}
                        <h2 className="text-xl font-bold text-gray-300 text-center mb-2 uppercase tracking-wider">
                            Students Joined
                        </h2>

                        {/* Counter */}
                        <div className="text-center">
                            <div className="text-6xl md:text-7xl font-black text-secondary mb-2 tabular-nums">
                            <CountUp 
                                end={stats.users} 
                                duration={2}
                                separator=","
                                preserveValue
                            />
                            </div>
                            <div className="flex items-center justify-center gap-2 text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-base font-semibold">Total Onboarded</span>
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                            background: 'radial-gradient(circle at center, rgba(249,115,22,0.1), transparent 70%)'
                            }}
                        />
                        </div>
                    </motion.div>

                    {/* Total Registrations Card */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="relative group h-full"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-3xl blur-xl opacity-0 group-hover:opacity-75 transition duration-500"></div>
                        
                        <div className="relative bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-3xl p-6 h-full flex flex-col justify-center">
                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center">
                            <TicketCheck className="w-8 h-8 text-primary" />
                            </div>
                        </div>

                        {/* Label */}
                        <h2 className="text-xl font-bold text-gray-300 text-center mb-2 uppercase tracking-wider">
                            Event Registrations
                        </h2>

                        {/* Counter */}
                        <div className="text-center flex flex-col items-center justify-center">
                            <div className="text-6xl md:text-7xl font-black text-primary mb-2 tabular-nums tracking-tight">
                            <CountUp 
                                end={stats.registrations} 
                                duration={2}
                                separator=","
                                preserveValue
                            />
                            </div>
                            <div className="flex items-center justify-center gap-2 text-green-400">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-base font-semibold">Total Seats Filled</span>
                            </div>
                        </div>

                        {/* Glow Effect */}
                        <motion.div
                            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                            background: 'radial-gradient(circle at center, rgba(147,51,234,0.1), transparent 70%)'
                            }}
                        />
                        </div>
                    </motion.div>
                </div>

                {/* Category Stats Grid */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="hidden xl:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0"
                >
                    {categoryStats.map((stat, index) => (
                    <motion.div 
                        key={stat.category}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + (index * 0.1) }}
                        className="relative bg-gray-900 border border-gray-700/50 rounded-2xl p-3 hover:border-primary/30 transition-all group overflow-hidden cursor-pointer hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
                        onClick={() => toggleCategoryExpansion(stat.category)}
                    >
                        <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-40 transition-opacity">
                        <TicketCheck className="w-6 h-6 rotate-[-15deg]" />
                        </div>
                        <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1 h-4 flex items-end group-hover:text-primary transition-colors">{stat.category}</div>
                        <div className="text-xl md:text-3xl font-bold bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent font-mono">
                            <CountUp end={stat.count} duration={2} separator="," />
                        </div>
                    </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* Right Column: Department Leaderboard */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="xl:col-span-2 h-full min-h-0 flex flex-col pl-4"
            >
                 <div className="flex items-center justify-between mb-4 px-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <TrendingUp className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl uppercase tracking-wider italic">Leaderboard</h3>
                            <p className="text-xs text-yellow-500 font-bold tracking-widest uppercase">Live Rankings</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 overflow-y-auto xl:overflow-visible overflow-x-hidden content-start pr-1 max-h-[calc(100vh-250px)] xl:max-h-none scrollbar-hide">
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
                                            <p className="text-gray-400 font-semibold">No events with registrations found</p>
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
                                                                <p className="text-xs text-gray-400">Registrations</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary/30 rounded-lg px-4 py-2 shrink-0">
                                                            <span className="text-2xl font-black text-primary font-mono tabular-nums">
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
                                            <span className="text-gray-300 font-semibold">Total Registrations</span>
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
                                            <p className="text-gray-400 font-semibold">No events with registrations found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {categoryEventDetails[expandedCategory]?.map((event, idx) => (
                                                <motion.div
                                                    key={event.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="group relative bg-gradient-to-br from-gray-900/50 to-black/50 hover:bg-gradient-to-br hover:from-gray-800/70 hover:to-black/70 border border-gray-700/30 hover:border-secondary/30 rounded-xl p-4 transition-all"
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
                                                                <p className="text-xs text-gray-400">Registrations</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-gradient-to-r from-secondary/20 to-orange-600/20 border border-secondary/30 rounded-lg px-4 py-2 shrink-0">
                                                            <span className="text-2xl font-black text-secondary font-mono tabular-nums">
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
                                            <span className="text-gray-300 font-semibold">Total Registrations</span>
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
