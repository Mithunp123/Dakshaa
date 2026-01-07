-- ============================================================
-- FIX: Add combo_purchase_id column to event_registrations_config
-- Issue: Combo explosion fails with "column combo_purchase_id does not exist"
-- Date: January 7, 2026
-- ============================================================

-- Check if column exists before adding
DO $$ 
BEGIN
    -- Add combo_purchase_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_registrations_config' 
        AND column_name = 'combo_purchase_id'
    ) THEN
        ALTER TABLE public.event_registrations_config
        ADD COLUMN combo_purchase_id UUID;
        
        -- Add comment
        COMMENT ON COLUMN public.event_registrations_config.combo_purchase_id IS 
        'Links to combo_purchases table if registration came from a combo purchase';
        
        RAISE NOTICE 'Added combo_purchase_id column to event_registrations_config';
    ELSE
        RAISE NOTICE 'Column combo_purchase_id already exists in event_registrations_config';
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_reg_combo_purchase_id 
ON public.event_registrations_config(combo_purchase_id)
WHERE combo_purchase_id IS NOT NULL;

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_registrations_config' 
        AND column_name = 'combo_purchase_id'
    ) THEN
        RAISE NOTICE '✅ SUCCESS: combo_purchase_id column exists in event_registrations_config';
    ELSE
        RAISE EXCEPTION '❌ FAILED: combo_purchase_id column was not added';
    END IF;
END $$;

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'event_registrations_config'
ORDER BY ordinal_position;
