SELECT conname, confrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'teams'::regclass;

SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'event_registrations_config';
