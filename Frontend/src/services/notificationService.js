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
      // First, get invitation details before accepting
      const { data: invitation } = await supabase
        .from('team_invitations')
        .select('team_id, invitee_id')
        .eq('id', invitationId)
        .single();

      const { data, error } = await supabase.rpc('accept_team_invitation', {
        invitation_id: invitationId
      });

      if (error) throw error;

      // If successful and we have invitation details, create registration for the new member
      if (data.success && invitation) {
        await notificationService.createRegistrationForNewMember(invitation.team_id, invitation.invitee_id);
      }

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
   * Create registration record for a new team member if team is already registered
   */
  createRegistrationForNewMember: async (teamId, userId) => {
    try {
      // Get team details
      const { data: team } = await supabase
        .from('teams')
        .select('id, team_name, event_id, is_active')
        .eq('id', teamId)
        .single();

      if (!team) return;

      // Get event details (need the text event_id for registrations)
      const { data: event } = await supabase
        .from('events')
        .select('id, event_id, name, title, price')
        .eq('id', team.event_id)
        .single();

      if (!event) return;

      // Check if team has any existing paid registration (means team is registered)
      const { data: existingRegs } = await supabase
        .from('event_registrations_config')
        .select('transaction_id, payment_amount')
        .eq('event_name', team.team_name)
        .eq('payment_status', 'PAID')
        .limit(1);

      if (!existingRegs || existingRegs.length === 0) {
        // Team not registered yet, no need to create registration
        return;
      }

      // Check if this user already has a registration
      const { data: userReg } = await supabase
        .from('event_registrations_config')
        .select('id')
        .eq('user_id', userId)
        .eq('event_name', team.team_name)
        .eq('payment_status', 'PAID')
        .maybeSingle();

      if (userReg) {
        // User already has registration
        return;
      }

      // Create registration for the new member
      // Use the same transaction_id and payment_amount as existing registrations
      const { error: insertError } = await supabase
        .from('event_registrations_config')
        .insert({
          user_id: userId,
          event_id: event.event_id || event.id,
          event_name: team.team_name,
          payment_status: 'PAID',
          payment_amount: existingRegs[0].payment_amount,
          transaction_id: existingRegs[0].transaction_id
        });

      if (insertError) {
        console.error('Error creating registration for new member:', insertError);
      } else {
        console.log('✅ Registration created for new team member');
      }
    } catch (err) {
      console.error('Error in createRegistrationForNewMember:', err);
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
      // First, get join request details before approving
      const { data: joinRequest } = await supabase
        .from('team_join_requests')
        .select('team_id, user_id')
        .eq('id', requestId)
        .single();

      const { data, error } = await supabase.rpc('approve_join_request', {
        request_id: requestId
      });

      if (error) throw error;

      // If successful and we have request details, create registration for the new member
      if (data.success && joinRequest) {
        await notificationService.createRegistrationForNewMember(joinRequest.team_id, joinRequest.user_id);
      }

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

  /**
   * Sync registrations for all members of a registered team
   * Call this when viewing a team to ensure all members have registration records
   */
  syncTeamMemberRegistrations: async (team) => {
    try {
      console.log('🔄 syncTeamMemberRegistrations called for team:', team?.name, team);
      
      if (!team) {
        console.log('❌ No team provided');
        return;
      }

      const memberUserIds = (team.members || []).map(m => m.user_id).filter(Boolean);
      console.log('👥 Team members:', memberUserIds.length, memberUserIds);
      
      if (memberUserIds.length === 0) {
        console.log('❌ No members in team');
        return;
      }

      // Get existing registrations for this team
      // The event_name in registrations is the TEAM NAME (not event name)
      const teamName = team.name || team.team_name;
      const eventTextId = team.events?.event_id || team.event_id;
      
      console.log('🔍 Looking for registrations with:', { teamName, eventTextId });
      
      // Query by team name (event_name field stores team name for team registrations)
      let existingRegs = null;
      let regError = null;
      
      // Try finding by team name first
      const { data: regsByName, error: err1 } = await supabase
        .from('event_registrations_config')
        .select('user_id, transaction_id, payment_amount, event_id, event_name')
        .eq('payment_status', 'PAID')
        .eq('event_name', teamName);
      
      console.log('📋 Registrations by team name:', regsByName?.length || 0, regsByName);
      
      if (regsByName && regsByName.length > 0) {
        existingRegs = regsByName;
        regError = err1;
      } else if (eventTextId) {
        // Fallback: try by event_id
        const { data: regsByEvent, error: err2 } = await supabase
          .from('event_registrations_config')
          .select('user_id, transaction_id, payment_amount, event_id, event_name')
          .eq('payment_status', 'PAID')
          .eq('event_id', eventTextId);
        
        console.log('📋 Registrations by event_id:', regsByEvent?.length || 0, regsByEvent);
        existingRegs = regsByEvent;
        regError = err2;
      }

      console.log('📋 Existing registrations found:', existingRegs?.length || 0, existingRegs);
      
      if (regError) {
        console.error('❌ Error fetching existing registrations:', regError);
        return;
      }

      // If no existing registrations but team is active (paid), create for ALL members
      if (!existingRegs || existingRegs.length === 0) {
        console.log('⚠️ No paid registrations found, checking if team is active/paid...');
        
        // Fetch fresh team data to check is_active status
        const { data: freshTeam } = await supabase
          .from('teams')
          .select('id, is_active, leader_id, created_by, max_members')
          .eq('id', team.id)
          .single();
        
        if (!freshTeam?.is_active) {
          console.log('⚠️ Team is not active/paid, skipping registration creation');
          return;
        }
        
        console.log('✅ Team is active/paid, creating registrations for all members');
        
        // Fetch event price from database
        let eventPrice = 0;
        if (eventTextId) {
          const { data: eventData } = await supabase
            .from('events')
            .select('price')
            .or(`event_id.eq.${eventTextId},id.eq.${eventTextId}`)
            .single();
          
          if (eventData?.price) {
            eventPrice = Number(eventData.price);
            console.log('💰 Event price from DB:', eventPrice);
          }
        }
        
        // Calculate total amount (price per member * team size)
        const teamSize = freshTeam.max_members || memberUserIds.length;
        const totalAmount = eventPrice * teamSize;
        
        // Create registrations for ALL members since none exist
        const newRegistrations = memberUserIds.map(userId => ({
          user_id: userId,
          event_id: eventTextId,
          event_name: teamName,
          payment_status: 'PAID',
          payment_amount: totalAmount,
          transaction_id: `team-${team.id}-sync`
        }));

        console.log('📝 Creating registrations for all members:', newRegistrations);

        const { data: insertedData, error } = await supabase
          .from('event_registrations_config')
          .insert(newRegistrations)
          .select();

        if (error) {
          console.error('❌ Error creating member registrations:', error);
        } else {
          console.log(`✅ Created registrations for ${newRegistrations.length} team members:`, insertedData);
        }
        return;
      }

      // Find registrations that match team members
      const teamMemberRegs = existingRegs.filter(r => memberUserIds.includes(r.user_id));
      const registeredUserIds = new Set(teamMemberRegs.map(r => r.user_id));
      const unregisteredMembers = memberUserIds.filter(id => !registeredUserIds.has(id));

      console.log('📊 Registration status:', {
        totalMembers: memberUserIds.length,
        alreadyRegistered: registeredUserIds.size,
        needsRegistration: unregisteredMembers.length
      });

      // Fix existing registrations with 0 amount
      const zeroAmountRegs = teamMemberRegs.filter(r => !r.payment_amount || r.payment_amount === 0);
      if (zeroAmountRegs.length > 0 && eventTextId) {
        console.log('🔧 Found registrations with 0 amount, fetching event price...');
        const { data: eventData } = await supabase
          .from('events')
          .select('price')
          .or(`event_id.eq.${eventTextId},id.eq.${eventTextId}`)
          .single();
        
        if (eventData?.price) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('max_members')
            .eq('id', team.id)
            .single();
          
          const teamSize = teamData?.max_members || memberUserIds.length;
          const totalAmount = Number(eventData.price) * teamSize;
          
          // Update all zero amount registrations for this team
          const userIdsToFix = zeroAmountRegs.map(r => r.user_id);
          const { error: updateError } = await supabase
            .from('event_registrations_config')
            .update({ payment_amount: totalAmount })
            .eq('event_name', teamName)
            .in('user_id', userIdsToFix);
          
          if (updateError) {
            console.error('❌ Error updating amounts:', updateError);
          } else {
            console.log(`✅ Updated payment_amount to ${totalAmount} for ${userIdsToFix.length} registrations`);
          }
        }
      }

      if (unregisteredMembers.length === 0) {
        console.log('✅ All members already have registrations');
        return;
      }

      // Use the event_id from existing registrations
      const eventId = existingRegs[0].event_id;
      const eventName = teamName; // Team name is used as event_name for team registrations

      // Create registrations for unregistered members
      const newRegistrations = unregisteredMembers.map(userId => ({
        user_id: userId,
        event_id: eventId,
        event_name: eventName,
        payment_status: 'PAID',
        payment_amount: existingRegs[0].payment_amount,
        transaction_id: existingRegs[0].transaction_id
      }));

      console.log('📝 Creating registrations:', newRegistrations);

      const { data: insertedData, error } = await supabase
        .from('event_registrations_config')
        .insert(newRegistrations)
        .select();

      if (error) {
        console.error('❌ Error syncing member registrations:', error);
      } else {
        console.log(`✅ Synced registrations for ${unregisteredMembers.length} team members:`, insertedData);
      }
    } catch (err) {
      console.error('❌ Error in syncTeamMemberRegistrations:', err);
    }
  },
};

export default notificationService;
