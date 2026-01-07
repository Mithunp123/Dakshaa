-- ============================================================
-- FIX COMBO PENDING PURCHASES
-- Allows re-attempting combo purchase by cleaning stale PENDING records
-- ============================================================

-- Option 1: Clean up all PENDING combo purchases older than 30 minutes (run manually when needed)
-- DELETE FROM combo_purchases 
-- WHERE payment_status = 'PENDING' 
-- AND purchased_at < NOW() - INTERVAL '30 minutes';

-- Option 2: Replace the create_combo_purchase function to handle PENDING records gracefully
CREATE OR REPLACE FUNCTION public.create_combo_purchase(
    p_combo_id UUID,
    p_user_id UUID,
    p_selected_event_ids UUID[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo RECORD;
    v_purchase_id UUID;
    v_existing_purchase_id UUID;
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

    -- Check if user already has a PAID purchase for this combo
    IF EXISTS (
        SELECT 1 FROM public.combo_purchases
        WHERE user_id = p_user_id AND combo_id = p_combo_id
        AND payment_status = 'PAID'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'You have already purchased this combo'
        );
    END IF;
    
    -- Delete any existing PENDING purchases for this combo (allows retry)
    DELETE FROM public.combo_purchases
    WHERE user_id = p_user_id 
    AND combo_id = p_combo_id
    AND payment_status = 'PENDING';

    -- Validate event selection
    v_validation_result := public.validate_combo_selection(p_combo_id, p_selected_event_ids);

    IF NOT (v_validation_result->>'valid')::boolean THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid event selection',
            'validation_errors', v_validation_result->'errors'
        );
    END IF;

    -- Create new combo purchase record
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
        to_jsonb(p_selected_event_ids)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_combo_purchase(UUID, UUID, UUID[]) TO authenticated;

-- Quick fix: Clean up the current user's PENDING purchases
-- Run this in SQL editor with your user_id to immediately fix:
-- DELETE FROM combo_purchases WHERE user_id = 'YOUR_USER_ID' AND payment_status = 'PENDING';

-- Verify the function was updated
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'create_combo_purchase';
