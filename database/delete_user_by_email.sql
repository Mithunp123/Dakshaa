-- =====================================================
-- DELETE USER AND ALL RELATED DATA
-- =====================================================
-- This script deletes a user and ALL their related data from the database
-- WARNING: This action is IRREVERSIBLE!

-- USER TO DELETE:
-- Email: pavithranai19@gmail.com
-- Name: Jarvis

-- =====================================================
-- STEP 1: Find the user ID
-- =====================================================
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user ID from profiles table
  SELECT id INTO user_uuid
  FROM profiles
  WHERE email = 'pavithranai19@gmail.com' OR full_name = 'Jarvis';

  IF user_uuid IS NULL THEN
    RAISE NOTICE 'User not found!';
  ELSE
    RAISE NOTICE 'Found user ID: %', user_uuid;

    -- =====================================================
    -- STEP 2: Delete all related data (in order of dependencies)
    -- =====================================================

    -- Delete team memberships
    DELETE FROM team_members WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted team memberships';

    -- Delete teams created by user
    DELETE FROM teams WHERE created_by = user_uuid;
    RAISE NOTICE 'Deleted teams created by user';

    -- Delete attendance records where user attended
    DELETE FROM attendance WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted attendance records (user attended)';

    -- Update attendance records marked by this user (set marked_by to NULL)
    UPDATE attendance SET marked_by = NULL WHERE marked_by = user_uuid;
    RAISE NOTICE 'Updated attendance records (marked by user)';

    -- Delete winner records
    DELETE FROM winners WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted winner records';

    -- Delete event coordinator assignments
    DELETE FROM event_coordinators WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted event coordinator assignments';

    -- Delete registrations
    DELETE FROM registrations WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted registrations';

    -- Delete accommodation bookings (if table exists)
    DELETE FROM accommodation WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted accommodation bookings';

    -- Delete lunch bookings (if table exists)
    DELETE FROM lunch_bookings WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted lunch bookings';

    -- Delete notifications (if table exists)
    DELETE FROM user_notifications WHERE user_id = user_uuid;
    RAISE NOTICE 'Deleted notifications';

    -- Delete profile
    DELETE FROM profiles WHERE id = user_uuid;
    RAISE NOTICE 'Deleted profile';

    -- Delete from auth.users (this will cascade delete profile due to FK)
    DELETE FROM auth.users WHERE id = user_uuid;
    RAISE NOTICE 'Deleted auth user';

    RAISE NOTICE 'User deletion completed successfully!';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Check if user still exists (should return 0):
-- SELECT COUNT(*) FROM profiles WHERE email = 'pavithranai19@gmail.com';
-- SELECT COUNT(*) FROM auth.users WHERE email = 'pavithranai19@gmail.com';

-- =====================================================
-- ALTERNATIVE: Manual Deletion (If above doesn't work)
-- =====================================================
-- First, find the user ID:
-- SELECT id, full_name, email FROM profiles WHERE email = 'pavithranai19@gmail.com';

-- Then replace <USER_ID> with the actual UUID and run:
/*
-- Delete in this order:
DELETE FROM team_members WHERE user_id = '<USER_ID>';
DELETE FROM teams WHERE created_by = '<USER_ID>';
DELETE FROM attendance WHERE user_id = '<USER_ID>';
DELETE FROM winners WHERE user_id = '<USER_ID>';
DELETE FROM event_coordinators WHERE user_id = '<USER_ID>';
DELETE FROM registrations WHERE user_id = '<USER_ID>';
DELETE FROM accommodation WHERE user_id = '<USER_ID>';
DELETE FROM lunch_bookings WHERE user_id = '<USER_ID>';
DELETE FROM user_notifications WHERE user_id = '<USER_ID>';
DELETE FROM profiles WHERE id = '<USER_ID>';
DELETE FROM auth.users WHERE id = '<USER_ID>';
*/

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This script deletes ALL data related to the user
-- 2. Make sure you have a backup before running
-- 3. The deletion follows foreign key dependencies
-- 4. Some tables (accommodation, lunch_bookings) may not exist yet
-- 5. If errors occur, delete manually using the alternative method
