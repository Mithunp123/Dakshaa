-- ============================================
-- DaKshaa Combo System - Complete Database Schema
-- This file contains all necessary tables, functions, and policies
-- for the combo offer system
-- ============================================

-- ============================================
-- SECTION 1: MISSING COLUMNS
-- ============================================

-- Add combo_purchase_id to event_registrations_config (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_registrations_config' 
        AND column_name = 'combo_purchase_id'
    ) THEN
        ALTER TABLE public.event_registrations_config 
        ADD COLUMN combo_purchase_id UUID REFERENCES public.combo_purchases(id) ON DELETE SET NULL;
        
        CREATE INDEX idx_event_registrations_combo_purchase 
        ON public.event_registrations_config(combo_purchase_id);
        
        COMMENT ON COLUMN public.event_registrations_config.combo_purchase_id IS 
        'Links to parent combo purchase if this registration was created via combo explosion';
    END IF;
END $$;

-- Ensure combo_purchases has all necessary columns
DO $$ 
BEGIN
    -- Add selected_event_ids if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combo_purchases' 
        AND column_name = 'selected_event_ids'
    ) THEN
        ALTER TABLE public.combo_purchases 
        ADD COLUMN selected_event_ids JSONB DEFAULT '[]'::jsonb;
        
        COMMENT ON COLUMN public.combo_purchases.selected_event_ids IS 
        'Array of event IDs student selected matching category quotas';
    END IF;

    -- Add explosion_completed if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combo_purchases' 
        AND column_name = 'explosion_completed'
    ) THEN
        ALTER TABLE public.combo_purchases 
        ADD COLUMN explosion_completed BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add individual_registration_ids if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combo_purchases' 
        AND column_name = 'individual_registration_ids'
    ) THEN
        ALTER TABLE public.combo_purchases 
        ADD COLUMN individual_registration_ids JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Ensure combos table has all necessary columns
DO $$ 
BEGIN
    -- Add category_quotas if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combos' 
        AND column_name = 'category_quotas'
    ) THEN
        ALTER TABLE public.combos 
        ADD COLUMN category_quotas JSONB DEFAULT '{}'::jsonb;
        
        COMMENT ON COLUMN public.combos.category_quotas IS 
        'JSON format: {"Technical": 2, "Workshop": 3, "Sports": 1} - defines how many events from each category';
    END IF;

    -- Add total_events_required if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'combos' 
        AND column_name = 'total_events_required'
    ) THEN
        ALTER TABLE public.combos 
        ADD COLUMN total_events_required INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN public.combos.total_events_required IS 
        'Total number of events student must select for this combo';
    END IF;
END $$;

-- ============================================
-- SECTION 2: NEW TABLES
-- ============================================

-- Table: combo_event_selections (Audit trail of event selections)
CREATE TABLE IF NOT EXISTS public.combo_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_purchase_id UUID NOT NULL REFERENCES public.combo_purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combo_purchase_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_combo_selections_purchase 
ON public.combo_event_selections(combo_purchase_id);

CREATE INDEX IF NOT EXISTS idx_combo_selections_event 
ON public.combo_event_selections(event_id);

COMMENT ON TABLE public.combo_event_selections IS 
'Tracks student event selections for combo purchases before explosion - provides audit trail';

-- Table: payment_transactions (Unified payment tracking)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EVENT', 'COMBO', 'ACCOMMODATION', 'LUNCH')),
    reference_id UUID, -- Points to event_registration, combo_purchase, accommodation_request, or lunch_booking
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_gateway TEXT, -- 'razorpay', 'paytm', 'stripe', etc.
    gateway_transaction_id TEXT,
    gateway_order_id TEXT,
    payment_status TEXT DEFAULT 'INITIATED' CHECK (payment_status IN ('INITIATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method TEXT, -- 'UPI', 'CARD', 'NET_BANKING', 'WALLET', etc.
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user 
ON public.payment_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status 
ON public.payment_transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_type 
ON public.payment_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id 
ON public.payment_transactions(gateway_transaction_id);

COMMENT ON TABLE public.payment_transactions IS 
'Unified payment tracking for all transaction types across the platform - single source of truth for payments';

-- Table: notification_queue (User notifications)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('REGISTRATION', 'PAYMENT', 'COMBO', 'EVENT_UPDATE', 'SYSTEM')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user 
ON public.notification_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notification_queue(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON public.notification_queue(notification_type);

COMMENT ON TABLE public.notification_queue IS 
'Stores in-app notifications for users about registrations, payments, and system updates';

-- ============================================
-- SECTION 3: CRITICAL RPC FUNCTIONS
-- ============================================

-- ============================================
-- Function: validate_combo_selection
-- Validates if selected events match combo category quotas
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_combo_selection(
    p_combo_id UUID,
    p_selected_event_ids JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo_quotas JSONB;
    v_event RECORD;
    v_category_counts JSONB := '{}'::jsonb;
    v_category TEXT;
    v_required_count INTEGER;
    v_actual_count INTEGER;
    v_errors TEXT[] := ARRAY[]::TEXT[];
    v_event_id UUID;
BEGIN
    -- Get combo category quotas
    SELECT category_quotas INTO v_combo_quotas
    FROM public.combos
    WHERE id = p_combo_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'valid', false,
            'errors', ARRAY['Combo not found']
        );
    END IF;

    -- Count events by category from selected events
    FOR v_event_id IN SELECT jsonb_array_elements_text(p_selected_event_ids)::uuid
    LOOP
        -- Get event details
        SELECT category INTO v_event
        FROM public.events_config
        WHERE id = v_event_id;

        IF NOT FOUND THEN
            v_errors := array_append(v_errors, 'Event not found: ' || v_event_id::text);
            CONTINUE;
        END IF;

        -- Check if event is open
        IF NOT EXISTS (SELECT 1 FROM public.events_config WHERE id = v_event_id AND is_open = TRUE) THEN
            v_errors := array_append(v_errors, 'Event is closed: ' || v_event_id::text);
        END IF;

        -- Increment category count
        v_category := lower(trim(v_event.category));
        IF v_category_counts ? v_category THEN
            v_category_counts := jsonb_set(
                v_category_counts,
                ARRAY[v_category],
                to_jsonb((v_category_counts->>v_category)::integer + 1)
            );
        ELSE
            v_category_counts := jsonb_set(
                v_category_counts,
                ARRAY[v_category],
                '1'::jsonb
            );
        END IF;
    END LOOP;

    -- Validate counts match quotas
    FOR v_category, v_required_count IN 
        SELECT lower(trim(key)), (value::text)::integer 
        FROM jsonb_each(v_combo_quotas)
        WHERE jsonb_typeof(value) = 'number'
    LOOP
        v_actual_count := COALESCE((v_category_counts->>v_category)::integer, 0);
        
        IF v_actual_count != v_required_count THEN
            v_errors := array_append(
                v_errors, 
                format('Category %s: Expected %s events, got %s', 
                    v_category, v_required_count, v_actual_count)
            );
        END IF;
    END LOOP;

    -- Check for extra categories not in quotas (case-insensitive)
    FOR v_category IN 
        SELECT jsonb_object_keys(v_category_counts)
    LOOP
        -- Check if category exists in quotas (case-insensitive)
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_each(v_combo_quotas)
            WHERE lower(trim(key)) = v_category
        ) THEN
            v_errors := array_append(
                v_errors,
                format('Unexpected category: %s', v_category)
            );
        END IF;
    END LOOP;

    RETURN json_build_object(
        'valid', array_length(v_errors, 1) IS NULL,
        'category_breakdown', v_category_counts,
        'errors', COALESCE(v_errors, ARRAY[]::TEXT[])
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'valid', false,
            'errors', ARRAY['Validation error: ' || SQLERRM]
        );
END;
$$;

-- ============================================
-- Function: explode_combo_purchase
-- Converts combo purchase into individual event registrations
-- This is the CRITICAL function for combo system
-- ============================================
CREATE OR REPLACE FUNCTION public.explode_combo_purchase(
    p_combo_purchase_id UUID,
    p_selected_event_ids JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo_purchase RECORD;
    v_combo RECORD;
    v_validation_result JSON;
    v_event_id UUID;
    v_event RECORD;
    v_registration_id UUID;
    v_registration_ids UUID[] := ARRAY[]::UUID[];
    v_current_registrations INTEGER;
    v_error TEXT;
BEGIN
    -- Get combo purchase details
    SELECT * INTO v_combo_purchase
    FROM public.combo_purchases
    WHERE id = p_combo_purchase_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo purchase not found'
        );
    END IF;

    -- Check if already exploded
    IF v_combo_purchase.explosion_completed = TRUE THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo has already been exploded'
        );
    END IF;

    -- Check payment status
    IF v_combo_purchase.payment_status != 'PAID' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Payment not completed'
        );
    END IF;

    -- Get combo details
    SELECT * INTO v_combo
    FROM public.combos
    WHERE id = v_combo_purchase.combo_id;

    -- Validate event selection
    v_validation_result := public.validate_combo_selection(
        v_combo_purchase.combo_id,
        p_selected_event_ids
    );

    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid event selection',
            'validation_errors', v_validation_result->'errors'
        );
    END IF;

    -- Create individual registrations for each event
    FOR v_event_id IN SELECT jsonb_array_elements_text(p_selected_event_ids)::uuid
    LOOP
        -- Get event details
        SELECT * INTO v_event
        FROM public.events_config
        WHERE id = v_event_id;

        -- Check capacity
        SELECT COUNT(*) INTO v_current_registrations
        FROM public.event_registrations_config
        WHERE event_id = v_event_id AND payment_status = 'PAID';

        IF v_current_registrations >= v_event.capacity THEN
            v_error := 'Event ' || v_event.name || ' is at full capacity';
            RAISE EXCEPTION '%', v_error;
        END IF;

        -- Check if user already registered for this event
        IF EXISTS (
            SELECT 1 FROM public.event_registrations_config
            WHERE user_id = v_combo_purchase.user_id 
            AND event_id = v_event_id
        ) THEN
            v_error := 'Already registered for event: ' || v_event.name;
            RAISE EXCEPTION '%', v_error;
        END IF;

        -- Create registration
        INSERT INTO public.event_registrations_config (
            event_id,
            user_id,
            payment_status,
            payment_amount,
            transaction_id,
            combo_purchase_id,
            registered_at
        ) VALUES (
            v_event_id,
            v_combo_purchase.user_id,
            'PAID', -- Already paid via combo
            0, -- Individual event cost is 0 (included in combo)
            v_combo_purchase.transaction_id,
            p_combo_purchase_id,
            NOW()
        )
        RETURNING id INTO v_registration_id;

        v_registration_ids := array_append(v_registration_ids, v_registration_id);

        -- Create selection audit record
        INSERT INTO public.combo_event_selections (
            combo_purchase_id,
            event_id,
            category,
            selected_at
        ) VALUES (
            p_combo_purchase_id,
            v_event_id,
            v_event.category,
            NOW()
        );
    END LOOP;

    -- Update combo purchase record
    UPDATE public.combo_purchases
    SET explosion_completed = TRUE,
        individual_registration_ids = to_jsonb(v_registration_ids),
        selected_event_ids = p_selected_event_ids
    WHERE id = p_combo_purchase_id;

    -- Create notification
    INSERT INTO public.notification_queue (
        user_id,
        notification_type,
        title,
        message,
        priority
    ) VALUES (
        v_combo_purchase.user_id,
        'COMBO',
        'Combo Registration Complete',
        format('Successfully registered for %s events from %s combo', 
            array_length(v_registration_ids, 1), v_combo.name),
        'HIGH'
    );

    RETURN json_build_object(
        'success', true,
        'message', format('Successfully registered for %s events', array_length(v_registration_ids, 1)),
        'registration_ids', to_jsonb(v_registration_ids),
        'event_count', array_length(v_registration_ids, 1)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Explosion failed: ' || SQLERRM
        );
END;
$$;

-- ============================================
-- Function: get_user_combo_purchases
-- Gets user's combo purchase history
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_combo_purchases(p_user_id UUID)
RETURNS TABLE (
    purchase_id UUID,
    combo_id UUID,
    combo_name TEXT,
    combo_description TEXT,
    combo_price INTEGER,
    payment_status TEXT,
    payment_amount INTEGER,
    transaction_id TEXT,
    selected_events JSONB,
    explosion_completed BOOLEAN,
    individual_registration_ids JSONB,
    purchased_at TIMESTAMPTZ,
    event_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id AS purchase_id,
        c.id AS combo_id,
        c.name AS combo_name,
        c.description AS combo_description,
        c.price AS combo_price,
        cp.payment_status,
        cp.payment_amount,
        cp.transaction_id,
        cp.selected_event_ids AS selected_events,
        cp.explosion_completed,
        cp.individual_registration_ids,
        cp.purchased_at,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'event_id', e.id,
                    'event_name', e.name,
                    'category', e.category,
                    'price', e.price
                )
            )
            FROM public.events_config e
            WHERE e.id IN (
                SELECT jsonb_array_elements_text(cp.selected_event_ids)::uuid
            )
        ) AS event_details
    FROM public.combo_purchases cp
    INNER JOIN public.combos c ON cp.combo_id = c.id
    WHERE cp.user_id = p_user_id
    ORDER BY cp.purchased_at DESC;
END;
$$;

-- ============================================
-- Function: create_combo_purchase
-- Initiates a combo purchase (before payment)
-- ============================================
CREATE OR REPLACE FUNCTION public.create_combo_purchase(
    p_combo_id UUID,
    p_user_id UUID,
    p_selected_event_ids JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo RECORD;
    v_purchase_id UUID;
    v_validation_result JSON;
BEGIN
    -- Get combo details
    SELECT * INTO v_combo
    FROM public.combos
    WHERE id = p_combo_id AND is_active = TRUE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo not found or inactive'
        );
    END IF;

    -- Check if user already purchased this combo
    IF EXISTS (
        SELECT 1 FROM public.combo_purchases
        WHERE user_id = p_user_id AND combo_id = p_combo_id
        AND payment_status IN ('PAID', 'PENDING')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Already purchased this combo or payment pending'
        );
    END IF;

    -- Validate event selection
    v_validation_result := public.validate_combo_selection(p_combo_id, p_selected_event_ids);

    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid event selection',
            'validation_errors', v_validation_result->'errors'
        );
    END IF;

    -- Create combo purchase record
    INSERT INTO public.combo_purchases (
        combo_id,
        user_id,
        payment_status,
        payment_amount,
        selected_event_ids
    ) VALUES (
        p_combo_id,
        p_user_id,
        'PENDING',
        v_combo.price,
        p_selected_event_ids
    )
    RETURNING id INTO v_purchase_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Combo purchase initiated',
        'purchase_id', v_purchase_id,
        'amount', v_combo.price
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error creating purchase: ' || SQLERRM
        );
END;
$$;

-- ============================================
-- Function: complete_combo_payment
-- Updates payment status and triggers explosion
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_combo_payment(
    p_combo_purchase_id UUID,
    p_transaction_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_selected_events JSONB;
    v_explosion_result JSON;
BEGIN
    -- Update payment status
    UPDATE public.combo_purchases
    SET payment_status = 'PAID',
        transaction_id = p_transaction_id
    WHERE id = p_combo_purchase_id
    RETURNING selected_event_ids INTO v_selected_events;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo purchase not found'
        );
    END IF;

    -- Trigger explosion
    v_explosion_result := public.explode_combo_purchase(
        p_combo_purchase_id,
        v_selected_events
    );

    RETURN v_explosion_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Payment completion failed: ' || SQLERRM
        );
END;
$$;

-- ============================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.combo_event_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for combo_event_selections
DROP POLICY IF EXISTS "Users can view own combo selections" ON public.combo_event_selections;
CREATE POLICY "Users can view own combo selections" ON public.combo_event_selections
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.combo_purchases
        WHERE id = combo_purchase_id AND user_id = auth.uid()
    )
);

-- RLS Policies for payment_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.payment_transactions;
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- RLS Policies for notification_queue
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notification_queue;
CREATE POLICY "Users can view own notifications" ON public.notification_queue
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notification_queue;
CREATE POLICY "Users can update own notifications" ON public.notification_queue
FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SECTION 5: PERFORMANCE INDEXES
-- ============================================

-- Additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_registrations_event 
ON public.event_registrations_config(event_id);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user_status 
ON public.event_registrations_config(user_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_events_config_category 
ON public.events_config(category);

CREATE INDEX IF NOT EXISTS idx_events_config_open 
ON public.events_config(is_open) WHERE is_open = TRUE;

CREATE INDEX IF NOT EXISTS idx_combo_purchases_combo 
ON public.combo_purchases(combo_id);

-- ============================================
-- SECTION 6: GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.validate_combo_selection TO authenticated;
GRANT EXECUTE ON FUNCTION public.explode_combo_purchase TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_combo_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_combo_purchase TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_combo_payment TO authenticated;

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================

-- Summary of changes:
-- 1. ✅ Added missing columns to existing tables
-- 2. ✅ Created combo_event_selections table (audit trail)
-- 3. ✅ Created payment_transactions table (unified payments)
-- 4. ✅ Created notification_queue table (user notifications)
-- 5. ✅ Created validate_combo_selection function
-- 6. ✅ Created explode_combo_purchase function (CRITICAL)
-- 7. ✅ Created get_user_combo_purchases function
-- 8. ✅ Created create_combo_purchase function
-- 9. ✅ Created complete_combo_payment function
-- 10. ✅ Added RLS policies for security
-- 11. ✅ Added performance indexes

-- Test the deployment:
-- SELECT public.validate_combo_selection('<combo_id>', '["<event_id_1>", "<event_id_2>"]'::jsonb);
