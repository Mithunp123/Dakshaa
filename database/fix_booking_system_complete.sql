-- ============================================================
-- COMPLETE BOOKING SYSTEM FIX FOR FEBRUARY 12-14, 2026
-- This script will clean up ALL old references and set up new ones
-- ============================================================

-- Step 1: Drop old indexes that reference old columns
DROP INDEX IF EXISTS idx_accommodation_march_28;
DROP INDEX IF EXISTS idx_lunch_bookings_march_28;
DROP INDEX IF EXISTS idx_lunch_bookings_march_29;

-- Step 2: Drop old columns from accommodation_requests
ALTER TABLE accommodation_requests DROP COLUMN IF EXISTS march_28_accommodation;

-- Step 3: Drop old columns from lunch_bookings
ALTER TABLE lunch_bookings DROP COLUMN IF EXISTS march_28_lunch;
ALTER TABLE lunch_bookings DROP COLUMN IF EXISTS march_29_lunch;

-- Step 4: Add new columns for February 12, 13, 14 to accommodation_requests
ALTER TABLE accommodation_requests 
ADD COLUMN IF NOT EXISTS february_12_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_13_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_14_accommodation BOOLEAN DEFAULT false;

-- Step 5: Add new columns for February 12, 13, 14 to lunch_bookings
ALTER TABLE lunch_bookings 
ADD COLUMN IF NOT EXISTS february_12_lunch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_13_lunch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_14_lunch BOOLEAN DEFAULT false;

-- Step 6: Create new indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accommodation_feb_12 ON public.accommodation_requests(february_12_accommodation);
CREATE INDEX IF NOT EXISTS idx_accommodation_feb_13 ON public.accommodation_requests(february_13_accommodation);
CREATE INDEX IF NOT EXISTS idx_accommodation_feb_14 ON public.accommodation_requests(february_14_accommodation);

CREATE INDEX IF NOT EXISTS idx_lunch_bookings_feb_12 ON public.lunch_bookings(february_12_lunch);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_feb_13 ON public.lunch_bookings(february_13_lunch);
CREATE INDEX IF NOT EXISTS idx_lunch_bookings_feb_14 ON public.lunch_bookings(february_14_lunch);

-- Step 7: Refresh the schema cache (important for PostgREST)
NOTIFY pgrst, 'reload schema';

-- Verification queries
SELECT 'Accommodation columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'accommodation_requests' 
  AND (column_name LIKE 'february_%' OR column_name LIKE 'march_%')
ORDER BY column_name;

SELECT 'Lunch booking columns:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'lunch_bookings' 
  AND (column_name LIKE 'february_%' OR column_name LIKE 'march_%')
ORDER BY column_name;

SELECT 'Indexes:' as info;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('accommodation_requests', 'lunch_bookings')
  AND (indexname LIKE '%feb%' OR indexname LIKE '%march%')
ORDER BY tablename, indexname;
