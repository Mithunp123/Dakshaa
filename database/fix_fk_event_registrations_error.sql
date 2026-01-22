-- ==============================================================================
-- FIX FOREIGN KEY CONSTRAINT ERROR: "insert or update on table ... violates ..."
-- ==============================================================================
-- This script fixes the foreign key relationship between event_registrations_config and events.
-- It ensures that:
-- 1. Orphaned registration records (referencing deleted events) are removed
-- 2. The foreign key constraint correctly points to the valid 'events' table
-- 3. Deleting an event properly cascades to delete its registrations

BEGIN;

-- 1. Remove orphaned records that would prevent the constraint from being applied
-- (i.e., registrations where the event_id no longer exists in limits)
DELETE FROM event_registrations_config 
WHERE event_id IS NOT NULL 
AND event_id NOT IN (SELECT id FROM events);

-- 2. Drop the existing problematic constraint
-- We use the name reported in the error: "fk_event_registrations_event_id"
ALTER TABLE event_registrations_config 
DROP CONSTRAINT IF EXISTS fk_event_registrations_event_id;

-- 3. Re-create the constraint referencing the correct 'events' table
-- Note: We reference 'events(id)' which is the UUID primary key
ALTER TABLE event_registrations_config 
ADD CONSTRAINT fk_event_registrations_event_id 
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;

COMMIT;

-- Verification query (Optional - Run if you want to check)
/*
SELECT 
    conname AS constraint_name, 
    conrelid::regclass AS table_name, 
    confrelid::regclass AS foreign_table_name,
    pg_get_constraintdef(c.oid)
FROM pg_constraint c
WHERE conname = 'fk_event_registrations_event_id';
*/
