import { supabase } from "../supabase";

/**
 * Feedback Service
 * Handles feedback submission for DaKshaa T26
 */

/**
 * Submit user feedback
 * @param {Object} feedbackData - Feedback form data
 * @returns {Promise<Object>} Response with success status
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const { username, email_id, rating, message } = feedbackData;

    const { data, error } = await supabase.rpc('submit_feedback', {
      p_username: username,
      p_email_id: email_id,
      p_rating: rating,
      p_message: message
    });

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all feedback (Admin only)
 * @returns {Promise<Array>} List of all feedback
 */
export const getAllFeedback = async () => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get feedback statistics
 * @returns {Promise<Object>} Feedback stats
 */
export const getFeedbackStats = async () => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating');

    if (error) throw error;

    const totalFeedback = data.length;
    const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;
    const ratingDistribution = {
      1: data.filter(f => f.rating === 1).length,
      2: data.filter(f => f.rating === 2).length,
      3: data.filter(f => f.rating === 3).length,
      4: data.filter(f => f.rating === 4).length,
      5: data.filter(f => f.rating === 5).length,
    };

    return {
      success: true,
      data: {
        totalFeedback,
        averageRating: averageRating.toFixed(2),
        ratingDistribution
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  submitFeedback,
  getAllFeedback,
  getFeedbackStats
};
