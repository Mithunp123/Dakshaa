SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'teams';

SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'event_registrations_config';