-- ============================================
-- FIX: Migrate Combos Table from Legacy to Modern Schema
-- ============================================
-- This script fixes the "column 'id' does not exist" error
-- by migrating from combo_id (TEXT) to id (UUID)
-- ============================================

-- Step 1: Backup existing data (if any)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'combos') THEN
        
        -- Create backup table
        DROP TABLE IF EXISTS combos_backup;
        CREATE TABLE combos_backup AS SELECT * FROM combos;
        
        RAISE NOTICE 'Backup created: % rows backed up', 
            (SELECT COUNT(*) FROM combos_backup);
    END IF;
END $$;

-- Step 2: Drop dependent tables (CASCADE)
DROP TABLE IF EXISTS combo_event_selections CASCADE;
DROP TABLE IF EXISTS combo_purchases CASCADE;
DROP TABLE IF EXISTS combo_items CASCADE;
DROP TABLE IF EXISTS combo_rules CASCADE;
DROP TABLE IF EXISTS combos CASCADE;

-- Step 3: Create Modern Combos Table
CREATE TABLE public.combos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    original_price INTEGER,
    discount_percentage INTEGER DEFAULT 0,
    category_quotas JSONB DEFAULT '{}'::jsonb,
    total_events_required INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    max_purchases INTEGER DEFAULT 100,
    current_purchases INTEGER DEFAULT 0,
    badge_text TEXT,
    badge_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Step 4: Restore data from backup (if any)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'combos_backup') THEN
        
        -- Check if backup has data
        IF (SELECT COUNT(*) FROM combos_backup) > 0 THEN
            INSERT INTO combos (name, price, is_active, created_at)
            SELECT 
                name,
                CASE 
                    WHEN price IS NOT NULL THEN price::integer
                    ELSE 0
                END as price,
                COALESCE(is_active, true),
                COALESCE(created_at, NOW())
            FROM combos_backup;
            
            RAISE NOTICE 'Restored % combos from backup', 
                (SELECT COUNT(*) FROM combos);
        ELSE
            RAISE NOTICE 'No data to restore';
        END IF;
    END IF;
END $$;

-- Step 5: Create combo_purchases table
CREATE TABLE IF NOT EXISTS public.combo_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_event_ids JSONB DEFAULT '[]'::jsonb,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER NOT NULL,
    transaction_id TEXT,
    explosion_completed BOOLEAN DEFAULT FALSE,
    individual_registration_ids UUID[] DEFAULT ARRAY[]::UUID[],
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, combo_id)
);

-- Step 6: Create combo_event_selections table
CREATE TABLE IF NOT EXISTS public.combo_event_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_purchase_id UUID NOT NULL REFERENCES public.combo_purchases(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events_config(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    selected_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combo_purchase_id, event_id)
);

-- Step 7: Add missing column to event_registrations_config
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'event_registrations_config'
    ) THEN
        ALTER TABLE public.event_registrations_config 
        ADD COLUMN IF NOT EXISTS combo_purchase_id UUID 
        REFERENCES public.combo_purchases(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_combos_active ON public.combos(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_combos_display_order ON public.combos(display_order);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_combo ON public.combo_purchases(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_user ON public.combo_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_combo_purchases_status ON public.combo_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_combo_selections_purchase ON public.combo_event_selections(combo_purchase_id);
CREATE INDEX IF NOT EXISTS idx_combo_selections_event ON public.combo_event_selections(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_combo_purchase 
ON public.event_registrations_config(combo_purchase_id) 
WHERE combo_purchase_id IS NOT NULL;

-- Step 9: Enable RLS
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_event_selections ENABLE ROW LEVEL SECURITY;

-- Step 10: RLS Policies for combos
DROP POLICY IF EXISTS "Anyone can view active combos" ON public.combos;
CREATE POLICY "Anyone can view active combos"
ON public.combos FOR SELECT
TO authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage combos" ON public.combos;
CREATE POLICY "Admins can manage combos"
ON public.combos FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- Step 11: RLS Policies for combo_purchases
DROP POLICY IF EXISTS "Users can view own combo purchases" ON public.combo_purchases;
CREATE POLICY "Users can view own combo purchases"
ON public.combo_purchases FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own combo purchases" ON public.combo_purchases;
CREATE POLICY "Users can create own combo purchases"
ON public.combo_purchases FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all combo purchases" ON public.combo_purchases;
CREATE POLICY "Admins can view all combo purchases"
ON public.combo_purchases FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
        AND role IN ('super_admin', 'registration_admin')
    )
);

-- Step 12: RLS Policies for combo_event_selections
DROP POLICY IF EXISTS "Users can view own selections" ON public.combo_event_selections;
CREATE POLICY "Users can view own selections"
ON public.combo_event_selections FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.combo_purchases
        WHERE combo_purchases.id = combo_event_selections.combo_purchase_id
        AND combo_purchases.user_id = auth.uid()
    )
);

-- Step 13: Add comments
COMMENT ON TABLE public.combos IS 'Event combo packages with category-based quotas';
COMMENT ON TABLE public.combo_purchases IS 'Student combo purchases with payment tracking';
COMMENT ON TABLE public.combo_event_selections IS 'Audit trail of event selections for combo purchases';

COMMENT ON COLUMN public.combos.category_quotas IS 'JSONB: {"Technical": 2, "Workshop": 3} - events required per category';
COMMENT ON COLUMN public.combos.total_events_required IS 'Auto-calculated sum of all category quotas';
COMMENT ON COLUMN public.combo_purchases.explosion_completed IS 'TRUE after combo exploded into individual event registrations';
COMMENT ON COLUMN public.combo_purchases.individual_registration_ids IS 'Array of UUID references to event_registrations_config';

-- Step 14: Create trigger to auto-calculate total_events_required
CREATE OR REPLACE FUNCTION update_combo_total_events()
RETURNS TRIGGER AS $$
DECLARE
    v_total INTEGER := 0;
    v_category TEXT;
    v_count INTEGER;
BEGIN
    -- Calculate total from category_quotas JSONB
    FOR v_category, v_count IN 
        SELECT key, (value::text)::integer 
        FROM jsonb_each(NEW.category_quotas)
        WHERE jsonb_typeof(value) = 'number' AND (value::text)::integer > 0
    LOOP
        v_total := v_total + v_count;
    END LOOP;
    
    NEW.total_events_required := v_total;
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_combo_total_events ON public.combos;
CREATE TRIGGER trg_update_combo_total_events
BEFORE INSERT OR UPDATE OF category_quotas ON public.combos
FOR EACH ROW
EXECUTE FUNCTION update_combo_total_events();

-- Step 15: Verify migration
DO $$
DECLARE
    v_col_exists BOOLEAN;
BEGIN
    -- Check if 'id' column exists (not 'combo_id')
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'combos'
        AND column_name = 'id'
    ) INTO v_col_exists;
    
    IF v_col_exists THEN
        RAISE NOTICE '✅ SUCCESS: combos table has ''id'' column (UUID)';
    ELSE
        RAISE EXCEPTION '❌ FAILED: combos table missing ''id'' column';
    END IF;
    
    -- Report table statistics
    RAISE NOTICE 'Combos: % rows', (SELECT COUNT(*) FROM combos);
    RAISE NOTICE 'Combo purchases: % rows', (SELECT COUNT(*) FROM combo_purchases);
    RAISE NOTICE 'Combo selections: % rows', (SELECT COUNT(*) FROM combo_event_selections);
END $$;

-- Step 16: Show final structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'combos'
ORDER BY ordinal_position;
