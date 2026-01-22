-- =====================================================
-- Update Existing Bookings to Show Proper Dates
-- =====================================================
-- Run this ONCE to fix your current bookings
-- Replace the user_id with your actual user ID
-- =====================================================

-- For VIKAS T (user_id: 59f67b9c-7baf-45c1-93e0-6fd22330618f)
-- Update accommodation to show February 12
UPDATE accommodation_requests
SET special_requests = '{"dates": ["February 12"]}'
WHERE user_id = '59f67b9c-7baf-45c1-93e0-6fd22330618f'
  AND payment_status = 'PAID';

-- Update lunch to show all 3 dates
UPDATE lunch_bookings
SET booked_dates = 'February 12, February 13, February 14'
WHERE user_id = '59f67b9c-7baf-45c1-93e0-6fd22330618f'
  AND payment_status = 'PAID';

-- Verify the updates
SELECT 
  'Accommodation' as type,
  full_name,
  special_requests,
  number_of_days,
  total_price
FROM accommodation_requests
WHERE user_id = '59f67b9c-7baf-45c1-93e0-6fd22330618f';

SELECT 
  'Lunch' as type,
  full_name,
  booked_dates,
  total_lunches,
  total_price
FROM lunch_bookings
WHERE user_id = '59f67b9c-7baf-45c1-93e0-6fd22330618f';
