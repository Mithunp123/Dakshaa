-- ============================================================================
-- FIX TEAM CREATION AND RLS INFINITE RECURSION
-- ============================================================================
-- This script fixes:
-- 1. Infinite recursion error in teams RLS policies
-- 2. Missing columns in teams table (max_members, leader_id)
-- 3. Proper RLS policies for team creation and viewing
-- ============================================================================

-- STEP 1: Add missing columns to teams table
-- ============================================================================
-- Add max_members column if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 4;

-- Add leader_id column if it doesn't exist (alias for created_by)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES profiles(id);

-- Update existing teams to set leader_id = created_by if leader_id is null
UPDATE teams SET leader_id = created_by WHERE leader_id IS NULL AND created_by IS NOT NULL;

-- STEP 2: Drop problematic RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;
DROP POLICY IF EXISTS "Public can view team names" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Users can update their teams" ON teams;
DROP POLICY IF EXISTS "Users can delete their teams" ON teams;

-- STEP 3: Create security definer function for team visibility
-- ============================================================================
-- This function breaks the circular dependency between teams and team_members policies
CREATE OR REPLACE FUNCTION user_can_view_team(t_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is a member of this team
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = t_id
        AND user_id = u_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 4: Create new RLS policies for teams table
-- ============================================================================

-- SELECT: Users can view teams they are members of
CREATE POLICY "Users can view teams they are members of" ON teams
    FOR SELECT USING (
        user_can_view_team(id, auth.uid())
    );

-- INSERT: Any authenticated user can create teams
CREATE POLICY "Users can create teams" ON teams
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        (created_by = auth.uid() OR leader_id = auth.uid())
    );

-- UPDATE: Team leaders can update their teams
CREATE POLICY "Users can update their teams" ON teams
    FOR UPDATE 
    USING (leader_id = auth.uid() OR created_by = auth.uid())
    WITH CHECK (leader_id = auth.uid() OR created_by = auth.uid());

-- DELETE: Team leaders can delete their teams
CREATE POLICY "Users can delete their teams" ON teams
    FOR DELETE 
    USING (leader_id = auth.uid() OR created_by = auth.uid());

-- STEP 5: Ensure team_members policies are correct
-- ============================================================================

-- Verify check_team_membership function exists
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
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;

-- SELECT: Users can view team members of teams they're in
CREATE POLICY "Users can view team members of their teams" ON team_members
    FOR SELECT USING (
        check_team_membership(team_id)
    );

-- INSERT: Allow users to join teams or leaders to add members
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

-- DELETE: Team leaders can remove members, or users can leave teams
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

-- STEP 6: Verify the fix
-- ============================================================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, cmd, policyname;

-- Test query that was failing before
-- SELECT * FROM team_members WHERE user_id = auth.uid();
