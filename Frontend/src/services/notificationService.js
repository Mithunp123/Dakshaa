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
      // Try notifications table first (new system with team features)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // If no data, try notification_queue as fallback
      if (!data || data.length === 0) {
        const { data: legacyData, error: legacyError } = await supabase
          .from('notification_queue')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        return {
          success: true,
          data: legacyData || [],
        };
      }

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
      // Try notifications table first (new system)
      let { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
        })
        .eq('id', notificationId)
        .select()
        .maybeSingle();

      // If not found, try notification_queue (legacy)
      if (!data && !error) {
        const result = await supabase
          .from('notification_queue')
          .update({
            is_read: true,
            read_at: new Date().toISOString(),
          })
          .eq('id', notificationId)
          .select()
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

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
      // Update notifications table (new system)
      const { data: data1, error: error1 } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      // Also update notification_queue (legacy)
      const { data: data2, error: error2 } = await supabase
        .from('notification_queue')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();

      const totalCount = (data1?.length || 0) + (data2?.length || 0);

      return {
        success: true,
        count: totalCount,
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

  /**
   * Accept team invitation
   */
  acceptTeamInvitation: async (invitationId) => {
    try {
      const { data, error } = await supabase.rpc('accept_team_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      return {
        success: data.success,
        error: data.error || null
      };
    } catch (error) {
      console.error("Error accepting invitation:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Reject team invitation
   */
  rejectTeamInvitation: async (invitationId) => {
    try {
      const { data, error } = await supabase.rpc('reject_team_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      return {
        success: data.success,
        error: data.error || null
      };
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Approve team join request (for team leaders)
   */
  approveJoinRequest: async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('approve_join_request', {
        request_id: requestId
      });

      if (error) throw error;

      return {
        success: data.success,
        error: data.error || null,
        message: data.message || null
      };
    } catch (error) {
      console.error("Error approving join request:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Reject team join request (for team leaders)
   */
  rejectJoinRequest: async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('reject_join_request', {
        request_id: requestId
      });

      if (error) throw error;

      return {
        success: data.success,
        error: data.error || null,
        message: data.message || null
      };
    } catch (error) {
      console.error("Error rejecting join request:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
};

export default notificationService;
