-- ============================================
-- RESTORE STUDENT REGISTRATIONS
-- Run this in Supabase SQL Editor
-- ============================================
-- This script will help you:
-- 1. View all students in the system
-- 2. View all events available
-- 3. Register students for events
-- ============================================

-- ============================================
-- STEP 1: VIEW ALL STUDENTS IN THE SYSTEM
-- ============================================
SELECT 
    id,
    full_name,
    email,
    role,
    college_name,
    department,
    mobile_number
FROM profiles
WHERE role = 'student' OR role IS NULL
ORDER BY full_name;

-- ============================================
-- STEP 2: VIEW ALL AVAILABLE EVENTS
-- ============================================
SELECT 
    id as event_uuid,
    event_key,
    name,
    category,
    price,
    capacity
FROM events_config
WHERE is_open = true
ORDER BY category, name;

-- ============================================
-- STEP 3: VIEW CURRENT REGISTRATIONS (if any)
-- ============================================
SELECT 
    p.full_name,
    p.email,
    r.event_name,
    r.payment_status,
    r.registered_at
FROM event_registrations_config r
JOIN profiles p ON r.user_id = p.id
ORDER BY r.registered_at DESC;

-- ============================================
-- STEP 4: REGISTER A STUDENT FOR AN EVENT
-- Replace 'STUDENT_EMAIL' and 'EVENT_KEY' with actual values
-- ============================================
/*
-- Example: Register john@example.com for CSE Technical Quiz (tech-cse)
INSERT INTO event_registrations_config (user_id, event_id, event_name, payment_status)
SELECT 
    p.id,
    e.id,
    e.name,
    'PAID'
FROM profiles p, events_config e
WHERE p.email = 'john@example.com'
  AND e.event_key = 'tech-cse'
ON CONFLICT (user_id, event_id) DO NOTHING;
*/

-- ============================================
-- STEP 5: BULK REGISTER - Register ALL students for specific events
-- Uncomment and run as needed
-- ============================================

-- Register all students for the Conference (free event)
/*
INSERT INTO event_registrations_config (user_id, event_id, event_name, payment_status)
SELECT 
    p.id,
    e.id,
    e.name,
    'PAID'
FROM profiles p
CROSS JOIN events_config e
WHERE (p.role = 'student' OR p.role IS NULL)
  AND e.event_key = 'conference'
ON CONFLICT (user_id, event_id) DO NOTHING;
*/

-- ============================================
-- STEP 6: RESTORE COORDINATOR EVENT ASSIGNMENTS
-- If coordinators lost their event assignments
-- ============================================

-- View all coordinators
SELECT 
    id,
    full_name,
    email,
    role
FROM profiles
WHERE role = 'event_coordinator';

-- Assign a coordinator to an event
/*
INSERT INTO event_coordinators (user_id, event_id, assigned_by)
SELECT 
    p.id,
    e.id,
    (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) -- assigned by first super admin
FROM profiles p, events_config e
WHERE p.email = 'coordinator@example.com'
  AND e.event_key = 'tech-cse'
ON CONFLICT DO NOTHING;
*/

-- ============================================
-- VERIFICATION: Check registration counts per event
-- ============================================
SELECT 
    e.name as event_name,
    e.event_key,
    e.category,
    COUNT(r.id) as registered_students,
    e.capacity
FROM events_config e
LEFT JOIN event_registrations_config r ON e.id = r.event_id AND r.payment_status = 'PAID'
WHERE e.is_open = true
GROUP BY e.id, e.name, e.event_key, e.category, e.capacity
ORDER BY e.category, e.name;
