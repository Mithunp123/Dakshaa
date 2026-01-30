import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // 1. Optimistic User Initialization from LocalStorage
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const sessionKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;
      const storedSession = localStorage.getItem(sessionKey);
      
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session?.user) return session.user;
      }
    } catch (e) {
      console.warn('Optimistic auth fetch failed:', e);
    }
    return null;
  });

  const [role, setRole] = useState(() => {
    // 2. Optimistic Role Initialization from SessionStorage (if available)
    try {
      const cachedProfile = sessionStorage.getItem('userProfile');
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile);
        return profile.role || 'student';
      }
    } catch (e) {}
    return null; // Don't default to student yet, let effect decide if we are loading
  });

  // If we found a user in LS, we are "not loading" initially to show UI instantly.
  // Unless we interpret "loading" as "validating". 
  // To solve the "infinite spinner" issue, we allow rendering if we have a user.
  const [loading, setLoading] = useState(() => !user);

  // Helper to fetch user role
  const fetchUserRole = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        return 'student'; // Default role on error
      }
      
      return profile?.role || 'student';
    } catch (err) {
      console.error('Exception fetching role:', err);
      return 'student';
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check (Async Validation)
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Update user if different (or just refresh reference)
          if (session.user.id !== user?.id) {
             setUser(session.user);
          }
          
          // Always fetch role to ensure permissions are up to date
          const userRole = await fetchUserRole(session.user.id);
          if (mounted) {
             setRole(userRole);
             // Cache role for next reload
             try {
                const cached = sessionStorage.getItem('userProfile');
                const profile = cached ? JSON.parse(cached) : {};
                profile.role = userRole;
                sessionStorage.setItem('userProfile', JSON.stringify(profile));
             } catch(e){}
          }
        } else {
          setUser(null);
          setRole(null);
          sessionStorage.removeItem('userProfile'); // Clear cache if logout detected
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
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
        // optimization: dont refetch role if we just fetched it and user ID is same? 
        // Better to be safe on state change events like SIGN_IN
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
             const userRole = await fetchUserRole(session.user.id);
             if (mounted) {
                 setRole(userRole);
                 // Cache role
                 try {
                    const cached = sessionStorage.getItem('userProfile');
                    const profile = cached ? JSON.parse(cached) : {};
                    profile.role = userRole;
                    sessionStorage.setItem('userProfile', JSON.stringify(profile));
                 } catch(e){}
             }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        sessionStorage.removeItem('userProfile');
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array as we want this to run once

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // Clear cached data
      sessionStorage.removeItem('userProfile');
      // The auth state change listener will handle updating state
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
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
