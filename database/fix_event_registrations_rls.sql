-- ============================================
-- FIX RLS POLICIES FOR EVENT_REGISTRATIONS_CONFIG
-- ============================================
-- This script fixes the Row Level Security policies to allow
-- authenticated users to register for events while maintaining security

-- ============================================
-- PART 1: DROP EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can insert their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can update their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON event_registrations_config;

-- ============================================
-- PART 2: CREATE NEW COMPREHENSIVE POLICIES
-- ============================================

-- Policy 1: Users can SELECT their own registrations
CREATE POLICY "Users can view their own event registrations" 
ON event_registrations_config FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can INSERT their own registrations
CREATE POLICY "Users can insert their own event registrations" 
ON event_registrations_config FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can UPDATE their own registrations (for payment status updates)
CREATE POLICY "Users can update their own event registrations" 
ON event_registrations_config FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins can view all registrations
CREATE POLICY "Admins can view all event registrations" 
ON event_registrations_config FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('super_admin', 'registration_admin', 'event_coordinator')
  )
);

-- Policy 5: Admins can manage all registrations (UPDATE, DELETE)
CREATE POLICY "Admins can manage event registrations" 
ON event_registrations_config FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- ============================================
-- PART 3: ENSURE RLS IS ENABLED
-- ============================================

ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 4: GRANT NECESSARY PERMISSIONS
-- ============================================

GRANT SELECT ON event_registrations_config TO authenticated;
GRANT INSERT ON event_registrations_config TO authenticated;
GRANT UPDATE ON event_registrations_config TO authenticated;

-- ============================================
-- PART 5: VERIFICATION QUERIES
-- ============================================

-- Check RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'event_registrations_config'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on event_registrations_config';
  END IF;
  
  RAISE NOTICE 'RLS is enabled on event_registrations_config ✓';
END $$;

-- List all policies
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
WHERE tablename = 'event_registrations_config'
ORDER BY policyname;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '================================================';
    RAISE NOTICE 'RLS policies fixed for event_registrations_config';
    RAISE NOTICE 'Users can now register for events securely';
    RAISE NOTICE '================================================';
END $$;
