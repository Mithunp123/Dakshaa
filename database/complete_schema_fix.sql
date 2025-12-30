-- =====================================================
-- COMPLETE SUPABASE SCHEMA FOR DAKSHAA WEB
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  mobile_number TEXT,
  college TEXT,
  department TEXT,
  year_of_study TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS_CONFIG TABLE (Main events table used by app)
CREATE TABLE IF NOT EXISTS events_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  max_registrations INTEGER,
  current_registrations INTEGER DEFAULT 0,
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  rules TEXT[],
  team_size INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMBOS TABLE
CREATE TABLE IF NOT EXISTS combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_name TEXT NOT NULL,
  name TEXT,
  description TEXT,
  total_price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  discount_percentage INTEGER,
  event_ids UUID[],
  events JSONB,
  category_quotas JSONB,
  max_purchases INTEGER,
  current_purchases INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENT_REGISTRATIONS_CONFIG TABLE (Main registrations table)
CREATE TABLE IF NOT EXISTS event_registrations_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events_config(id) ON DELETE SET NULL,
  combo_id UUID REFERENCES combos(id) ON DELETE SET NULL,
  payment_status TEXT DEFAULT 'PAID',
  payment_id TEXT,
  payment_amount DECIMAL(10,2),
  registration_type TEXT DEFAULT 'individual',
  team_id UUID,
  qr_code_string TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  event_id UUID REFERENCES events_config(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEAM_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADMIN_NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USER_NOTIFICATIONS TABLE (For user confirmations)
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'GENERAL',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow read profiles" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Events policies
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events_config;
CREATE POLICY "Events are viewable by everyone" ON events_config FOR SELECT USING (true);

-- Combos policies
DROP POLICY IF EXISTS "Combos are viewable by everyone" ON combos;
CREATE POLICY "Combos are viewable by everyone" ON combos FOR SELECT USING (true);

-- Registrations policies
DROP POLICY IF EXISTS "Users can view own registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Users can insert registrations" ON event_registrations_config;
DROP POLICY IF EXISTS "Allow read registrations" ON event_registrations_config;

CREATE POLICY "Users can view own registrations" ON event_registrations_config 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert registrations" ON event_registrations_config 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow read registrations" ON event_registrations_config 
  FOR SELECT USING (true);

-- Teams policies
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Team members policies
DROP POLICY IF EXISTS "Team members are viewable" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
CREATE POLICY "Team members are viewable" ON team_members FOR SELECT USING (true);
CREATE POLICY "Users can join teams" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin notifications policies
DROP POLICY IF EXISTS "Admin notifications are viewable" ON admin_notifications;
DROP POLICY IF EXISTS "Allow insert admin notifications" ON admin_notifications;
CREATE POLICY "Admin notifications are viewable" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert admin notifications" ON admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update admin notifications" ON admin_notifications FOR UPDATE USING (true);

-- User notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Allow insert user notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
CREATE POLICY "Users can view own notifications" ON user_notifications 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert user notifications" ON user_notifications 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON user_notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON event_registrations_config(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations_config(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON event_registrations_config(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);

-- =====================================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample Events
INSERT INTO events_config (event_name, description, category, price, venue, is_active) VALUES
('Tech Workshop', 'Learn latest technologies', 'WORKSHOP', 299, 'Hall A', true),
('Coding Challenge', 'Competitive programming contest', 'COMPETITION', 199, 'Lab 1', true),
('Startup Pitch', 'Present your startup ideas', 'STARTUP', 0, 'Auditorium', true),
('AI Summit', 'Artificial Intelligence conference', 'CONFERENCE', 499, 'Main Hall', true),
('Hackathon', '24-hour coding marathon', 'HACKATHON', 399, 'Tech Center', true)
ON CONFLICT DO NOTHING;

-- Sample Combos
INSERT INTO combos (combo_name, name, description, total_price, original_price, discount_percentage, is_active) VALUES
('Tech Bundle', 'Tech Bundle', 'Workshop + Coding Challenge', 399, 498, 20, true),
('All Access Pass', 'All Access Pass', 'Access to all events', 999, 1396, 28, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! Your database is ready.
-- =====================================================
