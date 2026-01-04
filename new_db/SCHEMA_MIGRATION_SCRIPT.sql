-- ============================================================
-- DAKSHAA - PRODUCTION SCHEMA MIGRATION SCRIPT
-- Safely converts TEXT-based fields to proper types
-- Date: January 4, 2026
-- ⚠️ IMPORTANT: Test on staging database first!
-- ============================================================

-- ============================================================
-- BACKUP REMINDER
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE '⚠️  CRITICAL: Create database backup before running!';
    RAISE NOTICE '⚠️  Command: pg_dump -U postgres -d dakshaa > backup_$(date +%%Y%%m%%d).sql';
    RAISE NOTICE '⚠️  Press Ctrl+C to cancel if backup not done!';
    RAISE NOTICE '';
    RAISE NOTICE '⏸️  Waiting 10 seconds...';
END $$;

-- Add safety delay (comment out after confirming backup)
-- SELECT pg_sleep(10);

-- ============================================================
-- PHASE 1: ADD NEW COLUMNS WITH PROPER TYPES
-- ============================================================

BEGIN;

RAISE NOTICE '📋 PHASE 1: Adding new columns with proper types...';

-- EVENTS TABLE: Add proper type columns
ALTER TABLE events
ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS capacity_int INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS current_registrations_int INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_team_size_int INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_team_size_int INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_team_event_bool BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active_bool BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_open_bool BOOLEAN DEFAULT true;

RAISE NOTICE '✅ Events table: New columns added';

-- EVENT_REGISTRATIONS_CONFIG: Add missing columns
ALTER TABLE event_registrations_config
ADD COLUMN IF NOT EXISTS combo_purchase_id UUID REFERENCES combo_purchases(id),
ADD COLUMN IF NOT EXISTS payment_amount_numeric NUMERIC(10, 2);

RAISE NOTICE '✅ Event registrations config: Missing columns added';

-- COMBOS TABLE: Add proper type columns
ALTER TABLE combos
ADD COLUMN IF NOT EXISTS price_numeric NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage_numeric NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_purchases_int INTEGER DEFAULT 100;

RAISE NOTICE '✅ Combos table: New columns added';

-- COMBO_PURCHASES: Add missing columns
ALTER TABLE combo_purchases
ADD COLUMN IF NOT EXISTS explosion_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS individual_registration_ids UUID[];

RAISE NOTICE '✅ Combo purchases: Missing columns added';

COMMIT;

-- ============================================================
-- PHASE 2: MIGRATE DATA FROM TEXT TO PROPER TYPES
-- ============================================================

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '📋 PHASE 2: Migrating data to new columns...';

-- EVENTS: Migrate data
UPDATE events
SET 
    price_numeric = CASE 
        WHEN price ~ '^[0-9]+(\.[0-9]+)?$' THEN price::numeric 
        ELSE 0 
    END,
    capacity_int = CASE 
        WHEN capacity ~ '^[0-9]+$' THEN capacity::integer 
        ELSE 100 
    END,
    current_registrations_int = CASE 
        WHEN current_registrations ~ '^[0-9]+$' THEN current_registrations::integer 
        ELSE 0 
    END,
    min_team_size_int = CASE 
        WHEN min_team_size ~ '^[0-9]+$' THEN min_team_size::integer 
        ELSE 1 
    END,
    max_team_size_int = CASE 
        WHEN max_team_size ~ '^[0-9]+$' THEN max_team_size::integer 
        ELSE 10 
    END,
    is_team_event_bool = CASE 
        WHEN lower(is_team_event) = 'true' THEN true 
        ELSE false 
    END,
    is_active_bool = CASE 
        WHEN lower(is_active) = 'true' THEN true 
        ELSE false 
    END,
    is_open_bool = CASE 
        WHEN lower(is_open) = 'true' THEN true 
        ELSE false 
    END;

RAISE NOTICE '✅ Events: %s rows migrated', (SELECT COUNT(*) FROM events);

-- EVENT_REGISTRATIONS_CONFIG: Migrate payment amount
UPDATE event_registrations_config
SET payment_amount_numeric = CASE 
    WHEN payment_amount ~ '^[0-9]+(\.[0-9]+)?$' THEN payment_amount::numeric 
    ELSE 0 
END
WHERE payment_amount IS NOT NULL;

RAISE NOTICE '✅ Event registrations: %s rows migrated', (SELECT COUNT(*) FROM event_registrations_config WHERE payment_amount IS NOT NULL);

-- COMBOS: Migrate data
UPDATE combos
SET 
    price_numeric = CASE 
        WHEN price ~ '^[0-9]+(\.[0-9]+)?$' THEN price::numeric 
        ELSE 0 
    END,
    discount_percentage_numeric = CASE 
        WHEN discount_percentage ~ '^[0-9]+(\.[0-9]+)?$' THEN discount_percentage::numeric 
        ELSE 0 
    END,
    max_purchases_int = CASE 
        WHEN max_purchases ~ '^[0-9]+$' THEN max_purchases::integer 
        ELSE 100 
    END;

RAISE NOTICE '✅ Combos: %s rows migrated', (SELECT COUNT(*) FROM combos);

COMMIT;

-- ============================================================
-- PHASE 3: DROP OLD TEXT COLUMNS & RENAME NEW ONES
-- ============================================================

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '📋 PHASE 3: Replacing old columns with new ones...';

-- EVENTS TABLE
ALTER TABLE events
DROP COLUMN IF EXISTS price CASCADE,
DROP COLUMN IF EXISTS capacity CASCADE,
DROP COLUMN IF EXISTS current_registrations CASCADE,
DROP COLUMN IF EXISTS min_team_size CASCADE,
DROP COLUMN IF EXISTS max_team_size CASCADE,
DROP COLUMN IF EXISTS is_team_event CASCADE,
DROP COLUMN IF EXISTS is_active CASCADE,
DROP COLUMN IF EXISTS is_open CASCADE;

ALTER TABLE events
RENAME COLUMN price_numeric TO price;
ALTER TABLE events
RENAME COLUMN capacity_int TO capacity;
ALTER TABLE events
RENAME COLUMN current_registrations_int TO current_registrations;
ALTER TABLE events
RENAME COLUMN min_team_size_int TO min_team_size;
ALTER TABLE events
RENAME COLUMN max_team_size_int TO max_team_size;
ALTER TABLE events
RENAME COLUMN is_team_event_bool TO is_team_event;
ALTER TABLE events
RENAME COLUMN is_active_bool TO is_active;
ALTER TABLE events
RENAME COLUMN is_open_bool TO is_open;

RAISE NOTICE '✅ Events: Old columns dropped, new columns renamed';

-- EVENT_REGISTRATIONS_CONFIG
ALTER TABLE event_registrations_config
DROP COLUMN IF EXISTS payment_amount CASCADE;

ALTER TABLE event_registrations_config
RENAME COLUMN payment_amount_numeric TO payment_amount;

RAISE NOTICE '✅ Event registrations: Payment amount converted';

-- COMBOS TABLE
ALTER TABLE combos
DROP COLUMN IF EXISTS price CASCADE,
DROP COLUMN IF EXISTS discount_percentage CASCADE,
DROP COLUMN IF EXISTS max_purchases CASCADE;

ALTER TABLE combos
RENAME COLUMN price_numeric TO price;
ALTER TABLE combos
RENAME COLUMN discount_percentage_numeric TO discount_percentage;
ALTER TABLE combos
RENAME COLUMN max_purchases_int TO max_purchases;

RAISE NOTICE '✅ Combos: Old columns dropped, new columns renamed';

COMMIT;

-- ============================================================
-- PHASE 4: ADD CONSTRAINTS & INDEXES
-- ============================================================

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '📋 PHASE 4: Adding constraints and indexes...';

-- EVENTS: Add constraints
ALTER TABLE events
ALTER COLUMN price SET NOT NULL,
ALTER COLUMN price SET DEFAULT 0,
ALTER COLUMN capacity SET NOT NULL,
ALTER COLUMN capacity SET DEFAULT 100,
ALTER COLUMN current_registrations SET NOT NULL,
ALTER COLUMN current_registrations SET DEFAULT 0,
ALTER COLUMN is_team_event SET NOT NULL,
ALTER COLUMN is_team_event SET DEFAULT false,
ALTER COLUMN is_active SET NOT NULL,
ALTER COLUMN is_active SET DEFAULT true,
ALTER COLUMN is_open SET NOT NULL,
ALTER COLUMN is_open SET DEFAULT true;

-- Add check constraints
ALTER TABLE events
ADD CONSTRAINT check_price_positive CHECK (price >= 0),
ADD CONSTRAINT check_capacity_positive CHECK (capacity > 0),
ADD CONSTRAINT check_registrations_valid CHECK (current_registrations >= 0),
ADD CONSTRAINT check_team_size_valid CHECK (min_team_size >= 1 AND max_team_size >= min_team_size);

RAISE NOTICE '✅ Events: Constraints added';

-- EVENT_REGISTRATIONS_CONFIG: Add constraints
ALTER TABLE event_registrations_config
ALTER COLUMN payment_amount SET DEFAULT 0;

ALTER TABLE event_registrations_config
ADD CONSTRAINT check_payment_amount_positive CHECK (payment_amount >= 0);

RAISE NOTICE '✅ Event registrations: Constraints added';

-- COMBOS: Add constraints
ALTER TABLE combos
ALTER COLUMN price SET NOT NULL,
ALTER COLUMN price SET DEFAULT 0,
ALTER COLUMN discount_percentage SET DEFAULT 0,
ALTER COLUMN max_purchases SET DEFAULT 100;

ALTER TABLE combos
ADD CONSTRAINT check_combo_price_positive CHECK (price >= 0),
ADD CONSTRAINT check_discount_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD CONSTRAINT check_max_purchases_positive CHECK (max_purchases > 0);

RAISE NOTICE '✅ Combos: Constraints added';

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_events_price ON events(price);
CREATE INDEX IF NOT EXISTS idx_events_capacity ON events(capacity);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_is_open ON events(is_open);
CREATE INDEX IF NOT EXISTS idx_events_is_team_event ON events(is_team_event);
CREATE INDEX IF NOT EXISTS idx_event_registrations_combo_purchase ON event_registrations_config(combo_purchase_id);

RAISE NOTICE '✅ Indexes created';

COMMIT;

-- ============================================================
-- PHASE 5: UPDATE RLS POLICIES (if needed)
-- ============================================================

BEGIN;

RAISE NOTICE '';
RAISE NOTICE '📋 PHASE 5: Updating RLS policies...';

-- Drop old policies if they reference old column types
DROP POLICY IF EXISTS "Users can view active events" ON events;
DROP POLICY IF EXISTS "Users can register for events" ON event_registrations_config;

-- Create updated policies
CREATE POLICY "Users can view active events"
ON events FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can register for events"
ON event_registrations_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

RAISE NOTICE '✅ RLS policies updated';

COMMIT;

-- ============================================================
-- PHASE 6: VERIFICATION
-- ============================================================

DO $$
DECLARE
    v_events_count INTEGER;
    v_registrations_count INTEGER;
    v_combos_count INTEGER;
    v_capacity_issues INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 PHASE 6: Verification...';
    RAISE NOTICE '';

    -- Count records
    SELECT COUNT(*) INTO v_events_count FROM events;
    SELECT COUNT(*) INTO v_registrations_count FROM event_registrations_config;
    SELECT COUNT(*) INTO v_combos_count FROM combos;
    
    -- Check for data issues
    SELECT COUNT(*) INTO v_capacity_issues 
    FROM events 
    WHERE current_registrations > capacity;

    RAISE NOTICE '📊 Migration Statistics:';
    RAISE NOTICE '   Events migrated: %', v_events_count;
    RAISE NOTICE '   Registrations migrated: %', v_registrations_count;
    RAISE NOTICE '   Combos migrated: %', v_combos_count;
    RAISE NOTICE '   Capacity issues: %', v_capacity_issues;
    RAISE NOTICE '';

    IF v_capacity_issues > 0 THEN
        RAISE WARNING '⚠️  % events have more registrations than capacity!', v_capacity_issues;
    END IF;

    -- Sample data check
    RAISE NOTICE '📋 Sample Event Data (first 3 rows):';
    FOR rec IN 
        SELECT name, price, capacity, current_registrations, is_team_event, is_active
        FROM events
        LIMIT 3
    LOOP
        RAISE NOTICE '   % | Price: % | Capacity: % | Registered: % | Team: % | Active: %',
            rec.name, rec.price, rec.capacity, rec.current_registrations, rec.is_team_event, rec.is_active;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '   1. Deploy RPC functions: psql < EVENT_REGISTRATION_RPC_FUNCTIONS.sql';
    RAISE NOTICE '   2. Update frontend services to use new types';
    RAISE NOTICE '   3. Test registration flow end-to-end';
    RAISE NOTICE '   4. Monitor application logs for errors';
END $$;

-- ============================================================
-- ROLLBACK INSTRUCTIONS (In case of issues)
-- ============================================================

/*
⚠️  IF MIGRATION FAILS, ROLLBACK WITH:

-- Restore from backup
psql -U postgres -d dakshaa < backup_YYYYMMDD.sql

-- OR Manual rollback:
BEGIN;
-- Add back TEXT columns
ALTER TABLE events
ADD COLUMN price TEXT,
ADD COLUMN capacity TEXT,
ADD COLUMN current_registrations TEXT,
ADD COLUMN is_team_event TEXT,
ADD COLUMN is_active TEXT,
ADD COLUMN is_open TEXT;

-- Copy data back
UPDATE events SET
    price = price_numeric::text,
    capacity = capacity_int::text,
    current_registrations = current_registrations_int::text,
    is_team_event = is_team_event_bool::text,
    is_active = is_active_bool::text,
    is_open = is_open_bool::text;

-- Drop new columns
ALTER TABLE events
DROP COLUMN price_numeric,
DROP COLUMN capacity_int,
DROP COLUMN current_registrations_int,
DROP COLUMN is_team_event_bool,
DROP COLUMN is_active_bool,
DROP COLUMN is_open_bool;

COMMIT;
*/
