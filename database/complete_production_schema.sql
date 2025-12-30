-- ============================================
-- DaKshaa T26 - COMPLETE PRODUCTION DATABASE SCHEMA
-- All Tables, Functions, Policies & Triggers
-- Run this in Supabase SQL Editor
-- ============================================

-- ==================== STEP 0: ALTER EXISTING TABLES ====================
-- Add missing columns to existing tables

-- Add leader_id to teams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teams' 
        AND column_name = 'leader_id'
    ) THEN
        ALTER TABLE public.teams ADD COLUMN leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add referral_count to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'referral_count'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN referral_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ==================== STEP 1: CREATE ALL TABLES ====================

-- 1. Profiles Table (User Extended Data)
-- CRITICAL: Must be first as other tables reference it
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    gender TEXT,
    college_name TEXT,
    department TEXT,
    year_of_study TEXT,
    roll_no TEXT,
    mobile_number TEXT,
    role TEXT DEFAULT 'student',
    admin_role TEXT CHECK (admin_role IN ('super_admin', 'registration_admin', 'coordinator', 'volunteer')),
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES auth.users(id),
    referral_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Feedback Table (for /feedback page)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    email_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Contact Messages Table (for /contact page)
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Events Configuration Table
CREATE TABLE IF NOT EXISTS public.events_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Technical' CHECK (category IN ('Technical', 'Non-Technical', 'Workshop', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other')),
    price INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('SOLO', 'TEAM')),
    capacity INTEGER NOT NULL DEFAULT 100,
    is_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 5. Event Registrations Table
CREATE TABLE IF NOT EXISTS public.event_registrations_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    team_members JSONB,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER,
    transaction_id TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 6. Accommodation Requests Table
CREATE TABLE IF NOT EXISTS public.accommodation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    college_name TEXT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_days INTEGER NOT NULL,
    include_food BOOLEAN DEFAULT FALSE,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_id TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lunch Bookings Table
CREATE TABLE IF NOT EXISTS public.lunch_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    lunch_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, lunch_date)
);

-- 8. Winners Table (for leaderboard & winners display)
CREATE TABLE IF NOT EXISTS public.winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    position INTEGER NOT NULL CHECK (position >= 1 AND position <= 3),
    prize_amount DECIMAL(10, 2),
    certificate_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, position)
);

-- 9. Referral Tracking Table (for leaderboard)
-- Note: profiles table already has referral_count column
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    referral_code TEXT NOT NULL,
    is_registered BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referred_user_id)
);

-- 10. Team Management Tables (enhanced)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    event_id TEXT NOT NULL,
    leader_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('invited', 'active', 'left')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 11. Combos (Package Bundles)
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category_quotas JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 12. Combo Items
CREATE TABLE IF NOT EXISTS public.combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    category_slot TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combo_id, event_id)
);

-- 13. Combo Purchases
CREATE TABLE IF NOT EXISTS public.combo_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER NOT NULL,
    transaction_id TEXT,
    explosion_completed BOOLEAN DEFAULT FALSE,
    individual_registration_ids JSONB,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, combo_id)
);

-- 14. Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

-- 15. Event Schedule Table
CREATE TABLE IF NOT EXISTS public.event_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    venue TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    is_live BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Admin Logs (Activity Tracking)
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_registration_id UUID,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Payment Transactions (Centralized Payment Tracking)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('event_registration', 'combo_registration', 'accommodation', 'lunch', 'other')),
    reference_id UUID, -- Links to registrations, accommodation_requests, etc.
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('razorpay', 'paytm', 'upi', 'cash', 'other')),
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    transaction_id TEXT UNIQUE,
    payment_gateway_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. QR Codes Table (for attendance tracking)
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- ==================== STEP 2: CREATE INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON public.profiles(admin_role);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_config_key ON public.events_config(event_key);
CREATE INDEX IF NOT EXISTS idx_events_config_active ON public.events_config(is_open);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations_config(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations_config(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment ON public.event_registrations_config(payment_status);
CREATE INDEX IF NOT EXISTS idx_accommodation_user ON public.accommodation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_accommodation_payment ON public.accommodation_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_user ON public.lunch_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_date ON public.lunch_bookings(lunch_date);
CREATE INDEX IF NOT EXISTS idx_winners_event ON public.winners(event_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_combos_active ON public.combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_event ON public.combo_items(event_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_user ON public.combo_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_status ON public.combo_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_teams_event ON public.teams(event_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_event_schedule_time ON public.event_schedule(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payment_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payment_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_data ON public.qr_codes(qr_code_data);

-- ==================== STEP 3: ROW LEVEL SECURITY (RLS) ====================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lunch_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can view open events" ON public.events_config;
DROP POLICY IF EXISTS "Only admins can modify events" ON public.events_config;
DROP POLICY IF EXISTS "Users can view own registrations" ON public.event_registrations_config;
DROP POLICY IF EXISTS "Users can register for events" ON public.event_registrations_config;
DROP POLICY IF EXISTS "Users can view their own accommodation requests" ON public.accommodation_requests;
DROP POLICY IF EXISTS "Users can create accommodation requests" ON public.accommodation_requests;
DROP POLICY IF EXISTS "Admins can view all accommodation requests" ON public.accommodation_requests;
DROP POLICY IF EXISTS "Admins can update accommodation requests" ON public.accommodation_requests;
DROP POLICY IF EXISTS "Users can view their own lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Users can create lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Admins can view all lunch bookings" ON public.lunch_bookings;
DROP POLICY IF EXISTS "Everyone can view winners" ON public.winners;
DROP POLICY IF EXISTS "Coordinators can manage winners" ON public.winners;
DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team leaders can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team leaders can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can view all teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON public.team_members;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Public can view active combos" ON public.combos;
DROP POLICY IF EXISTS "Admins can manage combos" ON public.combos;
DROP POLICY IF EXISTS "Public can view combo items" ON public.combo_items;
DROP POLICY IF EXISTS "Admins can manage combo items" ON public.combo_items;
DROP POLICY IF EXISTS "Users can view own combo purchases" ON public.combo_purchases;
DROP POLICY IF EXISTS "Admins can view all combo purchases" ON public.combo_purchases;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.newsletter_subscriptions;
DROP POLICY IF EXISTS "Everyone can view event schedule" ON public.event_schedule;
DROP POLICY IF EXISTS "Admins can manage event schedule" ON public.event_schedule;
DROP POLICY IF EXISTS "Admins can view admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can create admin logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can update transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can create their own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Volunteers can scan QR codes" ON public.qr_codes;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Feedback Policies (Allow public to insert feedback)
CREATE POLICY "Anyone can submit feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Contact Messages Policies
CREATE POLICY "Anyone can submit contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all contact messages" ON public.contact_messages
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can update contact messages" ON public.contact_messages
    FOR UPDATE USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Events Configuration Policies
CREATE POLICY "Anyone can view open events" ON public.events_config
    FOR SELECT USING (is_open = TRUE OR get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Only admins can modify events" ON public.events_config
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Event Registrations Policies
CREATE POLICY "Users can view own registrations" ON public.event_registrations_config
    FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Users can register for events" ON public.event_registrations_config
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Accommodation Policies
CREATE POLICY "Users can view their own accommodation requests" ON public.accommodation_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create accommodation requests" ON public.accommodation_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all accommodation requests" ON public.accommodation_requests
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can update accommodation requests" ON public.accommodation_requests
    FOR UPDATE USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Lunch Bookings Policies
CREATE POLICY "Users can view their own lunch bookings" ON public.lunch_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create lunch bookings" ON public.lunch_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all lunch bookings" ON public.lunch_bookings
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Winners Policies
CREATE POLICY "Everyone can view winners" ON public.winners
    FOR SELECT USING (true);

CREATE POLICY "Coordinators can manage winners" ON public.winners
    FOR ALL USING (get_user_role() IN ('super_admin', 'event_coordinator'));

-- Referrals Policies
CREATE POLICY "Users can view their referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" ON public.referrals
    FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" ON public.referrals
    FOR SELECT USING (get_user_role() IN ('super_admin'));

-- Teams Policies
CREATE POLICY "Users can view their teams" ON public.teams
    FOR SELECT USING (
        auth.uid() = leader_id OR
        EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid())
    );

CREATE POLICY "Team leaders can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Team leaders can update their teams" ON public.teams
    FOR UPDATE USING (auth.uid() = leader_id);

CREATE POLICY "Admins can view all teams" ON public.teams
    FOR SELECT USING (get_user_role() IN ('super_admin', 'event_coordinator'));

-- Team Members Policies
CREATE POLICY "Users can view team members of their teams" ON public.team_members
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND 
                (leader_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = teams.id AND tm.user_id = auth.uid())))
    );

CREATE POLICY "Team leaders can manage team members" ON public.team_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.teams WHERE id = team_members.team_id AND leader_id = auth.uid())
    );

-- Combo Policies
CREATE POLICY "Public can view active combos" ON public.combos
    FOR SELECT USING (is_active = true OR get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can manage combos" ON public.combos
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Public can view combo items" ON public.combo_items
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage combo items" ON public.combo_items
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Users can view own combo purchases" ON public.combo_purchases
    FOR SELECT USING (user_id = auth.uid() OR get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can view all combo purchases" ON public.combo_purchases
    FOR ALL USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Newsletter Policies
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all subscribers" ON public.newsletter_subscriptions
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Event Schedule Policies
CREATE POLICY "Everyone can view event schedule" ON public.event_schedule
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage event schedule" ON public.event_schedule
    FOR ALL USING (get_user_role() IN ('super_admin', 'event_coordinator'));

-- Admin Logs Policies
CREATE POLICY "Admins can view admin logs" ON public.admin_logs
    FOR SELECT USING (get_user_role() IN ('super_admin'));

CREATE POLICY "Admins can create admin logs" ON public.admin_logs
    FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Payment Transactions Policies
CREATE POLICY "Users can view their own transactions" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
    FOR SELECT USING (get_user_role() IN ('super_admin', 'registration_admin'));

CREATE POLICY "Admins can update transactions" ON public.payment_transactions
    FOR UPDATE USING (get_user_role() IN ('super_admin', 'registration_admin'));

-- Notifications Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- QR Codes Policies
CREATE POLICY "Users can view their own QR codes" ON public.qr_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QR codes" ON public.qr_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Volunteers can scan QR codes" ON public.qr_codes
    FOR SELECT USING (get_user_role() IN ('super_admin', 'volunteer', 'event_coordinator'));

-- ==================== STEP 4: RPC FUNCTIONS ====================

-- Function: Submit Feedback
CREATE OR REPLACE FUNCTION public.submit_feedback(
    p_username TEXT,
    p_email_id TEXT,
    p_rating INTEGER,
    p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_feedback_id UUID;
BEGIN
    INSERT INTO public.feedback (username, email_id, rating, message)
    VALUES (p_username, p_email_id, p_rating, p_message)
    RETURNING id INTO v_feedback_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Feedback submitted successfully',
        'feedback_id', v_feedback_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error submitting feedback: ' || SQLERRM
        );
END;
$$;

-- Function: Submit Contact Message
CREATE OR REPLACE FUNCTION public.submit_contact_message(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_subject TEXT,
    p_message TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO public.contact_messages (name, email, phone, subject, message)
    VALUES (p_name, p_email, p_phone, p_subject, p_message)
    RETURNING id INTO v_message_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Message sent successfully',
        'message_id', v_message_id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error sending message: ' || SQLERRM
        );
END;
$$;

-- Function: Get Leaderboard
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    full_name TEXT,
    department TEXT,
    college_name TEXT,
    referral_count INTEGER,
    rank BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.full_name,
        p.department,
        p.college_name,
        p.referral_count,
        ROW_NUMBER() OVER (ORDER BY p.referral_count DESC) as rank
    FROM public.profiles p
    WHERE p.referral_count > 0
    ORDER BY p.referral_count DESC
    LIMIT p_limit;
$$;

-- Function: Generate QR Code for User
CREATE OR REPLACE FUNCTION public.generate_user_qr_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_qr_data TEXT;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Check if QR code already exists
    SELECT qr_code_data INTO v_qr_data
    FROM public.qr_codes
    WHERE user_id = v_user_id AND is_active = true
    LIMIT 1;
    
    IF v_qr_data IS NOT NULL THEN
        RETURN v_qr_data;
    END IF;
    
    -- Generate new QR code data (user ID)
    v_qr_data := v_user_id::TEXT;
    
    INSERT INTO public.qr_codes (user_id, qr_code_data, is_active)
    VALUES (v_user_id, v_qr_data, true);
    
    RETURN v_qr_data;
END;
$$;

-- ============================================
-- EVENT MANAGEMENT FUNCTIONS
-- ============================================

-- Function: Create Event Configuration
CREATE OR REPLACE FUNCTION public.create_event_config(
    p_event_key TEXT,
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_type TEXT,
    p_capacity INTEGER,
    p_category TEXT DEFAULT 'Technical',
    p_is_open BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_event_id UUID;
BEGIN
    -- Validate inputs
    IF p_event_key IS NULL OR p_event_key = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event key is required'
        );
    END IF;

    IF p_name IS NULL OR p_name = '' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event name is required'
        );
    END IF;

    IF p_type NOT IN ('SOLO', 'TEAM') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Type must be SOLO or TEAM'
        );
    END IF;

    IF p_capacity <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Capacity must be greater than 0'
        );
    END IF;

    -- Check if event_key already exists
    IF EXISTS (SELECT 1 FROM public.events_config WHERE event_key = p_event_key) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event key already exists'
        );
    END IF;

    -- Insert new event
    INSERT INTO public.events_config (
        event_key, name, description, category, price, type, capacity, is_open, created_by
    )
    VALUES (
        p_event_key, p_name, p_description, p_category, p_price, p_type, p_capacity, p_is_open, auth.uid()
    )
    RETURNING id INTO v_new_event_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Event created successfully',
        'event_id', v_new_event_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- Function: Update Event Configuration
CREATE OR REPLACE FUNCTION public.update_event_config(
    p_event_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_type TEXT,
    p_capacity INTEGER,
    p_is_open BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_registrations INTEGER;
BEGIN
    -- Validate event exists
    IF NOT EXISTS (SELECT 1 FROM public.events_config WHERE id = p_event_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event not found'
        );
    END IF;

    -- Get current registrations
    SELECT COUNT(*) INTO v_current_registrations
    FROM public.registrations
    WHERE event_id = p_event_id AND status = 'confirmed';

    -- Check if new capacity is less than current registrations
    IF p_capacity < v_current_registrations THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot reduce capacity below current registrations (' || v_current_registrations || ')'
        );
    END IF;

    -- Validate type
    IF p_type NOT IN ('SOLO', 'TEAM') THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Type must be SOLO or TEAM'
        );
    END IF;

    -- Update event
    UPDATE public.events_config
    SET 
        name = p_name,
        description = p_description,
        price = p_price,
        type = p_type,
        capacity = p_capacity,
        is_open = p_is_open,
        updated_at = now()
    WHERE id = p_event_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Event updated successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- Function: Delete Event Configuration
CREATE OR REPLACE FUNCTION public.delete_event_config(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registration_count INTEGER;
BEGIN
    -- Check if event has registrations
    SELECT COUNT(*) INTO v_registration_count
    FROM public.registrations
    WHERE event_id = p_event_id;

    IF v_registration_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot delete event with existing registrations. Please close the event instead.'
        );
    END IF;

    -- Delete the event
    DELETE FROM public.events_config WHERE id = p_event_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Event deleted successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- Function: Get User Stats for Dashboard
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_registered_events INTEGER;
    v_attended_events INTEGER;
    v_pending_payments INTEGER;
    v_referrals INTEGER;
    v_teams_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    
    -- Count registered events
    SELECT COUNT(*) INTO v_registered_events
    FROM public.registrations
    WHERE user_id = v_user_id;
    
    -- Count attended events
    SELECT COUNT(DISTINCT event_id) INTO v_attended_events
    FROM public.attendance_logs
    WHERE user_id = v_user_id;
    
    -- Count pending payments
    SELECT COUNT(*) INTO v_pending_payments
    FROM public.payment_transactions
    WHERE user_id = v_user_id AND payment_status = 'PENDING';
    
    -- Count referrals
    SELECT referral_count INTO v_referrals
    FROM public.profiles
    WHERE id = v_user_id;
    
    -- Count teams
    SELECT COUNT(*) INTO v_teams_count
    FROM public.team_members
    WHERE user_id = v_user_id AND status = 'active';
    
    RETURN json_build_object(
        'registered_events', COALESCE(v_registered_events, 0),
        'attended_events', COALESCE(v_attended_events, 0),
        'pending_payments', COALESCE(v_pending_payments, 0),
        'referrals', COALESCE(v_referrals, 0),
        'teams_count', COALESCE(v_teams_count, 0)
    );
END;
$$;

-- Function: Create Accommodation Request
CREATE OR REPLACE FUNCTION public.create_accommodation_request(
    p_full_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_college_name TEXT,
    p_check_in_date DATE,
    p_check_out_date DATE,
    p_include_food BOOLEAN,
    p_special_requests TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_number_of_days INTEGER;
    v_total_price DECIMAL(10, 2);
    v_request_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Calculate number of days
    v_number_of_days := p_check_out_date - p_check_in_date;
    
    IF v_number_of_days <= 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid date range'
        );
    END IF;
    
    -- Calculate total price
    IF p_include_food THEN
        v_total_price := v_number_of_days * 450;
    ELSE
        v_total_price := v_number_of_days * 300;
    END IF;
    
    -- Create accommodation request
    INSERT INTO public.accommodation_requests (
        user_id, full_name, email, phone, college_name,
        check_in_date, check_out_date, number_of_days,
        include_food, total_price, special_requests
    )
    VALUES (
        v_user_id, p_full_name, p_email, p_phone, p_college_name,
        p_check_in_date, p_check_out_date, v_number_of_days,
        p_include_food, v_total_price, p_special_requests
    )
    RETURNING id INTO v_request_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Accommodation request created successfully',
        'request_id', v_request_id,
        'total_price', v_total_price
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error creating request: ' || SQLERRM
        );
END;
$$;

-- ==================== STEP 5: TRIGGERS ====================

-- Trigger: Update referral count when new referral is added
CREATE OR REPLACE FUNCTION public.update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET referral_count = referral_count + 1
    WHERE id = NEW.referrer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_referral_count ON public.referrals;
CREATE TRIGGER trg_update_referral_count
    AFTER INSERT ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_referral_count();

-- Trigger: Update accommodation request timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_accommodation_updated_at ON public.accommodation_requests;
CREATE TRIGGER trg_accommodation_updated_at
    BEFORE UPDATE ON public.accommodation_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_teams_updated_at ON public.teams;
CREATE TRIGGER trg_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ==================== STEP 5B: COMBO SYSTEM FUNCTIONS ====================

-- Function: Create Combo
CREATE OR REPLACE FUNCTION public.create_combo(
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_event_ids UUID[],
    p_is_active BOOLEAN DEFAULT TRUE,
    p_category_quotas JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo_id UUID;
    v_event_id UUID;
BEGIN
    -- Validation
    IF p_name IS NULL OR p_name = '' THEN
        RETURN json_build_object('success', false, 'message', 'Combo name is required');
    END IF;

    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    -- Create combo
    INSERT INTO public.combos (name, description, price, is_active, category_quotas, created_by)
    VALUES (p_name, p_description, p_price, p_is_active, p_category_quotas, auth.uid())
    RETURNING id INTO v_combo_id;

    -- Add combo items
    IF p_event_ids IS NOT NULL THEN
        FOREACH v_event_id IN ARRAY p_event_ids
        LOOP
            INSERT INTO public.combo_items (combo_id, event_id)
            VALUES (v_combo_id, v_event_id);
        END LOOP;
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Combo created successfully',
        'combo_id', v_combo_id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- Function: Update Combo
CREATE OR REPLACE FUNCTION public.update_combo(
    p_combo_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_event_ids UUID[],
    p_is_active BOOLEAN,
    p_category_quotas JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    -- Validation
    IF NOT EXISTS (SELECT 1 FROM public.combos WHERE id = p_combo_id) THEN
        RETURN json_build_object('success', false, 'message', 'Combo not found');
    END IF;

    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    -- Update combo
    UPDATE public.combos
    SET name = p_name,
        description = p_description,
        price = p_price,
        is_active = p_is_active,
        category_quotas = p_category_quotas,
        updated_at = NOW()
    WHERE id = p_combo_id;

    -- Remove old combo items
    DELETE FROM public.combo_items WHERE combo_id = p_combo_id;

    -- Add new combo items
    IF p_event_ids IS NOT NULL THEN
        FOREACH v_event_id IN ARRAY p_event_ids
        LOOP
            INSERT INTO public.combo_items (combo_id, event_id)
            VALUES (p_combo_id, v_event_id);
        END LOOP;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Combo updated successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- Function: Delete Combo
CREATE OR REPLACE FUNCTION public.delete_combo(p_combo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.combos WHERE id = p_combo_id;
    RETURN json_build_object('success', true, 'message', 'Combo deleted successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- Function: Toggle Combo Status
CREATE OR REPLACE FUNCTION public.toggle_combo_status(p_combo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status BOOLEAN;
BEGIN
    UPDATE public.combos
    SET is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = p_combo_id
    RETURNING is_active INTO v_new_status;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Combo not found');
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Combo status updated',
        'is_active', v_new_status
    );
END;
$$;

-- Function: Get Combos with Details
CREATE OR REPLACE FUNCTION public.get_combos_with_details()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(
            jsonb_build_object(
                'combo_id', c.id,
                'combo_name', c.name,
                'combo_description', c.description,
                'combo_price', c.price,
                'is_active', c.is_active,
                'category_quotas', c.category_quotas,
                'events', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'event_id', e.id,
                            'event_name', e.name,
                            'event_price', e.price,
                            'event_category', e.category
                        )
                    )
                    FROM public.combo_items ci
                    JOIN public.events_config e ON ci.event_id = e.id
                    WHERE ci.combo_id = c.id
                )
            )
        )
        FROM public.combos c
        ORDER BY c.created_at DESC
    );
END;
$$;

-- ==================== STEP 6: GRANT PERMISSIONS ====================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to anon users for public functions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.event_schedule TO anon;
GRANT SELECT ON public.winners TO anon;
GRANT EXECUTE ON FUNCTION public.submit_feedback TO anon;
GRANT EXECUTE ON FUNCTION public.submit_contact_message TO anon;

-- ==================== COMPLETION MESSAGE ====================

DO $$
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Tables Created: 14';
    RAISE NOTICE 'RPC Functions: 7';
    RAISE NOTICE 'Triggers: 4';
    RAISE NOTICE 'Policies: 30+';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Enable Realtime on required tables';
    RAISE NOTICE '2. Configure Storage buckets';
    RAISE NOTICE '3. Set environment variables';
    RAISE NOTICE '4. Test all API endpoints';
    RAISE NOTICE '====================================';
END $$;
