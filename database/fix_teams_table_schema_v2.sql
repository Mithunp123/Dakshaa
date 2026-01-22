-- =====================================================
-- ADD MISSING COLUMNS TO TEAMS TABLE
-- =====================================================
-- Ideally the teams table should support the fields used by the backend.
-- This script safely adds columns if they are missing.

DO $$
BEGIN
    -- Add leader_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'leader_id') THEN
        ALTER TABLE teams ADD COLUMN leader_id UUID REFERENCES auth.users(id);
    END IF;

    -- Add created_by if missing (it seemed to be in schema but maybe not in real db)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'created_by') THEN
        ALTER TABLE teams ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add team_name if 'name' exists but 'team_name' does not (Backend uses team_name)
    -- We can alias it or add a generated column, or just add the column.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'team_name') THEN
        ALTER TABLE teams ADD COLUMN team_name TEXT;
        -- Attempt to backfill from 'name' if exists
        BEGIN
            UPDATE teams SET team_name = name WHERE team_name IS NULL;
        EXCEPTION WHEN OTHERS THEN 
            NULL; -- Ignore if 'name' doesn't exist
        END;
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'is_active') THEN
        ALTER TABLE teams ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;

    -- Add max_members if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'max_members') THEN
        ALTER TABLE teams ADD COLUMN max_members INTEGER DEFAULT 5;
    END IF;

END $$;
