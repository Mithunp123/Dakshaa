-- Check actual registration counts in database

-- 1. Get all events with their IDs
SELECT 
    id as uuid_id,
    event_id as text_id,
    name,
    capacity
FROM events
WHERE is_active = true
ORDER BY name;

-- 2. Get count of PAID registrations per event
SELECT 
    event_id,
    event_name,
    COUNT(*) as registration_count
FROM event_registrations_config
WHERE payment_status = 'PAID'
GROUP BY event_id, event_name
ORDER BY registration_count DESC;

-- 3. Get detailed view matching events with their registration counts
SELECT 
    e.name as event_name,
    e.id as event_uuid_id,
    e.event_id as event_text_id,
    COUNT(r.id) as paid_registrations,
    e.capacity
FROM events e
LEFT JOIN event_registrations_config r 
    ON r.event_id = e.id AND r.payment_status = 'PAID'
WHERE e.is_active = true
GROUP BY e.id, e.event_id, e.name, e.capacity
ORDER BY paid_registrations DESC;
