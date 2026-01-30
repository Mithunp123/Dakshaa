import { supabase } from "../supabase";

/**
 * Get current user profile with role information
 * @returns {Promise<Object>} User profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    return {
      success: true,
      data: {
        ...profile,
        email: user.email
      }
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if current user has admin privileges
 * @returns {Promise<boolean>}
 */
export const isAdmin = async () => {
  try {
    const result = await getCurrentUserProfile();
    if (!result.success) return false;
    
    const role = result.data.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'event_coordinator';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Check if current user is event coordinator
 * @returns {Promise<boolean>}
 */
export const isEventCoordinator = async () => {
  try {
    const result = await getCurrentUserProfile();
    if (!result.success) return false;
    
    const role = result.data.role?.toLowerCase();
    return role === 'event_coordinator';
  } catch (error) {
    console.error('Error checking coordinator status:', error);
    return false;
  }
};

/**
 * Check if current user is super admin
 * @returns {Promise<boolean>}
 */
export const isSuperAdmin = async () => {
  try {
    const result = await getCurrentUserProfile();
    if (!result.success) return false;
    
    const role = result.data.role?.toLowerCase();
    return role === 'super_admin' || role === 'admin';
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

/**
 * Get events that user can coordinate (based on role)
 * @returns {Promise<Object>}
 */
export const getUserAccessibleEvents = async () => {
  try {
    const profileResult = await getCurrentUserProfile();
    if (!profileResult.success) {
      throw new Error('Failed to get user profile');
    }

    const userRole = profileResult.data.role?.toLowerCase();
    
    // Super admins can access all events
    if (userRole === 'super_admin' || userRole === 'admin') {
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      return {
        success: true,
        data: events || [],
        role: userRole
      };
    }
    
    // Event coordinators - need to determine their assigned events
    // This could be based on department, assigned events, etc.
    if (userRole === 'event_coordinator') {
      // For now, we'll filter by user's department or use a coordinator_events table
      // You might want to create a separate table for coordinator assignments
      const userDepartment = profileResult.data.department;
      
      let query = supabase
        .from('events')
        .select('*')
        .eq('is_active', true);
      
      // If department-based filtering is needed, uncomment below
      // if (userDepartment) {
      //   query = query.ilike('name', `%${userDepartment}%`);
      // }
      
      const { data: events, error } = await query.order('name');
      
      if (error) throw error;
      
      return {
        success: true,
        data: events || [],
        role: userRole
      };
    }
    
    // Regular users can't access admin features
    return {
      success: false,
      error: 'Insufficient permissions',
      role: userRole
    };
  } catch (error) {
    console.error('Error getting accessible events:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getCurrentUserProfile,
  isAdmin,
  isEventCoordinator,
  isSuperAdmin,
  getUserAccessibleEvents
};