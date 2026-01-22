-- ==============================================================================
-- FIX FOREIGN KEY CONSTRAINT & COLUMN TYPE MISMATCH
-- ==============================================================================
-- The error "operator does not exist: text = uuid" indicates that 
-- event_registrations_config.event_id is TEXT, but events.id is UUID.
-- This script converts the column to UUID and fixes the constraint.

BEGIN;

-- 1. Drop the existing constraint if it exists (to allow type modification)
ALTER TABLE event_registrations_config 
DROP CONSTRAINT IF EXISTS fk_event_registrations_event_id;

-- 2. Clean up invalid data that cannot be cast to UUID
-- We identify non-UUIDs using a regex pattern.
-- (This deletes rows with slug-IDs like 'tech-cse' if they exist and haven't been migrated)
-- If you need to preserve them, we would need to map them to UUIDs first, but for this fix we assume stale data removal.
DELETE FROM event_registrations_config 
WHERE event_id IS NOT NULL 
  AND event_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 3. Change column type from TEXT to UUID
-- This requires the remaining values to be valid UUID strings.
ALTER TABLE event_registrations_config 
ALTER COLUMN event_id TYPE UUID USING event_id::UUID;

-- 4. Remove orphaned records that reference non-existent events
-- Now both columns are UUID, so this comparison will work.
DELETE FROM event_registrations_config 
WHERE event_id IS NOT NULL 
AND event_id NOT IN (SELECT id FROM events);

-- 5. Add the correct Foreign Key constraint
ALTER TABLE event_registrations_config 
ADD CONSTRAINT fk_event_registrations_event_id 
FOREIGN KEY (event_id) 
REFERENCES events(id) 
ON DELETE CASCADE;

COMMIT;
