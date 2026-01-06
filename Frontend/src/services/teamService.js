import { supabase } from "../supabase";

/**
 * Team Service
 * Handles team creation and management for team-based events
 */

/**
 * Create a new team
 * @param {Object} teamData - Team information
 * @returns {Promise<Object>} Response with team details
 */
export const createTeam = async (teamData) => {
  try {
    // Debug: Check session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('🔍 Session check:', session ? '✅ Active' : '❌ Missing');
    console.log('🔍 User ID:', session?.user?.id);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {
      teamName,
      eventId,
      maxMembers
    } = teamData;

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        team_name: teamName,
        event_id: eventId,
        leader_id: user.id,
        created_by: user.id,
        max_members: maxMembers || 4,
        is_active: true
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Add leader as first team member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: user.id,
        role: 'leader',
        status: 'active'
      });

    if (memberError) throw memberError;

    return {
      success: true,
      data: team,
      error: null
    };
  } catch (error) {
    console.error("Error creating team:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get team details with members
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Team details with members
 */
export const getTeamDetails = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        leader:profiles!teams_leader_id_fkey(full_name, email, college_name),
        members:team_members(
          id,
          role,
          status,
          created_at,
          user:profiles!team_members_user_id_fkey(id, full_name, email, department)
        )
      `)
      .eq('id', teamId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error fetching team details:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Send team invitation to user
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to invite
 * @returns {Promise<Object>} Response with success status
 */
export const sendTeamInvitation = async (teamId, userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create invitation
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        team_id: teamId,
        inviter_id: user.id,
        invitee_id: userId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error sending invitation:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get pending invitations for a team
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Response with invitations
 */
export const getTeamInvitations = async (teamId) => {
  try {
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        *,
        invitee:profiles!team_invitations_invitee_id_fkey(id, full_name, email, roll_no, department)
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Add member to team
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to add
 * @returns {Promise<Object>} Response with success status
 */
export const addTeamMember = async (teamId, userId) => {
  try {
    // Check if team is full
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('max_members, members:team_members(count)')
      .eq('id', teamId)
      .single();

    if (teamError) throw teamError;

    const currentMembers = team.members[0].count;
    if (currentMembers >= team.max_members) {
      throw new Error('Team is full');
    }

    // Add member
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'member',
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error adding team member:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Remove member from team
 * @param {String} teamId - ID of the team
 * @param {String} userId - ID of the user to remove
 * @returns {Promise<Object>} Response with success status
 */
export const removeTeamMember = async (teamId, userId) => {
  try {
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'left' })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error removing team member:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update team details
 * @param {String} teamId - ID of the team
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response with updated team
 */
export const updateTeam = async (teamId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('teams')
      .update(updateData)
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error updating team:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Delete/Disband team
 * @param {String} teamId - ID of the team
 * @returns {Promise<Object>} Response with success status
 */
export const deleteTeam = async (teamId) => {
  try {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', teamId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error deleting team:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Search users to add to team
 * @param {String} searchQuery - Search query (name, email, roll number)
 * @returns {Promise<Array>} List of users
 */
export const searchUsersForTeam = async (searchQuery) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, roll_no, department, college_name')
      .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,roll_no.ilike.%${searchQuery}%`)
      .limit(20);

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error searching users:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Search teams to join
 * @param {String} searchQuery - Search query (team name, event name)
 * @returns {Promise<Array>} List of teams
 */
export const searchTeamsToJoin = async (searchQuery) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First, search for leaders by name to get their IDs
    const { data: matchingLeaders } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', `%${searchQuery}%`)
      .limit(50);

    const leaderIdsFromSearch = matchingLeaders?.map(l => l.id) || [];

    // Search teams by team name
    const { data: teamsByName, error: nameError } = await supabase
      .from('teams')
      .select(`
        id,
        team_name,
        max_members,
        leader_id,
        event_id,
        created_at,
        team_members(
          user_id,
          role,
          created_at,
          profiles(full_name, email)
        )
      `)
      .eq('is_active', true)
      .ilike('team_name', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (nameError) throw nameError;

    // Search teams by leader ID (if any leaders matched)
    let teamsByLeader = [];
    if (leaderIdsFromSearch.length > 0) {
      const { data: leaderTeams, error: leaderError } = await supabase
        .from('teams')
        .select(`
          id,
          team_name,
          max_members,
          leader_id,
          event_id,
          created_at,
          team_members(
            user_id,
            role,
            created_at,
            profiles(full_name, email)
          )
        `)
        .eq('is_active', true)
        .in('leader_id', leaderIdsFromSearch)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!leaderError && leaderTeams) {
        teamsByLeader = leaderTeams;
      }
    }

    // Combine and deduplicate results
    const allTeamsMap = new Map();
    [...(teamsByName || []), ...teamsByLeader].forEach(team => {
      if (!allTeamsMap.has(team.id)) {
        allTeamsMap.set(team.id, team);
      }
    });
    const data = Array.from(allTeamsMap.values());

    // Filter out teams user is already in or has pending requests for
    const { data: userTeams } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id);

    const { data: pendingRequests } = await supabase
      .from('team_join_requests')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    const userTeamIds = new Set(userTeams?.map(t => t.team_id) || []);
    const pendingTeamIds = new Set(pendingRequests?.map(r => r.team_id) || []);

    // Get unique event IDs and leader IDs
    const eventIds = [...new Set(data?.map(t => t.event_id).filter(Boolean) || [])];
    const leaderIds = [...new Set(data?.map(t => t.leader_id).filter(Boolean) || [])];

    // Fetch events and leaders separately
    const [eventsResult, leaderProfiles] = await Promise.all([
      eventIds.length > 0 
        ? supabase.from('events').select('event_id, title, category, event_type').in('event_id', eventIds)
        : { data: [] },
      leaderIds.length > 0
        ? supabase.from('profiles').select('id, full_name, email')
            .in('id', leaderIds)
        : { data: [] }
    ]);

    const eventMap = new Map(eventsResult.data?.map(e => [e.event_id, e]) || []);
    const leaderMap = new Map(leaderProfiles.data?.map(p => [p.id, p]) || []);

    const filteredTeams = (data || [])
      .filter(team => !userTeamIds.has(team.id) && !pendingTeamIds.has(team.id))
      .map(team => ({
        ...team,
        events: eventMap.get(team.event_id) || { title: team.event_id, category: '', event_type: '' },
        leader: leaderMap.get(team.leader_id),
        members: team.team_members || [],
        current_members: team.team_members?.length || 0,
        is_full: (team.team_members?.length || 0) >= team.max_members
      }));

    return {
      success: true,
      data: filteredTeams,
      error: null
    };
  } catch (error) {
    console.error("Error searching teams:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Send join request to a team
 * @param {String} teamId - ID of the team
 * @param {String} message - Optional message to team leader
 * @returns {Promise<Object>} Response with success status
 */
export const sendJoinRequest = async (teamId, message = '') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('team_join_requests')
      .insert({
        team_id: teamId,
        user_id: user.id,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error sending join request:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get pending join requests for user's teams (for team leaders)
 * @returns {Promise<Array>} List of join requests
 */
export const getTeamJoinRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch join requests with team and user data
    const { data, error } = await supabase
      .from('team_join_requests')
      .select(`
        id,
        message,
        created_at,
        status,
        user_id,
        teams(id, team_name, event_id, leader_id),
        profiles(id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, data: [], error: null };
    }

    // Filter to only show requests for teams the user leads
    const userTeamRequests = data.filter(r => r.teams?.leader_id === user.id);

    // Get unique event IDs
    const eventIds = [...new Set(userTeamRequests.map(r => r.teams?.event_id).filter(Boolean))];

    // Fetch events separately
    const { data: eventsData } = eventIds.length > 0 
      ? await supabase.from('events').select('event_id, title').in('event_id', eventIds)
      : { data: [] };

    const eventMap = new Map(eventsData?.map(e => [e.event_id, e]) || []);

    // Combine data
    const enrichedData = userTeamRequests.map(request => ({
      ...request,
      teams: request.teams ? {
        ...request.teams,
        events: eventMap.get(request.teams.event_id) || { title: request.teams.event_id }
      } : null
    }));

    return {
      success: true,
      data: enrichedData,
      error: null
    };
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get user's own join requests
 * @returns {Promise<Array>} List of user's join requests
 */
export const getMyJoinRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch join requests with team data
    const { data, error } = await supabase
      .from('team_join_requests')
      .select(`
        id,
        message,
        created_at,
        status,
        team_id,
        teams(id, team_name, event_id, leader_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, data: [], error: null };
    }

    // Get unique event IDs and leader IDs
    const eventIds = [...new Set(data.map(r => r.teams?.event_id).filter(Boolean))];
    const leaderIds = [...new Set(data.map(r => r.teams?.leader_id).filter(Boolean))];

    // Fetch events and leaders separately
    const [eventsResult, leadersResult] = await Promise.all([
      eventIds.length > 0 
        ? supabase.from('events').select('event_id, title').in('event_id', eventIds)
        : { data: [] },
      leaderIds.length > 0
        ? supabase.from('profiles').select('id, full_name').in('id', leaderIds)
        : { data: [] }
    ]);

    const eventMap = new Map(eventsResult.data?.map(e => [e.event_id, e]) || []);
    const leaderMap = new Map(leadersResult.data?.map(l => [l.id, l]) || []);

    // Combine data
    const enrichedData = data.map(request => ({
      ...request,
      teams: request.teams ? {
        ...request.teams,
        events: eventMap.get(request.teams.event_id) || { title: request.teams.event_id },
        leader: leaderMap.get(request.teams.leader_id) || { full_name: 'Unknown' }
      } : null
    }));

    return {
      success: true,
      data: enrichedData,
      error: null
    };
  } catch (error) {
    console.error("Error fetching my join requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Cancel a pending join request
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const cancelJoinRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('team_join_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error canceling join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Accept a join request (team leader only)
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const acceptJoinRequest = async (requestId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the join request details
    const { data: request, error: requestError } = await supabase
      .from('team_join_requests')
      .select('*, teams(id, leader_id, max_members)')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Join request not found');

    // Verify current user is the team leader
    if (request.teams.leader_id !== user.id) {
      throw new Error('Only team leader can accept join requests');
    }

    // Check if team is full
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', request.team_id);

    if (memberCount >= request.teams.max_members) {
      throw new Error('Team is full');
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({
        team_id: request.team_id,
        user_id: request.user_id,
        role: 'member',
        status: 'active'
      });

    if (memberError) throw memberError;

    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('team_join_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error accepting join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Reject a join request (team leader only)
 * @param {String} requestId - ID of the join request
 * @returns {Promise<Object>} Response with success status
 */
export const rejectJoinRequest = async (requestId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the join request details
    const { data: request, error: requestError } = await supabase
      .from('team_join_requests')
      .select('*, teams(id, leader_id)')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;
    if (!request) throw new Error('Join request not found');

    // Verify current user is the team leader
    if (request.teams.leader_id !== user.id) {
      throw new Error('Only team leader can reject join requests');
    }

    // Update request status to rejected
    const { error: updateError } = await supabase
      .from('team_join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error rejecting join request:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createTeam,
  getTeamDetails,
  addTeamMember,
  removeTeamMember,
  updateTeam,
  deleteTeam,
  searchUsersForTeam,
  sendTeamInvitation,
  getTeamInvitations,
  searchTeamsToJoin,
  sendJoinRequest,
  getTeamJoinRequests,
  getMyJoinRequests,
  cancelJoinRequest,
  acceptJoinRequest,
  rejectJoinRequest
};
