import { supabase } from '../supabase';

/**
 * Notification Service
 * Manages in-app notifications for users
 */
const notificationService = {
  /**
   * Get user's unread notifications
   */
  getUnreadNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message,
      };
    }
  },

  /**
   * Get all notifications for user
   */
  getAllNotifications: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      if (error) throw error;

      return {
        success: true,
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete notification
   */
  deleteNotification: async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Subscribe to real-time notifications
   * Returns a subscription object that should be unsubscribed on component unmount
   */
  subscribeToNotifications: (userId, callback) => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New notification received:', payload);
          callback(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Create a notification (for testing or admin use)
   */
  createNotification: async ({
    userId,
    notificationType,
    title,
    message,
    actionUrl = null,
    priority = 'NORMAL',
  }) => {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .insert({
          user_id: userId,
          notification_type: notificationType,
          title,
          message,
          action_url: actionUrl,
          priority,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (userId) => {
    try {
      const { count, error } = await supabase
        .from('notification_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return {
        success: true,
        count: count || 0,
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        count: 0,
        error: error.message,
      };
    }
  },
};

export default notificationService;
