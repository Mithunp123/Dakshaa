import { supabase } from '../supabase';
import silentRefreshManager from './silentRefresh';

// Enhanced Supabase client with automatic retry on auth failures
class AuthenticatedSupabaseClient {
  constructor() {
    this.maxRetries = 1;
    this.retryDelay = 1000;
  }

  // Check if error is auth-related
  isAuthError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    const code = error.code || '';
    const status = error.status || 0;
    
    return (
      message.includes('jwt') ||
      message.includes('unauthorized') ||
      message.includes('invalid_grant') ||
      message.includes('token') ||
      code === 'PGRST301' || // JWT expired
      code === 'PGRST302' || // JWT malformed
      status === 401
    );
  }

  // Retry wrapper for any Supabase operation that returns { data, error }
  async withRetry(operation, context = 'operation') {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Check session before making request if it's not the first attempt
        if (attempt > 0) {
          const sessionCheck = await silentRefreshManager.checkSession();
          if (!sessionCheck.valid) {
            throw new Error(`Invalid session: ${sessionCheck.reason}`);
          }
        }

        // Execute the operation
        const result = await operation();
        
        // Handle Supabase result format { data, error }
        if (result?.error) {
          throw result.error;
        }
        
        // If we get here, the operation succeeded
        if (attempt > 0) {
          console.log(`✅ ${context} succeeded after retry`);
        }
        
        return result;

      } catch (error) {
        lastError = error;
        
        // If it's not an auth error, or we've exhausted retries, throw immediately
        if (!this.isAuthError(error) || attempt >= this.maxRetries) {
          console.error(`❌ ${context} failed:`, error.message);
          throw error;
        }
        
        console.log(`🔄 ${context} failed with auth error, attempting refresh... (attempt ${attempt + 1})`);
        
        // Attempt to refresh the token
        const refreshed = await silentRefreshManager.performRefresh();
        if (!refreshed) {
          console.error(`❌ Token refresh failed, cannot retry ${context}`);
          throw error;
        }
        
        console.log(`✅ Token refreshed, retrying ${context}...`);
        
        // Add a small delay before retry to avoid race conditions
        if (this.retryDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // This should never be reached, but just in case
    throw lastError;
  }

  // Create a proxy that intercepts all supabase calls
  get proxy() {
    return new Proxy(supabase, {
      get: (target, prop) => {
        // If it's auth or storage, return directly (they handle their own auth)
        if (prop === 'auth' || prop === 'storage') {
          return target[prop];
        }

        // If it's 'from', wrap it with retry logic
        if (prop === 'from') {
          return (table) => {
            const originalQuery = target.from(table);
            
            // Wrap query methods with retry logic
            return new Proxy(originalQuery, {
              get: (queryTarget, queryProp) => {
                const originalMethod = queryTarget[queryProp];
                
                // Methods that execute queries
                const queryMethods = [
                  'select', 'insert', 'update', 'upsert', 'delete',
                  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
                  'is', 'in', 'contains', 'containedBy', 'rangeLt', 'rangeGt',
                  'rangeGte', 'rangeLte', 'rangeAdjacent', 'overlaps',
                  'textSearch', 'match', 'not', 'or', 'filter',
                  'order', 'limit', 'range', 'single', 'maybeSingle'
                ];
                
                if (typeof originalMethod === 'function') {
                  return (...args) => {
                    const result = originalMethod.apply(queryTarget, args);
                    
                    // If this returns a promise (i.e., it's a terminal query method), wrap it
                    if (result && typeof result.then === 'function') {
                      return this.withRetry(() => result, `${table}.${String(queryProp)}`);
                    }
                    
                    // Otherwise return the query builder for chaining
                    return result;
                  };
                }
                
                return originalMethod;
              }
            });
          };
        }

        // If it's 'rpc', wrap with retry
        if (prop === 'rpc') {
          return (functionName, params) => {
            return this.withRetry(
              () => target.rpc(functionName, params),
              `RPC ${functionName}`
            );
          };
        }

        // For other properties, return as-is
        return target[prop];
      }
    });
  }

  // Direct access to supabase for cases where proxy doesn't work
  get raw() {
    return supabase;
  }

  // Convenience methods
  get auth() {
    return supabase.auth;
  }

  get storage() {
    return supabase.storage;
  }
}

// Create singleton instance
const authenticatedSupabase = new AuthenticatedSupabaseClient();

// Export the proxy as the default
export default authenticatedSupabase.proxy;

// Also export the class instance for advanced usage
export { authenticatedSupabase };