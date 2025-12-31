-- ============================================
-- FIX ROLE MANAGEMENT POLICIES
-- Allow super_admins to update other users' roles
-- Run this in Supabase SQL Editor
-- ============================================

-- Helper function to get user role safely
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(user_role, 'student');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;

-- ============================================
-- FIX PROFILES POLICIES
-- ============================================

-- Drop ALL existing profile policies to start fresh
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;
DROP POLICY IF EXISTS "Only master admin can assign super_admin" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Enable RLS on profiles (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone to READ profiles (needed for displaying user info in lists)
CREATE POLICY "Allow read profiles" ON profiles
    FOR SELECT USING (true);

-- 2. Allow users to INSERT their own profile (for registration)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to UPDATE their own profile (name, college, etc.)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Allow super_admins to UPDATE ANY profile (for role management)
CREATE POLICY "Super admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- ============================================
-- ADMIN LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES profiles(id),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on admin_logs
DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;

-- Allow admins to insert logs
CREATE POLICY "Admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'registration_admin'))
    );

-- Allow super_admins to view logs
CREATE POLICY "Admins can view logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- ============================================
-- EVENT COORDINATORS TABLE POLICIES
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS event_coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE event_coordinators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Super admins can manage coordinators" ON event_coordinators;
DROP POLICY IF EXISTS "Coordinators can view their assignments" ON event_coordinators;
DROP POLICY IF EXISTS "Allow viewing coordinator assignments" ON event_coordinators;

-- Allow super_admins full access
CREATE POLICY "Super admins can manage coordinators" ON event_coordinators
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Allow coordinators to view their own assignments
CREATE POLICY "Coordinators can view their assignments" ON event_coordinators
    FOR SELECT USING (auth.uid() = user_id);

-- Allow everyone to view assignments (for display purposes)
CREATE POLICY "Allow viewing coordinator assignments" ON event_coordinators
    FOR SELECT USING (true);

-- ============================================
-- ENABLE REALTIME FOR PROFILES (for live updates)
-- ============================================
-- Note: Run this in Supabase Dashboard > Database > Replication
-- or use the following:
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Role management policies updated successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '  ✓ Super admins can now update other users roles';
    RAISE NOTICE '  ✓ All users can view profiles (for lists)';
    RAISE NOTICE '  ✓ Admin logs table created/verified';
    RAISE NOTICE '  ✓ Event coordinator policies updated';
    RAISE NOTICE '  ✓ Real-time enabled for profiles table';
    RAISE NOTICE '';
    RAISE NOTICE 'Test by: Logging in as super_admin and changing a users role';
END $$;

-- Show current policies (for verification)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

