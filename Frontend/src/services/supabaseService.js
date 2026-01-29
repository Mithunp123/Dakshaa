import { supabase } from "../supabase";

// Helper function to check if a string is a valid UUID
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const supabaseService = {
  // Fetch all active events with dynamic registration counts
  async getEvents() {
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true);
    
    if (error) throw error;
    
    // Get actual registration counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        // Count registrations for this event using event_id
        const { count } = await supabase
          .from("event_registrations_config")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);
        
        return {
          ...event,
          // Convert TEXT fields to numbers for the UI
          capacity: parseInt(event.capacity) || 100,
          current_registrations: count || 0,
          price: event.price,
          min_team_size: parseInt(event.min_team_size) || 1,
          max_team_size: parseInt(event.max_team_size) || 10,
          is_team_event: event.is_team_event === 'true' || event.is_team_event === true,
          is_open: event.is_open === 'true' || event.is_open === true || event.is_open !== 'false'
        };
      })
    );
    
    return eventsWithCounts;
  },

  // Fetch all active combos
  async getCombos() {
    const { data, error } = await supabase
      .from("combos")
      .select("*, combo_rules(*)")
      .eq("is_active", true);
    if (error) throw error;
    return data;
  },

  // Register for events (Individual or Combo)
  // Handles both UUID ids and text event_keys
  async registerEvents(userId, eventIds, comboId = null, paymentId = null) {
    try {
      // Separate UUIDs from text event_keys
      const uuids = eventIds.filter(id => isValidUUID(id));
      const eventKeys = eventIds.filter(id => !isValidUUID(id));

      // Convert event_keys to UUIDs by looking up in events table
      let resolvedUUIDs = [...uuids];
      
      if (eventKeys.length > 0) {
        const { data: keyLookup } = await supabase
          .from("events")
          .select("id, event_key, event_id")
          .or(`event_key.in.(${eventKeys.join(',')}),event_id.in.(${eventKeys.join(',')})`);
        
        if (keyLookup) {
          const keyToUUID = {};
          keyLookup.forEach(e => { 
            if (e.event_key) keyToUUID[e.event_key] = e.id;
            if (e.event_id) keyToUUID[e.event_id] = e.id;
          });
          eventKeys.forEach(key => {
            if (keyToUUID[key]) {
              resolvedUUIDs.push(keyToUUID[key]);
            }
          });
        }
      }

      if (resolvedUUIDs.length === 0) {
        throw new Error("No valid events found to register");
      }

      // Check if user is already registered for any of these events
      const { data: existingRegs } = await supabase
        .from("event_registrations_config")
        .select("event_id")
        .eq("user_id", userId)
        .in("event_id", resolvedUUIDs);

      // Filter out already registered events
      const alreadyRegistered = existingRegs?.map((r) => r.event_id) || [];
      const newEventIds = resolvedUUIDs.filter(
        (id) => !alreadyRegistered.includes(id)
      );

      if (newEventIds.length === 0) {
        throw new Error("You are already registered for all selected events!");
      }

      // Fetch event names for the new event IDs from events table
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, name, event_name, title")
        .in("id", newEventIds);

      // Create a map of event_id to event_name
      const eventNameMap = {};
      (eventsData || []).forEach((event) => {
        eventNameMap[event.id] = event.name || event.event_name || event.title;
      });

      // Include event_name along with other columns
      const registrations = newEventIds.map((eventId) => ({
        user_id: userId,
        event_id: eventId,
        event_name: eventNameMap[eventId] || null,
        payment_status: paymentId ? "PAID" : "PENDING", // PENDING initially, PAID when payment confirmed
        transaction_id: paymentId || null, // Set transaction ID when payment is processed
      }));

      console.log("Attempting to insert registrations:", registrations);

      const { data, error } = await supabase
        .from("event_registrations_config")
        .insert(registrations)
        .select();

      if (error) {
        // Handle duplicate key error gracefully
        if (error.code === "23505") {
          throw new Error("You are already registered for this event!");
        }
        console.error("Supabase insert error:", error);
        throw error;
      }

      console.log("Registration successful:", data);
      return data;
    } catch (err) {
      console.error("Registration service error:", err);
      throw err;
    }
  },

  // Get user registrations (with caching for performance)
  async getUserRegistrations(userId, forceRefresh = false) {
    // Check sessionStorage cache first (60 second cache)
    const cacheKey = `user_registrations_${userId}`;
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60000) { // 60 seconds
            console.log('📋 Using cached registrations');
            return data;
          }
        }
      } catch (e) {}
    }

    // First fetch registrations
    const { data: registrations, error } = await supabase
      .from("event_registrations_config")
      .select("*")
      .eq("user_id", userId);
      
    if (error) throw error;
    if (!registrations || registrations.length === 0) return [];
    
    // Get unique event IDs (could be UUID or text)
    const eventIds = [...new Set(registrations.map(r => r.event_id).filter(Boolean))];
    
    if (eventIds.length === 0) return registrations;
    
    // Fetch events matching either id (UUID) or event_id (text)
    const { data: events } = await supabase
      .from("events")
      .select("id, event_id, name, title, category, price, event_date, start_time, venue, description")
      .or(`id.in.(${eventIds.map(id => `"${id}"`).join(',')}),event_id.in.(${eventIds.map(id => `"${id}"`).join(',')})`);
    
    // Create lookup maps
    const eventsById = {};
    const eventsByTextId = {};
    (events || []).forEach(e => {
      eventsById[e.id] = e;
      if (e.event_id) eventsByTextId[e.event_id] = e;
    });
    
    // Attach event data to registrations
    const result = registrations.map(reg => ({
      ...reg,
      events: eventsById[reg.event_id] || eventsByTextId[reg.event_id] || null
    }));
    
    // Cache the result
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }));
    } catch (e) {}
    
    return result;
  },

  // Team methods
  async getUserTeams(userId) {
    try {
      // APPROACH 1: Get teams where user is leader/creator (avoids RLS recursion on team_members)
      // For owned teams, show active ones in main list but keep inactive for management
      const { data: ownedTeams, error: ownedError } = await supabase
        .from("teams")
        .select("*")
        .or(`leader_id.eq.${userId},created_by.eq.${userId}`);

      if (ownedError) {
        console.warn("Error fetching owned teams:", ownedError.message);
      }

      // APPROACH 2: Try to get team memberships (may fail due to RLS, but try anyway)
      let memberTeamIds = [];
      try {
        const { data: teamMemberships, error: memberError } = await supabase
          .from("team_members")
          .select("team_id, role, status")
          .eq("user_id", userId)
          .in("status", ["active", "joined"]);

        if (!memberError && teamMemberships) {
          memberTeamIds = teamMemberships.map(tm => tm.team_id);
        } else if (memberError) {
          console.warn("Error fetching team memberships (RLS may be blocking):", memberError.message);
        }
      } catch (e) {
        console.warn("team_members query failed:", e.message);
      }

      // Combine owned teams with member teams
      const ownedTeamIds = (ownedTeams || []).map(t => t.id);
      const allTeamIds = [...new Set([...ownedTeamIds, ...memberTeamIds])];

      if (allTeamIds.length === 0) {
        console.log("No teams found for user:", userId);
        return [];
      }

      // Fetch all teams by ID (may include teams not in ownedTeams if membership worked)
      let teams = ownedTeams || [];
      if (memberTeamIds.length > 0) {
        const missingTeamIds = memberTeamIds.filter(id => !ownedTeamIds.includes(id));
        if (missingTeamIds.length > 0) {
          // For non-owned teams (member only), still show active ones
          const { data: memberTeams } = await supabase
            .from("teams")
            .select("*")
            .in("id", missingTeamIds)
            .eq("is_active", true);
          if (memberTeams) {
            teams = [...teams, ...memberTeams];
          }
        }
      }
      
      console.log("Teams before filter:", teams.map(t => ({ id: t.id, name: t.team_name, is_active: t.is_active })));

      // Filter teams: Only show active teams in dashboard
      // This prevents teams created during payment (but payment not completed) from showing
      teams = teams.filter(team => team.is_active === true);
      
      console.log("Teams after is_active filter:", teams.map(t => ({ id: t.id, name: t.team_name, is_active: t.is_active })));

      if (!teams || teams.length === 0) {
        return [];
      }

      console.log("Found teams:", teams.length);

      // Get event IDs for fetching event details
      const eventIds = [...new Set(teams.map(t => t.event_id).filter(Boolean))];

      // Fetch events if there are any event IDs
      let events = [];
      if (eventIds.length > 0) {
        // Handle both UUID and text event_ids
        const quotedIds = eventIds.map(id => `"${id}"`).join(',');
        const { data: eventsData, error: eventsErr } = await supabase
          .from("events")
          .select("id, event_id, name, title, category, min_team_size, max_team_size")
          .or(`event_id.in.(${quotedIds}),id.in.(${quotedIds})`);
          
        if (eventsErr) {
           console.warn("Failed to fetch events:", eventsErr.message);
           // Fallback: try UUID match
           const { data: eData } = await supabase.from("events").select("*").in("id", eventIds);
           if (eData) events = eData;
        } else {
           events = eventsData || [];
        }
      }

      // Fetch all team members for these teams (may fail due to RLS)
      let allMembers = [];
      try {
        const { data: membersData, error: membersErr } = await supabase
          .from("team_members")
          .select(`
            team_id,
            user_id,
            role,
            status,
            created_at,
            profiles (id, full_name, email, roll_no, department, college_name)
          `)
          .in("team_id", allTeamIds)
          .in("status", ["active", "joined"])
          .order("role", { ascending: false });

        if (!membersErr && membersData) {
          allMembers = membersData;
        }
      } catch (e) {
        console.warn("team_members detailed query failed:", e.message);
      }
      
      // Fetch leader profiles for teams where leader might not be in team_members yet
      const leaderIds = [...new Set(teams.map(t => t.leader_id || t.created_by).filter(Boolean))];
      let leaderProfiles = {};
      if (leaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, college_name, department, roll_no")
          .in("id", leaderIds);
        
        if (profiles) {
          profiles.forEach(p => {
            leaderProfiles[p.id] = p;
          });
        }
      }

      // Build the complete team objects
      const teamsWithDetails = teams.map(team => {
        const isLeader = team.leader_id === userId || team.created_by === userId;
        const event = events.find(e => e.event_id === team.event_id || e.id === team.event_id);
        const teamMembers = allMembers?.filter(m => m.team_id === team.id) || [];
        const leaderId = team.leader_id || team.created_by;
        const leaderProfile = leaderProfiles[leaderId];
        
        // Flatten member data structure for easier access in UI
        const flattenedMembers = teamMembers.map(member => ({
          user_id: member.user_id,
          role: member.role,
          status: member.status,
          created_at: member.created_at,
          // Flatten profile data
          id: member.profiles?.id,
          name: member.profiles?.full_name || 'Unknown',
          email: member.profiles?.email || '',
          roll_no: member.profiles?.roll_no || '',
          department: member.profiles?.department || '',
          college: member.profiles?.college_name || ''
        }));

        // Determine user's role
        const userMember = teamMembers.find(m => m.user_id === userId);
        const userRole = isLeader ? 'leader' : (userMember?.role || 'member');
        
        // Check if leader is in members list
        const leaderInMembers = flattenedMembers.some(m => m.user_id === leaderId && m.role === 'leader');
        
        // Build final members list - ensure leader is always included with proper info
        let finalMembers = flattenedMembers;
        if (!leaderInMembers && leaderId) {
          // Add leader at the beginning with their profile info
          const leaderMember = {
            user_id: leaderId,
            role: 'leader',
            status: 'joined',
            name: leaderProfile?.full_name || 'Team Leader',
            email: leaderProfile?.email || '',
            roll_no: leaderProfile?.roll_no || '',
            department: leaderProfile?.department || '',
            college: leaderProfile?.college_name || ''
          };
          finalMembers = [leaderMember, ...flattenedMembers];
        } else if (leaderInMembers) {
          // Update leader info if we have better profile data
          finalMembers = flattenedMembers.map(m => {
            if (m.user_id === leaderId && leaderProfile) {
              return {
                ...m,
                name: leaderProfile.full_name || m.name,
                email: leaderProfile.email || m.email,
                college: leaderProfile.college_name || m.college
              };
            }
            return m;
          });
        }

        return {
          id: team.id,
          name: team.team_name || team.name || 'Unnamed Team',
          event_id: team.event_id,
          leader_id: leaderId,
          max_members: team.max_members || event?.max_team_size || 10,  // Use team's max_members first
          is_active: team.is_active !== undefined ? team.is_active : true,
          created_at: team.created_at,
          events: event ? {
            id: event.id,
            event_id: event.event_id,
            title: event.name || event.title,
            category: event.category,
            max_team_size: event.max_team_size,
            min_team_size: event.min_team_size
          } : null,
          role: userRole,
          members: finalMembers,
          is_registered: false
        };
      });
      
      // Debug: Log team details
      console.log('Teams with details:', teamsWithDetails.map(t => ({
        name: t.name,
        max_members: t.max_members,
        members_count: t.members?.length,
        leader_id: t.leader_id,
        has_leader_in_members: t.members?.some(m => m.role === 'leader')
      })));

      return teamsWithDetails;
    } catch (error) {
      console.error("Error fetching user teams:", error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  },

  // Admin: Update event capacity/price
  async updateEvent(eventId, updates) {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("event_id", eventId)
      .select();
    if (error) throw error;
    return data;
  },

  // Admin: Get registration counts
  async getRegistrationStats() {
    const { data, error } = await supabase
      .from("registrations")
      .select("event_id, count()", { count: "exact", head: false })
      .group("event_id");
    if (error) throw error;
    return data;
  },
};
