-- Fix bad data in registrations table and apply foreign key constraints
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    fixed_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting fix for registrations table...';

    -- 1. Try to fix UUIDs in registrations.event_id that should be text event_ids
    -- This assumes some registrations stored the UUID of the event instead of the text ID
    UPDATE registrations r
    SET event_id = e.event_id
    FROM events e
    WHERE r.event_id::text = e.id::text  -- Cast to text to compare UUIDs in text column
    AND r.event_id IS NOT NULL;
    
    GET DIAGNOSTICS fixed_count = ROW_COUNT;
    RAISE NOTICE 'Fixed % registrations that used UUID instead of event_id', fixed_count;

    -- 2. Identify and handle orphaned registrations (event_id not found in events)
    -- We'll delete them as they point to non-existent events
    DELETE FROM registrations
    WHERE event_id IS NOT NULL 
    AND event_id NOT IN (SELECT event_id FROM events);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % orphaned registrations pointing to missing events', deleted_count;

    -- 3. Now safely add the Foreign Key Constraint
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'registrations_event_id_fkey' 
        AND table_name = 'registrations'
    ) THEN
        ALTER TABLE registrations 
        ADD CONSTRAINT registrations_event_id_fkey 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added registrations_event_id_fkey constraint';
    ELSE
        RAISE NOTICE 'registrations_event_id_fkey constraint already exists';
    END IF;

    -- 4. Fix combo_id foreign key 
    -- Skipped to prevent errors if combos table schema varies
    -- The main goal is fixing event_id foreign key
    NULL;

END $$;
