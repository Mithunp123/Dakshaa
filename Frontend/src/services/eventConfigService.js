import { supabase } from "../supabase";

/**
 * Event Configuration Service
 * Handles all event CRUD operations for admin panel
 */

/**
 * Get all events with registration statistics
 * @returns {Promise<Array>} List of events with current_registrations count
 */
export const getEventsWithStats = async () => {
  try {
    const { data, error } = await supabase.rpc("get_events_with_stats");

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get single event by ID
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} Event details
 */
export const getEventById = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from("events_config")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get event by event_key (for frontend mapping)
 * @param {string} eventKey - Unique event key
 * @returns {Promise<Object>} Event details
 */
export const getEventByKey = async (eventKey) => {
  try {
    const { data, error } = await supabase
      .from("events_config")
      .select("*")
      .eq("event_key", eventKey)
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching event by key:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Check if event is available for registration
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} Availability status and details
 */
export const checkEventAvailability = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc("check_event_availability", {
      p_event_id: eventId
    });

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error checking availability:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Create a new event
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Result with new event ID
 */
export const createEvent = async (eventData) => {
  try {
    const { data, error } = await supabase.rpc("create_event_config", {
      p_event_key: eventData.event_key,
      p_name: eventData.name,
      p_description: eventData.description || null,
      p_price: eventData.price || 0,
      p_type: eventData.type,
      p_capacity: eventData.capacity,
      p_is_open: eventData.is_open !== undefined ? eventData.is_open : true
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.message);
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update an existing event
 * @param {string} eventId - UUID of the event
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result status
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const { data, error } = await supabase.rpc("update_event_config", {
      p_event_id: eventId,
      p_name: updates.name,
      p_description: updates.description || null,
      p_price: updates.price,
      p_type: updates.type,
      p_capacity: updates.capacity,
      p_is_open: updates.is_open
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.message);
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Delete an event (only if no registrations exist)
 * @param {string} eventId - UUID of the event
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc("delete_event_config", {
      p_event_id: eventId
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.message);
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Toggle event open/closed status
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} New status
 */
export const toggleEventStatus = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc("toggle_event_status", {
      p_event_id: eventId
    });

    if (error) throw error;

    if (!data.success) {
      throw new Error(data.message);
    }

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error toggling status:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all open events (for student registration page)
 * @returns {Promise<Array>} List of open events
 */
export const getOpenEvents = async () => {
  try {
    const { data, error } = await supabase
      .from("events_config")
      .select("*")
      .eq("is_open", true)
      .order("name");

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching open events:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Register user for an event
 * @param {string} eventId - UUID of the event
 * @param {Object} registrationData - Registration details
 * @returns {Promise<Object>} Registration record
 */
export const registerForEvent = async (eventId, registrationData) => {
  try {
    // First check availability
    const availCheck = await checkEventAvailability(eventId);
    
    if (!availCheck.success || !availCheck.data.available) {
      throw new Error(availCheck.data.reason || "Event is not available for registration");
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Fetch event name
    const { data: eventData } = await supabase
      .from("events_config")
      .select("name")
      .eq("id", eventId)
      .single();

    // Create registration with event_name
    const { data, error } = await supabase
      .from("event_registrations_config")
      .insert([
        {
          event_id: eventId,
          event_name: eventData?.name || null,
          user_id: user.id,
          team_name: registrationData.team_name || null,
          team_members: registrationData.team_members || null,
          payment_status: 'PENDING',
          payment_amount: availCheck.data.price
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error registering for event:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's registrations
 * @param {string} userId - UUID of the user (optional, defaults to current user)
 * @returns {Promise<Array>} List of user registrations
 */
export const getUserRegistrations = async (userId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("event_registrations_config")
      .select(`
        *,
        event:events_config(*)
      `)
      .eq("user_id", targetUserId)
      .order("registered_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get registrations for a specific event (admin only)
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Array>} List of registrations
 */
export const getEventRegistrations = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from("event_registrations_config")
      .select(`
        *,
        user:profiles(full_name, email, department, college_name, roll_no)
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Update registration payment status
 * @param {string} registrationId - UUID of the registration
 * @param {string} paymentStatus - New payment status
 * @param {Object} paymentDetails - Additional payment details
 * @returns {Promise<Object>} Updated registration
 */
export const updateRegistrationPayment = async (
  registrationId,
  paymentStatus,
  paymentDetails = {}
) => {
  try {
    const { data, error } = await supabase
      .from("event_registrations_config")
      .update({
        payment_status: paymentStatus,
        transaction_id: paymentDetails.transaction_id || null,
        ...paymentDetails
      })
      .eq("id", registrationId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error updating payment:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  getEventsWithStats,
  getEventById,
  getEventByKey,
  checkEventAvailability,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleEventStatus,
  getOpenEvents,
  registerForEvent,
  getUserRegistrations,
  getEventRegistrations,
  updateRegistrationPayment
};
