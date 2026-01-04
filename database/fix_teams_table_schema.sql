-- =============================================
-- FIX TEAMS TABLE SCHEMA
-- =============================================
-- This script ensures the teams table has all required columns
-- and fixes any inconsistencies between the code and database
-- =============================================

-- Add missing columns to teams table if they don't exist
DO $$ 
BEGIN
  -- Add team_name column (if using name, create alias or rename)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='team_name') THEN
    -- If 'name' column exists, rename it to 'team_name'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='name') THEN
      ALTER TABLE teams RENAME COLUMN name TO team_name;
      RAISE NOTICE 'Renamed teams.name to teams.team_name';
    ELSE
      -- Create team_name column
      ALTER TABLE teams ADD COLUMN team_name TEXT NOT NULL DEFAULT 'Unnamed Team';
      RAISE NOTICE 'Added teams.team_name column';
    END IF;
  END IF;

  -- Add leader_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='leader_id') THEN
    ALTER TABLE teams ADD COLUMN leader_id UUID REFERENCES profiles(id);
    RAISE NOTICE 'Added teams.leader_id column';
    
    -- Populate leader_id from team_members where role='leader'
    UPDATE teams t
    SET leader_id = tm.user_id
    FROM team_members tm
    WHERE t.id = tm.team_id 
    AND tm.role IN ('leader', 'lead')
    AND t.leader_id IS NULL;
    
    RAISE NOTICE 'Populated leader_id from existing team_members';
  END IF;

  -- Add max_members column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='max_members') THEN
    ALTER TABLE teams ADD COLUMN max_members INTEGER NOT NULL DEFAULT 4;
    RAISE NOTICE 'Added teams.max_members column';
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='is_active') THEN
    ALTER TABLE teams ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added teams.is_active column';
  END IF;
  
  RAISE NOTICE '✅ Teams table columns added successfully!';
END $$;

-- Create index on leader_id for faster queries
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_active ON teams(is_active);

-- Update existing teams to ensure they have leader_id populated
UPDATE teams t
SET leader_id = tm.user_id
FROM team_members tm
WHERE t.id = tm.team_id 
AND tm.role IN ('leader', 'lead')
AND t.leader_id IS NULL;

-- Ensure all active team_members have status='active' (not 'joined')
UPDATE team_members 
SET status = 'active' 
WHERE status = 'joined';

-- Add joined_at column to team_members if it doesn't exist (for better semantics)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='team_members' AND column_name='joined_at') THEN
    ALTER TABLE team_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
    -- Copy created_at to joined_at for existing records
    UPDATE team_members SET joined_at = created_at WHERE joined_at IS NULL;
    RAISE NOTICE 'Added team_members.joined_at column';
  END IF;
END $$;
