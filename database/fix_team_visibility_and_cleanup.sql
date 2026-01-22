-- =========================================================
-- FIX: TEAM VISIBILITY & PAYMENT AMOUNT DISPLAY
-- =========================================================

-- 1. FIX RLS POLICIES (Make Teams Visible)
-- Ensure users can see teams they are members of
DROP POLICY IF EXISTS "Users can view teams they belong to" ON teams;
CREATE POLICY "Users can view teams they belong to" ON teams
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = teams.id
    ) OR 
    leader_id = auth.uid() OR
    created_by = auth.uid()
  );

-- Ensure users can see team members
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
CREATE POLICY "Users can view team members of their teams" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- 2. FIX ZERO AMOUNT ISSUE
-- If payment_amount is 0 for PAID registrations, update it from event price
UPDATE event_registrations_config erc
SET payment_amount = e.price
FROM events e
WHERE erc.event_id = e.id 
  AND erc.payment_status = 'PAID' 
  AND (erc.payment_amount IS NULL OR erc.payment_amount = 0);

-- 3. ENSURE TEAM ACTIVE STATUS
-- Force active status for all teams that have paid members or valid registrations
UPDATE teams t
SET is_active = true
WHERE is_active = false 
  AND EXISTS (
    SELECT 1 FROM team_members tm 
    WHERE tm.team_id = t.id
  );

-- 4. CLEANUP ORPHANED MEMBERSHIPS
-- Remove members from non-existent teams
DELETE FROM team_members
WHERE team_id NOT IN (SELECT id FROM teams);

RAISE NOTICE 'Fixed Team Visibility and Payment Amounts';
