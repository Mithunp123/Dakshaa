-- =========================================================
-- FIX: "record new has no field updated_at" ERROR
-- =========================================================
-- This error occurs because a trigger (likely 'handle_updated_at') 
-- is trying to update a column 'updated_at' that doesn't exist 
-- on the 'teams' table.
-- =========================================================

-- 1. Add the missing 'updated_at' column to 'teams' table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='updated_at') THEN
    ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    RAISE NOTICE 'Added updated_at column to teams table';
  END IF;
END $$;

-- 2. Ensure the standard Supabase 'handle_updated_at' function exists
-- (This is usually provided by Supabase extensions, but good to ensure)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language plpgsql;

-- 3. Safely drop and recreate the trigger to ensure it's correctly linked
DROP TRIGGER IF EXISTS handle_updated_at ON teams;

CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

RAISE NOTICE 'Teams updated_at trigger configured successfully';

-- 4. Fix any "Ghost" teams that might be stuck in Inactive state due to the previous error
--    Activating teams that have valid members but are marked inactive might be risky, 
--    but useful if payment succeeded but activation failed.
--    (Optional: You can uncomment checks if needed, but manual review is safer)
-- UPDATE teams SET is_active = true WHERE is_active = false AND EXISTS (SELECT 1 FROM team_members WHERE team_id = teams.id);
