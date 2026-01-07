-- =============================================
-- FIX: Team Join Requests Foreign Key
-- =============================================
-- Issue: PGRST200 error - PostgREST can't find relationship between
--        team_join_requests and profiles tables
-- Cause: team_join_requests.user_id references auth.users(id) instead of profiles(id)
-- Fix: Change foreign key to reference profiles(id)
-- =============================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE team_join_requests
DROP CONSTRAINT IF EXISTS team_join_requests_user_id_fkey;

-- Step 2: Add new foreign key constraint referencing profiles table
ALTER TABLE team_join_requests
ADD CONSTRAINT team_join_requests_user_id_fkey
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Step 3: Verify the change
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='team_join_requests';

-- =============================================
-- RESULT: team_join_requests.user_id now properly references profiles(id)
--         PostgREST can now join these tables in API queries
-- =============================================
