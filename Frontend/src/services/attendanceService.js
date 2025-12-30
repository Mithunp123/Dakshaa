import { supabase } from "../supabase";

/**
 * Attendance Service
 * Handles all attendance-related operations for DaKshaa T26
 */

/**
 * Get all active events available for scanning
 * @returns {Promise<Array>} List of active events
 */
export const getActiveEvents = async () => {
  try {
    const { data, error } = await supabase.rpc("get_active_events_for_scanner");

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching active events:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Verify and mark attendance for a user at an event
 * @param {string} userId - UUID of the user being scanned
 * @param {string} eventId - UUID of the event
 * @param {string} scannedBy - UUID of the volunteer/coordinator doing the scan
 * @param {string} scanLocation - Optional location name
 * @returns {Promise<Object>} Result with status, message, and student data
 */
export const verifyAndMarkAttendance = async (
  userId,
  eventId,
  scannedBy,
  scanLocation = null
) => {
  try {
    const { data, error } = await supabase.rpc("verify_and_mark_attendance", {
      p_user_id: userId,
      p_event_id: eventId,
      p_scanned_by: scannedBy,
      p_scan_location: scanLocation
    });

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error verifying attendance:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get attendance statistics for a specific event
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} Stats including registered, attended, and attendance rate
 */
export const getAttendanceStats = async (eventId) => {
  try {
    const { data, error } = await supabase.rpc("get_attendance_stats", {
      p_event_id: eventId
    });

    if (error) throw error;

    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get attendance logs for a specific event
 * @param {string} eventId - UUID of the event
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} List of attendance logs with user details
 */
export const getAttendanceLogs = async (eventId, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select(
        `
        *,
        user:profiles!user_id(
          full_name,
          department,
          college_name,
          roll_no
        ),
        event:events!event_id(
          event_name,
          event_type,
          venue
        )
      `
      )
      .eq("event_id", eventId)
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get user's attendance history
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} List of events the user attended
 */
export const getUserAttendanceHistory = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select(
        `
        *,
        event:events!event_id(
          event_name,
          event_type,
          venue,
          start_time,
          end_time
        )
      `
      )
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching user attendance history:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Check if user has already attended an event
 * @param {string} userId - UUID of the user
 * @param {string} eventId - UUID of the event
 * @returns {Promise<boolean>} True if already attended, false otherwise
 */
export const hasUserAttended = async (userId, eventId) => {
  try {
    const { data, error } = await supabase
      .from("attendance_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      success: true,
      data: !!data,
      error: null
    };
  } catch (error) {
    console.error("Error checking attendance:", error);
    return {
      success: false,
      data: false,
      error: error.message
    };
  }
};

/**
 * Get all events (for admin management)
 * @param {boolean} activeOnly - If true, returns only active events
 * @returns {Promise<Array>} List of events
 */
export const getAllEvents = async (activeOnly = false) => {
  try {
    let query = supabase
      .from("events")
      .select("*")
      .order("start_time", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

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
 * Create a new event
 * @param {Object} eventData - Event details
 * @returns {Promise<Object>} Created event
 */
export const createEvent = async (eventData) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .insert([eventData])
      .select()
      .single();

    if (error) throw error;

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
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;

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
 * Delete an event
 * @param {string} eventId - UUID of the event
 * @returns {Promise<boolean>} Success status
 */
export const deleteEvent = async (eventId) => {
  try {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) throw error;

    return {
      success: true,
      data: true,
      error: null
    };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      data: false,
      error: error.message
    };
  }
};

/**
 * Get user's registration status for an event
 * @param {string} userId - UUID of the user
 * @param {string} eventId - UUID of the event
 * @returns {Promise<Object>} Registration details
 */
export const getUserRegistration = async (userId, eventId) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("user_id", userId)
      .eq("event_id", eventId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return {
      success: true,
      data: data || null,
      error: null
    };
  } catch (error) {
    console.error("Error fetching registration:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Register user for an event
 * @param {string} userId - UUID of the user
 * @param {string} eventId - UUID of the event
 * @param {Object} registrationData - Additional registration details
 * @returns {Promise<Object>} Registration record
 */
export const registerForEvent = async (userId, eventId, registrationData = {}) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .insert([
        {
          user_id: userId,
          event_id: eventId,
          ...registrationData
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
 * Update registration payment status
 * @param {string} registrationId - UUID of the registration
 * @param {string} paymentStatus - New payment status (PAID, PENDING, FAILED, REFUNDED)
 * @param {Object} paymentDetails - Payment transaction details
 * @returns {Promise<Object>} Updated registration
 */
export const updateRegistrationPayment = async (
  registrationId,
  paymentStatus,
  paymentDetails = {}
) => {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .update({
        payment_status: paymentStatus,
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

/**
 * Export attendance data to CSV format
 * @param {string} eventId - UUID of the event
 * @returns {Promise<string>} CSV formatted string
 */
export const exportAttendanceCSV = async (eventId) => {
  try {
    const result = await getAttendanceLogs(eventId, 10000);

    if (!result.success || !result.data.length) {
      throw new Error("No attendance data to export");
    }

    const headers = [
      "Timestamp",
      "Student Name",
      "Roll Number",
      "Department",
      "College",
      "Event Name",
      "Venue"
    ];

    const rows = result.data.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.user?.full_name || "N/A",
      log.user?.roll_no || "N/A",
      log.user?.department || "N/A",
      log.user?.college_name || "N/A",
      log.event?.event_name || "N/A",
      log.event?.venue || "N/A"
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");

    return {
      success: true,
      data: csvContent,
      error: null
    };
  } catch (error) {
    console.error("Error exporting CSV:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  getActiveEvents,
  verifyAndMarkAttendance,
  getAttendanceStats,
  getAttendanceLogs,
  getUserAttendanceHistory,
  hasUserAttended,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserRegistration,
  registerForEvent,
  updateRegistrationPayment,
  exportAttendanceCSV
};
