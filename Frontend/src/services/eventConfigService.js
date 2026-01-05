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
    console.log('Fetching events with stats...');
    
    // Create a timeout promise (5 seconds)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout - check if events table exists and is accessible')), 5000)
    );
    
    // First, try a simple query without any filters to test connectivity
    console.log('Testing database connectivity...');
    const testPromise = supabase
      .from('events')
      .select('id, event_id, name, title')
      .limit(1);
    
    const { data: testData, error: testError } = await Promise.race([
      testPromise,
      timeoutPromise
    ]).catch(err => ({ data: null, error: err }));
    
    if (testError) {
      console.error('Database connectivity test failed:', testError);
      console.error('Error details:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      // Return empty array with clear error message
      return {
        success: false,
        data: [],
        error: `Database connection failed: ${testError.message}. Please ensure the events table exists in Supabase.`
      };
    }
    
    console.log('Database connection OK, fetching all events...');
    
    // Now fetch all events with timeout
    const eventsPromise = supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    const { data: eventsData, error: eventsError } = await Promise.race([
      eventsPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Events query timeout')), 5000))
    ]).catch(err => ({ data: null, error: err }));

    if (eventsError || !eventsData) {
      console.error('Failed to fetch events:', eventsError);
      return {
        success: false,
        data: [],
        error: eventsError?.message || 'Failed to load events'
      };
    }

    console.log(`Loaded ${eventsData.length} events from database`);
    
    // If no events found, return early
    if (eventsData.length === 0) {
      console.warn('No active events found in database');
      return {
        success: true,
        data: [],
        error: null
      };
    }
    
    // Check which column name to use for event ID (id vs event_id)
    const hasUuidId = eventsData.length > 0 && 'id' in eventsData[0];
    const idField = hasUuidId ? 'id' : 'event_id';
    
    console.log(`Using ${idField} as event identifier`);
    
    // Skip registration counting if it's taking too long - just return events
    // Users can still see events even if counts aren't accurate
    try {
      // Determine which registration table to use (with timeout)
      const testRegPromise = supabase
        .from('event_registrations_config')
        .select('event_id')
        .limit(1);
      
      const { error: testRegError } = await Promise.race([
        testRegPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]).catch(() => ({ error: true }));
      
      const registrationTable = testRegError ? 'registrations' : 'event_registrations_config';
      const registrationIdField = 'event_id';
      
      console.log(`Using ${registrationTable} table for counting registrations`);
      
      // Count registrations for each event (with timeout for each)
      const eventsWithStats = await Promise.all(
        eventsData.map(async (event) => {
          const eventId = event[idField];
          
          try {
            const countPromise = supabase
              .from(registrationTable)
              .select('*', { count: 'exact', head: true })
              .eq(registrationIdField, eventId);
            
            const { count } = await Promise.race([
              countPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000))
            ]).catch(() => ({ count: 0 }));
            
            return {
              ...event,
              current_registrations: count || 0,
              registered_count: count || 0
            };
          } catch (err) {
            // If counting fails, return event with 0 registrations
            return {
              ...event,
              current_registrations: 0,
              registered_count: 0
            };
          }
        })
      );
      
      console.log(`Successfully loaded ${eventsWithStats.length} events with registration counts`);
      
      return {
        success: true,
        data: eventsWithStats,
        error: null
      };
    } catch (countError) {
      // If registration counting fails entirely, return events without counts
      console.warn('Failed to count registrations, returning events without counts:', countError);
      const eventsWithDefaults = eventsData.map(event => ({
        ...event,
        current_registrations: 0,
        registered_count: 0
      }));
      
      return {
        success: true,
        data: eventsWithDefaults,
        error: null
      };
    }
  } catch (error) {
    console.error("Fatal error fetching events:", error);
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
