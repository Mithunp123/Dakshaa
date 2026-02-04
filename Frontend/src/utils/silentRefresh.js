import { supabase } from '../supabase';
import { createContext, useContext, useEffect, useRef } from 'react';

// Context for managing silent refresh
const SilentRefreshContext = createContext({});

export const useSilentRefresh = () => useContext(SilentRefreshContext);

class SilentRefreshManager {
  constructor() {
    this.refreshTimer = null;
    this.isRefreshing = false;
    this.lastRefresh = 0;
    this.refreshThreshold = 300000; // 5 minutes before expiry
    this.minRefreshInterval = 60000; // Don't refresh more than once per minute
    this.listeners = new Set();
  }

  // Add listener for refresh events
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.warn('Silent refresh listener error:', error);
      }
    });
  }

  // Check if token needs refresh
  needsRefresh(session) {
    if (!session?.expires_at) return false;
    
    const now = Date.now() / 1000; // Convert to seconds
    const expiresAt = session.expires_at;
    const timeUntilExpiry = (expiresAt - now) * 1000; // Convert back to milliseconds
    
    return timeUntilExpiry <= this.refreshThreshold;
  }

  // Perform silent refresh
  async performRefresh() {
    if (this.isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping...');
      return;
    }

    const now = Date.now();
    if (now - this.lastRefresh < this.minRefreshInterval) {
      console.log('🔄 Refresh too recent, skipping...');
      return;
    }

    this.isRefreshing = true;
    this.lastRefresh = now;

    try {
      console.log('🔄 Performing silent token refresh...');
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Silent refresh failed:', error.message);
        
        // If refresh fails due to invalid refresh token, sign out
        if (error.message.includes('refresh_token') || error.message.includes('invalid_grant')) {
          console.warn('🚪 Invalid refresh token, signing out...');
          await supabase.auth.signOut();
          this.notifyListeners({ type: 'refresh-failed', error });
          return false;
        }
        
        this.notifyListeners({ type: 'refresh-error', error });
        return false;
      }

      if (session) {
        console.log('✅ Token refreshed successfully, expires at:', new Date(session.expires_at * 1000));
        this.scheduleNextRefresh(session);
        this.notifyListeners({ type: 'refresh-success', session });
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Silent refresh exception:', error);
      this.notifyListeners({ type: 'refresh-error', error });
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Schedule the next refresh
  scheduleNextRefresh(session) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!session?.expires_at) return;

    const now = Date.now() / 1000;
    const expiresAt = session.expires_at;
    const timeUntilRefresh = Math.max(
      (expiresAt * 1000) - now * 1000 - this.refreshThreshold,
      this.minRefreshInterval
    );

    console.log(`⏰ Next refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);

    this.refreshTimer = setTimeout(() => {
      this.performRefresh();
    }, timeUntilRefresh);
  }

  // Start monitoring
  async start() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if immediate refresh is needed
        if (this.needsRefresh(session)) {
          await this.performRefresh();
        } else {
          this.scheduleNextRefresh(session);
        }
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state change for refresh manager:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          this.scheduleNextRefresh(session);
        } else if (event === 'SIGNED_OUT') {
          this.stop();
        }
      });

    } catch (error) {
      console.error('❌ Failed to start silent refresh manager:', error);
    }
  }

  // Stop monitoring
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.isRefreshing = false;
    console.log('🛑 Silent refresh manager stopped');
  }

  // Manual refresh trigger
  async triggerRefresh() {
    return await this.performRefresh();
  }

  // Check session validity
  async checkSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { valid: false, reason: 'No session' };
      }

      const now = Date.now() / 1000;
      const expiresAt = session.expires_at;
      
      if (now >= expiresAt) {
        console.warn('🕒 Session expired, attempting refresh...');
        const refreshed = await this.performRefresh();
        return { valid: refreshed, reason: refreshed ? 'Refreshed' : 'Expired and refresh failed' };
      }

      return { valid: true, session };
    } catch (error) {
      console.error('❌ Session check failed:', error);
      return { valid: false, reason: error.message };
    }
  }
}

// Singleton instance
const silentRefreshManager = new SilentRefreshManager();

// React hook for using silent refresh
export const useSilentRefreshManager = () => {
  const managerRef = useRef(silentRefreshManager);

  useEffect(() => {
    const manager = managerRef.current;
    manager.start();

    // Clean up on unmount
    return () => {
      manager.stop();
    };
  }, []);

  return {
    performRefresh: () => managerRef.current.performRefresh(),
    checkSession: () => managerRef.current.checkSession(),
    addListener: (callback) => managerRef.current.addListener(callback)
  };
};

// Utility hook for handling network requests with automatic retry on token expiry
export const useAuthenticatedRequest = () => {
  const { checkSession, performRefresh } = useSilentRefreshManager();

  const makeRequest = async (requestFn, maxRetries = 1) => {
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check session before making request
        const sessionCheck = await checkSession();
        if (!sessionCheck.valid) {
          throw new Error(`Invalid session: ${sessionCheck.reason}`);
        }

        // Make the request
        const result = await requestFn();
        
        // If request succeeds, return result
        return { success: true, data: result };

      } catch (error) {
        lastError = error;
        
        // Check if it's an auth-related error and we haven't exceeded retries
        if (attempt < maxRetries && this.isAuthError(error)) {
          console.log(`🔄 Auth error detected, attempting refresh... (attempt ${attempt + 1})`);
          
          const refreshed = await performRefresh();
          if (refreshed) {
            console.log('✅ Token refreshed, retrying request...');
            continue; // Retry the request
          } else {
            console.error('❌ Token refresh failed, cannot retry');
            break;
          }
        }
        
        // If not auth error or retries exhausted, break
        break;
      }
    }

    return { success: false, error: lastError };
  };

  const isAuthError = (error) => {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';
    
    return (
      message.includes('jwt') ||
      message.includes('unauthorized') ||
      message.includes('invalid_grant') ||
      message.includes('token') ||
      code === 'PGRST301' || // JWT expired
      code === 'PGRST302'    // JWT malformed
    );
  };

  return { makeRequest };
};

export default silentRefreshManager;