-- =====================================================
-- AUTOMATIC PROFILE CREATION ON USER SIGNUP
-- =====================================================
-- This trigger automatically creates a profile entry when a new user signs up
-- It extracts user metadata from auth.users and populates the profiles table

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    gender,
    college_name,
    department,
    year_of_study,
    roll_number,
    mobile_number,
    referred_by,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'gender', ''),
    COALESCE(NEW.raw_user_meta_data->>'college_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'year_of_study', ''),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'referred_by', ''), ''),
    'student', -- Default role
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the trigger is created:
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This trigger runs automatically when a user signs up via Supabase Auth
-- 2. It extracts user data from raw_user_meta_data (passed in signUp options.data)
-- 3. All fields default to empty string if not provided
-- 4. The email field is stored in the profiles table for easy access
-- 5. Default role is 'student' - can be changed by admins later
