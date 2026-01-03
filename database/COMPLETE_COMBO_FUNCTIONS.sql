-- ============================================
-- COMPLETE FIX: All Missing Combo Functions
-- ============================================
-- This includes toggle_combo_status, delete_combo, and update current_purchases
-- ============================================

-- Function 1: Toggle Combo Active Status
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

-- Function 2: Delete Combo
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

-- Function 3: Get Combo Purchase Count
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

-- Create/Update View: combos_with_stats (for dynamic counts)
CREATE OR REPLACE VIEW public.combos_with_stats AS
SELECT 
    c.*,
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.combo_purchases cp 
         WHERE cp.combo_id = c.id 
         AND cp.payment_status = 'PAID'), 
        0
    ) as total_purchases,
    COALESCE(
        (SELECT COUNT(*) 
         FROM public.combo_purchases cp 
         WHERE cp.combo_id = c.id 
         AND cp.payment_status = 'PENDING'), 
        0
    ) as pending_purchases,
    -- Calculate availability
    CASE 
        WHEN c.max_purchases IS NULL THEN true
        WHEN COALESCE(
            (SELECT COUNT(*) 
             FROM public.combo_purchases cp 
             WHERE cp.combo_id = c.id 
             AND cp.payment_status IN ('PAID', 'PENDING')), 
            0
        ) < c.max_purchases THEN true
        ELSE false
    END as is_available
FROM public.combos c;

-- Grant permissions
GRANT SELECT ON public.combos_with_stats TO authenticated;

-- Create trigger to update current_purchases column automatically
CREATE OR REPLACE FUNCTION update_combo_current_purchases()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the combo's current_purchases count
    UPDATE public.combos
    SET current_purchases = (
        SELECT COUNT(*)
        FROM public.combo_purchases
        WHERE combo_id = NEW.combo_id
        AND payment_status = 'PAID'
    )
    WHERE id = NEW.combo_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_combo_purchases ON public.combo_purchases;

-- Create trigger on combo_purchases
CREATE TRIGGER trg_update_combo_purchases
AFTER INSERT OR UPDATE OF payment_status ON public.combo_purchases
FOR EACH ROW
WHEN (NEW.payment_status = 'PAID')
EXECUTE FUNCTION update_combo_current_purchases();

-- Initial update of all current_purchases counts
UPDATE public.combos c
SET current_purchases = (
    SELECT COUNT(*)
    FROM public.combo_purchases cp
    WHERE cp.combo_id = c.id
    AND cp.payment_status = 'PAID'
);

-- Comments
COMMENT ON FUNCTION public.toggle_combo_status IS 'Toggle combo active/inactive status';
COMMENT ON FUNCTION public.delete_combo IS 'Delete combo if no purchases exist';
COMMENT ON FUNCTION public.get_combo_purchase_count IS 'Get total paid purchases for a combo';
COMMENT ON VIEW public.combos_with_stats IS 'Combos with computed purchase statistics and availability';
COMMENT ON FUNCTION update_combo_current_purchases IS 'Auto-update combo current_purchases when payment is completed';

-- Verify functions were created
SELECT 
    routine_name,
    routine_type,
    'Function created successfully' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('toggle_combo_status', 'delete_combo', 'get_combo_purchase_count', 'update_combo_current_purchases')
ORDER BY routine_name;

-- Verify view was created
SELECT 
    table_name,
    'View created successfully' as status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name = 'combos_with_stats';

-- Test the view
SELECT 
    name,
    price,
    current_purchases,
    total_purchases,
    pending_purchases,
    is_available,
    is_active
FROM public.combos_with_stats
LIMIT 5;
