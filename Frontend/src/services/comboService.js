import { supabase } from "../supabase";

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
      // Use direct query instead of RPC function
      const { data, error } = await supabase
        .from("combos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

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
   */
  getActiveCombosForStudents: async (userId) => {
    try {
      // Use direct query instead of RPC function that doesn't exist
      const { data, error } = await supabase
        .from("combos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter combos that are still available (not sold out)
      const availableCombos = (data || []).filter((combo) => {
        const maxPurchases = combo.max_purchases || 100;
        const currentPurchases = combo.current_purchases || 0;
        return currentPurchases < maxPurchases;
      });

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
   * Create new combo
   */
  createCombo: async ({
    name,
    description,
    price,
    eventIds,
    isActive = true,
    categoryQuotas = {},
  }) => {
    try {
      const { data, error } = await supabase.rpc("create_combo", {
        p_name: name,
        p_description: description,
        p_price: price,
        p_event_ids: eventIds,
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
   * Update existing combo
   */
  updateCombo: async (
    comboId,
    { name, description, price, eventIds, isActive, categoryQuotas = {} }
  ) => {
    try {
      const { data, error } = await supabase.rpc("update_combo", {
        p_combo_id: comboId,
        p_name: name,
        p_description: description,
        p_price: price,
        p_event_ids: eventIds,
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
   * Purchase a combo package and register for selected events
   */
  purchaseCombo: async (userId, comboId, selectedEventIds) => {
    try {
      if (!userId) {
        return { success: false, error: "User not authenticated" };
      }

      console.log("📦 Purchasing combo:", {
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

      console.log("📦 Combo data:", combo);

      // Use selectedEventIds if provided, otherwise try to get from combo
      let eventIdsToRegister = selectedEventIds || [];

      if (eventIdsToRegister.length === 0) {
        // Try combo.event_ids array
        if (
          combo.event_ids &&
          Array.isArray(combo.event_ids) &&
          combo.event_ids.length > 0
        ) {
          eventIdsToRegister = combo.event_ids;
        }
        // Try combo.events JSON field
        else if (combo.events && Array.isArray(combo.events)) {
          eventIdsToRegister = combo.events
            .map((e) => e.id || e.event_id)
            .filter(Boolean);
        }
      }

      console.log("📦 Events to register:", eventIdsToRegister);

      // If no events, get all available events as fallback for combo registration
      if (eventIdsToRegister.length === 0) {
        console.warn("No event IDs in combo, fetching available events");

        // Get some events from events_config
        const { data: availableEvents } = await supabase
          .from("events_config")
          .select("id")
          .eq("is_active", true)
          .limit(5);

        if (availableEvents && availableEvents.length > 0) {
          eventIdsToRegister = availableEvents.map((e) => e.id);
          console.log("📦 Using available events:", eventIdsToRegister);
        } else {
          return {
            success: false,
            error:
              "No events available for registration. Please contact admin.",
            comboName: combo.name || combo.combo_name,
          };
        }
      }

      // Fetch event names for all events being registered
      const { data: eventsData } = await supabase
        .from("events_config")
        .select("id, name")
        .in("id", eventIdsToRegister);

      // Create a map of event_id to event_name
      const eventNameMap = {};
      (eventsData || []).forEach((event) => {
        eventNameMap[event.id] = event.name;
      });

      // Create registrations for each event with event_name
      const registrations = eventIdsToRegister.map((eventId) => ({
        user_id: userId,
        event_id: eventId,
        event_name: eventNameMap[eventId] || null,
        payment_status: "PAID",
      }));

      console.log("📦 Creating registrations:", registrations);

      const { data: regData, error: regError } = await supabase
        .from("event_registrations_config")
        .insert(registrations)
        .select();

      if (regError) {
        console.error("Registration insert error:", regError);
        throw regError;
      }

      console.log("📦 Registration success:", regData);

      // Update combo purchase count (ignore errors)
      try {
        await supabase
          .from("combos")
          .update({ current_purchases: (combo.current_purchases || 0) + 1 })
          .eq("id", comboId);
      } catch (updateErr) {
        console.log("Combo count update skipped:", updateErr);
      }

      return {
        success: true,
        data: regData,
        comboName: combo.name || combo.combo_name,
        totalPrice: combo.total_price || combo.price,
        message: "Combo purchase successful",
      };
    } catch (error) {
      console.error("Error purchasing combo:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default comboService;
