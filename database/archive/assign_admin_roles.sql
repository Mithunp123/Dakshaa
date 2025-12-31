-- =====================================================
-- ADMIN ROLE ASSIGNMENT SCRIPT
-- =====================================================
-- Quick script to assign roles and create test users
-- =====================================================

-- =====================================================
-- 1. ASSIGN EXISTING USERS TO ROLES
-- =====================================================

-- Example: Make a user Super Admin
-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE email = 'your-email@example.com';

-- Example: Make a user Registration Admin
-- UPDATE profiles 
-- SET role = 'registration_admin' 
-- WHERE email = 'regadmin@example.com';

-- Example: Make a user Event Coordinator
-- UPDATE profiles 
-- SET role = 'event_coordinator' 
-- WHERE email = 'coordinator@example.com';

-- Example: Make a user Volunteer
-- UPDATE profiles 
-- SET role = 'volunteer' 
-- WHERE email = 'volunteer@example.com';

-- =====================================================
-- 2. ASSIGN COORDINATORS TO SPECIFIC EVENTS
-- =====================================================

-- Example: Assign coordinator to Paper Presentation event
-- INSERT INTO event_coordinators (user_id, event_id, assigned_by)
-- SELECT 
--     p.id as user_id,
--     'paper_presentation' as event_id,
--     (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) as assigned_by
-- FROM profiles p
-- WHERE p.email = 'coordinator@example.com';

-- Bulk assign coordinator to multiple events
-- INSERT INTO event_coordinators (user_id, event_id, assigned_by)
-- SELECT 
--     p.id as user_id,
--     e.event_id,
--     (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) as assigned_by
-- FROM profiles p
-- CROSS JOIN (
--     SELECT event_id FROM events WHERE event_id IN (
--         'paper_presentation',
--         'project_expo',
--         'robot_race'
--     )
-- ) e
-- WHERE p.email = 'coordinator@example.com';

-- =====================================================
-- 3. VIEW CURRENT ROLE ASSIGNMENTS
-- =====================================================

-- Check all users and their roles
SELECT 
    email,
    full_name,
    role,
    created_at
FROM profiles
WHERE role IN ('super_admin', 'registration_admin', 'event_coordinator', 'volunteer')
ORDER BY role, email;

-- Check coordinator assignments
SELECT 
    p.email,
    p.full_name,
    ec.event_id,
    e.category,
    e.price,
    ec.assigned_at
FROM event_coordinators ec
JOIN profiles p ON p.id = ec.user_id
JOIN events e ON e.event_id = ec.event_id
ORDER BY ec.event_id, p.email;

-- =====================================================
-- 4. UTILITY QUERIES
-- =====================================================

-- Count users by role
SELECT 
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- Find unassigned coordinators
SELECT 
    p.email,
    p.full_name
FROM profiles p
WHERE p.role = 'event_coordinator'
AND p.id NOT IN (SELECT user_id FROM event_coordinators);

-- Find events without coordinators
SELECT 
    e.event_id,
    e.category,
    e.price
FROM events e
WHERE e.is_active = true
AND e.event_id NOT IN (SELECT event_id FROM event_coordinators);

-- =====================================================
-- 5. REMOVE ASSIGNMENTS (IF NEEDED)
-- =====================================================

-- Remove specific coordinator assignment
-- DELETE FROM event_coordinators 
-- WHERE user_id = (SELECT id FROM profiles WHERE email = 'coordinator@example.com')
-- AND event_id = 'paper_presentation';

-- Remove all assignments for a user
-- DELETE FROM event_coordinators 
-- WHERE user_id = (SELECT id FROM profiles WHERE email = 'coordinator@example.com');

-- Change user role back to student
-- UPDATE profiles 
-- SET role = 'student' 
-- WHERE email = 'coordinator@example.com';

-- =====================================================
-- 6. SEED SAMPLE ADMIN USERS (FOR TESTING)
-- =====================================================

-- NOTE: This requires Supabase Auth admin API access
-- Uncomment and modify as needed

-- Create Registration Admin test user
-- First create the auth user in Supabase Dashboard:
-- Email: regadmin@dakshaa.test
-- Password: Admin@123
-- Then run:
-- INSERT INTO profiles (id, full_name, email, role)
-- VALUES (
--     (SELECT id FROM auth.users WHERE email = 'regadmin@dakshaa.test'),
--     'Registration Admin',
--     'regadmin@dakshaa.test',
--     'registration_admin'
-- );

-- Create Event Coordinator test user
-- First create the auth user in Supabase Dashboard:
-- Email: coordinator@dakshaa.test
-- Password: Coord@123
-- Then run:
-- INSERT INTO profiles (id, full_name, email, role)
-- VALUES (
--     (SELECT id FROM auth.users WHERE email = 'coordinator@dakshaa.test'),
--     'Event Coordinator',
--     'coordinator@dakshaa.test',
--     'event_coordinator'
-- );

-- Assign coordinator to test events
-- INSERT INTO event_coordinators (user_id, event_id, assigned_by)
-- SELECT 
--     (SELECT id FROM profiles WHERE email = 'coordinator@dakshaa.test'),
--     event_id,
--     (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1)
-- FROM events
-- WHERE event_id IN ('paper_presentation', 'project_expo')
-- LIMIT 2;

-- Create Volunteer test user
-- First create the auth user in Supabase Dashboard:
-- Email: volunteer@dakshaa.test
-- Password: Vol@123
-- Then run:
-- INSERT INTO profiles (id, full_name, email, role)
-- VALUES (
--     (SELECT id FROM auth.users WHERE email = 'volunteer@dakshaa.test'),
--     'Volunteer Helper',
--     'volunteer@dakshaa.test',
--     'volunteer'
-- );

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'attendance', 'event_coordinators', 'event_winners',
            'kit_distribution', 'event_venues', 'transactions'
        ) THEN '✅ Required'
        ELSE '⚠️ Optional'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'profiles', 'registrations', 'events',
    'attendance', 'event_coordinators', 'event_winners',
    'kit_distribution', 'event_venues', 'transactions',
    'cashier_sessions', 'admin_logs'
)
ORDER BY status DESC, table_name;

-- Check if RLS is enabled on all tables
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'attendance', 'event_coordinators', 'event_winners',
    'kit_distribution', 'event_venues', 'transactions'
);

-- Verify helper functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_role',
    'is_event_coordinator',
    'get_admin_cash_today',
    'get_pending_approvals_count'
);

-- =====================================================
-- END OF SCRIPT
-- =====================================================
