-- =====================================================
-- ADD EMAIL COLUMN TO PROFILES TABLE
-- =====================================================
-- This adds an email column to profiles for easier access
-- (instead of always joining with auth.users)

-- Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles to populate email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to check if the column was added:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name = 'email';
