-- ============================================
-- FIX REGISTRATION COUNTING & TEAM VISIBILITY
-- Fixes: 1) Registration count showing 0
--        2) Team registrations not visible
-- ============================================

-- ============================================
-- PART 1: FIX REGISTRATION COUNTING
-- ============================================

-- Update get_events_with_stats to count ALL registrations (not just PAID)
-- Or modify based on your payment flow
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
        -- Count DISTINCT users with ANY payment status (PAID or PENDING)
        COALESCE(
            (SELECT COUNT(DISTINCT r.user_id)::BIGINT 
             FROM registrations r 
             WHERE r.event_id = e.event_id
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

-- Update trigger to count all registrations
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events
    SET current_registrations = (
        SELECT COUNT(DISTINCT user_id)
        FROM registrations
        WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    )
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Manually sync ALL registration counts right now
UPDATE events e
SET current_registrations = (
    SELECT COUNT(DISTINCT r.user_id)
    FROM registrations r
    WHERE r.event_id = e.event_id
);

-- ============================================
-- PART 2: FIX TEAM VISIBILITY FOR MEMBERS
-- ============================================

-- Ensure team_members table has proper RLS for members to see their teams
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;

-- Policy: Users can see their own memberships
CREATE POLICY "Users can view their team memberships" 
ON team_members
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can see all members of teams they're in
CREATE POLICY "Users can view team members of their teams" 
ON team_members
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
);

-- Ensure teams table has proper RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can view their own teams" ON teams;

-- Policy: Users can view teams they are members of
CREATE POLICY "Users can view their own teams" 
ON teams
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
);

-- ============================================
-- PART 3: CREATE HELPER FUNCTION FOR USER TEAMS
-- ============================================

CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    role TEXT,
    leader_id UUID,
    event_id TEXT,
    event_title TEXT,
    event_category TEXT,
    max_team_size INTEGER,
    min_team_size INTEGER,
    member_count BIGINT,
    is_registered BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        t.id as team_id,
        t.team_name,
        tm.role,
        t.leader_id,
        t.event_id,
        e.title as event_title,
        e.category as event_category,
        e.max_team_size,
        e.min_team_size,
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
        EXISTS(
            SELECT 1 FROM registrations r
            WHERE r.team_id = t.id
            AND r.user_id = p_user_id
        ) as is_registered,
        t.created_at
    FROM teams t
    INNER JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN events e ON t.event_id = e.event_id
    WHERE tm.user_id = p_user_id
    AND t.is_active = true
    ORDER BY t.created_at DESC;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_events_with_stats TO anon;
GRANT EXECUTE ON FUNCTION get_events_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_teams TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check registration counts
-- SELECT event_id, name, current_registrations FROM get_events_with_stats() 
-- WHERE current_registrations > 0 
-- ORDER BY current_registrations DESC LIMIT 10;

-- Check if user can see their teams
-- SELECT * FROM get_user_teams(auth.uid());

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Registration counting fixed! Counts updated and team visibility enabled.';
END $$;
