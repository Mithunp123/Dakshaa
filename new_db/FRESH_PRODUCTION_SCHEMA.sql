-- ============================================================
-- DAKSHAA EVENT MANAGEMENT - FRESH PRODUCTION SCHEMA
-- Based on actual production data from new_db folder
-- Date: January 4, 2026
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (User Management)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    college_name TEXT NOT NULL,
    department TEXT,
    year_of_study TEXT CHECK (year_of_study IN ('I Year', 'II Year', 'III Year', 'IV Year', 'V Year')),
    roll_number TEXT,
    roll_no TEXT, -- Legacy field
    mobile_number TEXT NOT NULL,
    email TEXT, -- User email for reference
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'volunteer', 'event_coordinator', 'registration_admin', 'super_admin')),
    referral_count INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 2. EVENTS TABLE (Event Catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL, -- Unique identifier like 'tech-cse', 'workshop-aiml'
    event_key TEXT, -- Legacy/alternative key
    name TEXT NOT NULL, -- Display name like 'CSE Technical Quiz'
    title TEXT, -- Alternative title
    event_name TEXT, -- Legacy name field
    description TEXT,
    venue TEXT,
    category TEXT NOT NULL CHECK (category IN ('technical', 'non-technical', 'workshop', 'cultural', 'hackathon', 'conference')),
    event_type TEXT CHECK (event_type IN ('competition', 'workshop', 'session', 'cultural')),
    type TEXT, -- Legacy type field
    price TEXT NOT NULL DEFAULT '0', -- Stored as TEXT in production (e.g., '100', '350')
    capacity TEXT NOT NULL DEFAULT '100',
    current_registrations TEXT DEFAULT '0',
    max_registrations TEXT, -- Max allowed registrations
    
    -- Team Event Configuration
    is_team_event TEXT DEFAULT 'false', -- 'true' or 'false' as TEXT
    min_team_size TEXT DEFAULT '1',
    max_team_size TEXT DEFAULT '1',
    
    -- Status Fields
    is_open TEXT DEFAULT 'true',
    is_active TEXT DEFAULT 'true',
    current_status TEXT DEFAULT 'upcoming' CHECK (current_status IN ('upcoming', 'ongoing', 'completed', 'cancelled', 'delayed')),
    
    -- Date/Time Fields
    registration_deadline TIMESTAMP WITH TIME ZONE,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    
    -- Coordinator Info
    coordinator_name TEXT,
    coordinator_contact TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 3. EVENT_REGISTRATIONS_CONFIG TABLE (Individual Registrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_registrations_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_name TEXT, -- Denormalized for quick access
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount NUMERIC(10, 2),
    transaction_id TEXT, -- Unique payment transaction ID
    combo_purchase_id UUID, -- Links to combo_purchases if from combo
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- ============================================================
-- 4. COMBOS TABLE (Package Offers)
-- ============================================================
CREATE TABLE IF NOT EXISTS combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price TEXT NOT NULL DEFAULT '0',
    original_price TEXT,
    discount_percentage TEXT DEFAULT '0',
    category_quotas JSONB DEFAULT '{}', -- e.g., {"Technical": 1, "Non-Technical": 1}
    total_events_required INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    max_purchases INTEGER DEFAULT 100,
    current_purchases INTEGER DEFAULT 0,
    badge_text TEXT,
    badge_color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- 5. COMBO_PURCHASES TABLE (Combo Purchase Records)
-- ============================================================
CREATE TABLE IF NOT EXISTS combo_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    selected_event_ids JSONB, -- Array of selected event IDs
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount TEXT,
    transaction_id TEXT UNIQUE,
    explosion_completed BOOLEAN DEFAULT false, -- True when converted to individual registrations
    individual_registration_ids UUID[], -- Array of created registration IDs
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 6. COMBO_EVENT_SELECTIONS TABLE (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS combo_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_purchase_id UUID NOT NULL REFERENCES combo_purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- Event category selected
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 7. TEAMS TABLE (Team Management)
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id),
    max_members INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 8. TEAM_MEMBERS TABLE (Team Membership)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    status TEXT DEFAULT 'joined' CHECK (status IN ('invited', 'joined', 'left')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(team_id, user_id)
);

-- ============================================================
-- 9. TEAM_INVITATIONS TABLE (Team Invite System)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(team_id, invitee_id)
);

-- ============================================================
-- 10. TEAM_JOIN_REQUESTS TABLE (Join Request System)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES profiles(id),
    
    UNIQUE(team_id, user_id)
);

-- ============================================================
-- 11. ATTENDANCE TABLE (Event Check-in)
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- event_id (text format like 'tech-cse')
    marked_by UUID REFERENCES profiles(id), -- Coordinator who marked attendance
    morning_attended BOOLEAN DEFAULT false,
    evening_attended BOOLEAN DEFAULT false,
    morning_time TIMESTAMP WITH TIME ZONE,
    evening_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, event_id)
);

-- ============================================================
-- 12. EVENT_COORDINATORS TABLE (Coordinator Assignments)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- event_id (text format)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id, event_id)
);

-- ============================================================
-- 13. ADMIN_LOGS TABLE (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('role_change', 'event_update', 'user_block', 'registration_update', 'payment_update')),
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_registration_id UUID REFERENCES event_registrations_config(id) ON DELETE SET NULL,
    details JSONB, -- JSON object with action details
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 14. ADMIN_NOTIFICATIONS TABLE (Admin Alerts)
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('NEW_REGISTRATION', 'NEW_COMBO_REGISTRATION', 'NEW_TEAM_REGISTRATION', 'PAYMENT_RECEIVED', 'USER_REGISTRATION_CONFIRMATION')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional data
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 15. NOTIFICATIONS TABLE (User Notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('team_invitation', 'registration_confirmation', 'payment_update', 'event_update', 'system')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 16. USER_NOTIFICATIONS TABLE (User-Specific Notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- 17. NOTIFICATION_QUEUE TABLE (Notification Processing Queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================
-- 18. ACCOMMODATION_REQUESTS TABLE (Housing Bookings)
-- ============================================================
CREATE TABLE IF NOT EXISTS accommodation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    march_28_accommodation BOOLEAN DEFAULT false,
    number_of_days TEXT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_id TEXT,
    special_requests TEXT,
    room_no TEXT,
    check_in_status BOOLEAN DEFAULT false,
    check_in_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id)
);

-- ============================================================
-- 19. LUNCH_BOOKINGS TABLE (Meal Reservations)
-- ============================================================
CREATE TABLE IF NOT EXISTS lunch_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    march_28_lunch BOOLEAN DEFAULT false,
    march_29_lunch BOOLEAN DEFAULT false,
    total_lunches TEXT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    UNIQUE(user_id)
);

-- ============================================================
-- 20. FEEDBACK TABLE (User Feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email_id TEXT NOT NULL,
    rating TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Event Indexes
CREATE INDEX IF NOT EXISTS idx_events_event_id ON events(event_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_current_status ON events(current_status);

-- Registration Indexes
CREATE INDEX IF NOT EXISTS idx_event_reg_user_id ON event_registrations_config(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_event_id ON event_registrations_config(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_payment_status ON event_registrations_config(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_reg_transaction_id ON event_registrations_config(transaction_id);

-- Team Indexes
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);

-- Notification Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);

-- Attendance Index
CREATE INDEX IF NOT EXISTS idx_attendance_user_event ON attendance(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);

-- Combo Indexes
CREATE INDEX IF NOT EXISTS idx_combo_purchases_user_id ON combo_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_combo_id ON combo_purchases(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_payment_status ON combo_purchases(payment_status);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lunch_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is event coordinator
CREATE OR REPLACE FUNCTION is_event_coordinator(event_text_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM event_coordinators 
        WHERE user_id = auth.uid() 
        AND event_id = event_text_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is team leader
CREATE OR REPLACE FUNCTION is_team_leader(p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM teams 
        WHERE id = p_team_id 
        AND leader_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Profiles: Users can view/edit their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Events: Public read access for active events
DROP POLICY IF EXISTS "Public can view active events" ON events;
CREATE POLICY "Public can view active events" ON events
    FOR SELECT USING (is_active = 'true');

-- Event Registrations: Users can view their own registrations
DROP POLICY IF EXISTS "Users can view their own registrations" ON event_registrations_config;
CREATE POLICY "Users can view their own registrations" ON event_registrations_config
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own registrations" ON event_registrations_config;
CREATE POLICY "Users can insert their own registrations" ON event_registrations_config
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Combos: Public read access
DROP POLICY IF EXISTS "Public can view active combos" ON combos;
CREATE POLICY "Public can view active combos" ON combos
    FOR SELECT USING (is_active = true);

-- Teams: Users can view teams they're members of
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
CREATE POLICY "Users can view their teams" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = teams.id 
            AND team_members.user_id = auth.uid()
        )
    );

-- Notifications: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies for staff
DROP POLICY IF EXISTS "Staff can view all registrations" ON event_registrations_config;
CREATE POLICY "Staff can view all registrations" ON event_registrations_config
    FOR SELECT USING (
        get_user_role() IN ('super_admin', 'registration_admin')
    );

DROP POLICY IF EXISTS "Admins can manage events" ON events;
CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (get_user_role() = 'super_admin');

-- ============================================================
-- EVENT REGISTRATION TRIGGERS
-- ============================================================

-- Trigger to send admin notification on new registration
CREATE OR REPLACE FUNCTION notify_admin_new_registration()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name TEXT;
    v_user_email TEXT;
    v_event_name TEXT;
BEGIN
    -- Get user details
    SELECT full_name, email INTO v_user_name, v_user_email
    FROM profiles WHERE id = NEW.user_id;
    
    -- Get event name
    SELECT name INTO v_event_name
    FROM events WHERE id = NEW.event_id;
    
    -- Insert admin notification
    INSERT INTO admin_notifications (type, title, message, data)
    VALUES (
        'NEW_REGISTRATION',
        'New Event Registration',
        v_user_name || ' registered for: ' || v_event_name,
        jsonb_build_object(
            'user_id', NEW.user_id,
            'user_name', v_user_name,
            'user_email', v_user_email,
            'event_id', NEW.event_id,
            'event_name', v_event_name,
            'payment_status', NEW.payment_status,
            'registered_at', NEW.registered_at
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_admin_registration ON event_registrations_config;
CREATE TRIGGER trigger_notify_admin_registration
    AFTER INSERT ON event_registrations_config
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_new_registration();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_combos_updated_at ON combos;
CREATE TRIGGER update_combos_updated_at
    BEFORE UPDATE ON combos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMPLETION MESSAGE
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Fresh Production Schema Created Successfully!';
    RAISE NOTICE '📊 20 Tables Created';
    RAISE NOTICE '🔒 RLS Enabled on All Tables';
    RAISE NOTICE '🎯 Indexes Created for Performance';
    RAISE NOTICE '🔔 Notification Triggers Configured';
    RAISE NOTICE '👥 Ready for Event Registration System';
END $$;
