import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase credentials
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing!');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Present' : '❌ Missing');
  throw new Error('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Supabase URL must start with https://');
}

// Validate Anon Key length (JWT tokens are typically long)
if (supabaseAnonKey.length < 100) {
  console.error('❌ Supabase Anon Key appears to be invalid (too short)');
  console.error('Key length:', supabaseAnonKey.length, 'characters');
  console.error('Expected: ~250+ characters for a valid JWT');
  throw new Error('Supabase Anon Key appears to be invalid. Please check your .env file.');
}

console.log('✅ Supabase client initializing...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseAnonKey.length, 'characters');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'dakshaa-web-app',
      'X-Client-Origin': window.location.origin
    }
  }
});

// Test connection on initialization
supabase.from('profiles').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      if (error.message.includes('Failed to fetch')) {
        console.error('🔥 CRITICAL: Cannot reach Supabase server!');
        console.error('Possible causes:');
        console.error('  1. Supabase project is paused (check dashboard)');
        console.error('  2. Network/firewall blocking connection');
        console.error('  3. CORS not configured for:', window.location.origin);
      } else if (error.code === '42P01') {
        console.error('🔥 Database tables missing! Run schema setup.');
      } else if (error.message.includes('JWT')) {
        console.error('🔥 Invalid API key! Check .env configuration.');
      }
    } else {
      console.log('✅ Supabase connection test successful');
    }
  })
  .catch(err => {
    console.error('❌ Supabase initialization error:', err);
  });

console.log('✅ Supabase client initialized successfully');
