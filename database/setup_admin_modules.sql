-- =====================================================
-- DAKSHAA ADMIN MODULES - COMPLETE DATABASE SETUP
-- =====================================================
-- Run this script in Supabase SQL Editor
-- This will set up all tables needed for advanced admin features
-- =====================================================

-- Step 1: Create get_user_role() function (required for RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADVANCED ADMIN TABLES
-- =====================================================

-- 1. Waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'promoted', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- 2. Transactions Table (Audit Log for Payments)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL, -- 'payment', 'refund', 'adjustment'
    method TEXT NOT NULL, -- 'cash', 'online'
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
    provider_id TEXT, -- Razorpay Payment ID / Transaction ID
    notes TEXT,
    marked_by UUID REFERENCES profiles(id), -- Admin who processed it
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Cashier Sessions
CREATE TABLE IF NOT EXISTS cashier_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    opening_balance DECIMAL DEFAULT 0,
    expected_cash DECIMAL DEFAULT 0,
    actual_cash DECIMAL,
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'verified'
    verified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Blacklist Table
CREATE TABLE IF NOT EXISTS blacklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    reason TEXT,
    blocked_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Admin Activity Logs Table (NEW - Core Feature)
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL, 
    -- Supported actions: 'force_add', 'move_user', 'upgrade_combo', 
    -- 'edit_profile', 'initiate_refund', 'promote_waitlist', 'bulk_email'
    target_user_id UUID REFERENCES profiles(id),
    target_registration_id UUID REFERENCES registrations(id),
    details JSONB, -- Store additional context like old_value, new_value, event_id, etc.
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =====================================================
-- UPDATE EXISTING TABLES
-- =====================================================

-- Add new columns to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'online';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS amount_paid DECIMAL DEFAULT 0;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS is_force_added BOOLEAN DEFAULT false;

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- =====================================================
-- UPDATE TRIGGER FOR FORCE ADD
-- =====================================================

-- Recreate capacity check trigger to allow force adding
DROP TRIGGER IF EXISTS trg_check_capacity ON registrations;

CREATE OR REPLACE FUNCTION check_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity INTEGER;
BEGIN
    -- If force added by admin, bypass capacity check
    IF NEW.is_force_added = true THEN
        RETURN NEW;
    END IF;

    -- Get current registration count for the event
    SELECT COUNT(*) INTO current_count FROM registrations WHERE event_id = NEW.event_id;
    
    -- Get capacity for the event
    SELECT capacity INTO max_capacity FROM events WHERE event_id = NEW.event_id;
    
    IF current_count >= max_capacity THEN
        RAISE EXCEPTION 'Event capacity reached';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_capacity
BEFORE INSERT ON registrations
FOR EACH ROW
EXECUTE FUNCTION check_capacity();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own waitlist" ON waitlist;
DROP POLICY IF EXISTS "Admins can manage waitlist" ON waitlist;
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins can view transactions" ON transactions;
DROP POLICY IF EXISTS "Super Admins can manage transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage their own sessions" ON cashier_sessions;
DROP POLICY IF EXISTS "Super Admins can manage blacklist" ON blacklist;

-- Waitlist Policies
CREATE POLICY "Users can view their own waitlist" ON waitlist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage waitlist" ON waitlist
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Admin Logs Policies
CREATE POLICY "Admins can view logs" ON admin_logs
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (get_user_role() IN ('super_admin', 'registration_admin', 'event_coordinator', 'volunteer'));

-- Transactions Policies
CREATE POLICY "Admins can view transactions" ON transactions
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Super Admins can manage transactions" ON transactions
    FOR ALL USING (get_user_role() = 'super_admin');

-- Cashier Sessions Policies
CREATE POLICY "Admins can manage their own sessions" ON cashier_sessions
    FOR ALL USING (admin_id = auth.uid() OR get_user_role() = 'super_admin');

-- Blacklist Policies
CREATE POLICY "Super Admins can manage blacklist" ON blacklist
    FOR ALL USING (get_user_role() = 'super_admin');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Waitlist indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_user ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_event ON waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Admin Logs indexes
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);

-- Transactions indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reg ON transactions(registration_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_mode ON registrations(payment_mode);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify everything is set up correctly:

-- Check if all tables exist
DO $$
BEGIN
    RAISE NOTICE '=== Verifying Tables ===';
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'waitlist') THEN
        RAISE NOTICE '✓ waitlist table exists';
    ELSE
        RAISE NOTICE '✗ waitlist table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_logs') THEN
        RAISE NOTICE '✓ admin_logs table exists';
    ELSE
        RAISE NOTICE '✗ admin_logs table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        RAISE NOTICE '✓ transactions table exists';
    ELSE
        RAISE NOTICE '✗ transactions table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cashier_sessions') THEN
        RAISE NOTICE '✓ cashier_sessions table exists';
    ELSE
        RAISE NOTICE '✗ cashier_sessions table missing';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blacklist') THEN
        RAISE NOTICE '✓ blacklist table exists';
    ELSE
        RAISE NOTICE '✗ blacklist table missing';
    END IF;
    
    RAISE NOTICE '=== Verification Complete ===';
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETE!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Created/Updated:';
    RAISE NOTICE '  ✓ 5 new tables (waitlist, transactions, cashier_sessions, blacklist, admin_logs)';
    RAISE NOTICE '  ✓ Updated registrations table with new columns';
    RAISE NOTICE '  ✓ Updated profiles table with new columns';
    RAISE NOTICE '  ✓ Modified capacity check trigger for force add';
    RAISE NOTICE '  ✓ Configured RLS policies for security';
    RAISE NOTICE '  ✓ Added performance indexes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Make sure you have a super_admin user';
    RAISE NOTICE '  2. Login to /admin in your app';
    RAISE NOTICE '  3. Test the new admin modules';
    RAISE NOTICE '================================================';
END $$;
