import { supabase } from '../supabase';

/**
 * Track referral code during signup
 * - Checks if referral code exists in referral_code table
 * - If doesn't exist, inserts with usage_count = 0
 * - If exists, does nothing (idempotent operation)
 * - Does NOT increment count during signup
 * 
 * @param {string} referralId - Referral code (mobile number or unique ID)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const trackReferralCode = async (referralId) => {
  try {
    // If no referral code provided, skip tracking
    if (!referralId || referralId.trim() === '') {
      return { success: true, data: null };
    }

    const trimmedReferralId = referralId.trim();

    // Check if referral code already exists
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_code')
      .select('*')
      .eq('referral_id', trimmedReferralId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error checking referral code:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // If code already exists, do nothing (idempotent)
    if (existingCode) {
      console.log('Referral code already exists, skipping insert:', existingCode);
      return { success: true, data: existingCode, alreadyExists: true };
    }

    // If code doesn't exist, create it with usage_count = 0
    const { data: newCode, error: insertError } = await supabase
      .from('referral_code')
      .insert({
        referral_id: trimmedReferralId,
        usage_count: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting referral code:', insertError);
      return { success: false, error: insertError.message };
    }
    
    return { success: true, data: newCode, alreadyExists: false };
  } catch (error) {
    console.error('Unexpected error in trackReferralCode:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Increment usage count for a referral code (used later, not during signup)
 * @param {string} referralId - The referral code to increment
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const incrementReferralUsage = async (referralId) => {
  try {
    if (!referralId || referralId.trim() === '') {
      return { success: true, data: null };
    }

    const trimmedReferralId = referralId.trim();

    // Fetch current record
    const { data: currentCode, error: fetchError } = await supabase
      .from('referral_code')
      .select('*')
      .eq('referral_id', trimmedReferralId)
      .single();

    if (fetchError) {
      console.error('Error fetching referral code for increment:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Increment the usage count
    const { data: updatedCode, error: updateError } = await supabase
      .from('referral_code')
      .update({ usage_count: (currentCode.usage_count || 0) + 1 })
      .eq('referral_id', trimmedReferralId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating referral usage:', updateError);
      return { success: false, error: updateError.message };
    }
    
    return { success: true, data: updatedCode };
  } catch (error) {
    console.error('Unexpected error in incrementReferralUsage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get referral code statistics
 * @param {string} referralId - The referral code to query
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getReferralStats = async (referralId) => {
  try {
    if (!referralId || referralId.trim() === '') {
      return { success: false, error: 'Referral ID is required' };
    }

    const { data, error } = await supabase
      .from('referral_code')
      .select('*')
      .eq('referral_id', referralId.trim())
      .single();

    if (error) {
      console.error('Error fetching referral stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };

  } catch (error) {
    console.error('Unexpected error in getReferralStats:', error);
    return { success: false, error: error.message };
  }
};
