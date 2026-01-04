-- ============================================
-- FIX TEAM VISIBILITY ISSUES
-- Rollback overly restrictive RLS policies
-- ============================================

-- ============================================
-- PART 1: FIX TEAMS TABLE RLS
-- ============================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view their own teams" ON teams;

-- Create more permissive policy for teams
CREATE POLICY "Users can view their teams" 
ON teams
FOR SELECT 
USING (
    -- User is the leader
    leader_id = auth.uid()
    OR
    -- User is a team member
    id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- PART 2: FIX TEAM_MEMBERS RLS
-- ============================================

-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;

-- Create simpler, working policies
CREATE POLICY "Members can view team data" 
ON team_members
FOR SELECT 
USING (
    -- User can see their own membership
    user_id = auth.uid()
    OR
    -- User can see members of teams they're in
    team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
    )
);

-- ============================================
-- PART 3: FIX get_user_teams FUNCTION
-- Handle missing is_active column
-- ============================================

DROP FUNCTION IF EXISTS get_user_teams(UUID);

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
        COALESCE(tm.role, 'member') as role,
        t.leader_id,
        t.event_id,
        COALESCE(e.title, e.name, e.event_name) as event_title,
        e.category as event_category,
        COALESCE(e.max_team_size, 4) as max_team_size,
        COALESCE(e.min_team_size, 2) as min_team_size,
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
    ORDER BY t.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION get_user_teams TO authenticated;

-- ============================================
-- PART 4: VERIFY TEAM DATA IS INTACT
-- ============================================

-- Check teams exist
DO $$ 
DECLARE 
    team_count INTEGER;
    member_count INTEGER;
BEGIN 
    SELECT COUNT(*) INTO team_count FROM teams;
    SELECT COUNT(*) INTO member_count FROM team_members;
    
    RAISE NOTICE 'Total teams in database: %', team_count;
    RAISE NOTICE 'Total team members in database: %', member_count;
    
    IF team_count = 0 THEN
        RAISE WARNING 'No teams found! Data might have been lost.';
    END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test: Check if current user can see their teams
-- SELECT * FROM teams WHERE leader_id = auth.uid() OR id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid());

-- Test: Check team members
-- SELECT * FROM team_members WHERE user_id = auth.uid();

-- Test: Use the function
-- SELECT * FROM get_user_teams(auth.uid());

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Team visibility fixed! Try viewing your teams now.';
END $$;
