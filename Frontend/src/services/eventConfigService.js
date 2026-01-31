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

// Track when a fetch started to prevent race conditions
let currentFetchTimestamp = 0;

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
    // First try the main events cache (used by getEventsWithStats)
    const cached = localStorage.getItem(EVENTS_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Return cache if it's less than 15 minutes old
      if (data?.length > 0 && (Date.now() - timestamp) < 15 * 60 * 1000) {
        console.log('⚡ getCachedEvents: Found valid cache');
        return data;
      }
    }
    // Fallback to static cache
    const staticCached = localStorage.getItem(EVENTS_STATIC_KEY);
    if (staticCached) {
      const { data } = JSON.parse(staticCached);
      return data || null;
    }
  } catch (e) {
    console.warn('getCachedEvents error:', e);
  }
  return null;
};

/**
 * Get all events with registration statistics (OPTIMIZED with smart caching)
 * Uses cache-first strategy with background refresh for best performance
 * @param {boolean} forceRefresh - Force bypass cache
 * @returns {Promise<Array>} List of events with current_registrations count
 */
export const getEventsWithStats = async (forceRefresh = false) => {
  // Record when this fetch started to prevent race conditions
  const fetchStartTime = Date.now();
  currentFetchTimestamp = fetchStartTime;
  
  try {
    console.log('🔄 Fetching events with stats...');
    
    // Step 1: Check cache first (instant load on refresh)
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(EVENTS_CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          // If cache is less than 10 minutes old, use it
          if (age < CACHE_DURATION && data?.length > 0) {
            console.log(`✅ Using cached events (${Math.round(age / 1000)}s old)`);
            
            // Background refresh if cache is older than 2 minutes
            if (age > 2 * 60 * 1000) {
              console.log('🔄 Background refresh triggered...');
              setTimeout(() => getEventsWithStats(true), 100);
            }
            
            return {
              success: true,
              data: data,
              error: null,
              fromCache: true,
              cacheAge: age
            };
          }
        }
      } catch (e) {
        console.warn('Cache read error:', e);
      }
    }
    
    // Step 2: Fetch fresh data from database
    const { data: fetchedEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (eventsError || !fetchedEvents) {
      console.error('❌ Failed to fetch events:', eventsError);
      
      // Fallback to stale cache if available
      try {
        const staleCache = localStorage.getItem(EVENTS_CACHE_KEY);
        if (staleCache) {
          const { data } = JSON.parse(staleCache);
          console.warn('⚠️ Using stale cache due to fetch error');
          return { success: true, data, error: null, fromCache: true, stale: true };
        }
      } catch (e) {}
      
      return {
        success: false,
        data: [],
        error: eventsError?.message || 'Failed to load events'
      };
    }

    console.log(`✅ Fetched ${fetchedEvents.length} events from database`);
    
    // If no events found, return early
    if (fetchedEvents.length === 0) {
      return {
        success: true,
        data: [],
        error: null
      };
    }
    
    // Step 3: Normalize event data - convert TEXT fields to proper types
    const eventsData = fetchedEvents.map(event => ({
      ...event,
      price: parseFloat(event.price) || 0,
      capacity: parseInt(event.capacity) || 100,
      current_registrations: 0, // Will be updated below
      min_team_size: parseInt(event.min_team_size) || 1,
      max_team_size: parseInt(event.max_team_size) || 1,
      is_team_event: event.is_team_event === true || event.is_team_event === 'true',
      is_open: event.is_open === true || event.is_open === 'true' || event.is_open === undefined,
      is_active: event.is_active === true || event.is_active === 'true' || event.is_active === undefined
    }));
    
    // Step 4: Fetch PAID registration counts via BATCHED RPC (1 call vs N calls)
    console.log('🔄 Fetching registration counts via BATCH RPC...');
    
    const eventIds = eventsData.map(e => e.id);
    let countMap = {};
    
    try {
      // Try batch RPC first (much faster)
      const { data: batchStats, error: batchError } = await supabase.rpc('get_batch_event_stats', { 
        p_event_ids: eventIds 
      });
      
      if (batchError) {
        console.warn('⚠️ Batch RPC failed, falling back to individual calls:', batchError.message);
        throw batchError; // Fall back to individual calls
      }
      
      if (batchStats && Array.isArray(batchStats)) {
        countMap = Object.fromEntries(
          batchStats.map(stat => [stat.event_id, stat.registered || 0])
        );
        console.log('✅ Batch stats fetched successfully');
      }
    } catch (batchErr) {
      // Fallback: Individual RPC calls (legacy support)
      console.log('🔄 Using fallback individual RPC calls...');
      const statsResponses = await Promise.all(
        eventsData.map(async (event) => {
          try {
            const { data, error } = await supabase.rpc('get_event_stats', { p_event_id: event.id });
            if (error) {
              console.warn(`⚠️ RPC get_event_stats failed for ${event.name}:`, error.message);
              return { id: event.id, registered: 0 };
            }
            const registered = (data && typeof data.registered === 'number') ? data.registered : 0;
            return { id: event.id, registered };
          } catch (e) {
            console.warn(`⚠️ RPC get_event_stats exception for ${event.name}:`, e.message);
            return { id: event.id, registered: 0 };
          }
        })
      );
      countMap = Object.fromEntries(statsResponses.map(r => [r.id, r.registered]));
    }

    console.log('📊 Registration counts:', countMap);

    // Step 5: Merge counts with event data
    const eventsWithStats = eventsData.map(event => {
      const count = countMap[event.id] || 0;
      return {
        ...event,
        current_registrations: count,
        registered_count: count
      };
    });
    
    // Step 6: Cache the result (only if this is still the latest fetch)
    try {
      // Prevent race condition: only update cache if no newer fetch has started
      if (currentFetchTimestamp === fetchStartTime) {
        localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify({
          data: eventsWithStats,
          timestamp: Date.now()
        }));
        console.log('💾 Events cached successfully');
      } else {
        console.log('⏭️ Skipping cache update - newer fetch in progress');
      }
    } catch (e) {
      console.warn('Failed to cache events:', e);
    }
    
    console.log(`✅ Loaded ${eventsWithStats.length} events with fresh registration counts`);
    
    return {
      success: true,
      data: eventsWithStats,
      error: null,
      fromCache: false
    };
  } catch (error) {
    console.error("❌ Fatal error fetching events:", error);
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
 * Helper: Convert value to boolean safely
 */
const toBool = (val) => {
  if (typeof val === 'boolean') return val;
  if (val === null || val === undefined) return false;
  return String(val).toLowerCase() === 'true' || val === 1 || val === '1';
};

/**
 * Helper: Convert to safe integer string
 */
const toIntStr = (val, defaultVal = '1') => {
  if (val === null || val === undefined || val === '') return defaultVal;
  return String(val);
};

/**
 * Update an existing event - Direct table update following Python reference
 * @param {string} eventId - UUID of the event
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result status
 */
export const updateEvent = async (eventId, updates) => {
  try {
    // Build update object with proper type conversion
    const updateData = {
      name: updates.name,
      description: updates.description,
      venue: updates.venue,
      category: updates.category,
      event_type: updates.event_type,
      price: String(updates.price || '0'),
      capacity: toIntStr(updates.capacity, '100'),
      is_team_event: toBool(updates.is_team_event || false),
      min_team_size: toIntStr(updates.min_team_size, '1'),
      max_team_size: toIntStr(updates.max_team_size, '1'),
      is_open: toBool(updates.is_open !== undefined ? updates.is_open : true),
      is_active: toBool(updates.is_active !== undefined ? updates.is_active : true),
      current_status: updates.current_status || 'upcoming',
      event_date: updates.event_date,
      start_time: updates.start_time,
      end_time: updates.end_time,
      coordinator_name: updates.coordinator_name,
      coordinator_contact: updates.coordinator_contact,
      type: updates.type,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values to avoid clearing data
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select();

    if (error) throw error;

    // Clear cache after update
    clearEventsCache();

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : null,
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
 * Delete an event - Direct table delete following Python reference
 * @param {string} eventId - UUID of the event
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .select();

    if (error) throw error;

    // Clear cache after delete
    clearEventsCache();

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : null,
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
 * Toggle event open/closed status - Direct table update
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} New status
 */
export const toggleEventStatus = async (eventId) => {
  try {
    // First get current status
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select('is_open')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the status
    const newStatus = !currentEvent.is_open;

    const { data, error } = await supabase
      .from('events')
      .update({ 
        is_open: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select();

    if (error) throw error;

    // Clear cache after update
    clearEventsCache();

    return {
      success: true,
      data: { is_open: newStatus },
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
 * Update status for multiple events (bulk operation)
 * @param {Array} eventIds - List of event IDs to update
 * @param {boolean} isOpen - New status
 * @returns {Promise<Object>} Success status
 */
export const updateEventsStatus = async (eventIds, isOpen) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update({ 
        is_open: isOpen,
        updated_at: new Date().toISOString()
      })
      .in('id', eventIds)
      .select();

    if (error) throw error;

    // Clear cache to ensure UI updates
    clearEventsCache();

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error bulk updating status:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get event statistics - Following Python reference
 * @returns {Promise<Object>} Event statistics
 */
export const getEventStats = async () => {
  try {
    const { data: allEvents, error } = await supabase
      .from('events')
      .select('category, current_status, is_open, is_active');

    if (error) throw error;

    const stats = {
      total_events: 0,
      technical: 0,
      non_technical: 0,
      workshops: 0,
      cultural: 0,
      sports: 0,
      upcoming: 0,
      ongoing: 0,
      completed: 0,
      open_events: 0,
      active_events: 0
    };

    allEvents.forEach(event => {
      stats.total_events += 1;

      const category = String(event.category || '').toLowerCase().trim();
      const status = event.current_status || '';

      // Category counts
      if (category === 'technical') {
        stats.technical += 1;
      } else if (category === 'non-technical' || category === 'non tech') {
        stats.non_technical += 1;
      } else if (category === 'workshop') {
        stats.workshops += 1;
      } else if (category === 'cultural') {
        stats.cultural += 1;
      } else if (category === 'sports') {
        stats.sports += 1;
      }

      // Status counts
      if (status === 'upcoming') {
        stats.upcoming += 1;
      } else if (status === 'ongoing') {
        stats.ongoing += 1;
      } else if (status === 'completed') {
        stats.completed += 1;
      }

      // Additional counts
      if (event.is_open) stats.open_events += 1;
      if (event.is_active) stats.active_events += 1;
    });

    return {
      success: true,
      data: stats,
      error: null
    };
  } catch (error) {
    console.error("Error fetching event stats:", error);
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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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

    // Invalidate caches
    clearUserRegistrationsCache(user.id);
    clearEventsCache(); 

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
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
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

    if (data && data.user_id) {
       clearUserRegistrationsCache(data.user_id);
    }
    clearEventsCache();

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

// Cache for user registered event IDs
const REGISTERED_IDS_CACHE_KEY = 'dakshaa_registered_ids';
const REGISTERED_IDS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

/**
 * Get all event IDs that the user has already registered for (CACHED)
 * @param {string} userId - User ID
 * @param {boolean} forceRefresh - Force bypass cache
 * @returns {Promise<Set<string>>} Set of event IDs user is registered for
 */
export const getUserRegisteredEventIds = async (userId, forceRefresh = false) => {
  try {
    if (!userId) {
      return new Set();
    }

    // Check cache first
    if (!forceRefresh) {
      try {
        const cached = sessionStorage.getItem(`${REGISTERED_IDS_CACHE_KEY}_${userId}`);
        if (cached) {
          const { ids, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age < REGISTERED_IDS_CACHE_DURATION && ids?.length >= 0) {
            console.log(`📋 Using cached registered IDs (${Math.round(age / 1000)}s old)`);
            return new Set(ids);
          }
        }
      } catch (e) {
        console.warn('Cache read error for registered IDs:', e);
      }
    }

    // Only get PAID registrations (not PENDING or FAILED)
    const { data, error } = await supabase
      .from('event_registrations_config')
      .select('event_id')
      .eq('user_id', userId)
      .eq('payment_status', 'PAID');

    if (error) throw error;

    // Return a Set of event IDs for fast lookup
    const eventIdsArray = (data || []).map(reg => reg.event_id);
    const eventIds = new Set(eventIdsArray);
    console.log(`📋 User has ${eventIds.size} registered events (fresh)`);
    
    // Cache the result
    try {
      sessionStorage.setItem(`${REGISTERED_IDS_CACHE_KEY}_${userId}`, JSON.stringify({
        ids: eventIdsArray,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache registered IDs:', e);
    }
    
    return eventIds;
  } catch (error) {
    console.error("Error fetching user registered events:", error);
    return new Set();
  }
};

/**
 * Clear user registrations cache (Call this after new registration/payment)
 * @param {string} userId - User ID to clear cache for
 */
export const clearUserRegistrationsCache = (userId) => {
  try {
    if (!userId) return;
    sessionStorage.removeItem(`${REGISTERED_IDS_CACHE_KEY}_${userId}`);
    console.log(`🧹 Cleared registration cache for user ${userId}`);
    return true;
  } catch (e) {
    console.warn('Failed to clear user registration cache:', e);
    return false;
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
  updateRegistrationPayment,
  getUserRegisteredEventIds,
  clearUserRegistrationsCache
};
