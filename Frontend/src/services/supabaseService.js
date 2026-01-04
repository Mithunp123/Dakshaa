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

  // Get user registrations
  async getUserRegistrations(userId) {
    const { data, error } = await supabase
      .from("event_registrations_config")
      .select("*, events:event_id(id, name, category, price, event_date, start_time, venue, description)")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  // Team methods
  async getUserTeams(userId) {
    try {
      // First, get team IDs where user is a member
      const { data: teamMemberships, error: memberError } = await supabase
        .from("team_members")
        .select("team_id, role, status")
        .eq("user_id", userId)
        .in("status", ["active", "joined"]);

      if (memberError) {
        console.warn("Error fetching team memberships:", memberError.message);
        return [];
      }

      if (!teamMemberships || teamMemberships.length === 0) {
        return [];
      }

      // Get team IDs
      const teamIds = teamMemberships.map(tm => tm.team_id);

      // Fetch team details separately - use wildcard to get all columns
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .in("id", teamIds);

      if (teamsError) {
        console.warn("Error fetching teams:", teamsError.message);
        return [];
      }

      if (!teams || teams.length === 0) {
        return [];
      }

      // Get event IDs for fetching event details
      const eventIds = [...new Set(teams.map(t => t.event_id).filter(Boolean))];

      // Fetch events if there are any event IDs
      let events = [];
      if (eventIds.length > 0) {
        const { data: eventsData } = await supabase
          .from("events")
          .select("id, event_id, name, category, min_team_size, max_team_size")
          .in("event_id", eventIds);
        events = eventsData || [];
      }

      // Fetch all team members for these teams
      const { data: allMembers } = await supabase
        .from("team_members")
        .select(`
          team_id,
          user_id,
          role,
          status,
          created_at,
          profiles (id, full_name, email, roll_no, department, college_name)
        `)
        .in("team_id", teamIds)
        .in("status", ["active", "joined"])
        .order("role", { ascending: false });

      // Build the complete team objects
      const teamsWithDetails = teams.map(team => {
        const membership = teamMemberships.find(tm => tm.team_id === team.id);
        const event = events.find(e => e.event_id === team.event_id);
        const teamMembers = allMembers?.filter(m => m.team_id === team.id) || [];
        
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

        return {
          id: team.id,
          name: team.team_name || team.name || 'Unnamed Team',
          event_id: team.event_id,
          leader_id: team.leader_id || team.created_by,
          max_members: event?.max_team_size || 10,
          is_active: team.is_active !== undefined ? team.is_active : true,
          created_at: team.created_at,
          events: event ? {
            id: event.id,
            title: event.name,
            category: event.category,
            max_team_size: event.max_team_size,
            min_team_size: event.min_team_size
          } : null,
          role: membership?.role || 'member',
          members: flattenedMembers,
          is_registered: false
        };
      });

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
