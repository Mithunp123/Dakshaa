-- ============================================
-- DaKshaa T26 - Combo & Package Management
-- Explosion Strategy: Bundle → Individual Registrations
-- ============================================

-- ============================================
-- TABLE: combos
-- Defines package bundles (e.g., "Tech Trio Pass")
-- ============================================
CREATE TABLE IF NOT EXISTS public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Package Details
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Discounted bundle price
    
    -- Category-Based Quota System
    -- Format: {"Workshop": 2, "Technical": 3, "Non-Technical": 2, "Sports": 1}
    category_quotas JSONB DEFAULT '{}'::jsonb,
    
    -- Display & Control
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0, -- For sorting on frontend
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- TABLE: combo_items
-- Links combos to individual events
-- NOW INCLUDES: category tracking for quota validation
-- ============================================
CREATE TABLE IF NOT EXISTS public.combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    
    -- Track which category slot this event fills
    category_slot TEXT, -- e.g., "Workshop", "Technical", "Sports"
    
    -- Prevent duplicate event in same combo
    UNIQUE(combo_id, event_id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: combo_purchases
-- Tracks combo purchases (for analytics & receipts)
-- ============================================
CREATE TABLE IF NOT EXISTS public.combo_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Payment Info
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER NOT NULL,
    transaction_id TEXT,
    
    -- Explosion Tracking
    explosion_completed BOOLEAN DEFAULT FALSE, -- Did we create all individual registrations?
    individual_registration_ids JSONB, -- Array of created registration IDs
    
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate combo purchase
    UNIQUE(user_id, combo_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_combos_active ON public.combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_event ON public.combo_items(event_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_user ON public.combo_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_status ON public.combo_purchases(payment_status);

-- ============================================
-- RPC: Get Combos with Event Details & Stats
-- ============================================
CREATE OR REPLACE FUNCTION public.get_combos_with_details()
RETURNS TABLE (
    combo_id UUID,
    combo_name TEXT,
    combo_description TEXT,
    combo_price INTEGER,
    is_active BOOLEAN,
    display_order INTEGER,
    category_quotas JSONB,
    event_count INTEGER,
    events JSONB,
    total_purchases INTEGER,
    original_price INTEGER,
    savings INTEGER,
    savings_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.price,
        c.is_active,
        c.display_order,
        c.category_quotas,
        COUNT(DISTINCT ci.event_id)::INTEGER,
        jsonb_agg(
            jsonb_build_object(
                'event_id', e.id,
                'event_name', e.name,
                'event_key', e.event_key,
                'event_price', e.price,
                'event_type', e.type,
                'event_category', e.category,
                'category_slot', ci.category_slot
            )
        ) FILTER (WHERE e.id IS NOT NULL),
        (SELECT COUNT(*)::INTEGER FROM public.combo_purchases WHERE combo_id = c.id AND payment_status = 'PAID'),
        COALESCE(SUM(e.price), 0)::INTEGER,
        (COALESCE(SUM(e.price), 0) - c.price)::INTEGER,
        CASE 
            WHEN SUM(e.price) > 0 THEN 
                ROUND(((SUM(e.price) - c.price) / SUM(e.price) * 100)::NUMERIC, 1)
            ELSE 0 
        END
    FROM public.combos c
    LEFT JOIN public.combo_items ci ON c.id = ci.combo_id
    LEFT JOIN public.events_config e ON ci.event_id = e.id
    GROUP BY c.id, c.name, c.description, c.price, c.is_active, c.display_order, c.category_quotas
    ORDER BY c.display_order ASC, c.created_at DESC;
END;
$$;

-- ============================================
-- RPC: Get Active Combos for Students
-- (Only shows combos where all events are available)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_active_combos_for_students(p_user_id UUID)
RETURNS TABLE (
    combo_id UUID,
    combo_name TEXT,
    combo_description TEXT,
    combo_price INTEGER,
    events JSONB,
    original_price INTEGER,
    savings INTEGER,
    savings_percentage NUMERIC,
    is_available BOOLEAN,
    unavailable_reason TEXT,
    already_purchased BOOLEAN,
    conflicting_events JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH combo_details AS (
        SELECT 
            c.id AS combo_id,
            c.name,
            c.description,
            c.price,
            jsonb_agg(
                jsonb_build_object(
                    'event_id', e.id,
                    'event_name', e.name,
                    'event_key', e.event_key,
                    'event_price', e.price,
                    'is_open', e.is_open,
                    'capacity', e.capacity,
                    'current_registrations', (
                        SELECT COUNT(*) 
                        FROM public.event_registrations_config 
                        WHERE event_id = e.id AND payment_status = 'PAID'
                    )
                )
            ) AS events,
            SUM(e.price) AS total_price
        FROM public.combos c
        INNER JOIN public.combo_items ci ON c.id = ci.combo_id
        INNER JOIN public.events_config e ON ci.event_id = e.id
        WHERE c.is_active = TRUE
        GROUP BY c.id, c.name, c.description, c.price
    ),
    user_conflicts AS (
        SELECT 
            cd.combo_id,
            jsonb_agg(
                jsonb_build_object(
                    'event_id', erc.event_id,
                    'event_name', e.name
                )
            ) FILTER (WHERE erc.event_id IS NOT NULL) AS conflicts
        FROM combo_details cd
        CROSS JOIN LATERAL jsonb_array_elements(cd.events) AS ev
        LEFT JOIN public.event_registrations_config erc ON 
            erc.user_id = p_user_id AND 
            erc.event_id = (ev->>'event_id')::UUID AND
            erc.payment_status = 'PAID'
        LEFT JOIN public.events_config e ON erc.event_id = e.id
        GROUP BY cd.combo_id
    )
    SELECT 
        cd.combo_id,
        cd.name,
        cd.description,
        cd.price,
        cd.events,
        cd.total_price::INTEGER,
        (cd.total_price - cd.price)::INTEGER,
        ROUND(((cd.total_price - cd.price) / cd.total_price * 100)::NUMERIC, 1),
        -- Availability check
        (
            -- All events must be open
            NOT EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(cd.events) AS ev
                WHERE (ev->>'is_open')::BOOLEAN = FALSE
            )
            AND
            -- No event should be sold out
            NOT EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(cd.events) AS ev
                WHERE (ev->>'current_registrations')::INTEGER >= (ev->>'capacity')::INTEGER
            )
            AND
            -- User hasn't bought this combo already
            NOT EXISTS (
                SELECT 1 FROM public.combo_purchases 
                WHERE user_id = p_user_id 
                AND combo_id = cd.combo_id 
                AND payment_status = 'PAID'
            )
            AND
            -- No conflicting individual registrations
            uc.conflicts IS NULL
        ) AS is_available,
        -- Reason for unavailability
        CASE
            WHEN EXISTS (
                SELECT 1 FROM public.combo_purchases 
                WHERE user_id = p_user_id 
                AND combo_id = cd.combo_id 
                AND payment_status = 'PAID'
            ) THEN 'Already purchased'
            WHEN uc.conflicts IS NOT NULL THEN 'Already registered for individual events'
            WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(cd.events) AS ev
                WHERE (ev->>'is_open')::BOOLEAN = FALSE
            ) THEN 'Some events are closed'
            WHEN EXISTS (
                SELECT 1 FROM jsonb_array_elements(cd.events) AS ev
                WHERE (ev->>'current_registrations')::INTEGER >= (ev->>'capacity')::INTEGER
            ) THEN 'Some events are sold out'
            ELSE NULL
        END,
        EXISTS (
            SELECT 1 FROM public.combo_purchases 
            WHERE user_id = p_user_id 
            AND combo_id = cd.combo_id 
            AND payment_status = 'PAID'
        ),
        uc.conflicts
    FROM combo_details cd
    LEFT JOIN user_conflicts uc ON cd.combo_id = uc.combo_id
    ORDER BY cd.price DESC;
END;
$$;

-- ============================================
-- RPC: Create Combo
-- ============================================
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
    v_event_type TEXT;
    v_event_category TEXT;
BEGIN
    -- Validation
    IF p_name IS NULL OR p_name = '' THEN
        RETURN json_build_object('success', false, 'message', 'Combo name is required');
    END IF;

    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    IF array_length(p_event_ids, 1) IS NULL OR array_length(p_event_ids, 1) < 2 THEN
        RETURN json_build_object('success', false, 'message', 'Combo must include at least 2 events');
    END IF;

    -- Check all events exist and are SOLO type
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        SELECT type, category INTO v_event_type, v_event_category 
        FROM public.events_config 
        WHERE id = v_event_id;
        
        IF v_event_type IS NULL THEN
            RETURN json_build_object('success', false, 'message', 'One or more events do not exist');
        END IF;

        IF v_event_type != 'SOLO' THEN
            RETURN json_build_object('success', false, 'message', 'Only SOLO events can be added to combos');
        END IF;
    END LOOP;

    -- Create combo with category quotas
    INSERT INTO public.combos (name, description, price, is_active, category_quotas, created_by)
    VALUES (p_name, p_description, p_price, p_is_active, p_category_quotas, auth.uid())
    RETURNING id INTO v_combo_id;

    -- Add combo items with category tracking
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        -- Get event category again
        SELECT category INTO v_event_category 
        FROM public.events_config 
        WHERE id = v_event_id;
        
        INSERT INTO public.combo_items (combo_id, event_id, category_slot)
        VALUES (v_combo_id, v_event_id, v_event_category);
    END LOOP;

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

-- ============================================
-- RPC: Update Combo
-- ============================================
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
    v_event_type TEXT;
    v_event_category TEXT;
BEGIN
    -- Validation
    IF NOT EXISTS (SELECT 1 FROM public.combos WHERE id = p_combo_id) THEN
        RETURN json_build_object('success', false, 'message', 'Combo not found');
    END IF;

    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    IF array_length(p_event_ids, 1) < 2 THEN
        RETURN json_build_object('success', false, 'message', 'Combo must include at least 2 events');
    END IF;

    -- Check all events exist and are SOLO type
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        SELECT type, category INTO v_event_type, v_event_category 
        FROM public.events_config 
        WHERE id = v_event_id;
        
        IF v_event_type IS NULL THEN
            RETURN json_build_object('success', false, 'message', 'One or more events do not exist');
        END IF;

        IF v_event_type != 'SOLO' THEN
            RETURN json_build_object('success', false, 'message', 'Only SOLO events can be added to combos');
        END IF;
    END LOOP;

    -- Update combo with category quotas
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

    -- Add new combo items with category tracking
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        -- Get event category
        SELECT category INTO v_event_category 
        FROM public.events_config 
        WHERE id = v_event_id;
        
        INSERT INTO public.combo_items (combo_id, event_id, category_slot)
        VALUES (p_combo_id, v_event_id, v_event_category);
    END LOOP;

    RETURN json_build_object('success', true, 'message', 'Combo updated successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- RPC: Delete Combo
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_combo(p_combo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purchase_count INTEGER;
BEGIN
    -- Check if combo has any purchases
    SELECT COUNT(*) INTO v_purchase_count
    FROM public.combo_purchases
    WHERE combo_id = p_combo_id AND payment_status = 'PAID';

    IF v_purchase_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot delete combo with existing purchases. Deactivate instead.'
        );
    END IF;

    DELETE FROM public.combos WHERE id = p_combo_id;

    RETURN json_build_object('success', true, 'message', 'Combo deleted successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- RPC: Toggle Combo Status
-- ============================================
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

-- ============================================
-- RPC: EXPLOSION FUNCTION
-- Purchase Combo → Create Individual Registrations
-- ============================================
CREATE OR REPLACE FUNCTION public.explode_combo_purchase(
    p_combo_id UUID,
    p_user_id UUID,
    p_transaction_id TEXT,
    p_payment_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purchase_id UUID;
    v_event_record RECORD;
    v_registration_ids UUID[] := ARRAY[]::UUID[];
    v_new_reg_id UUID;
BEGIN
    -- Create combo purchase record
    INSERT INTO public.combo_purchases (
        combo_id, user_id, payment_status, payment_amount, transaction_id
    )
    VALUES (
        p_combo_id, p_user_id, 'PAID', p_payment_amount, p_transaction_id
    )
    RETURNING id INTO v_purchase_id;

    -- THE EXPLOSION: Create individual registrations for each event
    FOR v_event_record IN 
        SELECT e.id AS event_id, e.name, e.price
        FROM public.combo_items ci
        INNER JOIN public.events_config e ON ci.event_id = e.id
        WHERE ci.combo_id = p_combo_id
    LOOP
        -- Insert individual registration
        INSERT INTO public.event_registrations_config (
            event_id, 
            user_id, 
            payment_status, 
            payment_amount, 
            transaction_id
        )
        VALUES (
            v_event_record.event_id,
            p_user_id,
            'PAID',
            v_event_record.price,
            p_transaction_id || '_COMBO_' || p_combo_id
        )
        RETURNING id INTO v_new_reg_id;

        -- Track created registration
        v_registration_ids := array_append(v_registration_ids, v_new_reg_id);
    END LOOP;

    -- Mark explosion as completed
    UPDATE public.combo_purchases
    SET explosion_completed = TRUE,
        individual_registration_ids = to_jsonb(v_registration_ids)
    WHERE id = v_purchase_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Combo purchase completed and registrations created',
        'purchase_id', v_purchase_id,
        'registrations_created', array_length(v_registration_ids, 1)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_purchases ENABLE ROW LEVEL SECURITY;

-- Combos: Public can view active, admins can manage
CREATE POLICY "Public can view active combos" ON public.combos
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage combos" ON public.combos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'registration_admin')
        )
    );

-- Combo Items: Public can view, admins can manage
CREATE POLICY "Public can view combo items" ON public.combo_items
    FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage combo items" ON public.combo_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'registration_admin')
        )
    );

-- Combo Purchases: Users can view their own, admins can view all
CREATE POLICY "Users can view own combo purchases" ON public.combo_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create combo purchases" ON public.combo_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all combo purchases" ON public.combo_purchases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('super_admin', 'registration_admin')
        )
    );

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
-- Uncomment to insert sample combos

/*
INSERT INTO public.combos (name, description, price, is_active) VALUES
('Tech Trio Pass', 'Access to all 3 flagship technical workshops', 350, TRUE),
('All Access Conference', 'All conference sessions + networking lunch', 500, TRUE),
('Workshop Bundle', 'Any 5 workshops of your choice', 600, TRUE);
*/

COMMENT ON TABLE public.combos IS 'Package bundles that combine multiple events at discounted prices';
COMMENT ON TABLE public.combo_items IS 'Maps combo packages to their constituent events';
COMMENT ON TABLE public.combo_purchases IS 'Tracks combo purchases and explosion status';
COMMENT ON FUNCTION public.explode_combo_purchase IS 'THE EXPLOSION: Converts combo purchase into individual event registrations';
