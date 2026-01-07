-- ============================================================
-- UPDATE ACCOMMODATION AND LUNCH BOOKING DATES
-- Migration from March 28-29 to February 12-14, 2026
-- ============================================================

-- Step 1: Add new columns for February 12, 13, 14 to accommodation_requests
ALTER TABLE accommodation_requests 
ADD COLUMN IF NOT EXISTS february_12_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_13_accommodation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_14_accommodation BOOLEAN DEFAULT false;

-- Step 2: Add new columns for February 12, 13, 14 to lunch_bookings
ALTER TABLE lunch_bookings 
ADD COLUMN IF NOT EXISTS february_12_lunch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_13_lunch BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS february_14_lunch BOOLEAN DEFAULT false;

-- Step 3: Drop old columns from accommodation_requests
ALTER TABLE accommodation_requests DROP COLUMN IF EXISTS march_28_accommodation;

-- Step 4: Drop old columns from lunch_bookings
ALTER TABLE lunch_bookings DROP COLUMN IF EXISTS march_28_lunch;
ALTER TABLE lunch_bookings DROP COLUMN IF EXISTS march_29_lunch;

-- Verification queries
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accommodation_requests' 
  AND column_name LIKE 'february_%'
ORDER BY column_name;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lunch_bookings' 
  AND column_name LIKE 'february_%'
ORDER BY column_name;
