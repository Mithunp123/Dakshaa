-- Fix Infinite Recursion in Teams RLS Policy
-- Issue: "infinite recursion detected in policy for relation teams"
-- This happens when teams policy references team_members, which references teams

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Users can view teams they are members of" ON teams;

-- Step 2: Create security definer function for team visibility
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create new policy using the security definer function
CREATE POLICY "Users can view teams they are members of" ON teams
    FOR SELECT USING (
        user_can_view_team(id, auth.uid())
    );

-- Step 4: Also allow public read for team names (optional)
-- This allows viewing team names without being a member
-- Comment out if you want teams to be private
CREATE POLICY "Public can view team names" ON teams
    FOR SELECT USING (true);

-- If you want teams private, drop the public policy:
-- DROP POLICY IF EXISTS "Public can view team names" ON teams;

-- Step 5: Verify policies
-- Run this to check current policies on teams table:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename = 'teams';
