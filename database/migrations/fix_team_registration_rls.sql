-- ============================================
-- FIX RLS POLICY FOR TEAM REGISTRATION
-- Allow users to register team members
-- ============================================

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can insert their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can insert registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON registrations;
DROP POLICY IF EXISTS "Users can update registrations" ON registrations;

-- Create simplified policy for INSERT
-- Allows: 1) Self registration, 2) Team registration by authenticated users
CREATE POLICY "Users can insert registrations" 
ON registrations
FOR INSERT 
WITH CHECK (
    -- Allow users to register themselves (individual/combo)
    auth.uid() = user_id
    OR
    -- Allow authenticated users to create team registrations
    -- (team_id will be validated by foreign key constraint)
    (registration_type = 'team' AND auth.uid() IS NOT NULL)
);

-- Create simplified policy for UPDATE
CREATE POLICY "Users can update registrations" 
ON registrations
FOR UPDATE 
USING (
    -- Allow users to update their own registrations
    auth.uid() = user_id
    OR
    -- Allow updates to team registrations by authenticated users
    (registration_type = 'team' AND auth.uid() IS NOT NULL)
);

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Team registration RLS policies updated successfully!';
END $$;
