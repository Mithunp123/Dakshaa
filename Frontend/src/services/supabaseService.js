import { supabase } from "../supabase";

// Helper function to check if a string is a valid UUID
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const supabaseService = {
  // Fetch all active events
  async getEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("is_active", true);
    if (error) throw error;
    return data;
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

      // Convert event_keys to UUIDs by looking up in events_config
      let resolvedUUIDs = [...uuids];
      
      if (eventKeys.length > 0) {
        const { data: keyLookup } = await supabase
          .from("events_config")
          .select("id, event_key")
          .in("event_key", eventKeys);
        
        if (keyLookup) {
          const keyToUUID = {};
          keyLookup.forEach(e => { keyToUUID[e.event_key] = e.id; });
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

      // Fetch event names for the new event IDs
      const { data: eventsData } = await supabase
        .from("events_config")
        .select("id, name")
        .in("id", newEventIds);

      // Create a map of event_id to event_name
      const eventNameMap = {};
      (eventsData || []).forEach((event) => {
        eventNameMap[event.id] = event.name;
      });

      // Include event_name along with other columns
      const registrations = newEventIds.map((eventId) => ({
        user_id: userId,
        event_id: eventId,
        event_name: eventNameMap[eventId] || null,
        payment_status: "PAID",
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
      .select("*, events_config(*)")
      .eq("user_id", userId);
    if (error) throw error;
    return data;
  },

  // Team methods
  async getUserTeams(userId) {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select(
          `
          *,
          teams (
            *,
            events (*)
          )
        `
        )
        .eq("user_id", userId);

      if (error) {
        console.warn("Teams table may not exist:", error.message);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // For each team, fetch all members
      const teamsWithMembers = await Promise.all(
        data.map(async (membership) => {
          const { data: members, error: membersError } = await supabase
            .from("team_members")
            .select(
              `
            *,
            profiles:user_id (full_name, email)
          `
            )
            .eq("team_id", membership.team_id);

          if (membersError) {
            console.warn("Error fetching team members:", membersError.message);
            return {
              ...membership.teams,
              role: membership.role,
              members: [],
            };
          }

          return {
            ...membership.teams,
            role: membership.role,
            members: (members || []).map((m) => ({
              name: m.profiles?.full_name || "Unknown",
              email: m.profiles?.email || "N/A",
              role: m.role,
              status: m.status,
            })),
          };
        })
      );

      return teamsWithMembers;
    } catch (err) {
      console.error("Error in getUserTeams:", err);
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
