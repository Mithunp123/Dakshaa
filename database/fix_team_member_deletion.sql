-- =============================================
-- FIX TEAM MEMBER DELETION ISSUE
-- =============================================
-- This script fixes the cascade delete issue where deleting a team member
-- was also deleting the team. It also prevents member removal entirely.
-- =============================================

-- First, drop the existing foreign key constraint on team_id
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the foreign key constraint name for team_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'team_members' 
        AND kcu.column_name = 'team_id'
        AND tc.constraint_type = 'FOREIGN KEY';

    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE team_members DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Add new foreign key with RESTRICT (prevents deletion if members exist)
ALTER TABLE team_members 
    ADD CONSTRAINT team_members_team_id_fkey 
    FOREIGN KEY (team_id) 
    REFERENCES teams(id) 
    ON DELETE RESTRICT;

-- Drop the existing DELETE policy that allows leaders to delete members
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;

-- Create new policies that prevent deletion
CREATE POLICY "Team leaders can view their team members" 
  ON team_members FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.leader_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can update member status" 
  ON team_members FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = team_members.team_id 
      AND teams.leader_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams" 
  ON team_members FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Remove any existing DELETE policies
DROP POLICY IF EXISTS "Allow member deletion" ON team_members;
DROP POLICY IF EXISTS "Team leaders can delete members" ON team_members;

-- Update removeTeamMember function to only mark as inactive instead of deleting
CREATE OR REPLACE FUNCTION mark_member_inactive(p_team_id UUID, p_user_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_team_leader UUID;
BEGIN
  -- Get team leader
  SELECT leader_id INTO v_team_leader
  FROM teams
  WHERE id = p_team_id;

  -- Check if caller is team leader
  IF v_team_leader != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Only team leader can remove members'
    );
  END IF;

  -- Check if trying to remove the leader
  IF p_user_id = v_team_leader THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cannot remove team leader'
    );
  END IF;

  -- Mark member as removed (don't delete)
  UPDATE team_members
  SET status = 'removed'
  WHERE team_id = p_team_id 
    AND user_id = p_user_id
    AND role != 'leader';

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Member marked as removed'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_member_inactive(UUID, UUID) TO authenticated;

-- Add constraint to prevent changing leader status
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_leader_cannot_leave;
ALTER TABLE team_members 
  ADD CONSTRAINT team_members_leader_cannot_leave 
  CHECK (NOT (role = 'leader' AND status != 'active'));

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$ 
BEGIN
  RAISE NOTICE '✅ Team member deletion fixed!';
  RAISE NOTICE '🔒 CASCADE DELETE changed to RESTRICT';
  RAISE NOTICE '❌ DELETE policies removed';
  RAISE NOTICE '🔄 Members can only be marked as removed, not deleted';
  RAISE NOTICE '👑 Team leader cannot be removed';
END $$;
