import { supabase } from "../supabase";

/**
 * Accommodation Service
 * Handles accommodation and lunch booking requests
 */

/**
 * Create accommodation request
 * @param {Object} requestData - Accommodation request data
 * @returns {Promise<Object>} Response with request details
 */
export const createAccommodationRequest = async (requestData) => {
  try {
    const {
      fullName,
      email,
      phone,
      collegeName,
      checkInDate,
      checkOutDate,
      includeFood,
      specialRequests
    } = requestData;

    const { data, error } = await supabase.rpc('create_accommodation_request', {
      p_full_name: fullName,
      p_email: email,
      p_phone: phone,
      p_college_name: collegeName,
      p_check_in_date: checkInDate,
      p_check_out_date: checkOutDate,
      p_include_food: includeFood,
      p_special_requests: specialRequests || null
    });

    if (error) throw error;

    return {
      success: data.success,
      data: data,
      error: null
    };
  } catch (error) {
    console.error("Error creating accommodation request:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's accommodation requests
 * @returns {Promise<Array>} List of user's requests
 */
export const getUserAccommodationRequests = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('accommodation_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching accommodation requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get all accommodation requests (Admin only)
 * @returns {Promise<Array>} List of all requests
 */
export const getAllAccommodationRequests = async () => {
  try {
    const { data, error } = await supabase
      .from('accommodation_requests')
      .select(`
        *,
        user:profiles!accommodation_requests_user_id_fkey(full_name, email, college_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching all accommodation requests:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Update accommodation payment status
 * @param {String} requestId - ID of the request
 * @param {String} paymentStatus - New payment status
 * @param {String} paymentId - Payment transaction ID
 * @returns {Promise<Object>} Response with updated request
 */
export const updateAccommodationPayment = async (requestId, paymentStatus, paymentId = null) => {
  try {
    const updateData = { payment_status: paymentStatus };
    if (paymentId) {
      updateData.payment_id = paymentId;
    }

    const { data, error } = await supabase
      .from('accommodation_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error("Error updating accommodation payment:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Create lunch booking
 * @param {Object} bookingData - Lunch booking data
 * @returns {Promise<Object>} Response with booking details
 */
export const createLunchBooking = async (bookingData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const {
      fullName,
      email,
      phone,
      lunchDate,
      quantity
    } = bookingData;

    const totalPrice = quantity * 100; // Rs. 100 per lunch

    const { data, error } = await supabase
      .from('lunch_bookings')
      .insert({
        user_id: user.id,
        full_name: fullName,
        email,
        phone,
        lunch_date: lunchDate,
        quantity,
        total_price: totalPrice
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
    console.error("Error creating lunch booking:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get user's lunch bookings
 * @returns {Promise<Array>} List of user's bookings
 */
export const getUserLunchBookings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('lunch_bookings')
      .select('*')
      .eq('user_id', user.id)
      .order('lunch_date', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null
    };
  } catch (error) {
    console.error("Error fetching lunch bookings:", error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Get accommodation and lunch statistics (Admin)
 * @returns {Promise<Object>} Statistics
 */
export const getAccommodationStats = async () => {
  try {
    const [accommodationResult, lunchResult] = await Promise.all([
      supabase.from('accommodation_requests').select('payment_status, total_price'),
      supabase.from('lunch_bookings').select('payment_status, total_price')
    ]);

    const accommodationStats = {
      total: accommodationResult.data?.length || 0,
      paid: accommodationResult.data?.filter(r => r.payment_status === 'PAID').length || 0,
      pending: accommodationResult.data?.filter(r => r.payment_status === 'PENDING').length || 0,
      revenue: accommodationResult.data
        ?.filter(r => r.payment_status === 'PAID')
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0) || 0
    };

    const lunchStats = {
      total: lunchResult.data?.length || 0,
      paid: lunchResult.data?.filter(r => r.payment_status === 'PAID').length || 0,
      pending: lunchResult.data?.filter(r => r.payment_status === 'PENDING').length || 0,
      revenue: lunchResult.data
        ?.filter(r => r.payment_status === 'PAID')
        .reduce((sum, r) => sum + parseFloat(r.total_price), 0) || 0
    };

    return {
      success: true,
      data: {
        accommodation: accommodationStats,
        lunch: lunchStats
      },
      error: null
    };
  } catch (error) {
    console.error("Error fetching accommodation stats:", error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  createAccommodationRequest,
  getUserAccommodationRequests,
  getAllAccommodationRequests,
  updateAccommodationPayment,
  createLunchBooking,
  getUserLunchBookings,
  getAccommodationStats
};
