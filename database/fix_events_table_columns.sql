-- ============================================================================
-- FIX EVENTS TABLE - ADD MISSING COLUMNS
-- ============================================================================
-- This script adds essential columns that the frontend expects but are missing
-- from the events table schema
-- ============================================================================

-- Add title column (essential - event name)
ALTER TABLE events ADD COLUMN IF NOT EXISTS title TEXT;

-- Add description column (for event details)
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;

-- Add team-related columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_team_event BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 2;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4;

-- Add event metadata columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS coordinator_name TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS coordinator_contact TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add registration limits
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_registrations INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

-- Update existing events to have default titles if null
UPDATE events 
SET title = COALESCE(title, 'Event ' || event_id)
WHERE title IS NULL OR title = '';

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
