-- ============================================
-- VERIFY EVENTS TABLE EXISTS AND HAS DATA
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if events table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
) as events_table_exists;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Count events
SELECT COUNT(*) as total_events FROM events;

-- Sample first 5 events
SELECT id, event_id, name, title, category, price, is_active
FROM events
LIMIT 5;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'events';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'events';

-- Test if anon role can select
SET ROLE anon;
SELECT COUNT(*) as visible_events FROM events WHERE is_active = true;
RESET ROLE;
