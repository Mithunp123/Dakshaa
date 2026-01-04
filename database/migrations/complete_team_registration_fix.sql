-- ============================================
-- COMPLETE FIX: TEAM REGISTRATION & RLS
-- Run this single file to fix all issues
-- ============================================

-- ============================================
-- PART 1: FIX REGISTRATIONS TABLE SCHEMA
-- ============================================

-- Add missing columns
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'individual';

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS combo_events TEXT[];

ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);

-- Add constraint
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS check_registration_type;
ALTER TABLE registrations
ADD CONSTRAINT check_registration_type 
CHECK (registration_type IN ('individual', 'combo', 'team'));

-- Update existing records
UPDATE registrations 
SET registration_type = CASE 
    WHEN team_id IS NOT NULL THEN 'team'
    WHEN combo_id IS NOT NULL THEN 'combo'
    ELSE 'individual'
END
WHERE registration_type IS NULL;

-- ============================================
-- PART 2: FIX EVENT REGISTRATION COUNTING
-- ============================================

-- Update get_events_with_stats function to count correctly
DROP FUNCTION IF EXISTS get_events_with_stats();

CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
    id UUID,
    event_id TEXT,
    event_key TEXT,
    name TEXT,
    title TEXT,
    event_name TEXT,
    description TEXT,
    venue TEXT,
    category TEXT,
    event_type TEXT,
    type TEXT,
    price DECIMAL,
    capacity INTEGER,
    current_registrations BIGINT,
    is_team_event BOOLEAN,
    min_team_size INTEGER,
    max_team_size INTEGER,
    is_open BOOLEAN,
    is_active BOOLEAN,
    current_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        e.id,
        e.event_id,
        e.event_key,
        e.name,
        e.title,
        e.event_name,
        e.description,
        e.venue,
        e.category,
        e.event_type,
        e.type,
        e.price,
        e.capacity,
        COALESCE(
            (SELECT COUNT(DISTINCT r.user_id)::BIGINT 
             FROM registrations r 
             WHERE r.event_id = e.event_id 
             AND UPPER(r.payment_status) = 'PAID'
            ), 
            0
        ) as current_registrations,
        e.is_team_event,
        e.min_team_size,
        e.max_team_size,
        COALESCE(e.is_open, true) as is_open,
        e.is_active,
        e.current_status,
        e.created_at,
        e.updated_at
    FROM events e
    WHERE e.is_active = true
    ORDER BY e.created_at DESC;
$$;

-- Create trigger to auto-update registration counts
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events
    SET current_registrations = (
        SELECT COUNT(DISTINCT user_id)
        FROM registrations
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
        AND UPPER(payment_status) = 'PAID'
    )
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_event_registration_count ON registrations;

CREATE TRIGGER trg_update_event_registration_count
    AFTER INSERT OR UPDATE OR DELETE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_event_registration_count();

-- Sync current counts
UPDATE events e
SET current_registrations = (
    SELECT COUNT(DISTINCT r.user_id)
    FROM registrations r
    WHERE r.event_id = e.event_id
    AND UPPER(r.payment_status) = 'PAID'
);

-- ============================================
-- PART 3: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view active events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;
DROP POLICY IF EXISTS "Event coordinators can view their events" ON events;

DROP POLICY IF EXISTS "Users can view their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can insert their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can view all registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can manage registrations" ON registrations;

DROP POLICY IF EXISTS "Users can view their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can insert their own event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can view all event registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Admins can manage event registrations" ON event_registrations_config;

-- ============================================
-- EVENTS TABLE POLICIES
-- ============================================

CREATE POLICY "Public can view active events" 
ON events FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all events" 
ON events FOR ALL 
USING (get_user_role() = 'super_admin');

CREATE POLICY "Event coordinators can view their events" 
ON events FOR SELECT 
USING (get_user_role() IN ('event_coordinator', 'registration_admin'));

-- ============================================
-- REGISTRATIONS TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view their own registrations" 
ON registrations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own registrations" 
ON registrations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations" 
ON registrations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" 
ON registrations FOR SELECT 
USING (get_user_role() IN ('super_admin', 'registration_admin', 'event_coordinator'));

CREATE POLICY "Admins can manage registrations" 
ON registrations FOR ALL 
USING (get_user_role() = 'super_admin');

-- ============================================
-- EVENT_REGISTRATIONS_CONFIG TABLE POLICIES
-- ============================================

CREATE POLICY "Users can view their own event registrations" 
ON event_registrations_config FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event registrations" 
ON event_registrations_config FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all event registrations" 
ON event_registrations_config FOR SELECT 
USING (get_user_role() IN ('super_admin', 'registration_admin', 'event_coordinator'));

CREATE POLICY "Admins can manage event registrations" 
ON event_registrations_config FOR ALL 
USING (get_user_role() = 'super_admin');

-- ============================================
-- PART 4: GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON events TO anon;
GRANT SELECT ON events TO authenticated;

GRANT SELECT ON registrations TO authenticated;
GRANT INSERT ON registrations TO authenticated;
GRANT UPDATE ON registrations TO authenticated;

GRANT SELECT ON event_registrations_config TO authenticated;
GRANT INSERT ON event_registrations_config TO authenticated;

GRANT SELECT ON events_config TO anon;
GRANT SELECT ON events_config TO authenticated;

GRANT EXECUTE ON FUNCTION get_events_with_stats TO anon;
GRANT EXECUTE ON FUNCTION get_events_with_stats TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================
-- Uncomment to verify after running:

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('events', 'registrations', 'event_registrations_config');

-- Check columns exist
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'registrations'
-- AND column_name IN ('registration_type', 'team_id');

-- Test event counts
-- SELECT event_id, name, current_registrations FROM get_events_with_stats() LIMIT 5;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Migration completed successfully! All tables secured and registration counting fixed.';
END $$;
