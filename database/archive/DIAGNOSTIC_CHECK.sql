-- ============================================
-- DIAGNOSTIC: Check All Required Functions and Tables
-- ============================================
-- Run this to see what's missing from your database
-- ============================================

-- Check if critical tables exist
SELECT 
    'Table Check' as check_type,
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('combos'),
    ('combo_purchases'),
    ('combo_event_selections'),
    ('payment_transactions'),
    ('notification_queue'),
    ('events_config'),
    ('event_registrations_config')
) AS required_tables(table_name);

-- Check if critical functions exist
SELECT 
    'Function Check' as check_type,
    function_name,
    CASE 
        WHEN function_name IN (
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (VALUES 
    ('validate_combo_selection'),
    ('create_combo_purchase'),
    ('complete_combo_payment'),
    ('explode_combo_purchase'),
    ('get_user_combo_purchases'),
    ('toggle_combo_status'),
    ('delete_combo'),
    ('create_combo'),
    ('update_combo')
) AS required_functions(function_name);

-- Check if combos table has correct structure
SELECT 
    'Combos Table Structure' as check_type,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'id' AND data_type = 'uuid' THEN '✅ CORRECT (modern schema)'
        WHEN column_name = 'combo_id' AND data_type IN ('text', 'character varying') THEN '⚠️ LEGACY SCHEMA - needs migration'
        ELSE '✅ EXISTS'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'combos'
AND column_name IN ('id', 'combo_id', 'category_quotas', 'price', 'is_active')
ORDER BY ordinal_position;

-- Check if event_registrations_config has combo_purchase_id column
SELECT 
    'Event Registrations Table' as check_type,
    column_name,
    data_type,
    '✅ EXISTS' as status
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations_config'
AND column_name = 'combo_purchase_id';

-- If no rows returned, this column is MISSING and needs to be added

-- Check RLS policies
SELECT 
    'RLS Policy Check' as check_type,
    schemaname,
    tablename,
    policyname,
    '✅ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('combos', 'combo_purchases', 'combo_event_selections', 'payment_transactions')
ORDER BY tablename, policyname;

-- Check if there are any combos
SELECT 
    'Data Check' as check_type,
    'combos' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '⚠️ NO DATA - create test combo'
    END as status
FROM combos;

-- Check if there are any events
SELECT 
    'Data Check' as check_type,
    'events_config' as table_name,
    COUNT(*) as row_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ HAS DATA'
        ELSE '❌ NO EVENTS - cannot create combo purchases'
    END as status
FROM events_config;

-- Summary
SELECT 
    '==================' as separator,
    'SUMMARY' as title,
    '==================' as separator2;

-- Count issues
WITH checks AS (
    SELECT COUNT(*) as total_issues
    FROM (
        -- Tables check
        SELECT 1 FROM (VALUES 
            ('combos'),
            ('combo_purchases'),
            ('combo_event_selections'),
            ('payment_transactions'),
            ('notification_queue')
        ) AS t(table_name)
        WHERE table_name NOT IN (
            SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        )
        
        UNION ALL
        
        -- Functions check
        SELECT 1 FROM (VALUES 
            ('validate_combo_selection'),
            ('create_combo_purchase'),
            ('complete_combo_payment'),
            ('explode_combo_purchase')
        ) AS f(function_name)
        WHERE function_name NOT IN (
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public'
        )
    ) issues
)
SELECT 
    total_issues,
    CASE 
        WHEN total_issues = 0 THEN '✅ ALL CHECKS PASSED - System ready!'
        WHEN total_issues <= 3 THEN '⚠️ MINOR ISSUES - Some functions missing'
        ELSE '❌ MAJOR ISSUES - Run complete_combo_schema.sql'
    END as status,
    CASE 
        WHEN total_issues = 0 THEN 'Your combo system is fully deployed and ready to use.'
        WHEN total_issues <= 3 THEN 'Run the missing function scripts (toggle_combo_status, etc.)'
        ELSE 'Run database/complete_combo_schema.sql to create all tables and functions'
    END as action_required
FROM checks;
