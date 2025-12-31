-- =====================================================
-- FIX ATTENDANCE MARKED_BY FOREIGN KEY CONSTRAINT
-- =====================================================
-- This fixes the foreign key constraint that prevents user deletion
-- when they have marked attendance for others

-- Drop the existing foreign key constraint
ALTER TABLE attendance 
DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey;

-- Recreate the constraint with ON DELETE SET NULL
-- This will set marked_by to NULL when the user who marked attendance is deleted
ALTER TABLE attendance
ADD CONSTRAINT attendance_marked_by_fkey 
FOREIGN KEY (marked_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Check the constraint:
-- SELECT
--   tc.constraint_name,
--   tc.table_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- JOIN information_schema.referential_constraints AS rc
--   ON rc.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name = 'attendance'
--   AND kcu.column_name = 'marked_by';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This allows users to be deleted even if they marked attendance
-- 2. When a user is deleted, marked_by is set to NULL (anonymous marker)
-- 3. Attendance records are preserved, only the marker reference is removed
-- 4. This is safer than CASCADE which would delete all attendance records
