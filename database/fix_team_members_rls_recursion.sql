-- ============================================================================
-- FIX TEAM_MEMBERS RLS INFINITE RECURSION
-- ============================================================================
-- Problem: team_members SELECT policy calls check_team_membership() which
-- queries team_members itself, causing infinite recursion.
-- Solution: Use a simpler policy that doesn't reference team_members.
-- ============================================================================

-- STEP 1: Drop the problematic function and policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Users can insert team members" ON team_members;
DROP POLICY IF EXISTS "Team members can be removed" ON team_members;
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;

-- STEP 2: Create SIMPLE RLS policies that don't cause recursion
-- ============================================================================

-- SELECT: Anyone can view team members (this is safe - team_members only contains IDs)
-- The actual team visibility is controlled by teams table RLS
CREATE POLICY "Anyone can view team members" ON team_members
    FOR SELECT USING (true);

-- INSERT: Authenticated users can add team members if they are:
-- 1. Adding themselves to a team, OR
-- 2. They are the leader of the team
CREATE POLICY "Users can insert team members" ON team_members
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (
            user_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM teams 
                WHERE teams.id = team_id 
                AND (teams.leader_id = auth.uid() OR teams.created_by = auth.uid())
            )
        )
    );

-- UPDATE: Only team leaders can update team member records
CREATE POLICY "Team leaders can update members" ON team_members
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_id 
            AND (teams.leader_id = auth.uid() OR teams.created_by = auth.uid())
        )
    );

-- DELETE: Team leaders can remove members, or users can remove themselves
CREATE POLICY "Team members can be removed" ON team_members
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM teams 
            WHERE teams.id = team_id 
            AND (teams.leader_id = auth.uid() OR teams.created_by = auth.uid())
        )
    );

-- STEP 3: Fix the teams table RLS policies as well
-- ============================================================================
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Users can view teams they created" ON teams;
DROP POLICY IF EXISTS "Public can view team names" ON teams;

-- SELECT: Users can view teams where they are the leader, creator, or a member
-- Using a direct subquery instead of a function to avoid recursion
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (
        leader_id = auth.uid() OR 
        created_by = auth.uid() OR
        id IN (
            SELECT team_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- INSERT: Any authenticated user can create a team
CREATE POLICY "Users can create teams" ON teams
    FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Only leader/creator can update
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
CREATE POLICY "Users can update their teams" ON teams
    FOR UPDATE
    USING (leader_id = auth.uid() OR created_by = auth.uid());

-- DELETE: Only leader/creator can delete
DROP POLICY IF EXISTS "Users can delete their teams" ON teams;
CREATE POLICY "Users can delete their teams" ON teams
    FOR DELETE
    USING (leader_id = auth.uid() OR created_by = auth.uid());

-- STEP 4: Drop problematic functions that aren't needed anymore
-- ============================================================================
DROP FUNCTION IF EXISTS check_team_membership(UUID);
DROP FUNCTION IF EXISTS user_can_view_team(UUID, UUID);

-- STEP 5: Verify RLS is enabled
-- ============================================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Done! The policies now use simple subqueries instead of recursive functions.
SELECT 'RLS policies fixed successfully!' as result;
