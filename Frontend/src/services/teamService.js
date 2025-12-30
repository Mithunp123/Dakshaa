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
        max_members: maxMembers || 4
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
          joined_at,
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

export default {
  createTeam,
  getTeamDetails,
  addTeamMember,
  removeTeamMember,
  updateTeam,
  deleteTeam,
  searchUsersForTeam
};
