import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../Components/AuthProvider';
import { useSilentRefreshManager } from '../utils/silentRefresh';
import { supabase } from '../supabase';

// Hook for handling page-level authentication and refresh
export const usePageAuth = (pageName = 'page') => {
  const { user, loading } = useAuth();
  const { checkSession, addListener } = useSilentRefreshManager();
  const pageLoadTime = useRef(Date.now());
  const lastActivityTime = useRef(Date.now());
  const isUnloadingRef = useRef(false);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    lastActivityTime.current = Date.now();
  }, []);

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [updateActivity]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log(`📖 ${pageName} became visible, checking session...`);
        
        const sessionCheck = await checkSession();
        if (!sessionCheck.valid) {
          console.warn(`⚠️ ${pageName}: Session invalid -`, sessionCheck.reason);
          
          if (sessionCheck.reason.includes('expired') || sessionCheck.reason.includes('refresh failed')) {
            // Force logout and redirect
            console.log('🚪 Forcing logout due to invalid session');
            await supabase.auth.signOut();
            window.location.href = '/login';
          }
        } else {
          console.log(`✅ ${pageName}: Session valid`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pageName, checkSession]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Listen for refresh events
  useEffect(() => {
    const unsubscribe = addListener((event) => {
      if (event.type === 'refresh-failed') {
        console.warn(`⚠️ ${pageName}: Silent refresh failed, user will be logged out`);
        // Don't immediately redirect, let the auth state change handler do it
      } else if (event.type === 'refresh-success') {
        console.log(`✅ ${pageName}: Token refreshed successfully`);
      } else if (event.type === 'refresh-error') {
        console.error(`❌ ${pageName}: Refresh error -`, event.error.message);
      }
    });

    return unsubscribe;
  }, [pageName, addListener]);

  // Periodic session validation (every 5 minutes for active users)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      // Only check if user has been active in the last 10 minutes
      const timeSinceActivity = Date.now() - lastActivityTime.current;
      if (timeSinceActivity > 600000) { // 10 minutes
        console.log(`⏸️ ${pageName}: User inactive, skipping session check`);
        return;
      }

      const sessionCheck = await checkSession();
      if (!sessionCheck.valid) {
        console.warn(`⚠️ ${pageName}: Periodic check failed -`, sessionCheck.reason);
        
        if (!isUnloadingRef.current && sessionCheck.reason.includes('expired')) {
          console.log('🚪 Redirecting to login due to expired session');
          window.location.href = '/login';
        }
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, pageName, checkSession]);

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    updateActivity
  };
};

// Hook for handling logout with proper cleanup
export const useSecureLogout = () => {
  const { logout } = useAuth();

  const secureLogout = useCallback(async () => {
    try {
      console.log('🚪 Performing secure logout...');
      
      // Clear all application caches
      try {
        localStorage.removeItem('userRole');
        localStorage.removeItem('dakshaa_events_cache');
        localStorage.removeItem('dakshaa_events_static');
        localStorage.removeItem('dakshaa_combos_cache');
        localStorage.removeItem('registrations_cache');
        sessionStorage.clear();
        
        // Clear service worker caches if available
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      } catch (error) {
        console.warn('Cache clearing error:', error);
      }

      // Perform logout
      await logout();
      
      // Force redirect to login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Secure logout error:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  }, [logout]);

  return secureLogout;
};