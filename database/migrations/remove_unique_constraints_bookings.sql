-- =====================================================
-- Remove UNIQUE Constraint to Allow Booking Modifications
-- =====================================================
-- This allows users to update/extend their bookings
-- We'll handle duplicates in application logic instead
-- =====================================================

-- Drop UNIQUE constraint on accommodation_requests
ALTER TABLE accommodation_requests 
DROP CONSTRAINT IF EXISTS accommodation_requests_user_id_key;

-- Drop UNIQUE constraint on lunch_bookings
ALTER TABLE lunch_bookings 
DROP CONSTRAINT IF EXISTS lunch_bookings_user_id_key;

-- Note: Users can now have multiple bookings
-- The application will handle preventing true duplicates
-- and allow modifications/extensions of existing bookings
