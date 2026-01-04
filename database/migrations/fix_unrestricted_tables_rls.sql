-- ============================================
-- FIX UNRESTRICTED TABLES RLS POLICIES
-- Addresses security warnings for event_registrations_config and events_config
-- ============================================

-- ============================================
-- 1. EVENT_REGISTRATIONS_CONFIG TABLE
-- ============================================

-- Enable RLS on event_registrations_config
ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can insert their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON event_registrations_config;

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view their own event registrations" 
ON event_registrations_config
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own registrations
CREATE POLICY "Users can insert their own event registrations" 
ON event_registrations_config
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins and coordinators can view all registrations
CREATE POLICY "Admins can view all event registrations" 
ON event_registrations_config
FOR SELECT 
USING (
    get_user_role() IN ('super_admin', 'registration_admin', 'event_coordinator')
);

-- Policy: Super admins can update/delete registrations
CREATE POLICY "Admins can manage event registrations" 
ON event_registrations_config
FOR ALL 
USING (
    get_user_role() = 'super_admin'
);

-- ============================================
-- 2. EVENTS_CONFIG VIEW
-- ============================================
-- Note: Views inherit RLS from their base tables
-- Ensure the base 'events' table has proper RLS

-- Enable RLS on events table (if not already enabled)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Event coordinators can view their events" ON events;

-- Policy: Everyone can view active events (needed for registration)
CREATE POLICY "Public can view active events" 
ON events
FOR SELECT 
USING (is_active = true);

-- Policy: Super admins can do everything
CREATE POLICY "Admins can manage all events" 
ON events
FOR ALL 
USING (
    get_user_role() = 'super_admin'
);

-- Policy: Event coordinators can view events
CREATE POLICY "Event coordinators can view their events" 
ON events
FOR SELECT 
USING (
    get_user_role() IN ('event_coordinator', 'registration_admin')
);

-- ============================================
-- 3. REGISTRATIONS TABLE RLS
-- ============================================

-- Enable RLS on registrations table
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can manage registrations" ON registrations;

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view their own registrations" 
ON registrations
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own registrations
CREATE POLICY "Users can insert their own registrations" 
ON registrations
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own registrations (payment status, etc.)
CREATE POLICY "Users can update their own registrations" 
ON registrations
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Admins can view all registrations
CREATE POLICY "Admins can view all registrations" 
ON registrations
FOR SELECT 
USING (
    get_user_role() IN ('super_admin', 'registration_admin', 'event_coordinator')
);

-- Policy: Super admins can manage all registrations
CREATE POLICY "Admins can manage registrations" 
ON registrations
FOR ALL 
USING (
    get_user_role() = 'super_admin'
);

-- ============================================
-- 4. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant permissions for authenticated users
GRANT SELECT ON event_registrations_config TO authenticated;
GRANT INSERT ON event_registrations_config TO authenticated;

GRANT SELECT ON registrations TO authenticated;
GRANT INSERT ON registrations TO authenticated;
GRANT UPDATE ON registrations TO authenticated;

-- Grant permissions for anonymous users to view events
GRANT SELECT ON events TO anon;
GRANT SELECT ON events TO authenticated;

-- Grant permissions on events_config view
GRANT SELECT ON events_config TO anon;
GRANT SELECT ON events_config TO authenticated;

-- ============================================
-- 5. VERIFICATION QUERIES
-- ============================================

-- Verify RLS is enabled
-- Run these queries to confirm:

-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('events', 'event_registrations_config', 'registrations');

-- View all policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename IN ('events', 'event_registrations_config', 'registrations')
-- ORDER BY tablename, policyname;
