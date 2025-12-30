-- ============================================
-- DaKshaa T26 - Event Configuration System
-- Admin Panel for Managing Event Metadata
-- ============================================

-- Table: events_config
-- Stores event business logic (price, capacity, type)
-- Frontend handles design/images via event_key mapping
CREATE TABLE IF NOT EXISTS public.events_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Critical: Maps to frontend design
    event_key TEXT NOT NULL UNIQUE,
    
    -- Display Information
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Technical' CHECK (category IN ('Technical', 'Non-Technical', 'Workshop', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other')),
    
    -- Business Logic
    price INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('SOLO', 'TEAM')),
    capacity INTEGER NOT NULL DEFAULT 100,
    
    -- Registration Control
    is_open BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table: event_registrations_config
-- Tracks registrations for capacity management
CREATE TABLE IF NOT EXISTS public.event_registrations_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_name TEXT,
    team_members JSONB, -- For TEAM type events
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER,
    transaction_id TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_events_config_key ON public.events_config(event_key);
CREATE INDEX IF NOT EXISTS idx_events_config_open ON public.events_config(is_open);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON public.event_registrations_config(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON public.event_registrations_config(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment ON public.event_registrations_config(payment_status);

-- ============================================
-- RPC FUNCTION: Get Event with Registration Count
-- ============================================
CREATE OR REPLACE FUNCTION public.get_events_with_stats()
RETURNS TABLE (
    id UUID,
    event_key TEXT,
    name TEXT,
    description TEXT,
    price INTEGER,
    type TEXT,
    capacity INTEGER,
    is_open BOOLEAN,
    current_registrations BIGINT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        e.id,
        e.event_key,
        e.name,
        e.description,
        e.price,
        e.type,
        e.capacity,
        e.is_open,
        COALESCE(COUNT(r.id), 0) as current_registrations,
        e.created_at,
        e.updated_at
    FROM public.events_config e
    LEFT JOIN public.event_registrations_config r ON e.id = r.event_id
    GROUP BY e.id, e.event_key, e.name, e.description, e.price, e.type, e.capacity, e.is_open, e.created_at, e.updated_at
    ORDER BY e.created_at DESC;
$$;

-- ============================================
-- RPC FUNCTION: Check Event Availability
-- ============================================
CREATE OR REPLACE FUNCTION public.check_event_availability(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_current_registrations INTEGER;
    v_is_available BOOLEAN;
BEGIN
    -- Get event details
    SELECT * INTO v_event
    FROM public.events_config
    WHERE id = p_event_id;

    IF v_event.id IS NULL THEN
        RETURN json_build_object(
            'available', false,
            'reason', 'Event not found'
        );
    END IF;

    -- Count current registrations
    SELECT COUNT(*) INTO v_current_registrations
    FROM public.event_registrations_config
    WHERE event_id = p_event_id
    AND payment_status = 'PAID';

    -- Check availability
    v_is_available := v_event.is_open AND v_current_registrations < v_event.capacity;

    RETURN json_build_object(
        'available', v_is_available,
        'is_open', v_event.is_open,
        'current_registrations', v_current_registrations,
        'capacity', v_event.capacity,
        'slots_remaining', v_event.capacity - v_current_registrations,
        'event_name', v_event.name,
        'price', v_event.price,
        'type', v_event.type
    );
END;
$$;

-- ============================================
-- RPC FUNCTION: Create Event
-- ============================================
CREATE OR REPLACE FUNCTION public.create_event_config(
    p_event_key TEXT,
    p_name TEXT,
    p_description TEXT,
    p_category TEXT DEFAULT 'Technical',
    p_price INTEGER,
    p_type TEXT,
    p_capacity INTEGER,
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

-- ============================================
-- RPC FUNCTION: Update Event
-- ============================================
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
    FROM public.event_registrations_config
    WHERE event_id = p_event_id
    AND payment_status = 'PAID';

    -- Prevent reducing capacity below current registrations
    IF p_capacity < v_current_registrations THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot reduce capacity below current registrations (' || v_current_registrations || ')'
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
        updated_at = NOW()
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

-- ============================================
-- RPC FUNCTION: Delete Event
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_event_config(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_registrations_count INTEGER;
BEGIN
    -- Check for existing registrations
    SELECT COUNT(*) INTO v_registrations_count
    FROM public.event_registrations_config
    WHERE event_id = p_event_id;

    IF v_registrations_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot delete event with existing registrations. Close the event instead.'
        );
    END IF;

    -- Delete event
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

-- ============================================
-- RPC FUNCTION: Toggle Event Status
-- ============================================
CREATE OR REPLACE FUNCTION public.toggle_event_status(p_event_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status BOOLEAN;
BEGIN
    -- Toggle is_open
    UPDATE public.events_config
    SET 
        is_open = NOT is_open,
        updated_at = NOW()
    WHERE id = p_event_id
    RETURNING is_open INTO v_new_status;

    IF v_new_status IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event not found'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Event status updated',
        'is_open', v_new_status
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.events_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations_config ENABLE ROW LEVEL SECURITY;

-- Events: Anyone can view open events
CREATE POLICY "Anyone can view open events"
ON public.events_config FOR SELECT
TO authenticated
USING (is_open = TRUE OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE admin_role IN ('super_admin', 'reg_admin', 'coordinator')
));

-- Events: Only admins can modify
CREATE POLICY "Only admins can modify events"
ON public.events_config FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'reg_admin')
    )
);

-- Registrations: Users can view their own
CREATE POLICY "Users can view own registrations"
ON public.event_registrations_config FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND admin_role IN ('super_admin', 'reg_admin', 'coordinator')
));

-- Registrations: Users can create their own
CREATE POLICY "Users can register for events"
ON public.event_registrations_config FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_events_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_event_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_event_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_event_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_event_config TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_event_status TO authenticated;

-- ============================================
-- Sample Events (Example Data)
-- ============================================
INSERT INTO public.events_config (event_key, name, description, price, type, capacity, is_open)
VALUES
    ('paper-pres', 'Paper Presentation', 'Present your research paper', 150, 'TEAM', 50, TRUE),
    ('debug-code', 'Code Debugging', 'Find and fix the bugs', 100, 'SOLO', 100, TRUE),
    ('web-design', 'Web Design Contest', 'Create stunning web designs', 200, 'TEAM', 40, TRUE),
    ('robo-race', 'Robotics Race', 'Build and race your robot', 300, 'TEAM', 30, TRUE),
    ('quiz-tech', 'Tech Quiz', 'Test your technical knowledge', 0, 'SOLO', 150, TRUE)
ON CONFLICT (event_key) DO NOTHING;

-- ============================================
-- Verification Queries
-- ============================================

-- Check if tables and functions exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('events_config', 'event_registrations_config');

-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name LIKE '%event%config%';

-- Test the functions
-- SELECT * FROM public.get_events_with_stats();
-- SELECT public.check_event_availability('event-uuid-here'::UUID);
