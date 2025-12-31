-- =====================================================
-- LIVE STATS DASHBOARD - DATABASE FUNCTIONS
-- =====================================================
-- Purpose: Secure public access to aggregate stats
-- without exposing individual user data
-- =====================================================

-- Function: Get live statistics for public dashboard
-- Returns: JSON with user count and registration count
-- Security: Uses SECURITY DEFINER to run with elevated privileges
--           but only returns aggregate counts, not user data

CREATE OR REPLACE FUNCTION get_live_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count int;
  reg_count int;
BEGIN
  -- Count total users from profiles table
  SELECT count(*) INTO user_count FROM profiles;
  
  -- Count total registrations from registrations table
  SELECT count(*) INTO reg_count FROM registrations;
  
  -- Return as JSON object
  RETURN json_build_object(
    'users', user_count,
    'registrations', reg_count,
    'last_updated', NOW()
  );
END;
$$;

-- Grant execute permission to anonymous users (public access)
GRANT EXECUTE ON FUNCTION get_live_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_live_stats() TO authenticated;

-- =====================================================
-- OPTIONAL: Create a materialized view for better performance
-- (Use this if you have > 5,000 users for faster queries)
-- =====================================================

-- Create materialized view for cached stats
CREATE MATERIALIZED VIEW IF NOT EXISTS live_stats_cache AS
SELECT 
  (SELECT count(*) FROM profiles) as total_users,
  (SELECT count(*) FROM registrations) as total_registrations,
  NOW() as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS live_stats_cache_idx ON live_stats_cache (last_updated);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_live_stats_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY live_stats_cache;
END;
$$;

-- =====================================================
-- TRIGGERS: Auto-refresh cache on new data
-- =====================================================

-- Trigger function to refresh stats cache
CREATE OR REPLACE FUNCTION trigger_refresh_live_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Refresh the materialized view in the background
  PERFORM refresh_live_stats_cache();
  RETURN NEW;
END;
$$;

-- Trigger on profiles table
DROP TRIGGER IF EXISTS refresh_stats_on_profile_insert ON profiles;
CREATE TRIGGER refresh_stats_on_profile_insert
  AFTER INSERT ON profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_live_stats();

-- Trigger on registrations table
DROP TRIGGER IF EXISTS refresh_stats_on_registration_insert ON registrations;
CREATE TRIGGER refresh_stats_on_registration_insert
  AFTER INSERT ON registrations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_live_stats();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the function
-- SELECT get_live_stats();

-- Test the materialized view
-- SELECT * FROM live_stats_cache;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Frontend can call: supabase.rpc('get_live_stats')
-- 3. Realtime subscriptions will auto-update counts
-- 4. For high traffic, use live_stats_cache materialized view
-- =====================================================
