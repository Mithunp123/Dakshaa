-- ============================================
-- MASTER ADMIN PROTECTION
-- Only user with ID 105f3289-bfc5-467f-8cd0-49ff9c8f7082 can assign super_admin role
-- ============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Only master admin can assign super_admin" ON profiles;

-- Create policy to restrict super_admin role assignment
CREATE POLICY "Only master admin can assign super_admin" 
ON profiles
FOR UPDATE
USING (
  CASE 
    -- If trying to set role to super_admin
    WHEN (SELECT role FROM profiles WHERE id = profiles.id) = 'super_admin' 
      OR NEW.role = 'super_admin' 
    THEN 
      -- Only allow if current user is the master admin
      auth.uid() = '105f3289-bfc5-467f-8cd0-49ff9c8f7082'::uuid
    ELSE 
      -- Allow other role changes if user is super_admin
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  END
);

-- Add check constraint to prevent direct SQL modification
DO $$
BEGIN
  -- Drop constraint if it exists
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS master_admin_only_super_admin;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create function to validate super admin assignment
CREATE OR REPLACE FUNCTION validate_super_admin_assignment()
RETURNS TRIGGER AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();

  -- If trying to assign super_admin role
  IF NEW.role = 'super_admin' AND OLD.role != 'super_admin' THEN
    -- Only master admin can do this
    IF auth.uid() != '105f3289-bfc5-467f-8cd0-49ff9c8f7082'::uuid THEN
      RAISE EXCEPTION 'Only Master Admin can assign Super Admin roles';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS enforce_master_admin_super_admin_assignment ON profiles;

-- Create trigger
CREATE TRIGGER enforce_master_admin_super_admin_assignment
  BEFORE UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_super_admin_assignment();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_super_admin_assignment() TO authenticated;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the protection is working:
--
-- SELECT id, full_name, email, role 
-- FROM profiles 
-- WHERE role = 'super_admin'
-- ORDER BY created_at;
--
-- Try to update a user to super_admin (should fail unless you're master admin):
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'test@example.com';
-- ============================================
