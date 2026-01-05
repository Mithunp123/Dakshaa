import { supabase } from "../supabase";

/**
 * Event Configuration Service
 * Handles all event CRUD operations for admin panel
 */

// Cache configuration - use localStorage for persistent cache across sessions
const EVENTS_CACHE_KEY = 'dakshaa_events_cache';
const EVENTS_STATIC_KEY = 'dakshaa_events_static'; // For instant display
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for full cache
const STATIC_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for static event data

/**
 * Clear the events cache - useful when events are updated
 */
export const clearEventsCache = () => {
  try {
    localStorage.removeItem(EVENTS_CACHE_KEY);
    localStorage.removeItem(EVENTS_STATIC_KEY);
    console.log('Events cache cleared');
    return true;
  } catch (error) {
    console.warn('Failed to clear events cache:', error);
    return false;
  }
};

/**
 * Get cached events instantly (for immediate display)
 * Returns null if no cache available
 */
export const getCachedEvents = () => {
  try {
    const cached = localStorage.getItem(EVENTS_STATIC_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return data || null;
    }
  } catch (e) {
    // Ignore cache errors
  }
  return null;
};

/**
 * Get all events with registration statistics (with caching for static data)
 * Static event data is cached, but registration counts are always fetched fresh
 * @returns {Promise<Array>} List of events with current_registrations count
 */
export const getEventsWithStats = async () => {
  try {
    let eventsData = null;
    let fromCache = false;
    
    // Try to get from localStorage first (persistent cache)
    const cachedData = localStorage.getItem(EVENTS_CACHE_KEY);
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION && data && data.length > 0) {
          console.log(`Using cached event data (${Math.round(age / 1000)}s old)`);
          eventsData = data;
          fromCache = true;
        }
      } catch (e) {
        console.warn('Failed to parse cache, fetching fresh data...');
      }
    }
    
    // If no valid cache, fetch events from database
    if (!eventsData) {
      console.log('Fetching events from database...');
      
      const { data: fetchedEvents, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (eventsError || !fetchedEvents) {
        console.error('Failed to fetch events:', eventsError);
        
        // Try to use stale static cache as fallback
        const staleCache = localStorage.getItem(EVENTS_STATIC_KEY);
        if (staleCache) {
          try {
            const { data } = JSON.parse(staleCache);
            if (data && data.length > 0) {
              console.warn('Using stale cache due to fetch error');
              return {
                success: true,
                data: data.map(e => ({ ...e, current_registrations: 0, registered_count: 0 })),
                error: null,
                fromCache: true,
                stale: true
              };
            }
          } catch (e) {}
        }
        
        return {
          success: false,
          data: [],
          error: eventsError?.message || 'Failed to load events'
        };
      }
      
      eventsData = fetchedEvents;
      
      // Cache the static event data in localStorage (persists across sessions)
      try {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify({
          data: eventsData,
          timestamp: Date.now()
        }));
        // Also save static version for instant display
        localStorage.setItem(EVENTS_STATIC_KEY, JSON.stringify({
          data: eventsData,
          timestamp: Date.now()
        }));
        console.log('Event data cached to localStorage');
      } catch (cacheError) {
        console.warn('Failed to cache events:', cacheError);
      }
    }

    console.log(`Processing ${eventsData.length} events`);
    
    // If no events found, return early
    if (eventsData.length === 0) {
      return {
        success: true,
        data: [],
        error: null
      };
    }
    
    // Check which column name to use for event ID (id vs event_id)
    const hasUuidId = eventsData.length > 0 && 'id' in eventsData[0];
    const idField = hasUuidId ? 'id' : 'event_id';
    
    // ALWAYS fetch fresh registration counts (this is quick)
    console.log('Fetching fresh registration counts...');
    try {
      // Get all registration counts in a single query for efficiency
      const { data: allRegistrations, error: regError } = await supabase
        .from('event_registrations_config')
        .select('event_id');
      
      if (!regError && allRegistrations) {
        // Count registrations per event
        const countMap = {};
        allRegistrations.forEach(reg => {
          countMap[reg.event_id] = (countMap[reg.event_id] || 0) + 1;
        });
        
        // Merge counts with event data
        const eventsWithStats = eventsData.map(event => {
          const eventId = event[idField];
          const count = countMap[eventId] || 0;
          return {
            ...event,
            current_registrations: count,
            registered_count: count
          };
        });
        
        console.log(`Loaded ${eventsWithStats.length} events with fresh registration counts`);
        
        return {
          success: true,
          data: eventsWithStats,
          error: null,
          fromCache: fromCache
        };
      }
    } catch (countError) {
      console.warn('Failed to fetch registration counts:', countError);
    }
    
    // Fallback: return events with 0 counts if registration fetch fails
    const eventsWithDefaults = eventsData.map(event => ({
      ...event,
      current_registrations: 0,
      registered_count: 0
    }));
    
    return {
      success: true,
      data: eventsWithDefaults,
      error: null,
      fromCache: fromCache
    };
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
  getCachedEvents,
  clearEventsCache,
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
