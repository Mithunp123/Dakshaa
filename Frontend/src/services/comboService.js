import { supabase } from "../supabase";

// Cache for combos (similar to events cache)
const COMBOS_CACHE_KEY = 'dakshaa_combos_cache';
const COMBOS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to clear cache
export const clearCombosCache = () => {
  try {
    localStorage.removeItem(COMBOS_CACHE_KEY);
    console.log('Combos cache cleared');
    return true;
  } catch (error) {
    console.warn('Failed to clear combos cache:', error);
    return false;
  }
};

// Helper to get cached combos
const getCachedCombos = () => {
  try {
    const cached = localStorage.getItem(COMBOS_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < COMBOS_CACHE_DURATION && data?.length > 0) {
        console.log('🔵 [comboService] Using cached combos');
        return data;
      }
    }
  } catch (e) {}
  return null;
};

// Helper to cache combos
const cacheCombos = (combos) => {
  try {
    localStorage.setItem(COMBOS_CACHE_KEY, JSON.stringify({
      data: combos,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

// Helper function to check if a string is a valid UUID
const isValidUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to resolve event IDs (converts event_keys to UUIDs if needed)
const resolveEventIds = async (eventIds) => {
  if (!eventIds || eventIds.length === 0) return [];
  
  const uuids = eventIds.filter(id => isValidUUID(id));
  const eventKeys = eventIds.filter(id => !isValidUUID(id));
  
  let resolvedUUIDs = [...uuids];
  
  if (eventKeys.length > 0) {
    const { data: keyLookup } = await supabase
      .from("events_config")
      .select("id, event_key")
      .in("event_key", eventKeys);
    
    if (keyLookup) {
      const keyToUUID = {};
      keyLookup.forEach(e => { keyToUUID[e.event_key] = e.id; });
      eventKeys.forEach(key => {
        if (keyToUUID[key]) {
          resolvedUUIDs.push(keyToUUID[key]);
        }
      });
    }
  }
  
  return resolvedUUIDs;
};

/**
 * Combo & Package Service
 * Manages event bundle packages using Explosion Strategy
 */

const comboService = {
  /**
   * Get all combos - Direct table query following Python reference
   * @param {boolean} includeInactive - Include inactive combos
   */
  getAllCombos: async (includeInactive = false) => {
    try {
      let query = supabase
        .from('combos')
        .select('*');

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cache the results
      if (data) cacheCombos(data);

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error fetching combos:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Get combo by ID - Direct table query
   * @param {string} comboId - UUID of the combo
   */
  getComboById: async (comboId) => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .select('*')
        .eq('id', comboId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching combo:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  },

  /**
   * Create new combo - Direct table insert following Python reference
   */
  createCombo: async ({
    name,
    description,
    price,
    originalPrice,
    discountPercentage = 0,
    categoryQuotas = {},
    totalEventsRequired = 2,
    isActive = true,
    displayOrder = 0,
    maxPurchases = 100,
    badgeText,
    badgeColor
  }) => {
    try {
      const insertData = {
        name,
        description,
        price,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        category_quotas: categoryQuotas,
        total_events_required: totalEventsRequired,
        is_active: isActive,
        display_order: displayOrder,
        max_purchases: maxPurchases,
        badge_text: badgeText,
        badge_color: badgeColor
      };

      // Remove undefined values
      Object.keys(insertData).forEach(key => {
        if (insertData[key] === undefined) {
          delete insertData[key];
        }
      });

      const { data, error } = await supabase
        .from('combos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      clearCombosCache();

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error creating combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update combo - Direct table update following Python reference
   */
  updateCombo: async (comboId, {
    name,
    description,
    price,
    originalPrice,
    discountPercentage = 0,
    categoryQuotas = {},
    totalEventsRequired = 2,
    isActive = true,
    displayOrder = 0,
    maxPurchases = 100,
    badgeText,
    badgeColor
  }) => {
    try {
      const updateData = {
        name,
        description,
        price,
        original_price: originalPrice,
        discount_percentage: discountPercentage,
        category_quotas: categoryQuotas,
        total_events_required: totalEventsRequired,
        is_active: isActive,
        display_order: displayOrder,
        max_purchases: maxPurchases,
        badge_text: badgeText,
        badge_color: badgeColor
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data, error } = await supabase
        .from('combos')
        .update(updateData)
        .eq('id', comboId)
        .select();

      if (error) throw error;

      // Clear cache
      clearCombosCache();

      return {
        success: true,
        data: data && data.length > 0 ? data[0] : null,
        message: 'Combo updated successfully'
      };
    } catch (error) {
      console.error("Error updating combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Delete combo - Direct table delete following Python reference
   */
  deleteCombo: async (comboId) => {
    try {
      const { data, error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId)
        .select();

      if (error) throw error;

      // Clear cache
      clearCombosCache();

      return {
        success: true,
        data: data && data.length > 0 ? data[0] : null,
        message: 'Combo deleted successfully'
      };
    } catch (error) {
      console.error("Error deleting combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Toggle combo active status - Direct table update
   */
  toggleComboStatus: async (comboId) => {
    try {
      // First get current status
      const { data: currentCombo, error: fetchError } = await supabase
        .from('combos')
        .select('is_active')
        .eq('id', comboId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle the status
      const newStatus = !currentCombo.is_active;

      const { data, error } = await supabase
        .from('combos')
        .update({ is_active: newStatus })
        .eq('id', comboId)
        .select();

      if (error) throw error;

      // Clear cache
      clearCombosCache();

      return {
        success: true,
        isActive: newStatus,
        message: `Combo ${newStatus ? 'activated' : 'deactivated'} successfully`
      };
    } catch (error) {
      console.error("Error toggling combo status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all combo purchases - Following Python reference
   */
  getComboPurchases: async (limit = 100, offset = 0, paymentStatus = null) => {
    try {
      let query = supabase
        .from('combo_purchases')
        .select('*');

      if (paymentStatus) {
        query = query.eq('payment_status', paymentStatus);
      }

      const { data, error } = await query
        .order('purchased_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Fetch related data separately (similar to Python approach)
      const flattened = await Promise.all((data || []).map(async (purchase) => {
        const flat = { ...purchase };

        // Try to get profile info
        try {
          if (purchase.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email, mobile_number')
              .eq('id', purchase.user_id)
              .single();

            if (profile) {
              flat.full_name = profile.full_name;
              flat.email = profile.email;
              flat.mobile_number = profile.mobile_number;
            }
          }
        } catch (e) {
          console.warn('Could not fetch profile for purchase', e);
        }

        // Try to get combo info
        try {
          if (purchase.combo_id) {
            const { data: combo } = await supabase
              .from('combos')
              .select('name')
              .eq('id', purchase.combo_id)
              .single();

            if (combo) {
              flat.combo_name = combo.name;
            }
          }
        } catch (e) {
          console.warn('Could not fetch combo for purchase', e);
        }

        return flat;
      }));

      return {
        success: true,
        data: flattened,
      };
    } catch (error) {
      console.error("Error fetching combo purchases:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Get purchase by ID - Following Python reference
   */
  getPurchaseById: async (purchaseId) => {
    try {
      const { data, error } = await supabase
        .from('combo_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (error) throw error;

      const flat = { ...data };

      // Fetch related data separately
      try {
        if (data.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, mobile_number')
            .eq('id', data.user_id)
            .single();

          if (profile) {
            flat.full_name = profile.full_name;
            flat.email = profile.email;
            flat.mobile_number = profile.mobile_number;
          }
        }
      } catch (e) {}

      try {
        if (data.combo_id) {
          const { data: combo } = await supabase
            .from('combos')
            .select('name')
            .eq('id', data.combo_id)
            .single();

          if (combo) {
            flat.combo_name = combo.name;
          }
        }
      } catch (e) {}

      return {
        success: true,
        data: flat,
      };
    } catch (error) {
      console.error("Error fetching purchase:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  },

  /**
   * Delete combo purchase - Direct table delete
   */
  deletePurchase: async (purchaseId) => {
    try {
      const { data, error } = await supabase
        .from('combo_purchases')
        .delete()
        .eq('id', purchaseId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data && data.length > 0 ? data[0] : null,
      };
    } catch (error) {
      console.error("Error deleting purchase:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Update payment status - Following Python reference
   */
  updatePaymentStatus: async (purchaseId, status, transactionId = null) => {
    try {
      const updateData = { payment_status: status };
      if (transactionId) {
        updateData.transaction_id = transactionId;
      }

      const { data, error } = await supabase
        .from('combo_purchases')
        .update(updateData)
        .eq('id', purchaseId)
        .select();

      if (error) throw error;

      return {
        success: true,
        data: data && data.length > 0 ? data[0] : null,
      };
    } catch (error) {
      console.error("Error updating payment status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get combo purchase statistics - Following Python reference
   */
  getPurchaseStats: async () => {
    try {
      const { data, error } = await supabase
        .from('combo_purchases')
        .select('payment_status, payment_amount');

      if (error) throw error;

      const stats = {
        total_purchases: 0,
        paid: 0,
        pending: 0,
        total_revenue: 0
      };

      (data || []).forEach(purchase => {
        stats.total_purchases += 1;
        const status = purchase.payment_status || '';

        if (status === 'PAID' || status === 'paid') {
          stats.paid += 1;
          try {
            stats.total_revenue += parseFloat(purchase.payment_amount || 0);
          } catch (e) {}
        } else if (status === 'PENDING' || status === 'pending') {
          stats.pending += 1;
        }
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Error fetching purchase stats:", error);
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }
  },

  /**
   * Get all combos with full details (Admin view) - Enhanced version
   */
  getCombosWithDetails: async () => {
    try {
      // Get all combos
      const { data: combos, error } = await supabase
        .from('combos')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get purchase counts for each combo
      const combosWithStats = await Promise.all((combos || []).map(async (combo) => {
        try {
          const { data: purchases } = await supabase
            .from('combo_purchases')
            .select('id', { count: 'exact', head: false })
            .eq('combo_id', combo.id);

          return {
            ...combo,
            total_purchases: purchases?.length || 0,
            current_purchases: purchases?.length || 0
          };
        } catch (e) {
          return {
            ...combo,
            total_purchases: 0,
            current_purchases: 0
          };
        }
      }));

      // Cache the results
      cacheCombos(combosWithStats);

      return {
        success: true,
        data: combosWithStats,
      };
    } catch (error) {
      console.error("Error fetching combos with details:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Get active combos for students (with availability checks)
   * @param {string} userId - The user ID (passed from caller, no re-auth needed)
   */
  getActiveCombosForStudents: async (userId, forceRefresh = false) => {
    try {
      console.log('🔵 [comboService] getActiveCombosForStudents called with userId:', userId);
      
      // Trust the userId passed in - don't call getUser() as it can timeout/hang
      if (!userId) {
        console.warn("⚠️ [comboService] No userId provided, combos not available");
        return {
          success: false,
          data: [],
          error: "User not authenticated",
        };
      }

      // Try cache first for instant display - RETURN IMMEDIATELY if valid cache
      const cachedCombos = getCachedCombos();
      if (cachedCombos && !forceRefresh) {
        // Return cache immediately, trigger background refresh if older than 2 min
        const cached = localStorage.getItem(COMBOS_CACHE_KEY);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          if (age > 2 * 60 * 1000) {
            // Trigger background refresh
            setTimeout(() => comboService.getActiveCombosForStudents(userId, true), 100);
          }
        }
        return { success: true, data: cachedCombos, fromCache: true };
      }

      // Query combos table
      console.log('🔵 [comboService] Querying combos table...');
      const { data, error } = await supabase
        .from("combos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      console.log("🔵 [comboService] Raw combos query result:", { 
        dataLength: data?.length || 0,
        error: error?.message,
        firstCombo: data?.[0]?.name
      });
      
      if (error) {
        console.error("🔵 [comboService] Query error:", error);
        // If query fails but we have cache, return cache
        if (cachedCombos) {
          console.log('🔵 [comboService] Returning cached combos due to query error');
          return { success: true, data: cachedCombos };
        }
        throw error;
      }

      // Filter combos that are still available (not sold out)
      const availableCombos = (data || []).map((combo) => {
        // Normalize combo data - convert TEXT fields to proper types
        const normalizedCombo = {
          ...combo,
          price: parseFloat(combo.price) || 0,
          max_purchases: parseInt(combo.max_purchases) || 100,
          current_purchases: parseInt(combo.current_purchases) || 0,
          is_active: combo.is_active === true || combo.is_active === 'true'
        };
        return normalizedCombo;
      }).filter((combo) => {
        const isAvailable = combo.current_purchases < combo.max_purchases;
        console.log(`🔵 [comboService] Combo "${combo.name}": current=${combo.current_purchases}, max=${combo.max_purchases}, available=${isAvailable}`);
        return isAvailable;
      });
      
      console.log("🔵 [comboService] Available combos after filtering:", availableCombos.length);

      // Cache the results
      if (availableCombos.length > 0) {
        cacheCombos(availableCombos);
      }

      return {
        success: true,
        data: availableCombos,
      };
    } catch (error) {
      console.error("Error fetching active combos:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  // Legacy methods below - keeping for backward compatibility
  /**
   * @deprecated Use getComboById instead
   */
  getComboByIdLegacy: async (comboId) => {
    try {
      const { data, error } = await supabase
        .from("combos")
        .select(
          `
          *,
          combo_items (
            event_id,
            events_config (*)
          )
        `
        )
        .eq("id", comboId)
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error fetching combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * @deprecated Use createCombo instead
   */
  createComboRPC: async ({
    name,
    description,
    price,
    isActive = true,
    categoryQuotas = {},
  }) => {
    try {
      const { data, error } = await supabase.rpc("create_combo", {
        p_name: name,
        p_description: description,
        p_price: price,
        p_is_active: isActive,
        p_category_quotas: categoryQuotas,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        data: data.combo_id,
      };
    } catch (error) {
      console.error("Error creating combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * @deprecated Use updateCombo instead
   */
  updateComboRPC: async (
    comboId,
    { name, description, price, isActive, categoryQuotas = {} }
  ) => {
    try {
      const { data, error } = await supabase.rpc("update_combo", {
        p_combo_id: comboId,
        p_name: name,
        p_description: description,
        p_price: price,
        p_is_active: isActive,
        p_category_quotas: categoryQuotas,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error updating combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * @deprecated Use deleteCombo instead
   */
  deleteComboRPC: async (comboId) => {
    try {
      const { data, error } = await supabase.rpc("delete_combo", {
        p_combo_id: comboId,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.error("Error deleting combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * @deprecated Use toggleComboStatus instead
   */
  toggleComboStatusRPC: async (comboId) => {
    try {
      const { data, error } = await supabase.rpc("toggle_combo_status", {
        p_combo_id: comboId,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error("Error toggling combo status:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * THE EXPLOSION FUNCTION
   * Purchase combo and create individual event registrations
   */
  explodeComboPurchase: async ({
    comboId,
    userId,
    transactionId,
    paymentAmount,
  }) => {
    try {
      const { data, error } = await supabase.rpc("explode_combo_purchase", {
        p_combo_id: comboId,
        p_user_id: userId,
        p_transaction_id: transactionId,
        p_payment_amount: paymentAmount,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.message,
        };
      }

      return {
        success: true,
        purchaseId: data.purchase_id,
        registrationsCreated: data.registrations_created,
        message: data.message,
      };
    } catch (error) {
      console.error("Error exploding combo purchase:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user's combo purchases
   */
  getUserComboPurchases: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("combo_purchases")
        .select(
          `
          *,
          combos (
            id,
            name,
            description,
            price
          )
        `
        )
        .eq("user_id", userId)
        .eq("payment_status", "PAID")
        .order("purchased_at", { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error fetching user combo purchases:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all events for combo creation (both SOLO and TEAM)
   */
  getSoloEventsForCombo: async () => {
    try {
      const { data, error } = await supabase
        .from("events_config")
        .select("id, name, event_key, price, category, type, is_open")
        .eq("is_open", true)
        .order("name");

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error fetching events:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Calculate combo savings
   */
  calculateSavings: (events, comboPrice) => {
    const originalPrice = events.reduce((sum, event) => sum + event.price, 0);
    const savings = originalPrice - comboPrice;
    const savingsPercentage =
      originalPrice > 0 ? ((savings / originalPrice) * 100).toFixed(1) : 0;

    return {
      originalPrice,
      savings,
      savingsPercentage,
    };
  },

  /**
   * Check if user has conflicts with combo
   */
  checkComboConflicts: async (userId, eventIds) => {
    try {
      const { data, error } = await supabase
        .from("event_registrations_config")
        .select("event_id, events_config(name)")
        .eq("user_id", userId)
        .eq("payment_status", "PAID")
        .in("event_id", eventIds);

      if (error) throw error;

      return {
        hasConflict: data && data.length > 0,
        conflicts: data || [],
      };
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return {
        hasConflict: false,
        conflicts: [],
      };
    }
  },

  /**
   * Validate combo event selection (NEW - uses RPC function)
   */
  validateComboSelection: async (comboId, selectedEventIds) => {
    try {
      const { data, error } = await supabase.rpc("validate_combo_selection", {
        p_combo_id: comboId,
        p_selected_event_ids: selectedEventIds,
      });

      if (error) throw error;

      return {
        valid: data?.valid || false,
        categoryBreakdown: data?.category_breakdown || {},
        errors: data?.errors || [],
      };
    } catch (error) {
      console.error("Error validating combo selection:", error);
      return {
        valid: false,
        categoryBreakdown: {},
        errors: [error.message],
      };
    }
  },

  /**
   * Create combo purchase (NEW - initiates purchase before payment)
   */
  createComboPurchase: async (comboId, userId, selectedEventIds) => {
    try {
      const { data, error } = await supabase.rpc("create_combo_purchase", {
        p_combo_id: comboId,
        p_user_id: userId,
        p_selected_event_ids: selectedEventIds,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || "Failed to create purchase",
        };
      }

      return {
        success: true,
        purchaseId: data.purchase_id,
        amount: data.amount,
      };
    } catch (error) {
      console.error("Error creating combo purchase:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Complete combo payment (NEW - updates payment and triggers explosion)
   */
  completeComboPayment: async (purchaseId, transactionId) => {
    try {
      const { data, error } = await supabase.rpc("complete_combo_payment", {
        p_combo_purchase_id: purchaseId,
        p_transaction_id: transactionId,
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.message || "Payment completion failed",
        };
      }

      return {
        success: true,
        registrationIds: data.registration_ids,
        eventCount: data.event_count,
        message: data.message,
      };
    } catch (error) {
      console.error("Error completing combo payment:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get user's PAID combo purchases (IDs only)
   */
  getUserPaidCombos: async (userId) => {
    try {
      const { data, error } = await supabase
        .from("combo_purchases")
        .select("combo_id")
        .eq("user_id", userId)
        .eq("payment_status", "PAID");

      if (error) throw error;

      return {
        success: true,
        data: (data || []).map(p => p.combo_id),
      };
    } catch (error) {
      console.error("Error fetching paid combos:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Get user combo purchases with full details (NEW - uses RPC function)
   */
  getUserComboPurchasesDetailed: async (userId) => {
    try {
      const { data, error } = await supabase.rpc("get_user_combo_purchases", {
        p_user_id: userId,
      });

      if (error) throw error;

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("Error fetching user combo purchases:", error);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  },

  /**
   * Purchase a combo package (UPDATED - uses new flow)
   */
  purchaseCombo: async (userId, comboId, selectedEventIds) => {
    try {
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      if (!comboId || comboId === 'undefined' || comboId === 'null') {
        return { success: false, error: "Invalid combo ID. Please select a combo again." };
      }

      console.log("📦 Purchasing combo with new flow:", {
        userId,
        comboId,
        selectedEventIds,
      });

      // Step 1: Validate selection
      const validation = await comboService.validateComboSelection(
        comboId,
        selectedEventIds
      );

      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid selection: ${validation.errors.join(", ")}`,
        };
      }

      // Step 2: Create purchase record
      const purchaseResult = await comboService.createComboPurchase(
        comboId,
        userId,
        selectedEventIds
      );

      if (!purchaseResult.success) {
        return purchaseResult;
      }

      // Step 3: Return purchase details for payment gateway integration
      return {
        success: true,
        purchaseId: purchaseResult.purchaseId,
        amount: purchaseResult.amount,
        needsPayment: true,
        message: "Purchase initiated. Proceed to payment.",
      };

    } catch (error) {
      console.error("Error purchasing combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Purchase a combo package - Legacy flow (for backward compatibility)
   */
  purchaseComboLegacy: async (userId, comboId, selectedEventIds) => {
    try {
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      if (!comboId || comboId === 'undefined' || comboId === 'null') {
        return { success: false, error: "Invalid combo ID. Please select a combo again." };
      }

      console.log("📦 Purchasing combo (legacy):", {
        userId,
        comboId,
        selectedEventIds,
      });

      // Get combo details
      const { data: combo, error: comboError } = await supabase
        .from("combos")
        .select("*")
        .eq("id", comboId)
        .single();

      if (comboError) {
        console.error("Combo fetch error:", comboError);
        throw comboError;
      }

      // Resolve event IDs
      let eventIdsToRegister = selectedEventIds || [];
      if (eventIdsToRegister.length === 0) {
        if (combo.event_ids && Array.isArray(combo.event_ids)) {
          eventIdsToRegister = combo.event_ids;
        } else if (combo.events && Array.isArray(combo.events)) {
          eventIdsToRegister = combo.events
            .map((e) => e.id || e.event_id)
            .filter(Boolean);
        }
      }

      eventIdsToRegister = await resolveEventIds(eventIdsToRegister);
      
      if (eventIdsToRegister.length === 0) {
        return {
          success: false,
          error: "No valid events found to register",
        };
      }

      // Create registrations using legacy registrations table
      const { data: eventsData } = await supabase
        .from("events_config")
        .select("id, event_key")
        .in("id", eventIdsToRegister);

      const eventKeyMap = {};
      (eventsData || []).forEach((event) => {
        eventKeyMap[event.id] = event.event_key;
      });

      const registrations = eventIdsToRegister
        .map((eventId) => ({
          user_id: userId,
          event_id: eventKeyMap[eventId],
          combo_id: comboId,
          payment_status: "PAID",
          payment_id: `COMBO_${Date.now()}`,
        }))
        .filter(r => r.event_id);

      const { data: regData, error: regError } = await supabase
        .from("registrations")
        .insert(registrations)
        .select();

      if (regError) {
        console.error("Registration insert error:", regError);
        throw regError;
      }

      return {
        success: true,
        data: regData,
        comboName: combo.name || combo.combo_name,
        message: "Combo purchase successful",
      };
    } catch (error) {
      console.error("Error purchasing combo (legacy):", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default comboService;
