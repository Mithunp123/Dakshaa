import { supabase } from "../supabase";

// ==================== ACTIVITY LOGGING ====================
export const logAdminAction = async (actionType, targetUserId = null, targetRegistrationId = null, details = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action_type: actionType,
        target_user_id: targetUserId,
        target_registration_id: targetRegistrationId,
        details: details
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// ==================== REGISTRATION MANAGEMENT ====================

// Get all registrations with filters
export const getAllRegistrations = async (filters = {}) => {
  try {
    let query = supabase
      .from('registrations')
      .select(`
        *,
        user:profiles!registrations_user_id_fkey(full_name, email, college_name, mobile_number),
        event:events(event_id, category, price),
        combo:combos(combo_id, name, price)
      `)
      .order('created_at', { ascending: false });

    if (filters.eventId) {
      query = query.eq('event_id', filters.eventId);
    }
    
    if (filters.status) {
      query = query.eq('payment_status', filters.status);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return { data: null, error };
  }
};

// Force add user to event (bypass capacity)
export const forceAddUser = async (userId, eventId) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        user_id: userId,
        event_id: eventId,
        payment_status: 'completed',
        is_force_added: true,
        marked_by: (await supabase.auth.getUser()).data.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    await logAdminAction('force_add', userId, data.id, { event_id: eventId });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error force adding user:', error);
    return { data: null, error };
  }
};

// Move user to different event
export const moveUserToEvent = async (registrationId, newEventId) => {
  try {
    // Get current registration
    const { data: currentReg } = await supabase
      .from('registrations')
      .select('event_id, user_id')
      .eq('id', registrationId)
      .single();
    
    const { data, error } = await supabase
      .from('registrations')
      .update({ event_id: newEventId })
      .eq('id', registrationId)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAdminAction('move_user', currentReg.user_id, registrationId, {
      old_event_id: currentReg.event_id,
      new_event_id: newEventId
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error moving user:', error);
    return { data: null, error };
  }
};

// Upgrade registration to combo
export const upgradeToCombo = async (registrationId, comboId) => {
  try {
    const { data: currentReg } = await supabase
      .from('registrations')
      .select('user_id')
      .eq('id', registrationId)
      .single();
    
    const { data, error } = await supabase
      .from('registrations')
      .update({ combo_id: comboId })
      .eq('id', registrationId)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAdminAction('upgrade_combo', currentReg.user_id, registrationId, { combo_id: comboId });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error upgrading to combo:', error);
    return { data: null, error };
  }
};

// ==================== WAITLIST MANAGEMENT ====================

// Get all waitlist entries
export const getWaitlist = async (eventId = null) => {
  try {
    let query = supabase
      .from('waitlist')
      .select(`
        *,
        user:profiles!waitlist_user_id_fkey(full_name, email, mobile_number),
        event:events(event_id, category, capacity)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });
    
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return { data: null, error };
  }
};

// Promote user from waitlist to registration
export const promoteWaitlistUser = async (waitlistId) => {
  try {
    // Get waitlist entry
    const { data: waitlistEntry } = await supabase
      .from('waitlist')
      .select('*')
      .eq('id', waitlistId)
      .single();
    
    if (!waitlistEntry) throw new Error('Waitlist entry not found');
    
    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert({
        user_id: waitlistEntry.user_id,
        event_id: waitlistEntry.event_id,
        payment_status: 'pending'
      })
      .select()
      .single();
    
    if (regError) throw regError;
    
    // Update waitlist status
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ status: 'promoted' })
      .eq('id', waitlistId);
    
    if (updateError) throw updateError;
    
    await logAdminAction('promote_waitlist', waitlistEntry.user_id, registration.id, {
      waitlist_id: waitlistId,
      event_id: waitlistEntry.event_id
    });
    
    return { data: registration, error: null };
  } catch (error) {
    console.error('Error promoting waitlist user:', error);
    return { data: null, error };
  }
};

// ==================== FINANCE MODULE ====================

// Get cashier logs (cash payments grouped by admin)
export const getCashierLogs = async (dateRange = null) => {
  try {
    let query = supabase
      .from('registrations')
      .select(`
        id,
        amount_paid,
        created_at,
        marked_by,
        admin:profiles!registrations_marked_by_fkey(full_name, email)
      `)
      .eq('payment_mode', 'cash')
      .eq('payment_status', 'completed')
      .order('created_at', { ascending: false });
    
    if (dateRange?.start) {
      query = query.gte('created_at', dateRange.start);
    }
    
    if (dateRange?.end) {
      query = query.lte('created_at', dateRange.end);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Group by admin
    const grouped = data.reduce((acc, reg) => {
      const adminId = reg.marked_by;
      if (!acc[adminId]) {
        acc[adminId] = {
          admin: reg.admin,
          total_cash: 0,
          transaction_count: 0,
          transactions: []
        };
      }
      acc[adminId].total_cash += parseFloat(reg.amount_paid || 0);
      acc[adminId].transaction_count++;
      acc[adminId].transactions.push(reg);
      return acc;
    }, {});
    
    return { data: Object.values(grouped), error: null };
  } catch (error) {
    console.error('Error fetching cashier logs:', error);
    return { data: null, error };
  }
};

// Get payment reconciliation data
export const getPaymentReconciliation = async () => {
  try {
    // Get all registrations
    const { data: registrations } = await supabase
      .from('registrations')
      .select('*')
      .eq('payment_status', 'completed');
    
    // Get all transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('status', 'completed');
    
    // Find orphan payments (transactions without matching registrations)
    const orphanTransactions = transactions?.filter(tx => {
      return !registrations?.some(reg => reg.payment_id === tx.provider_id);
    }) || [];
    
    // Find registrations without transactions
    const orphanRegistrations = registrations?.filter(reg => {
      return reg.payment_mode === 'online' && !transactions?.some(tx => tx.provider_id === reg.payment_id);
    }) || [];
    
    return {
      data: {
        total_registrations: registrations?.length || 0,
        total_transactions: transactions?.length || 0,
        orphan_transactions: orphanTransactions,
        orphan_registrations: orphanRegistrations,
        orphan_count: orphanTransactions.length + orphanRegistrations.length
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching reconciliation data:', error);
    return { data: null, error };
  }
};

// Initiate refund (This would connect to Razorpay API)
export const initiateRefund = async (paymentId, amount, reason) => {
  try {
    // Note: In production, this should call your backend API which then calls Razorpay
    // For now, we'll just create a transaction record
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        provider_id: paymentId,
        amount: amount,
        type: 'refund',
        method: 'online',
        status: 'pending',
        notes: reason,
        marked_by: (await supabase.auth.getUser()).data.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    await logAdminAction('initiate_refund', null, null, {
      payment_id: paymentId,
      amount: amount,
      reason: reason
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error initiating refund:', error);
    return { data: null, error };
  }
};

// ==================== PARTICIPANT CRM ====================

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    await logAdminAction('edit_profile', userId, null, {
      old_values: oldProfile,
      new_values: updates
    });
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
};

// Get all users registered for an event
export const getUsersByEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        user:profiles!registrations_user_id_fkey(
          id,
          full_name,
          email,
          mobile_number,
          college_name,
          department
        )
      `)
      .eq('event_id', eventId)
      .eq('payment_status', 'completed');
    
    if (error) throw error;
    
    const users = data.map(reg => reg.user);
    return { data: users, error: null };
  } catch (error) {
    console.error('Error fetching users by event:', error);
    return { data: null, error };
  }
};

// Send bulk email (This would integrate with SendGrid/EmailJS)
export const sendBulkEmail = async (eventId, subject, message) => {
  try {
    // Get all users for the event
    const { data: users } = await getUsersByEvent(eventId);
    
    if (!users || users.length === 0) {
      throw new Error('No users found for this event');
    }
    
    // In production, you would call your backend API to send emails
    // For now, we'll just log the action
    
    await logAdminAction('bulk_email', null, null, {
      event_id: eventId,
      subject: subject,
      recipient_count: users.length,
      message_preview: message.substring(0, 100)
    });
    
    return {
      data: {
        success: true,
        recipient_count: users.length,
        message: 'Bulk email queued for sending'
      },
      error: null
    };
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return { data: null, error };
  }
};

// Get admin activity logs
export const getAdminLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('admin_logs')
      .select(`
        *,
        admin:profiles!admin_logs_admin_id_fkey(full_name, email, role),
        target_user:profiles!admin_logs_target_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);
    
    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }
    
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return { data: null, error };
  }
};

// Get all events (for dropdowns/filters)
export const getAllEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_id');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { data: null, error };
  }
};

// Get all combos
export const getAllCombos = async () => {
  try {
    const { data, error } = await supabase
      .from('combos')
      .select('*')
      .order('combo_id');
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching combos:', error);
    return { data: null, error };
  }
};

// Search users
export const searchUsers = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,mobile_number.ilike.%${searchTerm}%`)
      .limit(20);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching users:', error);
    return { data: null, error };
  }
};

// ==================== EVENT-WISE REGISTRATION MANAGER ====================

// Get event-specific stats
export const getEventStats = async (eventId) => {
  try {
    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('event_id', eventId)
      .single();
    
    if (eventError) throw eventError;

    // Get registration count
    const { count: registered, error: countError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    
    if (countError) throw countError;

    // Get revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('registrations')
      .select('amount')
      .eq('event_id', eventId)
      .eq('payment_status', 'paid');
    
    if (revenueError) throw revenueError;
    const revenue = revenueData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

    // Get attendance count
    const { count: attended, error: attendanceError } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('attended', true);
    
    if (attendanceError) throw attendanceError;

    return {
      event_id: event.event_id,
      event_name: event.category,
      capacity: event.max_seats || 0,
      registered: registered || 0,
      revenue,
      attended: attended || 0
    };
  } catch (error) {
    console.error('Error fetching event stats:', error);
    throw error;
  }
};

// Get all participants for an event
export const getEventParticipants = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        reg_id,
        payment_status,
        attended,
        team_leader_id,
        created_at,
        user_id,
        profiles!registrations_user_id_fkey (
          id,
          full_name,
          email,
          college_name,
          mobile_number,
          department,
          roll_no
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Flatten the data
    const participants = data.map(reg => ({
      reg_id: reg.reg_id,
      user_id: reg.user_id,
      payment_status: reg.payment_status,
      attended: reg.attended,
      team_leader_id: reg.team_leader_id,
      is_team_leader: data.some(r => r.team_leader_id === reg.reg_id),
      created_at: reg.created_at,
      full_name: reg.profiles?.full_name,
      email: reg.profiles?.email,
      college_name: reg.profiles?.college_name,
      mobile: reg.profiles?.mobile_number,
      department: reg.profiles?.department,
      roll_no: reg.profiles?.roll_no
    }));

    return participants;
  } catch (error) {
    console.error('Error fetching event participants:', error);
    throw error;
  }
};

// Approve cash payment
export const approveCashPayment = async (regId) => {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ 
        payment_status: 'paid',
        payment_method: 'cash'
      })
      .eq('reg_id', regId);
    
    if (error) throw error;

    await logAdminAction('approve_cash_payment', null, regId, {
      action: 'Approved cash payment'
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving cash payment:', error);
    throw error;
  }
};

// Remove participant
export const removeParticipant = async (regId) => {
  try {
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('reg_id', regId);
    
    if (error) throw error;

    await logAdminAction('remove_participant', null, regId, {
      action: 'Removed participant from event'
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
};

// Move participant to another event
export const moveParticipantToEvent = async (regId, newEventId) => {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ event_id: newEventId })
      .eq('reg_id', regId);
    
    if (error) throw error;

    await logAdminAction('move_participant', null, regId, {
      action: 'Moved participant to another event',
      new_event_id: newEventId
    });

    return { success: true };
  } catch (error) {
    console.error('Error moving participant:', error);
    throw error;
  }
};

// Split team member (remove from team but keep registration)
export const splitTeamMember = async (regId) => {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ team_leader_id: null })
      .eq('reg_id', regId);
    
    if (error) throw error;

    await logAdminAction('split_team_member', null, regId, {
      action: 'Removed member from team'
    });

    return { success: true };
  } catch (error) {
    console.error('Error splitting team member:', error);
    throw error;
  }
};

// Bulk approve payments
export const bulkApprovePayments = async (regIds) => {
  try {
    const { error } = await supabase
      .from('registrations')
      .update({ 
        payment_status: 'paid',
        payment_method: 'cash'
      })
      .in('reg_id', regIds);
    
    if (error) throw error;

    await logAdminAction('bulk_approve_payments', null, null, {
      action: 'Bulk approved payments',
      count: regIds.length,
      reg_ids: regIds
    });

    return { success: true };
  } catch (error) {
    console.error('Error bulk approving payments:', error);
    throw error;
  }
};

// Export event participants to CSV
export const exportEventCSV = async (eventId, eventName) => {
  try {
    const participants = await getEventParticipants(eventId);
    
    const headers = ['Name', 'College', 'Email', 'Mobile', 'Department', 'Roll No', 'Status', 'Team', 'Attended'];
    const rows = participants.map(p => [
      p.full_name,
      p.college_name,
      p.email,
      p.mobile,
      p.department,
      p.roll_no,
      p.payment_status.toUpperCase(),
      p.is_team_leader ? 'Leader' : (p.team_leader_id ? 'Member' : 'Solo'),
      p.attended ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, '_')}_participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    await logAdminAction('export_event_csv', null, null, {
      action: 'Exported event participants to CSV',
      event_id: eventId,
      participant_count: participants.length
    });

    return { success: true };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

// Broadcast email to all event participants
export const broadcastEventEmail = async (eventId, subject, message) => {
  try {
    const participants = await getEventParticipants(eventId);
    const emails = participants.map(p => p.email).filter(Boolean);

    // Note: This would require a backend email service
    // For now, we'll just log the action
    console.log('Broadcasting email to:', emails);
    console.log('Subject:', subject);
    console.log('Message:', message);

    await logAdminAction('broadcast_event_email', null, null, {
      action: 'Broadcasted email to event participants',
      event_id: eventId,
      recipient_count: emails.length,
      subject
    });

    // In a real implementation, you would call a backend API to send emails
    alert(`Email would be sent to ${emails.length} participants. Backend integration required.`);

    return { success: true };
  } catch (error) {
    console.error('Error broadcasting email:', error);
    throw error;
  }
};
