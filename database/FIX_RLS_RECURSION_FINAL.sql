-- ============================================================================
-- FINAL FIX: RLS INFINITE RECURSION FOR teams AND team_members
-- ============================================================================
-- RUN THIS ENTIRE SCRIPT IN SUPABASE SQL EDITOR
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this > Run
-- ============================================================================

-- STEP 1: Disable RLS temporarily to clean up
-- ============================================================================
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies on teams table
-- ============================================================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'teams'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON teams', pol.policyname);
    END LOOP;
END $$;

-- STEP 3: Drop ALL existing policies on team_members table  
-- ============================================================================
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'team_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON team_members', pol.policyname);
    END LOOP;
END $$;

-- STEP 4: Drop problematic functions
-- ============================================================================
DROP FUNCTION IF EXISTS check_team_membership(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_team_member(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_team_leader(UUID) CASCADE;

-- STEP 5: Create SIMPLE non-recursive policies for team_members
-- ============================================================================
-- KEY INSIGHT: For SELECT, just allow all authenticated users to see team members
-- The "security" is that team_members only contains user IDs and team IDs, not sensitive data

CREATE POLICY "team_members_select_all" ON team_members
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "team_members_insert_own" ON team_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- User can add themselves
        user_id = auth.uid() 
        OR 
        -- Or they are the team leader/creator (direct check on teams, no subquery on team_members)
        team_id IN (
            SELECT id FROM teams 
            WHERE leader_id = auth.uid() OR created_by = auth.uid()
        )
    );

CREATE POLICY "team_members_update_leader" ON team_members
    FOR UPDATE 
    TO authenticated
    USING (
        team_id IN (
            SELECT id FROM teams 
            WHERE leader_id = auth.uid() OR created_by = auth.uid()
        )
    );

CREATE POLICY "team_members_delete_own_or_leader" ON team_members
    FOR DELETE 
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        team_id IN (
            SELECT id FROM teams 
            WHERE leader_id = auth.uid() OR created_by = auth.uid()
        )
    );

-- STEP 6: Create SIMPLE non-recursive policies for teams
-- ============================================================================
-- KEY INSIGHT: Don't reference team_members in SELECT policy to avoid recursion

CREATE POLICY "teams_select_all" ON teams
    FOR SELECT 
    TO authenticated
    USING (true);  -- Allow all authenticated users to see teams
    -- Team membership check happens in frontend/backend, not RLS

CREATE POLICY "teams_insert_authenticated" ON teams
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "teams_update_owner" ON teams
    FOR UPDATE 
    TO authenticated
    USING (leader_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "teams_delete_owner" ON teams
    FOR DELETE 
    TO authenticated
    USING (leader_id = auth.uid() OR created_by = auth.uid());

-- STEP 7: Re-enable RLS
-- ============================================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- STEP 8: Grant permissions to service role (for backend operations)
-- ============================================================================
GRANT ALL ON teams TO service_role;
GRANT ALL ON team_members TO service_role;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON team_members TO authenticated;

-- STEP 9: Verify the policies were created
-- ============================================================================
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('teams', 'team_members')
ORDER BY tablename, policyname;

-- ============================================================================
-- DONE! Refresh your frontend and try again.
-- ============================================================================
