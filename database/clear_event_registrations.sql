-- ============================================================
-- Clear Event Registrations - Use for Testing/Reset
-- ============================================================

-- ⚠️ WARNING: These queries will DELETE data permanently!
-- Use with caution and only in development/testing environments

-- ============================================================
-- Option 1: Clear ALL Event Registrations (Nuclear Option)
-- ============================================================

-- Delete all event registrations
DELETE FROM event_registrations_config;

-- Delete all payment transactions related to events
DELETE FROM payment_transactions WHERE booking_type = 'event';

-- ============================================================
-- Option 2: Clear Event Registrations for Specific User
-- ============================================================

-- Replace 'YOUR_USER_ID' with actual user ID
DELETE FROM event_registrations_config 
WHERE user_id = 'YOUR_USER_ID';

DELETE FROM payment_transactions 
WHERE user_id = 'YOUR_USER_ID' AND booking_type = 'event';

-- ============================================================
-- Option 3: Clear Only PENDING Payment Registrations
-- ============================================================

-- Delete registrations with pending payments
DELETE FROM event_registrations_config 
WHERE payment_status = 'PENDING';

-- Delete pending payment transactions
DELETE FROM payment_transactions 
WHERE status IN ('INITIATED', 'PENDING') AND booking_type = 'event';

-- ============================================================
-- Option 4: Clear Registrations for Specific Event
-- ============================================================

-- Replace EVENT_ID with actual event ID
DELETE FROM event_registrations_config 
WHERE event_id = EVENT_ID;

-- ============================================================
-- Option 5: Clear Failed/Abandoned Payments (Safe Cleanup)
-- ============================================================

-- Delete registrations where payment failed or was abandoned (older than 30 minutes)
DELETE FROM event_registrations_config 
WHERE payment_status = 'PENDING' 
AND created_at < NOW() - INTERVAL '30 minutes';

-- Delete old pending payment transactions
DELETE FROM payment_transactions 
WHERE status IN ('INITIATED', 'PENDING', 'FAILED') 
AND booking_type = 'event'
AND created_at < NOW() - INTERVAL '30 minutes';

-- ============================================================
-- Verification Queries (Run AFTER cleanup to verify)
-- ============================================================

-- Check remaining event registrations
SELECT 
    COUNT(*) as total_registrations,
    payment_status,
    COUNT(DISTINCT user_id) as unique_users
FROM event_registrations_config 
GROUP BY payment_status;

-- Check remaining payment transactions
SELECT 
    COUNT(*) as total_transactions,
    status,
    booking_type
FROM payment_transactions 
GROUP BY status, booking_type;

-- Check event registration counts
SELECT 
    e.event_name,
    e.capacity,
    COUNT(erc.id) as current_registrations,
    e.capacity - COUNT(erc.id) as available_slots
FROM events e
LEFT JOIN event_registrations_config erc ON e.id = erc.event_id
WHERE erc.payment_status = 'PAID' OR erc.payment_status IS NULL
GROUP BY e.id, e.event_name, e.capacity
ORDER BY e.event_name;
