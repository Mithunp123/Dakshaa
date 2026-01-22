-- ==============================================================================
-- FIX TEAMS TABLE FOREIGN KEY CONSTRAINT & CLEANUP
-- ==============================================================================
-- This script fixes the schema and cleans up invalid data that prevents schema changes.

BEGIN;

-- 1. CLEANUP DEPENDENCIES FIRST (To avoid Foreign Key violations)
-- We need to delete team members for teams that will be deleted in the next steps (invalid Event IDs or Inactive)

-- 1a. Identify teams to be deleted (Invalid UUIDs)
CREATE TEMPORARY TABLE teams_to_delete AS
SELECT id FROM teams 
WHERE event_id IS NOT NULL 
  AND event_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 1b. Delete members of these invalid teams
DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams_to_delete);
DELETE FROM teams WHERE id IN (SELECT id FROM teams_to_delete);
DROP TABLE teams_to_delete;

-- 1c. Cleanup "Inactive" teams (Stuck from failed payments) and their members
-- This clears the "Already registered" state if it was stuck
CREATE TEMPORARY TABLE inactive_teams AS SELECT id FROM teams WHERE is_active = false;
DELETE FROM team_members WHERE team_id IN (SELECT id FROM inactive_teams);
DELETE FROM teams WHERE id IN (SELECT id FROM inactive_teams);
DROP TABLE inactive_teams;

-- 1d. Cleanup Stuck Pending Registrations
DELETE FROM event_registrations_config WHERE payment_status = 'PENDING';


-- 2. SCHEMA UPDATE: FIX TEAMS FOREIGN KEY
-- Now that invalid data is gone, we can safely alter columns

-- Drop existing constraints
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_event_id_fkey;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS fk_teams_event_id;

-- Change column type to UUID
ALTER TABLE teams ALTER COLUMN event_id TYPE UUID USING event_id::UUID;

-- Add correct Foreign Key constraint
ALTER TABLE teams 
ADD CONSTRAINT teams_event_id_fkey 
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;


-- 3. FIX PERMISSIONS (RLS)
-- Allow users to retry/delete their own stuck registrations if they occur again

DROP POLICY IF EXISTS "Users can delete their own event registrations" ON event_registrations_config;
CREATE POLICY "Users can delete their own event registrations" 
ON event_registrations_config FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own event registrations" ON event_registrations_config;
CREATE POLICY "Users can update their own event registrations" 
ON event_registrations_config FOR UPDATE 
USING (auth.uid() = user_id);

COMMIT;

