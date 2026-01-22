-- =====================================================
-- Drop Triggers Preventing Multiple Bookings
-- =====================================================
-- Remove any triggers that prevent users from modifying bookings
-- =====================================================

-- Drop the specific triggers that raise the P0001 error
DROP TRIGGER IF EXISTS trigger_check_duplicate_accommodation ON accommodation_requests;
DROP TRIGGER IF EXISTS trigger_check_duplicate_lunch_booking ON lunch_bookings;
DROP TRIGGER IF EXISTS trigger_check_duplicate_lunch ON lunch_bookings;

-- Drop any other similar triggers
DROP TRIGGER IF EXISTS prevent_duplicate_accommodation ON accommodation_requests;
DROP TRIGGER IF EXISTS prevent_duplicate_lunch ON lunch_bookings;

-- Now drop the functions (after triggers are removed)
DROP FUNCTION IF EXISTS check_duplicate_accommodation() CASCADE;
DROP FUNCTION IF EXISTS check_duplicate_lunch_booking() CASCADE;
DROP FUNCTION IF EXISTS check_accommodation_duplicate() CASCADE;
DROP FUNCTION IF EXISTS check_lunch_duplicate() CASCADE;

-- List all remaining triggers for verification
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('accommodation_requests', 'lunch_bookings')
ORDER BY event_object_table, trigger_name;
