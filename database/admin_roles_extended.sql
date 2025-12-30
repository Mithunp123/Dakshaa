-- =====================================================
-- EXTENDED ADMIN ROLE FEATURES
-- =====================================================
-- Additional tables and columns for Registration Admin, 
-- Event Coordinator, and Volunteer features
-- =====================================================

-- 1. Attendance Table (for Event Coordinator)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    marked_by UUID REFERENCES profiles(id), -- Coordinator who scanned
    mark_type TEXT DEFAULT 'qr_scan', -- 'qr_scan', 'manual', 'gate_pass'
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- 2. Event Coordinators Assignment Table
CREATE TABLE IF NOT EXISTS event_coordinators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- 3. Winners/Results Table
CREATE TABLE IF NOT EXISTS event_winners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE,
    position INTEGER NOT NULL, -- 1, 2, 3
    marked_by UUID REFERENCES profiles(id), -- Coordinator who selected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, event_id)
);

-- 4. Kit Distribution Table (for Volunteers)
CREATE TABLE IF NOT EXISTS kit_distribution (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    kit_type TEXT NOT NULL, -- 'welcome_kit', 'lunch', 'snacks', 'merchandise'
    delivered_by UUID REFERENCES profiles(id), -- Volunteer who handed it
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, kit_type)
);

-- 5. Venue/Room Information Table
CREATE TABLE IF NOT EXISTS event_venues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id TEXT REFERENCES events(event_id) ON DELETE CASCADE UNIQUE,
    building TEXT NOT NULL,
    room_number TEXT NOT NULL,
    floor INTEGER,
    capacity INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Update profiles table for kit tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kit_delivered BOOLEAN DEFAULT false;

-- 7. Update registrations table for admin approval tracking
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is event coordinator
CREATE OR REPLACE FUNCTION is_event_coordinator(p_event_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM event_coordinators
        WHERE user_id = auth.uid()
        AND event_id = p_event_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin's cash collected today
CREATE OR REPLACE FUNCTION get_admin_cash_today(admin_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_cash DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_cash
    FROM transactions
    WHERE marked_by = admin_uuid
    AND method = 'cash'
    AND status = 'completed'
    AND DATE(created_at) = CURRENT_DATE;
    
    RETURN total_cash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending approvals count
CREATE OR REPLACE FUNCTION get_pending_approvals_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM registrations
    WHERE payment_status = 'pending'
    AND payment_mode = 'cash';
    
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Attendance Policies
DROP POLICY IF EXISTS "Coordinators can manage attendance" ON attendance;
CREATE POLICY "Coordinators can manage attendance" ON attendance
    FOR ALL USING (
        get_user_role() IN ('super_admin', 'event_coordinator') OR
        is_event_coordinator(event_id)
    );

DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (auth.uid() = user_id);

-- Event Coordinators Policies
DROP POLICY IF EXISTS "Admins can manage coordinators" ON event_coordinators;
CREATE POLICY "Admins can manage coordinators" ON event_coordinators
    FOR ALL USING (get_user_role() = 'super_admin');

DROP POLICY IF EXISTS "Coordinators can view assignments" ON event_coordinators;
CREATE POLICY "Coordinators can view assignments" ON event_coordinators
    FOR SELECT USING (auth.uid() = user_id);

-- Winners Policies
DROP POLICY IF EXISTS "Coordinators can manage winners" ON event_winners;
CREATE POLICY "Coordinators can manage winners" ON event_winners
    FOR ALL USING (
        get_user_role() IN ('super_admin', 'event_coordinator')
    );

DROP POLICY IF EXISTS "Public can view winners" ON event_winners;
CREATE POLICY "Public can view winners" ON event_winners
    FOR SELECT USING (true);

-- Kit Distribution Policies
DROP POLICY IF EXISTS "Volunteers can manage kits" ON kit_distribution;
CREATE POLICY "Volunteers can manage kits" ON kit_distribution
    FOR ALL USING (
        get_user_role() IN ('super_admin', 'volunteer', 'event_coordinator')
    );

DROP POLICY IF EXISTS "Users can view own kit status" ON kit_distribution;
CREATE POLICY "Users can view own kit status" ON kit_distribution
    FOR SELECT USING (auth.uid() = user_id);

-- Venue Policies
DROP POLICY IF EXISTS "Everyone can view venues" ON event_venues;
CREATE POLICY "Everyone can view venues" ON event_venues
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage venues" ON event_venues;
CREATE POLICY "Admins can manage venues" ON event_venues
    FOR ALL USING (get_user_role() = 'super_admin');

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_coordinators_event ON event_coordinators(event_id);
CREATE INDEX IF NOT EXISTS idx_coordinators_user ON event_coordinators(user_id);
CREATE INDEX IF NOT EXISTS idx_winners_event ON event_winners(event_id);
CREATE INDEX IF NOT EXISTS idx_kit_user ON kit_distribution(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_mode ON registrations(payment_mode);

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample venue data
INSERT INTO event_venues (event_id, building, room_number, floor, capacity, notes)
VALUES 
    ('paper_presentation', 'CSE Block', '201', 2, 100, 'Seminar Hall with projector'),
    ('project_expo', 'Main Block', 'Auditorium', 1, 300, 'Main auditorium'),
    ('robot_race', 'EEE Block', '204', 2, 50, 'Lab with open space')
ON CONFLICT (event_id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify setup:
-- SELECT * FROM attendance LIMIT 5;
-- SELECT * FROM event_coordinators LIMIT 5;
-- SELECT * FROM event_winners LIMIT 5;
-- SELECT * FROM kit_distribution LIMIT 5;
-- SELECT * FROM event_venues;
