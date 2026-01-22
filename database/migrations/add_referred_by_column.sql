-- ============================================================
-- MIGRATION: Add referred_by column (Simple Storage Only)
-- Date: January 11, 2026
-- Description: Stores the referral roll number as-is, no counting
-- ============================================================

-- Step 1: Add referred_by column to profiles table if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Step 2: Create index for faster referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Step 3: Remove any existing referral count triggers (no aggregation needed)
DROP TRIGGER IF EXISTS trigger_increment_referral_count ON profiles;
DROP FUNCTION IF EXISTS increment_referral_count();

-- Step 4: Update the handle_new_user function to include referred_by
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
    'student',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICATION
-- ============================================================
-- Check if referred_by column exists:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by';

-- Check referral data for a user:
-- SELECT full_name, roll_number, referred_by FROM profiles WHERE referred_by IS NOT NULL;
