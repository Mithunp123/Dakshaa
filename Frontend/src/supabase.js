import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // Use sessionStorage - clears when browser/tab closes
    persistSession: true, // Keep session during page refresh and navigation
    autoRefreshToken: true, // Auto-refresh tokens to maintain session
    detectSessionInUrl: true // Detect session from email verification links
  }
});
