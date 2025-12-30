-- ============================================
-- DaKshaa T26 - Event Coordinator Scanner System
-- ============================================
-- This file contains functions for the event coordinator QR scanner
-- to lookup user registered events and mark attendance

-- ============================================
-- IMPORTANT: This system uses the existing `attendance` table
-- which has event_id as TEXT (references events.event_id)
-- The events_config.event_key is used to link with the legacy events table
-- ============================================

-- ============================================
-- Drop existing functions first (to allow signature changes)
-- ============================================
DROP FUNCTION IF EXISTS public.get_user_registered_events(UUID);
DROP FUNCTION IF EXISTS public.get_user_profile_for_scanner(UUID);
DROP FUNCTION IF EXISTS public.mark_event_attendance(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.mark_event_attendance(UUID, UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.mark_manual_attendance(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS public.mark_manual_attendance(UUID, UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_event_stats(UUID);
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

-- ============================================
-- Add session columns to attendance table (use columns instead of rows)
-- ============================================
DO $$ 
BEGIN
    -- Add morning_attended column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'morning_attended'
    ) THEN
        ALTER TABLE public.attendance ADD COLUMN morning_attended BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add evening_attended column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'evening_attended'
    ) THEN
        ALTER TABLE public.attendance ADD COLUMN evening_attended BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add morning_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'morning_time'
    ) THEN
        ALTER TABLE public.attendance ADD COLUMN morning_time TIMESTAMPTZ;
    END IF;
    
    -- Add evening_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'evening_time'
    ) THEN
        ALTER TABLE public.attendance ADD COLUMN evening_time TIMESTAMPTZ;
    END IF;
    
    -- Drop old session_type column if exists (we're using columns now)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'session_type'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN session_type;
    END IF;
END $$;

-- ============================================
-- RPC FUNCTION: Get User Registered Events
-- ============================================
-- Returns all events a user is registered for (with paid status)
-- Used when scanning a QR to show event selection if multiple

CREATE OR REPLACE FUNCTION public.get_user_registered_events(p_user_id UUID)
RETURNS TABLE (
    event_id UUID,
    event_name TEXT,
    event_key TEXT,
    event_type TEXT,
    venue TEXT,
    event_date DATE,
    start_time TIME,
    end_time TIME,
    payment_status TEXT,
    already_attended BOOLEAN,
    attendance_time TIMESTAMPTZ,
    morning_attended BOOLEAN,
    evening_attended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id AS event_id,
        ec.name AS event_name,
        ec.event_key,
        ec.type AS event_type,
        ec.venue,
        ec.event_date,
        ec.start_time,
        ec.end_time,
        erc.payment_status,
        -- Check attendance table for already attended status (any session)
        EXISTS (
            SELECT 1 FROM public.attendance a 
            WHERE a.user_id = p_user_id AND a.event_id = ec.event_key
        ) AS already_attended,
        (SELECT a.created_at FROM public.attendance a WHERE a.user_id = p_user_id AND a.event_id = ec.event_key ORDER BY a.created_at DESC LIMIT 1) AS attendance_time,
        -- Check morning session attendance (from column)
        COALESCE((SELECT a.morning_attended FROM public.attendance a WHERE a.user_id = p_user_id AND a.event_id = ec.event_key LIMIT 1), FALSE) AS morning_attended,
        -- Check evening session attendance (from column)
        COALESCE((SELECT a.evening_attended FROM public.attendance a WHERE a.user_id = p_user_id AND a.event_id = ec.event_key LIMIT 1), FALSE) AS evening_attended
    FROM public.event_registrations_config erc
    INNER JOIN public.events_config ec ON erc.event_id = ec.id
    WHERE erc.user_id = p_user_id
        AND erc.payment_status = 'PAID'
        AND ec.is_open = TRUE
    ORDER BY 
        CASE 
            WHEN EXISTS (SELECT 1 FROM public.attendance a WHERE a.user_id = p_user_id AND a.event_id = ec.event_key) THEN 1
            ELSE 0 
        END, -- Pending first
        ec.event_date ASC,
        ec.start_time ASC;
END;
$$;

-- ============================================
-- RPC FUNCTION: Get User Profile For Scanner
-- ============================================
-- Returns user profile info for display on scanner result

CREATE OR REPLACE FUNCTION public.get_user_profile_for_scanner(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'phone', p.phone,
        'department', p.department,
        'college_name', p.college_name,
        'roll_no', p.roll_no,
        'avatar_url', p.avatar_url
    ) INTO v_result
    FROM public.profiles p
    WHERE p.id = p_user_id;
    
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'error', true,
            'message', 'User not found'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- ============================================
-- RPC FUNCTION: Mark Event Attendance (with session)
-- ============================================
-- Marks attendance for a specific event after coordinator confirmation
-- Uses the existing attendance table with event_key (TEXT)
-- Uses columns for session: morning_attended, evening_attended
-- UPSERT: Creates row if not exists, updates session column if exists

CREATE OR REPLACE FUNCTION public.mark_event_attendance(
    p_user_id UUID,
    p_event_id UUID,
    p_scanned_by UUID,
    p_scan_location TEXT DEFAULT NULL,
    p_session_type TEXT DEFAULT 'morning'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_name TEXT;
    v_student_dept TEXT;
    v_student_roll_no TEXT;
    v_student_college TEXT;
    v_event_name TEXT;
    v_event_key TEXT;
    v_first_entry_time TIMESTAMPTZ;
    v_is_registered BOOLEAN;
    v_session TEXT;
    v_existing_morning BOOLEAN;
    v_existing_evening BOOLEAN;
BEGIN
    -- Validate session type
    v_session := COALESCE(p_session_type, 'morning');
    IF v_session NOT IN ('morning', 'evening') THEN
        v_session := 'morning';
    END IF;

    -- 1. Get student info
    SELECT full_name, department, roll_no, college_name
    INTO v_student_name, v_student_dept, v_student_roll_no, v_student_college
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_student_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User not found',
            'code', 'USER_NOT_FOUND'
        );
    END IF;

    -- 2. Get event info from events_config (includes event_key for attendance table)
    SELECT name, event_key INTO v_event_name, v_event_key
    FROM public.events_config
    WHERE id = p_event_id AND is_open = TRUE;

    IF v_event_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Event not found or not active',
            'code', 'EVENT_NOT_FOUND'
        );
    END IF;

    -- 3. Check if user is registered for this event
    SELECT EXISTS (
        SELECT 1 FROM public.event_registrations_config
        WHERE user_id = p_user_id
        AND event_id = p_event_id
        AND payment_status = 'PAID'
    ) INTO v_is_registered;

    IF NOT v_is_registered THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User not registered for this event',
            'code', 'NOT_REGISTERED',
            'student_name', v_student_name,
            'event_name', v_event_name
        );
    END IF;

    -- 4. Check if attendance row exists and get current session status
    SELECT morning_attended, evening_attended, created_at
    INTO v_existing_morning, v_existing_evening, v_first_entry_time
    FROM public.attendance
    WHERE user_id = p_user_id AND event_id = v_event_key;
    
    -- Check if row exists (FOUND is set by the SELECT INTO)
    IF NOT FOUND THEN
        -- No existing row, insert new
        -- 5. Ensure event exists in legacy events table, create if not
        INSERT INTO public.events (event_id, category, price, capacity, is_active, created_at)
        VALUES (v_event_key, 'general', 0, 1000, true, NOW())
        ON CONFLICT (event_id) DO NOTHING;
        
        INSERT INTO public.attendance (user_id, event_id, marked_by, morning_attended, evening_attended, morning_time, evening_time, created_at)
        VALUES (
            p_user_id, 
            v_event_key, 
            p_scanned_by, 
            (v_session = 'morning'),
            (v_session = 'evening'),
            CASE WHEN v_session = 'morning' THEN NOW() ELSE NULL END,
            CASE WHEN v_session = 'evening' THEN NOW() ELSE NULL END,
            NOW()
        );
    ELSE
        -- Row exists, check if already marked for this session
        IF (v_session = 'morning' AND COALESCE(v_existing_morning, FALSE) = TRUE) THEN
            RETURN json_build_object(
                'status', 'warning',
                'message', 'Already marked attendance for morning session',
                'code', 'DUPLICATE_ENTRY',
                'student_name', v_student_name,
                'student_dept', v_student_dept,
                'student_roll_no', v_student_roll_no,
                'event_name', v_event_name,
                'session_type', v_session,
                'first_entry_time', v_first_entry_time
            );
        END IF;
        
        IF (v_session = 'evening' AND COALESCE(v_existing_evening, FALSE) = TRUE) THEN
            RETURN json_build_object(
                'status', 'warning',
                'message', 'Already marked attendance for evening session',
                'code', 'DUPLICATE_ENTRY',
                'student_name', v_student_name,
                'student_dept', v_student_dept,
                'student_roll_no', v_student_roll_no,
                'event_name', v_event_name,
                'session_type', v_session,
                'first_entry_time', v_first_entry_time
            );
        END IF;
        
        -- Update the appropriate session column
        IF v_session = 'morning' THEN
            UPDATE public.attendance 
            SET morning_attended = TRUE, morning_time = NOW(), marked_by = p_scanned_by
            WHERE user_id = p_user_id AND event_id = v_event_key;
        ELSE
            UPDATE public.attendance 
            SET evening_attended = TRUE, evening_time = NOW(), marked_by = p_scanned_by
            WHERE user_id = p_user_id AND event_id = v_event_key;
        END IF;
    END IF;

    -- 8. Return success
    RETURN json_build_object(
        'status', 'success',
        'message', 'Attendance marked successfully for ' || v_session || ' session',
        'code', 'ACCESS_GRANTED',
        'student_name', v_student_name,
        'student_dept', v_student_dept,
        'student_college', v_student_college,
        'student_roll_no', v_student_roll_no,
        'event_name', v_event_name,
        'session_type', v_session,
        'timestamp', NOW()
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', 'Already marked attendance for this session',
            'code', 'DUPLICATE_ENTRY',
            'student_name', v_student_name,
            'event_name', v_event_name,
            'session_type', v_session
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Database error: ' || SQLERRM,
            'code', 'DATABASE_ERROR'
        );
END;
$$;

-- ============================================
-- RPC FUNCTION: Mark Manual Attendance (for Coordinator Dashboard)
-- ============================================
-- Used by the manual attendance tab in the coordinator dashboard
-- Takes event_id as UUID (from events_config), uses event_key for attendance table
-- Uses columns for session: morning_attended, evening_attended (single row per user/event)

CREATE OR REPLACE FUNCTION public.mark_manual_attendance(
    p_user_id UUID,
    p_event_uuid UUID,
    p_marked_by UUID,
    p_session_type TEXT DEFAULT 'morning'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student_name TEXT;
    v_event_name TEXT;
    v_event_key TEXT;
    v_is_registered BOOLEAN;
    v_session TEXT;
    v_existing_morning BOOLEAN;
    v_existing_evening BOOLEAN;
BEGIN
    -- Validate session type
    v_session := COALESCE(p_session_type, 'morning');
    IF v_session NOT IN ('morning', 'evening') THEN
        v_session := 'morning';
    END IF;

    -- 1. Get student info
    SELECT full_name INTO v_student_name
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_student_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User not found',
            'code', 'USER_NOT_FOUND'
        );
    END IF;

    -- 2. Get event info from events_config
    SELECT name, event_key INTO v_event_name, v_event_key
    FROM public.events_config
    WHERE id = p_event_uuid;

    IF v_event_name IS NULL THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Event not found',
            'code', 'EVENT_NOT_FOUND'
        );
    END IF;

    -- 3. Check if user is registered for this event
    SELECT EXISTS (
        SELECT 1 FROM public.event_registrations_config
        WHERE user_id = p_user_id
        AND event_id = p_event_uuid
        AND payment_status = 'PAID'
    ) INTO v_is_registered;

    IF NOT v_is_registered THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'User not registered for this event',
            'code', 'NOT_REGISTERED'
        );
    END IF;

    -- 4. Check if attendance row exists and get current session status
    SELECT morning_attended, evening_attended
    INTO v_existing_morning, v_existing_evening
    FROM public.attendance
    WHERE user_id = p_user_id AND event_id = v_event_key;
    
    -- Check if row exists (FOUND is set by the SELECT INTO)
    IF NOT FOUND THEN
        -- No existing row, insert new
        -- 5. Ensure event exists in legacy events table, create if not
        INSERT INTO public.events (event_id, category, price, capacity, is_active, created_at)
        VALUES (v_event_key, 'general', 0, 1000, true, NOW())
        ON CONFLICT (event_id) DO NOTHING;
        
        INSERT INTO public.attendance (user_id, event_id, marked_by, morning_attended, evening_attended, morning_time, evening_time, created_at)
        VALUES (
            p_user_id, 
            v_event_key, 
            p_marked_by, 
            (v_session = 'morning'),
            (v_session = 'evening'),
            CASE WHEN v_session = 'morning' THEN NOW() ELSE NULL END,
            CASE WHEN v_session = 'evening' THEN NOW() ELSE NULL END,
            NOW()
        );
    ELSE
        -- Row exists, check if already marked for this session
        IF (v_session = 'morning' AND COALESCE(v_existing_morning, FALSE) = TRUE) THEN
            RETURN json_build_object(
                'status', 'warning',
                'message', 'Already marked attendance for morning session',
                'code', 'DUPLICATE_ENTRY',
                'student_name', v_student_name,
                'event_name', v_event_name,
                'session_type', v_session
            );
        END IF;
        
        IF (v_session = 'evening' AND COALESCE(v_existing_evening, FALSE) = TRUE) THEN
            RETURN json_build_object(
                'status', 'warning',
                'message', 'Already marked attendance for evening session',
                'code', 'DUPLICATE_ENTRY',
                'student_name', v_student_name,
                'event_name', v_event_name,
                'session_type', v_session
            );
        END IF;
        
        -- Ensure event exists in legacy events table
        INSERT INTO public.events (event_id, category, price, capacity, is_active, created_at)
        VALUES (v_event_key, 'general', 0, 1000, true, NOW())
        ON CONFLICT (event_id) DO NOTHING;
        
        -- Update the appropriate session column
        IF v_session = 'morning' THEN
            UPDATE public.attendance 
            SET morning_attended = TRUE, morning_time = NOW(), marked_by = p_marked_by
            WHERE user_id = p_user_id AND event_id = v_event_key;
        ELSE
            UPDATE public.attendance 
            SET evening_attended = TRUE, evening_time = NOW(), marked_by = p_marked_by
            WHERE user_id = p_user_id AND event_id = v_event_key;
        END IF;
    END IF;

    -- 6. Return success
    RETURN json_build_object(
        'status', 'success',
        'message', 'Attendance marked successfully for ' || v_session || ' session',
        'code', 'ACCESS_GRANTED',
        'student_name', v_student_name,
        'event_name', v_event_name,
        'session_type', v_session,
        'timestamp', NOW()
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'status', 'warning',
            'message', 'Already marked attendance for this session',
            'code', 'DUPLICATE_ENTRY',
            'student_name', v_student_name,
            'event_name', v_event_name,
            'session_type', v_session
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'status', 'error',
            'message', 'Database error: ' || SQLERRM,
            'code', 'DATABASE_ERROR'
        );
END;
$$;

-- ============================================
-- RPC FUNCTION: Get Event Stats (Dynamic Counts)
-- ============================================
-- Returns live stats for an event including session-based attendance
-- Uses column-based session tracking: morning_attended, evening_attended

CREATE OR REPLACE FUNCTION public.get_event_stats(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_key TEXT;
    v_registered INTEGER;
    v_morning_attended INTEGER;
    v_evening_attended INTEGER;
    v_total_attended INTEGER;
BEGIN
    -- Get event_key from events_config
    SELECT event_key INTO v_event_key
    FROM public.events_config
    WHERE id = p_event_id;
    
    IF v_event_key IS NULL THEN
        RETURN json_build_object('error', 'Event not found');
    END IF;
    
    -- Count registrations
    SELECT COUNT(*) INTO v_registered
    FROM public.event_registrations_config
    WHERE event_id = p_event_id AND payment_status = 'PAID';
    
    -- Count morning attendance (from morning_attended column)
    SELECT COUNT(*) INTO v_morning_attended
    FROM public.attendance
    WHERE event_id = v_event_key AND morning_attended = TRUE;
    
    -- Count evening attendance (from evening_attended column)
    SELECT COUNT(*) INTO v_evening_attended
    FROM public.attendance
    WHERE event_id = v_event_key AND evening_attended = TRUE;
    
    -- Count total unique users attended (any session)
    SELECT COUNT(*) INTO v_total_attended
    FROM public.attendance
    WHERE event_id = v_event_key AND (morning_attended = TRUE OR evening_attended = TRUE);
    
    RETURN json_build_object(
        'registered', v_registered,
        'morning_attended', v_morning_attended,
        'evening_attended', v_evening_attended,
        'total_attended', v_total_attended,
        'morning_remaining', v_registered - v_morning_attended,
        'evening_remaining', v_registered - v_evening_attended
    );
END;
$$;

-- ============================================
-- RPC FUNCTION: Get Admin Dashboard Stats
-- ============================================
-- Returns overall stats for admin dashboard
-- Uses column-based session tracking: morning_attended, evening_attended

CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_users INTEGER;
    v_total_registrations INTEGER;
    v_total_revenue NUMERIC;
    v_morning_checkins INTEGER;
    v_evening_checkins INTEGER;
    v_total_checkins INTEGER;
    v_total_events INTEGER;
    v_open_events INTEGER;
BEGIN
    -- Total users
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;
    
    -- Total registrations (PAID)
    SELECT COUNT(*) INTO v_total_registrations 
    FROM public.event_registrations_config 
    WHERE payment_status = 'PAID';
    
    -- Total revenue
    SELECT COALESCE(SUM(payment_amount), 0) INTO v_total_revenue
    FROM public.event_registrations_config
    WHERE payment_status = 'PAID';
    
    -- Morning check-ins (from morning_attended column)
    SELECT COUNT(*) INTO v_morning_checkins
    FROM public.attendance
    WHERE morning_attended = TRUE;
    
    -- Evening check-ins (from evening_attended column)
    SELECT COUNT(*) INTO v_evening_checkins
    FROM public.attendance
    WHERE evening_attended = TRUE;
    
    -- Total unique check-ins (users who attended any session)
    SELECT COUNT(*) INTO v_total_checkins
    FROM public.attendance
    WHERE morning_attended = TRUE OR evening_attended = TRUE;
    
    -- Total events
    SELECT COUNT(*) INTO v_total_events FROM public.events_config;
    
    -- Open events
    SELECT COUNT(*) INTO v_open_events FROM public.events_config WHERE is_open = TRUE;
    
    RETURN json_build_object(
        'total_users', v_total_users,
        'total_registrations', v_total_registrations,
        'total_revenue', v_total_revenue,
        'morning_checkins', v_morning_checkins,
        'evening_checkins', v_evening_checkins,
        'total_checkins', v_total_checkins,
        'total_events', v_total_events,
        'open_events', v_open_events
    );
END;
$$;

-- ============================================
-- Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_user_registered_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_profile_for_scanner TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_event_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_manual_attendance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats TO authenticated;

-- ============================================
-- Ensure unique constraint on attendance (user_id, event_id)
-- ============================================
-- With column-based sessions, we only need one row per user/event
DO $$ 
BEGIN
    -- Drop old session-based constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' AND constraint_name = 'attendance_user_event_session_unique'
    ) THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_user_event_session_unique;
    END IF;
    
    -- Ensure unique constraint on user_id and event_id only
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'attendance' AND constraint_name = 'attendance_user_id_event_id_key'
    ) THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_id_event_id_key 
            UNIQUE (user_id, event_id);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists or table structure differs
        NULL;
END $$;

-- ============================================
-- Create index for session column-based queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_morning ON public.attendance(event_id) WHERE morning_attended = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_evening ON public.attendance(event_id) WHERE evening_attended = TRUE;

-- Drop old session_type index if exists
DROP INDEX IF EXISTS idx_attendance_session;

-- ============================================
-- Verification
-- ============================================
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_user_registered_events', 'get_user_profile_for_scanner', 'mark_event_attendance', 'mark_manual_attendance', 'get_event_stats', 'get_admin_dashboard_stats');
