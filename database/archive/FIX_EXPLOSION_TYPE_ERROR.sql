-- ============================================
-- FIX: Explosion Function - Type Mismatch Error
-- ============================================
-- Fixes: column "individual_registration_ids" is of type uuid[] but expression is of type jsonb
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
    -- FIX: Use v_registration_ids directly (UUID[]) not to_jsonb()
    UPDATE public.combo_purchases
    SET explosion_completed = TRUE,
        individual_registration_ids = v_registration_ids,  -- ✅ FIXED: No to_jsonb()
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
        'registration_ids', array_to_json(v_registration_ids),  -- ✅ FIXED: Use array_to_json()
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

-- Verify the function was updated
SELECT 'explode_combo_purchase function fixed successfully' as status;
