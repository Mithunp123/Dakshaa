-- ============================================
-- DaKshaa T26 - Event-Based Attendance System
-- ============================================

-- Table: events
-- Stores all events (workshops, sessions, lunch, etc.)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('general_entry', 'workshop', 'lunch', 'session', 'competition')),
    description TEXT,
    venue TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    max_capacity INTEGER,
    requires_registration BOOLEAN DEFAULT TRUE,
    requires_payment BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: registrations
-- Tracks which users registered for which events
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount DECIMAL(10, 2) DEFAULT 0,
    transaction_id TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Table: attendance_logs
-- Records every successful scan (attendance entry)
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    scan_location TEXT,
    UNIQUE(user_id, event_id, timestamp)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_registrations_user_event ON public.registrations(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_event ON public.attendance_logs(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON public.attendance_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_active ON public.events(is_active, event_type);

-- ============================================
-- RPC FUNCTION: verify_and_mark_attendance
-- ============================================
-- This function handles all validation logic in a single secure database call
-- Returns: JSON with status, message, and student data

CREATE OR REPLACE FUNCTION public.verify_and_mark_attendance(
    p_user_id UUID,
    p_event_id UUID,
    p_scanned_by UUID,
    p_scan_location TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_name TEXT;
    v_student_dept TEXT;
    v_student_college TEXT;
    v_student_roll_no TEXT;
    v_event_name TEXT;
    v_requires_registration BOOLEAN;
    v_requires_payment BOOLEAN;
    v_first_entry_time TIMESTAMPTZ;
    v_result JSON;
BEGIN
    -- 1. CHECK: Does the user exist?
    SELECT full_name, department, college_name, roll_no
    INTO v_student_name, v_student_dept, v_student_college, v_student_roll_no
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_student_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User not found',
            'code', 'USER_NOT_FOUND'
        );
    END IF;

    -- 2. CHECK: Does the event exist and is it active?
    SELECT event_name, requires_registration, requires_payment
    INTO v_event_name, v_requires_registration, v_requires_payment
    FROM public.events
    WHERE id = p_event_id AND is_active = TRUE;

    IF v_event_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Event not found or inactive',
            'code', 'EVENT_NOT_FOUND'
        );
    END IF;

    -- 3. CHECK: Is registration required? If yes, verify it
    IF v_requires_registration THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.registrations
            WHERE user_id = p_user_id
            AND event_id = p_event_id
        ) THEN
            RETURN json_build_object(
                'status', 'error',
                'message', 'User not registered for this event',
                'code', 'NOT_REGISTERED',
                'student_name', v_student_name,
                'student_dept', v_student_dept,
                'event_name', v_event_name
            );
        END IF;

        -- 4. CHECK: If payment is required, verify payment status
        IF v_requires_payment THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.registrations
                WHERE user_id = p_user_id
                AND event_id = p_event_id
                AND payment_status = 'PAID'
            ) THEN
                RETURN json_build_object(
                    'status', 'error',
                    'message', 'Payment pending or failed',
                    'code', 'PAYMENT_PENDING',
                    'student_name', v_student_name,
                    'student_dept', v_student_dept,
                    'event_name', v_event_name
                );
            END IF;
        END IF;
    END IF;

    -- 5. CHECK: Duplicate Entry Prevention
    SELECT timestamp INTO v_first_entry_time
    FROM public.attendance_logs
    WHERE user_id = p_user_id
    AND event_id = p_event_id
    ORDER BY timestamp DESC
    LIMIT 1;

    IF v_first_entry_time IS NOT NULL THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', 'Already scanned',
            'code', 'DUPLICATE_ENTRY',
            'student_name', v_student_name,
            'student_dept', v_student_dept,
            'student_roll_no', v_student_roll_no,
            'event_name', v_event_name,
            'first_entry_time', v_first_entry_time
        );
    END IF;

    -- 6. SUCCESS: Log the attendance
    INSERT INTO public.attendance_logs (user_id, event_id, scanned_by, scan_location, timestamp)
    VALUES (p_user_id, p_event_id, p_scanned_by, p_scan_location, NOW());

    -- 7. Return success response with full student details
    RETURN json_build_object(
        'status', 'success',
        'message', 'Access granted',
        'code', 'ACCESS_GRANTED',
        'student_name', v_student_name,
        'student_dept', v_student_dept,
        'student_college', v_student_college,
        'student_roll_no', v_student_roll_no,
        'event_name', v_event_name,
        'timestamp', NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Database error: ' || SQLERRM,
            'code', 'DATABASE_ERROR'
        );
END;
$$;

-- ============================================
-- Helper RPC: Get Active Events for Scanner
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_events_for_scanner()
RETURNS TABLE (
    id UUID,
    event_name TEXT,
    event_type TEXT,
    venue TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    requires_registration BOOLEAN,
    requires_payment BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        id,
        event_name,
        event_type,
        venue,
        start_time,
        end_time,
        requires_registration,
        requires_payment
    FROM public.events
    WHERE is_active = TRUE
    ORDER BY 
        CASE event_type
            WHEN 'general_entry' THEN 1
            WHEN 'session' THEN 2
            WHEN 'workshop' THEN 3
            WHEN 'lunch' THEN 4
            WHEN 'competition' THEN 5
            ELSE 6
        END,
        start_time ASC;
$$;

-- ============================================
-- Helper RPC: Get Attendance Stats
-- ============================================
CREATE OR REPLACE FUNCTION public.get_attendance_stats(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_registered INTEGER;
    v_total_attended INTEGER;
    v_attendance_rate DECIMAL;
    v_result JSON;
BEGIN
    -- Count registered users
    SELECT COUNT(*)
    INTO v_total_registered
    FROM public.registrations
    WHERE event_id = p_event_id
    AND payment_status = 'PAID';

    -- Count actual attendees
    SELECT COUNT(DISTINCT user_id)
    INTO v_total_attended
    FROM public.attendance_logs
    WHERE event_id = p_event_id;

    -- Calculate attendance rate
    IF v_total_registered > 0 THEN
        v_attendance_rate := (v_total_attended::DECIMAL / v_total_registered::DECIMAL) * 100;
    ELSE
        v_attendance_rate := 0;
    END IF;

    RETURN json_build_object(
        'total_registered', v_total_registered,
        'total_attended', v_total_attended,
        'attendance_rate', ROUND(v_attendance_rate, 2),
        'pending', v_total_registered - v_total_attended
    );
END;
$$;

-- ============================================
-- Insert Sample Events
-- ============================================
INSERT INTO public.events (event_name, event_type, description, venue, requires_registration, requires_payment, is_active)
VALUES
    ('Main Hall Entry', 'general_entry', 'General entry to DaKshaa T26 event', 'Main Auditorium', TRUE, TRUE, TRUE),
    ('Lunch Distribution', 'lunch', 'Lunch for registered participants', 'Cafeteria', FALSE, FALSE, TRUE),
    ('AI/ML Workshop', 'workshop', 'Hands-on AI and Machine Learning workshop', 'Lab 101', TRUE, TRUE, TRUE),
    ('Web Development Session', 'workshop', 'Full-stack web development session', 'Lab 102', TRUE, TRUE, TRUE),
    ('Hackathon Check-in', 'competition', 'Hackathon participant check-in', 'Seminar Hall', TRUE, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Events: Anyone authenticated can view active events
CREATE POLICY "Anyone can view active events"
ON public.events FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Events: Only admins can insert/update/delete
CREATE POLICY "Only admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'reg_admin', 'coordinator')
    )
);

-- Registrations: Users can view their own registrations
CREATE POLICY "Users can view own registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Registrations: Admins can view all
CREATE POLICY "Admins can view all registrations"
ON public.registrations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'reg_admin', 'coordinator')
    )
);

-- Attendance Logs: Users can view their own attendance
CREATE POLICY "Users can view own attendance"
ON public.attendance_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Attendance Logs: Admins can view all
CREATE POLICY "Admins can view all attendance"
ON public.attendance_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'reg_admin', 'coordinator', 'volunteer')
    )
);

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.verify_and_mark_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_events_for_scanner TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_stats TO authenticated;

-- ============================================
-- Verification Queries
-- ============================================
-- Run these after setup to verify everything works

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('events', 'registrations', 'attendance_logs');

-- Check if functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('verify_and_mark_attendance', 'get_active_events_for_scanner', 'get_attendance_stats');

-- Test the scanner function (replace UUIDs with real ones)
-- SELECT public.verify_and_mark_attendance(
--     'user-uuid-here'::UUID,
--     'event-uuid-here'::UUID,
--     'scanner-uuid-here'::UUID,
--     'Main Gate'
-- );
