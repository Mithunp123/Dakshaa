-- ============================================
-- FIX REGISTRATIONS TABLE SCHEMA
-- Add missing columns and fix registration counting
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO REGISTRATIONS TABLE
-- ============================================

-- Add registration_type column if it doesn't exist
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'individual';

-- Add team_id column for team registrations
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Add combo_events column to store event selections from combos
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS combo_events TEXT[];

-- Add registered_at timestamp if not exists
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 2. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_type ON registrations(registration_type);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);

-- ============================================
-- 3. UPDATE get_events_with_stats FUNCTION
-- To properly count PAID registrations only
-- ============================================

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
        -- Count only PAID registrations (case-insensitive)
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

-- ============================================
-- 4. CREATE FUNCTION TO UPDATE EVENT CAPACITY
-- Automatically update current_registrations in events table
-- ============================================

CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the events table with current registration count
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

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_update_event_registration_count ON registrations;

-- Create trigger on registrations table
CREATE TRIGGER trg_update_event_registration_count
    AFTER INSERT OR UPDATE OR DELETE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_event_registration_count();

-- ============================================
-- 5. CREATE FUNCTION TO GET USER REGISTRATIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_registrations(p_user_id UUID)
RETURNS TABLE (
    registration_id UUID,
    event_id TEXT,
    event_name TEXT,
    event_category TEXT,
    price DECIMAL,
    payment_status TEXT,
    payment_id TEXT,
    registration_type TEXT,
    team_id UUID,
    team_name TEXT,
    qr_code_string TEXT,
    registered_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        r.id as registration_id,
        r.event_id,
        COALESCE(e.name, e.title, e.event_name) as event_name,
        e.category as event_category,
        e.price,
        r.payment_status,
        r.payment_id,
        r.registration_type,
        r.team_id,
        t.name as team_name,
        r.qr_code_string,
        COALESCE(r.registered_at, r.created_at) as registered_at
    FROM registrations r
    LEFT JOIN events e ON r.event_id = e.event_id
    LEFT JOIN teams t ON r.team_id = t.id
    WHERE r.user_id = p_user_id
    AND UPPER(r.payment_status) = 'PAID'
    ORDER BY r.created_at DESC;
$$;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_events_with_stats TO anon;
GRANT EXECUTE ON FUNCTION get_events_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_registrations TO authenticated;

-- ============================================
-- 7. UPDATE EXISTING REGISTRATIONS
-- Set default registration_type for existing records
-- ============================================

-- Update existing registrations without registration_type
UPDATE registrations 
SET registration_type = CASE 
    WHEN team_id IS NOT NULL THEN 'team'
    WHEN combo_id IS NOT NULL THEN 'combo'
    ELSE 'individual'
END
WHERE registration_type IS NULL;

-- ============================================
-- 8. REFRESH ALL EVENT REGISTRATION COUNTS
-- One-time sync to ensure counts are accurate
-- ============================================

UPDATE events e
SET current_registrations = (
    SELECT COUNT(DISTINCT r.user_id)
    FROM registrations r
    WHERE r.event_id = e.event_id
    AND UPPER(r.payment_status) = 'PAID'
);

-- ============================================
-- 9. ADD CONSTRAINTS
-- ============================================

-- Ensure registration_type is one of the valid values
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS check_registration_type;

ALTER TABLE registrations
ADD CONSTRAINT check_registration_type 
CHECK (registration_type IN ('individual', 'combo', 'team'));

-- ============================================
-- 10. VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify:

-- Check if columns exist
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'registrations'
-- AND column_name IN ('registration_type', 'team_id', 'combo_events', 'registered_at')
-- ORDER BY column_name;

-- Check registration counts
-- SELECT 
--     e.event_id,
--     COALESCE(e.name, e.title, e.event_name) as event_name,
--     e.current_registrations,
--     COUNT(DISTINCT r.user_id) as actual_paid_count
-- FROM events e
-- LEFT JOIN registrations r ON e.event_id = r.event_id AND UPPER(r.payment_status) = 'PAID'
-- GROUP BY e.id, e.event_id, e.name, e.title, e.event_name, e.current_registrations
-- HAVING e.current_registrations != COUNT(DISTINCT r.user_id)
-- ORDER BY e.event_id;

-- Test the function
-- SELECT * FROM get_events_with_stats() LIMIT 5;
