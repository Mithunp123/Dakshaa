-- Fix missing foreign key relationship between registrations and events
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Check if the foreign key exists on registrations.event_id, if not, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'registrations_event_id_fkey' 
        AND table_name = 'registrations'
    ) THEN
        -- Only add if references are valid (text to text)
        ALTER TABLE registrations 
        ADD CONSTRAINT registrations_event_id_fkey 
        FOREIGN KEY (event_id) 
        REFERENCES events(event_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Added registrations_event_id_fkey';
    ELSE
        RAISE NOTICE 'registrations_event_id_fkey already exists';
    END IF;

    -- 2. Check combo_id foreign key
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'registrations_combo_id_fkey' 
        AND table_name = 'registrations'
    ) THEN
         IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'combos') THEN
            ALTER TABLE registrations 
            ADD CONSTRAINT registrations_combo_id_fkey 
            FOREIGN KEY (combo_id) 
            REFERENCES combos(combo_id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Added registrations_combo_id_fkey';
         END IF;
    END IF;

END $$;

-- Verify relationships
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'registrations';
