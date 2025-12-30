-- =====================================================
-- FIX: Database setup for Event Coordinator features
-- =====================================================
-- Run this script in Supabase SQL Editor to fix any
-- missing tables, columns, or permissions
-- =====================================================

-- 0. ADD EVENT_NAME COLUMN TO REGISTRATIONS TABLE
-- =====================================================
-- This stores the event name directly in registrations for easy display
ALTER TABLE event_registrations_config 
ADD COLUMN IF NOT EXISTS event_name TEXT;

-- Update existing registrations with event names from events_config
-- Using 'name' column (confirmed from table structure)
UPDATE event_registrations_config r
SET event_name = e.name
FROM events_config e
WHERE r.event_id = e.id
AND r.event_name IS NULL;

-- 0.1 ADD FOREIGN KEY FROM event_registrations_config.user_id TO profiles.id
-- =====================================================
-- This allows Supabase to detect the relationship for joins
-- First, ensure profiles table exists and has correct structure
-- Note: We add a second FK constraint that references profiles
-- This is safe because profiles.id = auth.users.id by design

-- Add FK constraint if it doesn't exist (for PostgREST relationship detection)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'event_registrations_config_user_id_profiles_fkey'
        AND table_name = 'event_registrations_config'
    ) THEN
        -- Add the FK constraint
        ALTER TABLE event_registrations_config
        ADD CONSTRAINT event_registrations_config_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FK constraint may already exist or profiles table issue: %', SQLERRM;
END $$;

-- 1. ATTENDANCE TABLE
-- =====================================================
-- Note: event_id references events_config(id) as UUID
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events_config(id) ON DELETE CASCADE,
    marked_by UUID REFERENCES profiles(id),
    mark_type TEXT DEFAULT 'qr_scan',
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Enable RLS on attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Set REPLICA IDENTITY for real-time to work properly
ALTER TABLE attendance REPLICA IDENTITY FULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Coordinators can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Authenticated can read attendance" ON attendance;
DROP POLICY IF EXISTS "Coordinators can insert attendance" ON attendance;

-- Allow coordinators and admins to manage attendance
CREATE POLICY "Coordinators can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'event_coordinator', 'volunteer')
        )
    );

-- Allow users to view their own attendance
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (auth.uid() = user_id);

-- 2. EVENT COORDINATORS TABLE
-- =====================================================
-- Note: event_id references events_config(id) as UUID
CREATE TABLE IF NOT EXISTS event_coordinators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events_config(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE event_coordinators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage coordinators" ON event_coordinators;
DROP POLICY IF EXISTS "Coordinators can view assignments" ON event_coordinators;
DROP POLICY IF EXISTS "Authenticated can read coordinators" ON event_coordinators;

-- Allow super admins to manage
CREATE POLICY "Admins can manage coordinators" ON event_coordinators
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

-- Allow coordinators to view their own assignments
CREATE POLICY "Coordinators can view assignments" ON event_coordinators
    FOR SELECT USING (auth.uid() = user_id);

-- Allow all authenticated users to read (needed for dashboard)
CREATE POLICY "Authenticated can read coordinators" ON event_coordinators
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3. EVENT WINNERS TABLE
-- =====================================================
-- Note: event_id references events_config(id) as UUID
CREATE TABLE IF NOT EXISTS event_winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events_config(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    marked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE event_winners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coordinators can manage winners" ON event_winners;
DROP POLICY IF EXISTS "Public can view winners" ON event_winners;

CREATE POLICY "Coordinators can manage winners" ON event_winners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'event_coordinator')
        )
    );

CREATE POLICY "Public can view winners" ON event_winners
    FOR SELECT USING (true);

-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_coordinators_event ON event_coordinators(event_id);
CREATE INDEX IF NOT EXISTS idx_coordinators_user ON event_coordinators(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_event ON event_winners(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);

-- 5. ENABLE REALTIME FOR DYNAMIC UPDATES
-- =====================================================
-- Enable realtime on registrations tables for dynamic updates
ALTER TABLE registrations REPLICA IDENTITY FULL;
ALTER TABLE event_registrations_config REPLICA IDENTITY FULL;

-- NOTE: In Supabase Dashboard, you need to manually enable Realtime for tables:
-- 1. Go to Database > Replication
-- 2. Find 'supabase_realtime' source
-- 3. Enable 'registrations', 'attendance', and 'event_registrations_config' tables
-- 
-- Alternatively, run the following commands if you have superuser access:
-- These commands add tables to Supabase's realtime publication

-- Try to add tables to publication (may already exist)
DO $$
BEGIN
    -- Try to add registrations to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    -- Try to add attendance to realtime  
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    -- Try to add event_registrations_config to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations_config;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 6. VERIFY SETUP
-- =====================================================
SELECT 'attendance' as table_name, COUNT(*) as count FROM attendance
UNION ALL
SELECT 'event_coordinators', COUNT(*) FROM event_coordinators
UNION ALL
SELECT 'event_winners', COUNT(*) FROM event_winners
UNION ALL
SELECT 'event_registrations_config', COUNT(*) FROM event_registrations_config;

-- 7. VERIFY REALTIME IS ENABLED
-- =====================================================
SELECT 
    schemaname,
    tablename,
    'Realtime enabled' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('registrations', 'attendance');
