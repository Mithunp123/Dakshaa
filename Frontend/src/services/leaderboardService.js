import { supabase } from "../supabase";

/**
 * Leaderboard Service
 * Handles referral leaderboard and winners display
 */

/**
 * Get referral leaderboard
 * @param {Number} limit - Number of top referrers to fetch
 * @returns {Promise<Array>} List of top referrers
 */
export const getReferralLeaderboard = async (limit = 100) => {
  try {
    const { data, error } = await supabase.rpc('get_referral_leaderboard', {
      p_limit: limit
    });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get leaderboard statistics
 * @returns {Promise<Object>} Leaderboard stats
 */
export const getLeaderboardStats = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('referral_count')
      .gt('referral_count', 0);

    if (error) throw error;

    const totalReferrals = data.reduce((sum, user) => sum + user.referral_count, 0);
    const topReferrer = Math.max(...data.map(user => user.referral_count));
    const activeReferrers = data.length;

    return {
      success: true,
      data: {
        totalReferrals,
        topReferrer,
        activeReferrers
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching leaderboard stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get event winners
 * @param {String} eventId - Filter by event ID (optional)
 * @returns {Promise<Array>} List of winners
 */
export const getEventWinners = async (eventId = null) => {
  try {
    let query = supabase
      .from('winners')
      .select(`
        *,
        user:profiles!winners_user_id_fkey(full_name, college_name, department)
      `)
      .order('position', { ascending: true });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching winners:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Add event winner (Admin/Coordinator only)
 * @param {Object} winnerData - Winner information
 * @returns {Promise<Object>} Response with winner details
 */
export const addEventWinner = async (winnerData) => {
  try {
    const {
      eventId,
      userId,
      teamName,
      position,
      prizeAmount,
      certificateUrl
    } = winnerData;

    const { data, error } = await supabase
      .from('winners')
      .insert({
        event_id: eventId,
        user_id: userId,
        team_name: teamName || null,
        position,
        prize_amount: prizeAmount || null,
        certificate_url: certificateUrl || null
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
    console.error("Error adding winner:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update winner information
 * @param {String} winnerId - ID of the winner
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Response with updated winner
 */
export const updateWinner = async (winnerId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('winners')
      .update(updateData)
      .eq('id', winnerId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error updating winner:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Delete winner
 * @param {String} winnerId - ID of the winner
 * @returns {Promise<Object>} Response with success status
 */
export const deleteWinner = async (winnerId) => {
  try {
    const { error } = await supabase
      .from('winners')
      .delete()
      .eq('id', winnerId);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error("Error deleting winner:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getReferralLeaderboard,
  getLeaderboardStats,
  getEventWinners,
  addEventWinner,
  updateWinner,
  deleteWinner
};
