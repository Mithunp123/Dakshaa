-- ============================================
-- FIX: Combo Selection Validation - Case Insensitive Categories
-- ============================================
-- Fixes "Unexpected category: technical" error
-- by making category comparison case-insensitive
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

        -- Increment category count (normalize to lowercase for comparison)
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

    -- Validate counts match quotas (case-insensitive comparison)
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

-- Verify the function was updated
SELECT 'validate_combo_selection function updated successfully' as status;

-- Test with sample data (replace with actual IDs)
-- SELECT public.validate_combo_selection(
--     'your-combo-id'::uuid,
--     '["event-id-1", "event-id-2"]'::jsonb
-- );
