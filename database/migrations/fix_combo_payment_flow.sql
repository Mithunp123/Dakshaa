-- ============================================================
-- FIX: Allow combo retry when payment is PENDING
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop all existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS public.create_combo_purchase(UUID, UUID, JSONB);
DROP FUNCTION IF EXISTS public.create_combo_purchase(UUID, UUID, UUID[]);

-- Create the function with UUID[] parameter (matches frontend call)
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

    -- Delete any existing PENDING purchases for this combo (allows retry like individual events)
    -- This MUST happen BEFORE the PAID check
    DELETE FROM public.combo_purchases
    WHERE user_id = p_user_id 
    AND combo_id = p_combo_id
    AND payment_status = 'PENDING';
    
    -- Only block if user has a PAID purchase (not PENDING)
    IF EXISTS (
        SELECT 1 FROM public.combo_purchases
        WHERE user_id = p_user_id AND combo_id = p_combo_id
        AND payment_status = 'PAID'
    ) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Already purchased this combo or payment pending'
        );
    END IF;

    -- Validate event selection (skip if function doesn't exist)
    BEGIN
        v_validation_result := public.validate_combo_selection(p_combo_id, p_selected_event_ids);
        
        IF NOT (v_validation_result->>'valid')::boolean THEN
            RETURN json_build_object(
                'success', false,
                'message', 'Invalid event selection',
                'validation_errors', v_validation_result->'errors'
            );
        END IF;
    EXCEPTION
        WHEN undefined_function THEN
            -- Validation function doesn't exist, skip validation
            NULL;
    END;

    -- Create new combo purchase record with PENDING status
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

-- Verify the fix
SELECT 'Function updated successfully' as status;
