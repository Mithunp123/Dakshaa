-- =====================================================
-- QUICK VERIFICATION & USER SETUP
-- =====================================================
-- Run this AFTER setup_admin_modules.sql to verify and set up users
-- =====================================================

-- 1. Check all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist') 
        THEN '✓ NEW TABLE'
        ELSE '✓ Exists'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'events', 'registrations', 'combos', 
    'waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist'
)
ORDER BY table_name;

-- 2. Check new columns in registrations
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'registrations' 
AND column_name IN ('payment_mode', 'amount_paid', 'marked_by', 'is_force_added')
ORDER BY ordinal_position;

-- 3. Check new columns in profiles
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('is_blocked', 'notes', 'email')
ORDER BY ordinal_position;

-- 4. Verify RLS is enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist');

-- 5. Count RLS policies
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SETUP SUPER ADMIN USER
-- =====================================================
-- Replace 'your-email@example.com' with your actual email

-- Check current users and their roles
SELECT 
    au.email,
    p.full_name,
    p.role,
    p.created_at
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Update a user to super_admin (REPLACE THE EMAIL!)
-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE id = (
--     SELECT id FROM auth.users 
--     WHERE email = 'your-email@example.com'
-- );

-- Verify the update
-- SELECT 
--     au.email,
--     p.full_name,
--     p.role
-- FROM auth.users au
-- JOIN profiles p ON p.id = au.id
-- WHERE au.email = 'your-email@example.com';

-- =====================================================
-- TEST DATA (Optional)
-- =====================================================
-- Uncomment to insert sample test data

-- Insert a test event if none exist
-- INSERT INTO events (event_id, category, price, capacity, is_active)
-- VALUES ('TEST_EVENT', 'technical', 100, 50, true)
-- ON CONFLICT (event_id) DO NOTHING;

-- Insert a test combo
-- INSERT INTO combos (combo_id, name, price, is_active)
-- VALUES ('TEST_COMBO', 'Test Package', 500, true)
-- ON CONFLICT (combo_id) DO NOTHING;

-- =====================================================
-- FUNCTIONS CHECK
-- =====================================================

-- Verify get_user_role function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_user_role';

-- Verify check_capacity function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'check_capacity';

-- =====================================================
-- PERFORMANCE CHECK
-- =====================================================

-- List all indexes on new tables
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('waitlist', 'admin_logs', 'transactions', 'registrations')
ORDER BY tablename, indexname;

-- =====================================================
-- FINAL STATUS REPORT
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('waitlist', 'admin_logs', 'transactions', 'cashier_sessions', 'blacklist');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('waitlist', 'admin_logs', 'transactions', 'registrations');
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'VERIFICATION REPORT';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tables Created: % / 5', table_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE 'Indexes: %', index_count;
    RAISE NOTICE '';
    
    IF table_count = 5 AND policy_count >= 8 THEN
        RAISE NOTICE '✓ Database setup is COMPLETE and VERIFIED!';
        RAISE NOTICE '';
        RAISE NOTICE 'You can now:';
        RAISE NOTICE '  1. Set a user as super_admin (uncomment above)';
        RAISE NOTICE '  2. Login to your app';
        RAISE NOTICE '  3. Navigate to /admin';
        RAISE NOTICE '  4. Access new modules:';
        RAISE NOTICE '     • Registration Management';
        RAISE NOTICE '     • Finance Module';
        RAISE NOTICE '     • Participant CRM';
        RAISE NOTICE '     • Waitlist Management';
    ELSE
        RAISE NOTICE '⚠ Some components may be missing';
        RAISE NOTICE 'Please review the setup script';
    END IF;
    
    RAISE NOTICE '================================================';
END $$;
