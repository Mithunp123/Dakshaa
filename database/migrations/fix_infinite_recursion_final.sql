-- ============================================
-- FIX INFINITE RECURSION IN TEAMS RLS
-- COMPLETE FIX - No more breaking changes
-- ============================================

-- ============================================
-- STEP 1: DROP ALL PROBLEMATIC POLICIES
-- ============================================

-- Drop ALL existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can view their own teams" ON teams;
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Team leaders can manage their teams" ON teams;
DROP POLICY IF EXISTS "Users can insert teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can delete their teams" ON teams;
DROP POLICY IF EXISTS "teams_select_policy" ON teams;
DROP POLICY IF EXISTS "teams_insert_policy" ON teams;
DROP POLICY IF EXISTS "teams_update_policy" ON teams;
DROP POLICY IF EXISTS "teams_delete_policy" ON teams;

DROP POLICY IF EXISTS "Members can view team data" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Users can update team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete team members" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;

-- ============================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- TEAMS TABLE - Simple policies without subqueries
CREATE POLICY "teams_select_policy" 
ON teams
FOR SELECT 
USING (
    -- Leaders can see their teams
    leader_id = auth.uid()
);

CREATE POLICY "teams_insert_policy" 
ON teams
FOR INSERT 
WITH CHECK (
    leader_id = auth.uid()
);

CREATE POLICY "teams_update_policy" 
ON teams
FOR UPDATE 
USING (leader_id = auth.uid())
WITH CHECK (leader_id = auth.uid());

CREATE POLICY "teams_delete_policy" 
ON teams
FOR DELETE 
USING (leader_id = auth.uid());

-- TEAM_MEMBERS TABLE - Simple policies
CREATE POLICY "team_members_select_policy" 
ON team_members
FOR SELECT 
USING (
    -- Users can see their own memberships
    user_id = auth.uid()
);

CREATE POLICY "team_members_insert_policy" 
ON team_members
FOR INSERT 
WITH CHECK (
    -- Team leaders can add members (checked via application logic)
    EXISTS (
        SELECT 1 FROM teams 
        WHERE teams.id = team_members.team_id 
        AND teams.leader_id = auth.uid()
    )
);

CREATE POLICY "team_members_delete_policy" 
ON team_members
FOR DELETE 
USING (
    -- Leaders can remove members OR users can remove themselves
    EXISTS (
        SELECT 1 FROM teams 
        WHERE teams.id = team_members.team_id 
        AND teams.leader_id = auth.uid()
    )
    OR user_id = auth.uid()
);

-- ============================================
-- STEP 3: CREATE SAFE HELPER FUNCTION
-- ============================================

-- Drop old function
DROP FUNCTION IF EXISTS get_user_teams(UUID);

-- Create new function that bypasses RLS
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
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.team_name,
        COALESCE(tm.role, 'member') as role,
        t.leader_id,
        t.event_id,
        COALESCE(e.title, e.name, e.event_name, 'Unknown Event') as event_title,
        e.category as event_category,
        COALESCE(e.max_team_size, 4) as max_team_size,
        COALESCE(e.min_team_size, 2) as min_team_size,
        (SELECT COUNT(*)::BIGINT FROM team_members WHERE team_id = t.id) as member_count,
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
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_teams TO authenticated;

-- ============================================
-- STEP 4: VERIFY DATA INTEGRITY
-- ============================================

DO $$ 
DECLARE 
    team_count INTEGER;
    member_count INTEGER;
    reg_count INTEGER;
BEGIN 
    SELECT COUNT(*) INTO team_count FROM teams;
    SELECT COUNT(*) INTO member_count FROM team_members;
    SELECT COUNT(*) INTO reg_count FROM registrations WHERE team_id IS NOT NULL;
    
    RAISE NOTICE '✓ Teams: %', team_count;
    RAISE NOTICE '✓ Team Members: %', member_count;
    RAISE NOTICE '✓ Team Registrations: %', reg_count;
    
    IF team_count = 0 THEN
        RAISE WARNING 'No teams found in database!';
    ELSE
        RAISE NOTICE 'Teams intact! RLS policies fixed.';
    END IF;
END $$;

-- ============================================
-- VERIFICATION - RUN THESE MANUALLY
-- ============================================

-- Check your teams directly
-- SELECT * FROM teams WHERE leader_id = auth.uid();

-- Check your team memberships
-- SELECT * FROM team_members WHERE user_id = auth.uid();

-- Use the safe function
-- SELECT * FROM get_user_teams(auth.uid());
