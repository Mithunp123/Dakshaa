-- ============================================================
-- DATABASE STATUS CHECK SCRIPT
-- Run this in Supabase SQL Editor to verify all tables and policies
-- ============================================================

-- 1. CHECK COMBOS TABLE STRUCTURE
SELECT '=== COMBOS TABLE COLUMNS ===' as section;

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'combos'
ORDER BY ordinal_position;

-- 2. CHECK COMBOS DATA
SELECT '=== COMBOS DATA ===' as section;

SELECT * FROM combos LIMIT 10;

-- Count active combos
SELECT 
    'Total combos' as metric, 
    COUNT(*)::text as value 
FROM combos
UNION ALL
SELECT 
    'Active combos', 
    COUNT(*)::text 
FROM combos 
WHERE is_active = true;

-- 2. CHECK EVENT_REGISTRATIONS_CONFIG TABLE
SELECT '=== EVENT_REGISTRATIONS_CONFIG TABLE ===' as section;

-- Check if combo_purchase_id column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations_config'
ORDER BY ordinal_position;

-- Count registrations
SELECT 
    'Total registrations' as metric, 
    COUNT(*)::text as value 
FROM event_registrations_config;

-- 3. CHECK RLS POLICIES ON COMBOS
SELECT '=== RLS POLICIES ON COMBOS ===' as section;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'combos';

-- Check if RLS is enabled on combos
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled,
    relforcerowsecurity as rls_forced
FROM pg_class 
WHERE relname = 'combos';

-- 4. CHECK PROFILES TABLE
SELECT '=== PROFILES TABLE ===' as section;

SELECT 
    'Total profiles' as metric, 
    COUNT(*)::text as value 
FROM profiles
UNION ALL
SELECT 
    'Admin users', 
    COUNT(*)::text 
FROM profiles 
WHERE role IN ('super_admin', 'registration_admin', 'admin');

-- 5. CHECK EVENTS TABLE
SELECT '=== EVENTS_CONFIG TABLE ===' as section;

SELECT 
    'Total events' as metric, 
    COUNT(*)::text as value 
FROM events_config;

-- Check events_config columns
SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'events_config'
ORDER BY ordinal_position;

-- 6. CHECK TABLE EXISTENCE
SELECT '=== TABLE EXISTENCE CHECK ===' as section;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'combos',
    'combo_purchases',
    'combo_event_selections',
    'events_config',
    'event_registrations_config',
    'profiles',
    'teams',
    'team_members',
    'accommodation_requests',
    'lunch_bookings',
    'contact_details',
    'feedback_details'
)
ORDER BY table_name;

-- 7. CHECK RLS STATUS ON ALL TABLES
SELECT '=== RLS STATUS ALL TABLES ===' as section;

SELECT 
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND c.relname IN (
    'combos',
    'combo_purchases',
    'events_config',
    'event_registrations_config',
    'profiles',
    'teams'
)
ORDER BY c.relname;

-- 8. TEST COMBO READ ACCESS (as authenticated user)
SELECT '=== COMBO READ TEST ===' as section;

-- This should return combos if RLS allows it
SELECT * FROM combos WHERE is_active = true LIMIT 5;
