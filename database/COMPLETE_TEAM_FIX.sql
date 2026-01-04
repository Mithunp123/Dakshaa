-- ============================================================================
-- COMPLETE TEAM CREATION FIX - RUN THIS SCRIPT
-- ============================================================================
-- This script fixes ALL issues preventing team creation:
-- 1. Adds missing columns to events table
-- 2. Adds missing columns to teams table  
-- 3. Fixes infinite recursion in RLS policies
-- ============================================================================

-- ============================================================================
-- PART 1: FIX EVENTS TABLE
-- ============================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_team_event BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 2;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Set default titles for existing events
UPDATE events 
SET title = COALESCE(title, 'Event ' || event_id)
WHERE title IS NULL OR title = '';

-- ============================================================================
-- PART 2: FIX TEAMS TABLE
-- ============================================================================

ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES profiles(id);

-- Update existing teams to set leader_id = created_by if leader_id is null
UPDATE teams SET leader_id = created_by WHERE leader_id IS NULL AND created_by IS NOT NULL;

-- ============================================================================
-- PART 3: FIX RLS POLICIES (INFINITE RECURSION)
-- ============================================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Public can view team names" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can delete their teams" ON teams;

-- Create security definer function for team visibility
CREATE OR REPLACE FUNCTION user_can_view_team(t_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = t_id
        AND user_id = u_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies for teams table
CREATE POLICY "Users can view teams they are members of" ON teams
    FOR SELECT USING (user_can_view_team(id, auth.uid()));

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (created_by = auth.uid() OR leader_id = auth.uid())
    );

CREATE POLICY "Users can update their teams" ON teams
    FOR UPDATE 
    USING (leader_id = auth.uid() OR created_by = auth.uid())
    WITH CHECK (leader_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can delete their teams" ON teams
    FOR DELETE 
    USING (leader_id = auth.uid() OR created_by = auth.uid());

-- ============================================================================
-- PART 4: FIX TEAM_MEMBERS POLICIES
-- ============================================================================

-- Ensure check_team_membership function exists
CREATE OR REPLACE FUNCTION check_team_membership(t_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = t_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing team_members policies
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Team members can be removed" ON team_members;

-- Create new policies
CREATE POLICY "Users can view team members of their teams" ON team_members
    FOR SELECT USING (check_team_membership(team_id));

CREATE POLICY "Users can insert team members" ON team_members
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (user_id = auth.uid() OR 
         EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id 
            AND (leader_id = auth.uid() OR created_by = auth.uid())
         ))
    );

CREATE POLICY "Team members can be removed" ON team_members
    FOR DELETE 
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE id = team_id 
            AND (leader_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check events table columns
SELECT 'Events Table Columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('title', 'is_team_event', 'max_team_size', 'min_team_size')
ORDER BY column_name;

-- Check teams table columns  
SELECT 'Teams Table Columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teams' 
AND column_name IN ('max_members', 'leader_id', 'created_by', 'name')
ORDER BY column_name;

-- Check policies
SELECT 'Active Policies:' as info;
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, cmd;

-- ============================================================================
-- PART 5: CONFIGURE TEAM EVENTS
-- ============================================================================

-- Technical Team Events
UPDATE events SET 
    is_team_event = true, 
    min_team_size = 2, 
    max_team_size = 3,
    title = 'Neura Hack (Hackathon)'
WHERE event_id = 'tech-it';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 1, 
    max_team_size = 3,
    title = 'SEMISPARK (Project Presentation)'
WHERE event_id = 'tech-vlsi';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 2, 
    max_team_size = 4,
    title = 'ROBO SOCCER'
WHERE event_id = 'tech-mct';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 2, 
    max_team_size = 4,
    title = 'ElectroBuzz'
WHERE event_id = 'tech-ece';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 1, 
    max_team_size = 3,
    title = 'Codathon'
WHERE event_id = 'tech-aiml' OR event_id = 'codeathon';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 1, 
    max_team_size = 3,
    title = 'Paper Presentation'
WHERE event_id = 'tech-mech';

-- Cultural Team Events
UPDATE events SET 
    is_team_event = true, 
    min_team_size = 5, 
    max_team_size = 10,
    title = 'Beat Battle (Group Dance)'
WHERE event_id = 'cultural-group-dance';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 3, 
    max_team_size = 8,
    title = 'Short Film Competition'
WHERE event_id = 'cultural-short-film';

-- Non-Technical Team Events
UPDATE events SET 
    is_team_event = true, 
    min_team_size = 2, 
    max_team_size = 3,
    title = 'Trailblazers (Clue Hunt)'
WHERE event_id = 'nontech-cse';

UPDATE events SET 
    is_team_event = true, 
    min_team_size = 2, 
    max_team_size = 2,
    title = 'Blind Maze Challenge'
WHERE event_id = 'nontech-vlsi';

-- Ensure all workshop events are NOT team events
UPDATE events SET 
    is_team_event = false
WHERE event_id LIKE 'workshop-%';

-- List all team events
SELECT 'Team Events Configured:' as info;
SELECT 
    event_id, 
    title, 
    category,
    is_team_event, 
    min_team_size, 
    max_team_size,
    price
FROM events 
WHERE is_team_event = true
ORDER BY category, event_id;

-- Success message
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status;
