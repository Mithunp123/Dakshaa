import { supabase } from "../supabase";

/**
 * Dashboard Service
 * Handles user dashboard data and statistics
 */

/**
 * Get user dashboard statistics
 * @returns {Promise<Object>} User dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    const { data, error } = await supabase.rpc('get_user_dashboard_stats');

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's registrations with event details
 * @returns {Promise<Array>} List of user's event registrations
 */
export const getUserRegistrations = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events_config(event_key, name, type, price)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
 * Get user's attendance history
 * @returns {Promise<Array>} List of attended events
 */
export const getUserAttendance = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        event:events(event_name, event_type, venue)
      `)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching user attendance:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get user's teams
 * @returns {Promise<Array>} List of user's teams
 */
export const getUserTeams = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        team:teams(
          id,
          team_name,
          event_id,
          leader_id,
          max_members,
          is_active,
          leader:profiles!teams_leader_id_fkey(full_name)
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching user teams:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get user's notifications
 * @param {Boolean} unreadOnly - Fetch only unread notifications
 * @returns {Promise<Array>} List of notifications
 */
export const getUserNotifications = async (unreadOnly = false) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Mark notification as read
 * @param {String} notificationId - ID of the notification
 * @returns {Promise<Object>} Response with success status
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Mark all notifications as read
 * @returns {Promise<Object>} Response with success status
 */
export const markAllNotificationsAsRead = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user's QR code
 * @returns {Promise<String>} QR code data
 */
export const getUserQRCode = async () => {
  try {
    const { data, error } = await supabase.rpc('generate_user_qr_code');

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error generating QR code:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's payment transactions
 * @returns {Promise<Array>} List of transactions
 */
export const getUserTransactions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

export default {
  getDashboardStats,
  getUserRegistrations,
  getUserAttendance,
  getUserTeams,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUserQRCode,
  getUserTransactions
};
