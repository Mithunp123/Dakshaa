-- ============================================================
-- FIX COMBOS RLS - Allow authenticated users to read combos
-- ============================================================

-- Check current RLS status
SELECT 
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'combos';

-- Check existing policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'combos';

-- Option 1: If RLS is enabled, add policy to allow all authenticated users to read
DROP POLICY IF EXISTS "Anyone can view active combos" ON combos;
CREATE POLICY "Anyone can view active combos"
ON combos FOR SELECT
USING (is_active = true);

-- Option 2: If no policies exist, you might need to enable RLS first then add policy
-- ALTER TABLE combos ENABLE ROW LEVEL SECURITY;

-- Verify policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'combos';

-- Test: This should return combos now
SELECT id, name, price, is_active FROM combos WHERE is_active = true;
