import { supabase } from "../supabase";

/**
 * Contact Service
 * Handles contact form submissions for DaKshaa T26
 */

/**
 * Submit contact message
 * @param {Object} contactData - Contact form data
 * @returns {Promise<Object>} Response with success status
 */
export const submitContactMessage = async (contactData) => {
  try {
    const { name, email, phone, subject, message } = contactData;

    const { data, error } = await supabase.rpc('submit_contact_message', {
      p_name: name,
      p_email: email,
      p_phone: phone || null,
      p_subject: subject,
      p_message: message
    });

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error submitting contact message:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get all contact messages (Admin only)
 * @param {String} status - Filter by status (optional)
 * @returns {Promise<Array>} List of contact messages
 */
export const getAllContactMessages = async (status = null) => {
  try {
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching contact messages:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Update contact message status
 * @param {String} messageId - ID of the message
 * @param {String} status - New status
 * @returns {Promise<Object>} Response with success status
 */
export const updateContactMessageStatus = async (messageId, status) => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error updating contact message:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  submitContactMessage,
  getAllContactMessages,
  updateContactMessageStatus
};
