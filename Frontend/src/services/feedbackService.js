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
    const {
      username,
      email_id,
      event_category,
      event_id,
      event_name,
      question_ratings,
      message,
    } = feedbackData;

    const ratingValues = Object.values(question_ratings || {})
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    const overallRating =
      ratingValues.length > 0
        ? Math.max(1, Math.min(5, Math.round(ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length)))
        : 5;

    const { data, error } = await supabase.rpc('submit_feedback', {
      p_username: username,
      p_email_id: email_id,
      p_event_category: event_category,
      p_event_id: event_id,
      p_event_name: event_name,
      p_question_ratings: question_ratings,
      p_rating: overallRating,
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

/**
 * Get feedback filtered by event_id
 * @param {string} eventId - The event UUID to filter by
 * @returns {Promise<Object>} Feedback list for the event
 */
export const getFeedbackByEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching feedback by event:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get feedback statistics for a specific event
 * @param {string} eventId - The event UUID
 * @returns {Promise<Object>} Feedback stats for the event
 */
export const getFeedbackStatsByEvent = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating, question_ratings, message, username, email_id, created_at')
      .eq('event_id', eventId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        success: true,
        data: {
          totalFeedback: 0,
          averageRating: '0.00',
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          questionAverages: {},
        },
        error: null
      };
    }

    const totalFeedback = data.length;
    const averageRating = data.reduce((sum, item) => sum + item.rating, 0) / totalFeedback;
    const ratingDistribution = {
      1: data.filter(f => f.rating === 1).length,
      2: data.filter(f => f.rating === 2).length,
      3: data.filter(f => f.rating === 3).length,
      4: data.filter(f => f.rating === 4).length,
      5: data.filter(f => f.rating === 5).length,
    };

    // Aggregate question-wise averages
    const questionTotals = {};
    const questionCounts = {};
    data.forEach(item => {
      if (item.question_ratings && typeof item.question_ratings === 'object') {
        Object.entries(item.question_ratings).forEach(([key, value]) => {
          const numVal = Number(value);
          if (Number.isFinite(numVal)) {
            questionTotals[key] = (questionTotals[key] || 0) + numVal;
            questionCounts[key] = (questionCounts[key] || 0) + 1;
          }
        });
      }
    });

    const questionAverages = {};
    Object.keys(questionTotals).forEach(key => {
      questionAverages[key] = (questionTotals[key] / questionCounts[key]).toFixed(2);
    });

    return {
      success: true,
      data: {
        totalFeedback,
        averageRating: averageRating.toFixed(2),
        ratingDistribution,
        questionAverages,
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching event feedback stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all feedback for a category (or all if category is 'all')
 * @param {string} category - The event category to filter by, or 'all'
 * @returns {Promise<Object>} Feedback list
 */
export const getFeedbackByCategory = async (category) => {
  try {
    let query = supabase
      .from('feedback')
      .select('*')
      .order('event_name', { ascending: true })
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.ilike('event_category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching feedback by category:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

export default {
  submitFeedback,
  getAllFeedback,
  getFeedbackStats,
  getFeedbackByEvent,
  getFeedbackStatsByEvent,
  getFeedbackByCategory
};
