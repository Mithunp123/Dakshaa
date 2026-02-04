import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import silentRefreshManager from '../utils/silentRefresh';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

// Helper to get session key dynamically
const getSessionKey = () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
  } catch {
    return 'sb-auth-token';
  }
};

// Helper to read stored session
const getStoredSession = () => {
  try {
    const sessionKey = getSessionKey();
    const storedSession = localStorage.getItem(sessionKey);
    if (storedSession) {
      const session = JSON.parse(storedSession);
      // Validate session hasn't expired
      if (session?.expires_at && session.expires_at * 1000 > Date.now()) {
        return session;
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn('Failed to read stored session:', e);
    }
  }
  return null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // 1. Optimistic User Initialization from LocalStorage
    const session = getStoredSession();
    return session?.user || null;
  });

  const [role, setRole] = useState(() => {
    // 2. Optimistic Role Initialization from localStorage (more persistent than sessionStorage)
    try {
      // Try localStorage first (survives tab close)
      const cachedRole = localStorage.getItem('userRole');
      if (cachedRole) return cachedRole;
      
      // Fallback to sessionStorage
      const cachedProfile = sessionStorage.getItem('userProfile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        return profile.role || 'student';
      }
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('Role cache read failed:', e);
      }
    }
    return 'student'; // Default to student instead of null
  });

  // Start with loading=false if we have a cached user, true otherwise
  const [loading, setLoading] = useState(() => {
    const session = getStoredSession();
    return !session?.user; // Only show loading if no cached user
  });
  
  // Track visibility check debounce
  const lastVisibilityCheckRef = useRef(0);
  const isLoggingOut = useRef(false);
  const [roleVerified, setRoleVerified] = useState(() => {
    const session = getStoredSession();
    return !session?.user; 
  });

  // Safety timeout - never show loading spinner for more than 5 seconds
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('Auth loading timeout - forcing load complete');
        setLoading(false);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Helper to fetch user role with caching
  const fetchUserRole = useCallback(async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        return 'student'; // Default role on error
      }
      
      const userRole = profile?.role || 'student';
      
      // Cache role in both localStorage and sessionStorage for persistence
      try {
        localStorage.setItem('userRole', userRole);
        const cached = sessionStorage.getItem('userProfile');
        const profileData = cached ? JSON.parse(cached) : {};
        profileData.role = userRole;
        sessionStorage.setItem('userProfile', JSON.stringify(profileData));
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Failed to cache role:', e);
        }
      }
      
      return userRole;
    } catch (err) {
      console.error('Exception fetching role:', err);
      return 'student';
    }
  }, []);

  // Handle visibility change - refresh session when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Debounce: Don't check more than once per 30 seconds to avoid token refresh issues
        const now = Date.now();
        if (now - lastVisibilityCheckRef.current < 30000) {
          return;
        }
        lastVisibilityCheckRef.current = now;

        try {
          // Refresh the session when tab becomes visible
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session refresh error:', error);
            // DON'T clear user state on error - might be temporary network issue
            return;
          }
          
          if (session?.user) {
            // Update user state if needed
            setUser(session.user);
            
            // Use cached role - don't re-fetch unless missing
            const cachedRole = localStorage.getItem('userRole');
            if (cachedRole && cachedRole !== 'student') {
              // Keep using cached role for admins/coordinators
              setRole(cachedRole);
            } else if (!cachedRole) {
              // Only fetch if no cached role
              const freshRole = await fetchUserRole(session.user.id);
              setRole(freshRole);
            }
          }
          // DON'T clear user state if no session - let the auth listener handle sign out
        } catch (err) {
          console.error('Visibility change handler error:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [role, fetchUserRole]);

  useEffect(() => {
    let mounted = true;

    // 1. Start Silent Refresh Manager
    silentRefreshManager.start();

    // 2. Initial Session Check (Async Validation)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Update user if different (or just refresh reference)
          setUser(session.user);
          
          // Fetch role to ensure permissions are up to date
          const userRole = await fetchUserRole(session.user.id);
          if (mounted) {
             setRole(userRole);
             setRoleVerified(true);
          }
        } else {
          // No session - user is not logged in (this is OK for public pages)
          setUser(null);
          setRole('student');
          setRoleVerified(true);
          // Clear all cached data on logout detection
          localStorage.removeItem('userRole');
          sessionStorage.removeItem('userProfile');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // On error, still allow the app to load
        setUser(null);
        setRole('student');
        setRoleVerified(true);
      } finally {
        // ALWAYS set loading to false so the app can render
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth State Change:', event);

      if (session?.user) {
        setUser(session.user);
        
        // Fetch role on SIGNED_IN, INITIAL_SESSION, and TOKEN_REFRESHED
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
             isLoggingOut.current = false;
             if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') setRoleVerified(false);
             
             const userRole = await fetchUserRole(session.user.id);
             if (mounted) {
                 setRole(userRole);
                 setRoleVerified(true);
             }
        }
      } else if (event === 'SIGNED_OUT') {
        // IMPORTANT: Double-check there's really no valid session before clearing
        // (Unless we are explicitly logging out)
        const storedSession = getStoredSession();
        if (storedSession?.user && !isLoggingOut.current) {
          console.log('SIGNED_OUT received but valid session exists in storage - ignoring');
          // Use stored session instead
          setUser(storedSession.user);
          const cachedRole = localStorage.getItem('userRole');
          if (cachedRole) {
            setRole(cachedRole);
          }
        } else {
          // Truly signed out - clear everything
          setUser(null);
          setRole('student');
          // Clear ALL cached data on sign out
          localStorage.removeItem('userRole');
          sessionStorage.removeItem('userProfile');
          sessionStorage.removeItem('dashboard_data');
          // Clear events cache too
          localStorage.removeItem('dakshaa_events_cache');
          localStorage.removeItem('dakshaa_events_static');
        }
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      silentRefreshManager.stop();
    };
  }, [fetchUserRole]); // fetchUserRole is memoized

  // Logout function - thoroughly clears all cached data
  const logout = async () => {
    try {
      isLoggingOut.current = true;
      
      // Stop silent refresh manager
      silentRefreshManager.stop();
      
      // Clear all cached data BEFORE signing out to prevent race conditions
      localStorage.removeItem('userRole');
      sessionStorage.removeItem('userProfile');
      sessionStorage.removeItem('dashboard_data');
      localStorage.removeItem('dakshaa_events_cache');
      localStorage.removeItem('dakshaa_events_static');
      localStorage.removeItem('dakshaa_combos_cache');
      localStorage.removeItem('registrations_cache');
      sessionStorage.clear(); // Clear all sessionStorage
      
      // Clear service worker caches if available
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      } catch (cacheError) {
        console.warn('Cache clearing error:', cacheError);
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Force clear the auth token even on error
        try {
          const sessionKey = getSessionKey();
          localStorage.removeItem(sessionKey);
        } catch (e) {
          console.error('Failed to clear session key:', e);
        }
      }
      
      // Update state immediately
      setUser(null);
      setRole(null);
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Force state reset even on error
      setUser(null);
      setRole(null);
    }
  };

  const value = {
    user,
    roleVerified,
    role: role || 'student', // Fallback for UI if null/loading
    loading, // This loading is now "isResolvingInitialState" mostly
    isAuthenticated: !!user,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                <p className="text-emerald-500/80 font-mono text-sm">Initializing Secure Session...</p>
            </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
