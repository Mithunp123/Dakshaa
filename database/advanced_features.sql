-- Advanced Registration Features

-- 1. Waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'waiting', -- 'waiting', 'promoted', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- 2. Transactions Table (Audit Log)
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

-- 5. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES profiles(id),
    action_type TEXT NOT NULL, -- 'force_add', 'move_user', 'upgrade_combo', 'edit_profile', 'refund', 'promote_waitlist', etc.
    target_user_id UUID REFERENCES profiles(id),
    target_registration_id UUID REFERENCES registrations(id),
    details JSONB, -- Store additional context like old_value, new_value, event_id, etc.
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Update Registrations Table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'online';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS amount_paid DECIMAL DEFAULT 0;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS marked_by UUID REFERENCES profiles(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS is_force_added BOOLEAN DEFAULT false;

-- 6. Update Profiles Table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- 7. Modify Capacity Check Trigger to allow Force Add
CREATE OR REPLACE FUNCTION check_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_capacity INTEGER;
BEGIN
    -- If force added, bypass capacity check
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

-- 8. RLS Policies for new tables

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Waitlist: Users can see their own, Admins see all
CREATE POLICY "Users can view their own waitlist" ON waitlist
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage waitlist" ON waitlist
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Admin Logs: Admins can view all logs
CREATE POLICY "Admins can view logs" ON admin_logs
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));
CREATE POLICY "Admins can insert logs" ON admin_logs
    FOR INSERT WITH CHECK (get_user_role() IN ('super_admin', 'registration_admin', 'coordinator', 'volunteer'));

-- Transactions: Admins only
CREATE POLICY "Admins can view transactions" ON transactions
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));
CREATE POLICY "Super Admins can manage transactions" ON transactions
    FOR ALL USING (get_user_role() = 'super_admin');

-- Cashier Sessions: Admins only
CREATE POLICY "Admins can manage their own sessions" ON cashier_sessions
    FOR ALL USING (admin_id = auth.uid() OR get_user_role() = 'super_admin');

-- Blacklist: Admins only
CREATE POLICY "Admins can manage blacklist" ON blacklist
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));
