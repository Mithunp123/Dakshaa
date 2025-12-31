-- ============================================================
-- DATABASE SCHEMA FOR THREE NEW MODULES
-- 1. Accommodation Management
-- 2. Referral System
-- 3. Live Event Status Board
-- ============================================================

-- ============================================================
-- 1. ACCOMMODATION MANAGEMENT MODULE
-- ============================================================

-- Create accommodation table
CREATE TABLE IF NOT EXISTS accommodation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  payment_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT,
  transaction_id TEXT,
  check_in_status BOOLEAN DEFAULT false,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  room_no TEXT,
  days_booked INTEGER DEFAULT 1,
  total_amount DECIMAL(10, 2),
  special_requests TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_accommodation_user_id ON accommodation(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_payment_status ON accommodation(payment_status);
CREATE INDEX IF NOT EXISTS idx_accommodation_room_no ON accommodation(room_no);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_accommodation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_accommodation_updated_at
BEFORE UPDATE ON accommodation
FOR EACH ROW
EXECUTE FUNCTION update_accommodation_updated_at();

-- Enable RLS
ALTER TABLE accommodation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own accommodation"
  ON accommodation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own accommodation booking"
  ON accommodation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all accommodation"
  ON accommodation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'registration_admin')
    )
  );

CREATE POLICY "Admins can update accommodation"
  ON accommodation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'registration_admin', 'volunteer')
    )
  );

-- ============================================================
-- 2. REFERRAL MANAGEMENT SYSTEM
-- ============================================================

-- Add referred_by column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

-- Create index for faster referral queries
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Function to increment referral count
CREATE OR REPLACE FUNCTION increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by != '' THEN
    -- Increment the referral count for the referrer
    UPDATE profiles
    SET referral_count = referral_count + 1
    WHERE roll_no = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment referral count
CREATE TRIGGER trigger_increment_referral_count
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION increment_referral_count();

-- ============================================================
-- 3. LIVE EVENT STATUS BOARD
-- ============================================================

-- Add current_status column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'scheduled' 
  CHECK (current_status IN ('scheduled', 'live', 'delayed', 'ended')),
ADD COLUMN IF NOT EXISTS venue TEXT,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general' CHECK (type IN ('general', 'urgent', 'success', 'warning')),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create index for active announcements
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Anyone can view active announcements"
  ON announcements FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can create announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'coordinator')
    )
  );

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'coordinator')
    )
  );

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'coordinator')
    )
  );

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check if tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM (
  VALUES 
    ('accommodation'),
    ('announcements')
) AS tables(table_name);

-- Check new columns in existing tables
SELECT 
  column_name,
  table_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'profiles' AND column_name IN ('referred_by', 'referral_count'))
    OR (table_name = 'events' AND column_name IN ('current_status', 'venue', 'start_time', 'end_time'))
  )
ORDER BY table_name, column_name;

-- Show RLS policies count
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('accommodation', 'announcements')
GROUP BY schemaname, tablename;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✓ Database schema for Accommodation, Referral, and Live Status modules created successfully!';
END $$;
