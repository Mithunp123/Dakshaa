import { supabase } from "../supabase";

// Cache for combos (similar to events cache)
const COMBOS_CACHE_KEY = 'dakshaa_combos_cache';
const COMBOS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
   * Get all combos with full details (Admin view)
   */
  getCombosWithDetails: async () => {
    try {
      // Use combos_with_stats view to get purchase counts
      const { data, error } = await supabase
        .from("combos_with_stats")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback to regular combos table if view doesn't exist
        console.warn("combos_with_stats view not found, using combos table");
        const fallback = await supabase
          .from("combos")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (fallback.error) throw fallback.error;
        
        return {
          success: true,
          data: (fallback.data || []).map(c => ({
            ...c,
            total_purchases: c.current_purchases || 0
          })),
        };
      }

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
   * Get active combos for students (with availability checks)
   * @param {string} userId - The user ID (passed from caller, no re-auth needed)
   */
  getActiveCombosForStudents: async (userId) => {
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

      // Try cache first for instant display
      const cachedCombos = getCachedCombos();
      
      // Ensure Supabase session is initialized before querying
      // This restores the session from localStorage if needed
      let sessionReady = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        sessionReady = !!session;
        console.log('🔵 [comboService] Session ready:', sessionReady);
      } catch (e) {
        console.warn('🔵 [comboService] Session check failed:', e.message);
        // If session check fails but we have cache, return cache
        if (cachedCombos) {
          console.log('🔵 [comboService] Returning cached combos due to session issue');
          return { success: true, data: cachedCombos };
        }
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

  /**
   * Get combo by ID
   */
  getComboById: async (comboId) => {
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
   * Create new combo (category quotas only)
   */
  createCombo: async ({
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
   * Update existing combo (category quotas only)
   */
  updateCombo: async (
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
   * Delete combo
   */
  deleteCombo: async (comboId) => {
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
   * Toggle combo active status
   */
  toggleComboStatus: async (comboId) => {
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
