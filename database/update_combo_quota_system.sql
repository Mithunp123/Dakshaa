-- ============================================
-- UPDATE COMBO SYSTEM TO CATEGORY-QUOTA ONLY
-- Students select events, not admins
-- ============================================

-- Drop old combo_items table (no longer needed)
DROP TABLE IF EXISTS public.combo_items CASCADE;

-- Update combos table structure
ALTER TABLE public.combos 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category_quotas JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_events_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment to explain structure
COMMENT ON COLUMN public.combos.category_quotas IS 'JSON format: {"Technical": 2, "Workshop": 3, "Sports": 1} - defines how many events from each category';
COMMENT ON COLUMN public.combos.total_events_required IS 'Total number of events student must select for this combo';

-- Update combo_purchases table to store student selections
ALTER TABLE public.combo_purchases 
ADD COLUMN IF NOT EXISTS selected_event_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS explosion_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS individual_registration_ids JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.combo_purchases.selected_event_ids IS 'Array of event IDs student selected matching category quotas';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_combos_active ON public.combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_user ON public.combo_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_status ON public.combo_purchases(payment_status);

-- ============================================
-- Helper function: Calculate total events from quotas
-- ============================================
CREATE OR REPLACE FUNCTION calculate_total_events_required()
RETURNS TRIGGER AS $$
DECLARE
    total INTEGER := 0;
    quota_value INTEGER;
BEGIN
    -- Sum all quota values
    FOR quota_value IN 
        SELECT (value::text)::integer 
        FROM jsonb_each(NEW.category_quotas)
        WHERE jsonb_typeof(value) = 'number'
    LOOP
        total := total + quota_value;
    END LOOP;
    
    NEW.total_events_required := total;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_total_events ON public.combos;
CREATE TRIGGER trg_calculate_total_events
BEFORE INSERT OR UPDATE OF category_quotas ON public.combos
FOR EACH ROW
EXECUTE FUNCTION calculate_total_events_required();

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================
-- Now combos work with category quotas only:
-- 1. Admin creates combo with category quotas
-- 2. Student selects events matching quotas
-- 3. System validates and creates registrations
-- ============================================
