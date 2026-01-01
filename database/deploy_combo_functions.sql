-- ============================================
-- COMBO MANAGEMENT RPC FUNCTIONS
-- Deploy this to enable full combo editing in admin panel
-- ============================================

-- ============================================
-- Drop existing functions first (if they exist)
-- ============================================
DROP FUNCTION IF EXISTS public.create_combo(text,text,integer,uuid[],boolean,jsonb);
DROP FUNCTION IF EXISTS public.update_combo(uuid,text,text,integer,uuid[],boolean,jsonb);
DROP FUNCTION IF EXISTS public.delete_combo(uuid);
DROP FUNCTION IF EXISTS public.toggle_combo_status(uuid);
DROP FUNCTION IF EXISTS public.get_combos_with_details();

-- ============================================
-- RPC: Create Combo with Category Quotas
-- ============================================
CREATE OR REPLACE FUNCTION public.create_combo(
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_event_ids UUID[],
    p_is_active BOOLEAN,
    p_category_quotas JSONB
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
    v_event_count INTEGER;
BEGIN
    -- Validate inputs
    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    v_event_count := array_length(p_event_ids, 1);
    IF v_event_count < 2 THEN
        RETURN json_build_object('success', false, 'message', 'Combo must have at least 2 events');
    END IF;

    -- Validate all events exist and are SOLO type
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        SELECT event_type INTO v_event_type 
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
    INSERT INTO public.combos (name, description, price, is_active, category_quotas)
    VALUES (p_name, p_description, p_price, p_is_active, p_category_quotas)
    RETURNING id INTO v_combo_id;

    -- Add combo items with category tracking
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        -- Get event category
        SELECT category INTO v_event_category 
        FROM public.events_config 
        WHERE id = v_event_id;
        
        INSERT INTO public.combo_items (combo_id, event_id, category_slot)
        VALUES (v_combo_id, v_event_id, v_event_category);
    END LOOP;

    RETURN json_build_object('success', true, 'message', 'Combo created successfully', 'combo_id', v_combo_id);

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- RPC: Update Combo with Category Quotas
-- ============================================
CREATE OR REPLACE FUNCTION public.update_combo(
    p_combo_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_price INTEGER,
    p_event_ids UUID[],
    p_is_active BOOLEAN,
    p_category_quotas JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
    v_event_type TEXT;
    v_event_category TEXT;
    v_event_count INTEGER;
BEGIN
    -- Check if combo exists
    IF NOT EXISTS (SELECT 1 FROM public.combos WHERE id = p_combo_id) THEN
        RETURN json_build_object('success', false, 'message', 'Combo not found');
    END IF;

    -- Validate inputs
    IF p_price <= 0 THEN
        RETURN json_build_object('success', false, 'message', 'Price must be greater than 0');
    END IF;

    v_event_count := array_length(p_event_ids, 1);
    IF v_event_count < 2 THEN
        RETURN json_build_object('success', false, 'message', 'Combo must have at least 2 events');
    END IF;

    -- Validate all events exist and are SOLO type
    FOREACH v_event_id IN ARRAY p_event_ids
    LOOP
        SELECT event_type INTO v_event_type 
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
-- RPC: Delete Combo (with safety check)
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_combo(p_combo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_purchase_count INTEGER;
BEGIN
    -- Check if combo has any paid purchases
    SELECT COUNT(*) INTO v_purchase_count
    FROM public.combo_purchases
    WHERE combo_id = p_combo_id AND payment_status = 'PAID';

    IF v_purchase_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot delete combo with existing purchases. Deactivate instead.'
        );
    END IF;

    -- Delete combo (cascade will delete combo_items)
    DELETE FROM public.combos WHERE id = p_combo_id;

    RETURN json_build_object('success', true, 'message', 'Combo deleted successfully');

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- RPC: Toggle Combo Active Status
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

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'message', 'Error: ' || SQLERRM);
END;
$$;

-- ============================================
-- RPC: Get Combos with Details (for admin display)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_combos_with_details()
RETURNS TABLE (
    combo_id UUID,
    combo_name TEXT,
    description TEXT,
    price INTEGER,
    is_active BOOLEAN,
    category_quotas JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    event_details JSONB,
    purchase_count BIGINT
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
        c.category_quotas,
        c.created_at,
        c.updated_at,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', ec.id,
                    'name', ec.name,
                    'category', ec.category,
                    'fee', ec.fee
                )
                ORDER BY ec.name
            ) FILTER (WHERE ec.id IS NOT NULL),
            '[]'::json
        )::jsonb AS event_details,
        COUNT(cp.id) FILTER (WHERE cp.payment_status = 'PAID') AS purchase_count
    FROM public.combos c
    LEFT JOIN public.combo_items ci ON c.id = ci.combo_id
    LEFT JOIN public.events_config ec ON ci.event_id = ec.id
    LEFT JOIN public.combo_purchases cp ON c.id = cp.combo_id
    GROUP BY c.id, c.name, c.description, c.price, c.is_active, c.category_quotas, c.created_at, c.updated_at
    ORDER BY c.created_at DESC;
END;
$$;

-- ============================================
-- Grant execute permissions to authenticated users
-- ============================================
GRANT EXECUTE ON FUNCTION public.create_combo TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_combo TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_combo TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_combo_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_combos_with_details TO authenticated;

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================
-- Now you can edit combos in the admin panel!
-- The following operations are now available:
-- 1. ✅ Create new combos
-- 2. ✅ Edit existing combos (name, description, price, events)
-- 3. ✅ Delete combos (if no paid purchases)
-- 4. ✅ Toggle combo active/inactive status
-- 5. ✅ View combo details with purchase counts
-- ============================================
