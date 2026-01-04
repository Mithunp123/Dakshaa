-- ============================================================
-- DAKSHAA - COMPLETE EVENT REGISTRATION RPC FUNCTIONS
-- Comprehensive functions for fully functional event registration
-- Date: January 4, 2026
-- ============================================================

-- ============================================================
-- 1. VALIDATE EVENT REGISTRATION
-- Validates if user can register for selected events
-- ============================================================

CREATE OR REPLACE FUNCTION validate_event_registration(
    p_user_id UUID,
    p_event_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
    v_valid BOOLEAN := true;
    v_errors JSONB := '[]'::jsonb;
    v_event_id UUID;
    v_event_name TEXT;
    v_capacity INTEGER;
    v_current_registrations INTEGER;
    v_is_team_event BOOLEAN;
    v_already_registered BOOLEAN;
BEGIN
    -- Check each event
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        -- Get event details
        SELECT 
            name,
            capacity::integer,
            current_registrations::integer,
            (is_team_event = 'true')
        INTO 
            v_event_name,
            v_capacity,
            v_current_registrations,
            v_is_team_event
        FROM events
        WHERE id = v_event_id;

        -- Check if event exists
        IF v_event_name IS NULL THEN
            v_valid := false;
            v_errors := v_errors || jsonb_build_object(
                'event_id', v_event_id,
                'error', 'Event not found'
            );
            CONTINUE;
        END IF;

        -- Check duplicate registration
        SELECT EXISTS(
            SELECT 1 
            FROM event_registrations_config
            WHERE user_id = p_user_id 
            AND event_id = v_event_id
        ) INTO v_already_registered;

        IF v_already_registered THEN
            v_valid := false;
            v_errors := v_errors || jsonb_build_object(
                'event_id', v_event_id,
                'event_name', v_event_name,
                'error', 'Already registered for this event'
            );
            CONTINUE;
        END IF;

        -- Check capacity
        IF v_current_registrations >= v_capacity THEN
            v_valid := false;
            v_errors := v_errors || jsonb_build_object(
                'event_id', v_event_id,
                'event_name', v_event_name,
                'error', 'Event is full'
            );
            CONTINUE;
        END IF;

    END LOOP;

    RETURN json_build_object(
        'valid', v_valid,
        'errors', v_errors
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. CREATE EVENT REGISTRATION
-- Creates registration records for individual events
-- ============================================================

CREATE OR REPLACE FUNCTION create_event_registration(
    p_user_id UUID,
    p_event_ids UUID[],
    p_combo_purchase_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_registration_ids UUID[] := ARRAY[]::UUID[];
    v_event_id UUID;
    v_event_name TEXT;
    v_event_price NUMERIC;
    v_total_amount NUMERIC := 0;
    v_registration_id UUID;
BEGIN
    -- Validate first
    DECLARE
        v_validation JSON;
        v_is_valid BOOLEAN;
    BEGIN
        v_validation := validate_event_registration(p_user_id, p_event_ids);
        v_is_valid := (v_validation->>'valid')::boolean;
        
        IF NOT v_is_valid THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Validation failed',
                'details', v_validation
            );
        END IF;
    END;

    -- Create registrations
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        -- Get event details
        SELECT name, price::numeric 
        INTO v_event_name, v_event_price
        FROM events
        WHERE id = v_event_id;

        -- Insert registration
        INSERT INTO event_registrations_config (
            user_id,
            event_id,
            event_name,
            payment_status,
            payment_amount,
            combo_purchase_id
        ) VALUES (
            p_user_id,
            v_event_id,
            v_event_name,
            'PENDING',
            v_event_price,
            p_combo_purchase_id
        ) RETURNING id INTO v_registration_id;

        v_registration_ids := array_append(v_registration_ids, v_registration_id);
        v_total_amount := v_total_amount + v_event_price;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'registration_ids', v_registration_ids,
        'total_amount', v_total_amount,
        'event_count', array_length(v_registration_ids, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. PROCESS PAYMENT CONFIRMATION
-- Updates payment status and triggers post-payment actions
-- ============================================================

CREATE OR REPLACE FUNCTION process_payment_confirmation(
    p_user_id UUID,
    p_registration_ids UUID[],
    p_transaction_id TEXT,
    p_payment_amount NUMERIC
)
RETURNS JSON AS $$
DECLARE
    v_registration_id UUID;
    v_updated_count INTEGER := 0;
    v_event_names TEXT := '';
BEGIN
    -- Update all registrations
    FOREACH v_registration_id IN ARRAY p_registration_ids
    LOOP
        UPDATE event_registrations_config
        SET 
            payment_status = 'PAID',
            transaction_id = p_transaction_id,
            payment_amount = p_payment_amount / array_length(p_registration_ids, 1)
        WHERE id = v_registration_id
        AND user_id = p_user_id
        AND payment_status = 'PENDING';

        IF FOUND THEN
            v_updated_count := v_updated_count + 1;
            
            -- Increment event registration count
            UPDATE events e
            SET current_registrations = (current_registrations::integer + 1)::text
            FROM event_registrations_config erc
            WHERE erc.id = v_registration_id
            AND e.id = erc.event_id;
        END IF;
    END LOOP;

    -- Get event names for notification
    SELECT string_agg(event_name, ', ')
    INTO v_event_names
    FROM event_registrations_config
    WHERE id = ANY(p_registration_ids);

    -- Create user notification
    INSERT INTO user_notifications (user_id, type, title, message, data)
    VALUES (
        p_user_id,
        'REGISTRATION_CONFIRMED',
        'Registration Confirmed!',
        'Your payment has been confirmed for: ' || v_event_names,
        jsonb_build_object(
            'registration_ids', p_registration_ids,
            'transaction_id', p_transaction_id,
            'amount', p_payment_amount
        )
    );

    RETURN json_build_object(
        'success', v_updated_count > 0,
        'updated_count', v_updated_count,
        'transaction_id', p_transaction_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. GET USER REGISTRATIONS WITH DETAILS
-- Fetches complete registration information for user
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_registrations(p_user_id UUID)
RETURNS TABLE (
    registration_id UUID,
    event_id UUID,
    event_name TEXT,
    event_category TEXT,
    event_venue TEXT,
    event_date DATE,
    event_start_time TIME,
    payment_status TEXT,
    payment_amount NUMERIC,
    transaction_id TEXT,
    registered_at TIMESTAMP WITH TIME ZONE,
    qr_code TEXT,
    is_team_event BOOLEAN,
    attendance_status JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        erc.id AS registration_id,
        e.id AS event_id,
        e.name AS event_name,
        e.category AS event_category,
        e.venue AS event_venue,
        e.event_date,
        e.start_time AS event_start_time,
        erc.payment_status,
        erc.payment_amount,
        erc.transaction_id,
        erc.registered_at,
        erc.id::text AS qr_code, -- Use registration ID as QR code
        (e.is_team_event = 'true') AS is_team_event,
        CASE 
            WHEN a.id IS NOT NULL THEN
                json_build_object(
                    'morning', a.morning_attended,
                    'evening', a.evening_attended,
                    'morning_time', a.morning_time,
                    'evening_time', a.evening_time
                )
            ELSE NULL
        END AS attendance_status
    FROM event_registrations_config erc
    INNER JOIN events e ON erc.event_id = e.id
    LEFT JOIN attendance a ON a.user_id = erc.user_id AND a.event_id = e.event_id
    WHERE erc.user_id = p_user_id
    ORDER BY erc.registered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 5. CHECK EVENT CAPACITY
-- Real-time capacity check for an event
-- ============================================================

CREATE OR REPLACE FUNCTION check_event_capacity(p_event_id UUID)
RETURNS JSON AS $$
DECLARE
    v_capacity INTEGER;
    v_current INTEGER;
    v_remaining INTEGER;
    v_available BOOLEAN;
BEGIN
    SELECT 
        capacity::integer,
        current_registrations::integer
    INTO v_capacity, v_current
    FROM events
    WHERE id = p_event_id;

    IF v_capacity IS NULL THEN
        RETURN json_build_object(
            'error', 'Event not found'
        );
    END IF;

    v_remaining := v_capacity - v_current;
    v_available := v_remaining > 0;

    RETURN json_build_object(
        'available', v_available,
        'capacity', v_capacity,
        'current_registrations', v_current,
        'remaining_spots', v_remaining,
        'percentage_filled', ROUND((v_current::numeric / v_capacity::numeric * 100), 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. CREATE TEAM REGISTRATION
-- Registers entire team for an event
-- ============================================================

CREATE OR REPLACE FUNCTION create_team_registration(
    p_team_id UUID,
    p_event_id UUID,
    p_leader_pays BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
    v_team_members UUID[];
    v_member_id UUID;
    v_event_price NUMERIC;
    v_total_amount NUMERIC;
    v_registration_ids UUID[] := ARRAY[]::UUID[];
    v_event_name TEXT;
    v_min_team_size INTEGER;
    v_max_team_size INTEGER;
    v_team_size INTEGER;
    v_registration_id UUID;
BEGIN
    -- Get team members
    SELECT array_agg(user_id)
    INTO v_team_members
    FROM team_members
    WHERE team_id = p_team_id
    AND status = 'joined';

    v_team_size := array_length(v_team_members, 1);

    -- Get event details
    SELECT 
        name,
        price::numeric,
        min_team_size::integer,
        max_team_size::integer
    INTO 
        v_event_name,
        v_event_price,
        v_min_team_size,
        v_max_team_size
    FROM events
    WHERE id = p_event_id;

    -- Validate team size
    IF v_team_size < v_min_team_size THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Team size too small. Minimum: ' || v_min_team_size
        );
    END IF;

    IF v_team_size > v_max_team_size THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Team size too large. Maximum: ' || v_max_team_size
        );
    END IF;

    -- Calculate total
    v_total_amount := v_event_price * v_team_size;

    -- Create registrations for all members
    FOREACH v_member_id IN ARRAY v_team_members
    LOOP
        INSERT INTO event_registrations_config (
            user_id,
            event_id,
            event_name,
            payment_status,
            payment_amount
        ) VALUES (
            v_member_id,
            p_event_id,
            v_event_name,
            'PENDING',
            CASE WHEN p_leader_pays THEN 0 ELSE v_event_price END
        ) RETURNING id INTO v_registration_id;

        v_registration_ids := array_append(v_registration_ids, v_registration_id);
    END LOOP;

    -- Create team notification
    INSERT INTO admin_notifications (type, title, message, data)
    VALUES (
        'NEW_TEAM_REGISTRATION',
        'New Team Registration',
        'Team registered for: ' || v_event_name,
        jsonb_build_object(
            'team_id', p_team_id,
            'event_id', p_event_id,
            'event_name', v_event_name,
            'team_size', v_team_size,
            'total_amount', v_total_amount
        )
    );

    RETURN json_build_object(
        'success', true,
        'registration_ids', v_registration_ids,
        'total_amount', v_total_amount,
        'team_size', v_team_size
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. VALIDATE TEAM REGISTRATION
-- Checks if team can register for event
-- ============================================================

CREATE OR REPLACE FUNCTION validate_team_registration(
    p_team_id UUID,
    p_event_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_team_size INTEGER;
    v_min_team_size INTEGER;
    v_max_team_size INTEGER;
    v_is_team_event BOOLEAN;
    v_already_registered INTEGER;
    v_errors JSONB := '[]'::jsonb;
    v_valid BOOLEAN := true;
BEGIN
    -- Get team size
    SELECT COUNT(*)
    INTO v_team_size
    FROM team_members
    WHERE team_id = p_team_id
    AND status = 'joined';

    -- Get event requirements
    SELECT 
        (is_team_event = 'true'),
        min_team_size::integer,
        max_team_size::integer
    INTO 
        v_is_team_event,
        v_min_team_size,
        v_max_team_size
    FROM events
    WHERE id = p_event_id;

    -- Check if it's a team event
    IF NOT v_is_team_event THEN
        v_valid := false;
        v_errors := v_errors || jsonb_build_object(
            'error', 'This is not a team event'
        );
    END IF;

    -- Check team size
    IF v_team_size < v_min_team_size THEN
        v_valid := false;
        v_errors := v_errors || jsonb_build_object(
            'error', 'Team size too small',
            'current', v_team_size,
            'minimum', v_min_team_size
        );
    END IF;

    IF v_team_size > v_max_team_size THEN
        v_valid := false;
        v_errors := v_errors || jsonb_build_object(
            'error', 'Team size too large',
            'current', v_team_size,
            'maximum', v_max_team_size
        );
    END IF;

    -- Check if any member already registered
    SELECT COUNT(*)
    INTO v_already_registered
    FROM event_registrations_config erc
    INNER JOIN team_members tm ON erc.user_id = tm.user_id
    WHERE tm.team_id = p_team_id
    AND erc.event_id = p_event_id;

    IF v_already_registered > 0 THEN
        v_valid := false;
        v_errors := v_errors || jsonb_build_object(
            'error', 'Some team members already registered',
            'count', v_already_registered
        );
    END IF;

    RETURN json_build_object(
        'valid', v_valid,
        'errors', v_errors,
        'team_size', v_team_size,
        'requirements', json_build_object(
            'min', v_min_team_size,
            'max', v_max_team_size
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. GET EVENT REGISTRATIONS (Admin)
-- Fetches all registrations for an event with user details
-- ============================================================

CREATE OR REPLACE FUNCTION get_event_registrations(
    p_event_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    registration_id UUID,
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    user_mobile TEXT,
    user_college TEXT,
    payment_status TEXT,
    payment_amount NUMERIC,
    transaction_id TEXT,
    registered_at TIMESTAMP WITH TIME ZONE,
    attendance_status JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        erc.id AS registration_id,
        p.id AS user_id,
        p.full_name AS user_name,
        p.email AS user_email,
        p.mobile_number AS user_mobile,
        p.college_name AS user_college,
        erc.payment_status,
        erc.payment_amount,
        erc.transaction_id,
        erc.registered_at,
        CASE 
            WHEN a.id IS NOT NULL THEN
                json_build_object(
                    'marked', true,
                    'morning', a.morning_attended,
                    'evening', a.evening_attended,
                    'morning_time', a.morning_time,
                    'evening_time', a.evening_time
                )
            ELSE json_build_object('marked', false)
        END AS attendance_status
    FROM event_registrations_config erc
    INNER JOIN profiles p ON erc.user_id = p.id
    LEFT JOIN attendance a ON a.user_id = erc.user_id 
        AND a.event_id = (SELECT event_id FROM events WHERE id = p_event_id)
    WHERE erc.event_id = p_event_id
    AND (p_status IS NULL OR erc.payment_status = p_status)
    ORDER BY erc.registered_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. UPDATE REGISTRATION STATUS (Admin)
-- Allows admin to update registration payment status
-- ============================================================

CREATE OR REPLACE FUNCTION update_registration_status(
    p_admin_id UUID,
    p_registration_id UUID,
    p_new_status TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_admin_role TEXT;
    v_updated BOOLEAN;
BEGIN
    -- Check admin permission
    SELECT role INTO v_admin_role
    FROM profiles
    WHERE id = p_admin_id;

    IF v_admin_role NOT IN ('super_admin', 'registration_admin') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient permissions'
        );
    END IF;

    -- Update registration
    UPDATE event_registrations_config
    SET 
        payment_status = p_new_status,
        transaction_id = COALESCE(p_transaction_id, transaction_id)
    WHERE id = p_registration_id;

    v_updated := FOUND;

    -- Log admin action
    IF v_updated THEN
        INSERT INTO admin_logs (admin_id, action_type, target_registration_id, details)
        VALUES (
            p_admin_id,
            'registration_update',
            p_registration_id,
            jsonb_build_object(
                'new_status', p_new_status,
                'transaction_id', p_transaction_id
            )
        );
    END IF;

    RETURN json_build_object(
        'success', v_updated,
        'registration_id', p_registration_id,
        'new_status', p_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 10. GET REGISTRATION STATISTICS
-- Returns comprehensive stats for admin dashboard
-- ============================================================

CREATE OR REPLACE FUNCTION get_registration_statistics(
    p_event_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_total_registrations INTEGER;
    v_paid_registrations INTEGER;
    v_pending_registrations INTEGER;
    v_total_revenue NUMERIC;
    v_pending_revenue NUMERIC;
BEGIN
    IF p_event_id IS NULL THEN
        -- Global statistics
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE payment_status = 'PAID'),
            COUNT(*) FILTER (WHERE payment_status = 'PENDING'),
            COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'PAID'), 0),
            COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'PENDING'), 0)
        INTO 
            v_total_registrations,
            v_paid_registrations,
            v_pending_registrations,
            v_total_revenue,
            v_pending_revenue
        FROM event_registrations_config;
    ELSE
        -- Event-specific statistics
        SELECT 
            COUNT(*),
            COUNT(*) FILTER (WHERE payment_status = 'PAID'),
            COUNT(*) FILTER (WHERE payment_status = 'PENDING'),
            COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'PAID'), 0),
            COALESCE(SUM(payment_amount) FILTER (WHERE payment_status = 'PENDING'), 0)
        INTO 
            v_total_registrations,
            v_paid_registrations,
            v_pending_registrations,
            v_total_revenue,
            v_pending_revenue
        FROM event_registrations_config
        WHERE event_id = p_event_id;
    END IF;

    RETURN json_build_object(
        'total_registrations', v_total_registrations,
        'paid_registrations', v_paid_registrations,
        'pending_registrations', v_pending_registrations,
        'total_revenue', v_total_revenue,
        'pending_revenue', v_pending_revenue,
        'event_id', p_event_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION validate_event_registration TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_registration TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_confirmation TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_registrations TO authenticated;
GRANT EXECUTE ON FUNCTION check_event_capacity TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_registration TO authenticated;
GRANT EXECUTE ON FUNCTION validate_team_registration TO authenticated;

-- Admin functions
GRANT EXECUTE ON FUNCTION get_event_registrations TO authenticated;
GRANT EXECUTE ON FUNCTION update_registration_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_registration_statistics TO authenticated;

-- ============================================================
-- COMPLETION NOTICE
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Event Registration RPC Functions Created Successfully!';
    RAISE NOTICE '📊 10 Functions Deployed:';
    RAISE NOTICE '   1. validate_event_registration';
    RAISE NOTICE '   2. create_event_registration';
    RAISE NOTICE '   3. process_payment_confirmation';
    RAISE NOTICE '   4. get_user_registrations';
    RAISE NOTICE '   5. check_event_capacity';
    RAISE NOTICE '   6. create_team_registration';
    RAISE NOTICE '   7. validate_team_registration';
    RAISE NOTICE '   8. get_event_registrations';
    RAISE NOTICE '   9. update_registration_status';
    RAISE NOTICE '   10. get_registration_statistics';
    RAISE NOTICE '🔒 Permissions Granted to authenticated users';
    RAISE NOTICE '🎯 Ready for Full Event Registration System!';
END $$;
