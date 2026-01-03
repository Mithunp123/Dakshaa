-- ============================================
-- Missing RPC Functions for Combo Management
-- ============================================
-- This adds the missing toggle_combo_status function
-- and other helper functions
-- ============================================

-- Function: Toggle Combo Active Status
CREATE OR REPLACE FUNCTION public.toggle_combo_status(
    p_combo_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_status BOOLEAN;
BEGIN
    -- Check if combo exists
    IF NOT EXISTS (SELECT 1 FROM public.combos WHERE id = p_combo_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo not found'
        );
    END IF;

    -- Toggle the status
    UPDATE public.combos
    SET 
        is_active = NOT is_active,
        updated_at = NOW()
    WHERE id = p_combo_id
    RETURNING is_active INTO v_new_status;

    RETURN json_build_object(
        'success', true,
        'is_active', v_new_status,
        'message', CASE 
            WHEN v_new_status THEN 'Combo activated'
            ELSE 'Combo deactivated'
        END
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- Function: Delete Combo
CREATE OR REPLACE FUNCTION public.delete_combo(
    p_combo_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if combo exists
    IF NOT EXISTS (SELECT 1 FROM public.combos WHERE id = p_combo_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Combo not found'
        );
    END IF;

    -- Check if combo has any purchases
    IF EXISTS (SELECT 1 FROM public.combo_purchases WHERE combo_id = p_combo_id) THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Cannot delete combo with existing purchases. Deactivate it instead.'
        );
    END IF;

    -- Delete the combo (CASCADE will handle related records)
    DELETE FROM public.combos WHERE id = p_combo_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Combo deleted successfully'
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Error: ' || SQLERRM
        );
END;
$$;

-- Function: Get Total Purchases for a Combo
CREATE OR REPLACE FUNCTION public.get_combo_purchase_count(
    p_combo_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_count
    FROM public.combo_purchases
    WHERE combo_id = p_combo_id
    AND payment_status = 'PAID';

    RETURN COALESCE(v_count, 0);
END;
$$;

-- Add computed column for total_purchases
-- This creates a view that includes purchase counts
CREATE OR REPLACE VIEW public.combos_with_stats AS
SELECT 
    c.*,
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.combo_purchases cp 
         WHERE cp.combo_id = c.id 
         AND cp.payment_status = 'PAID'), 
        0
    ) as total_purchases
FROM public.combos c;

-- Grant permissions
GRANT SELECT ON public.combos_with_stats TO authenticated;

-- Comments
COMMENT ON FUNCTION public.toggle_combo_status IS 'Toggle combo active/inactive status';
COMMENT ON FUNCTION public.delete_combo IS 'Delete combo if no purchases exist';
COMMENT ON FUNCTION public.get_combo_purchase_count IS 'Get total paid purchases for a combo';
COMMENT ON VIEW public.combos_with_stats IS 'Combos with computed purchase statistics';

-- Verify functions were created
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('toggle_combo_status', 'delete_combo', 'get_combo_purchase_count')
ORDER BY routine_name;
