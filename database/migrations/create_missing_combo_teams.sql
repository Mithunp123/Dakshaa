-- ============================================================
-- CREATE MISSING TEAMS FOR COMBO REGISTRATIONS
-- This script creates teams for team events in combo purchases
-- that were completed before the team creation logic was added
-- ============================================================

-- First, let's see combo registrations with team events that don't have teams
-- Run this SELECT first to preview what will be created:

/*
SELECT 
    erc.id as registration_id,
    erc.user_id,
    erc.event_id,
    erc.event_name as stored_team_name,
    e.name as event_name,
    e.min_team_size,
    e.max_team_size,
    p.full_name as user_name,
    cp.id as combo_purchase_id
FROM event_registrations_config erc
JOIN events e ON erc.event_id = e.id
JOIN profiles p ON erc.user_id = p.id
LEFT JOIN combo_purchases cp ON erc.combo_purchase_id = cp.id
LEFT JOIN teams t ON t.event_id = erc.event_id AND t.leader_id = erc.user_id
WHERE erc.combo_purchase_id IS NOT NULL
  AND erc.payment_status = 'PAID'
  AND (e.min_team_size > 1 OR e.max_team_size > 1)
  AND t.id IS NULL;
*/

-- Create a function to create missing teams
CREATE OR REPLACE FUNCTION create_missing_combo_teams()
RETURNS TABLE(
    created_team_id UUID,
    event_name TEXT,
    team_name TEXT,
    leader_name TEXT
) AS $$
DECLARE
    rec RECORD;
    new_team_id UUID;
    generated_team_name TEXT;
BEGIN
    -- Loop through combo registrations with team events but no teams
    FOR rec IN 
        SELECT 
            erc.id as registration_id,
            erc.user_id,
            erc.event_id,
            erc.event_name as stored_team_name,
            e.name as event_name_val,
            e.min_team_size,
            e.max_team_size,
            p.full_name as user_name
        FROM event_registrations_config erc
        JOIN events e ON erc.event_id = e.id
        JOIN profiles p ON erc.user_id = p.id
        LEFT JOIN teams t ON t.event_id = erc.event_id AND t.leader_id = erc.user_id
        WHERE erc.combo_purchase_id IS NOT NULL
          AND erc.payment_status = 'PAID'
          AND (e.min_team_size > 1 OR e.max_team_size > 1)
          AND t.id IS NULL
    LOOP
        -- Generate team name: use stored name or fallback to "User's Team"
        generated_team_name := COALESCE(
            NULLIF(rec.stored_team_name, ''),
            rec.user_name || '''s Team'
        );
        
        -- Create the team
        INSERT INTO teams (
            name,
            event_id,
            leader_id,
            member_count,
            max_size,
            is_open
        ) VALUES (
            generated_team_name,
            rec.event_id,
            rec.user_id,
            COALESCE(rec.min_team_size, 2),
            COALESCE(rec.max_team_size, 4),
            false  -- Closed since it's from combo registration
        )
        RETURNING id INTO new_team_id;
        
        -- Add user as team leader
        INSERT INTO team_members (
            team_id,
            user_id,
            role,
            joined_at
        ) VALUES (
            new_team_id,
            rec.user_id,
            'leader',
            NOW()
        )
        ON CONFLICT (team_id, user_id) DO NOTHING;
        
        -- Return the created team info
        created_team_id := new_team_id;
        event_name := rec.event_name_val;
        team_name := generated_team_name;
        leader_name := rec.user_name;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run this to create the missing teams:
-- SELECT * FROM create_missing_combo_teams();

-- After running, you can verify with:
/*
SELECT 
    t.id as team_id,
    t.name as team_name,
    e.name as event_name,
    p.full_name as leader_name,
    t.created_at
FROM teams t
JOIN events e ON t.event_id = e.id
JOIN profiles p ON t.leader_id = p.id
ORDER BY t.created_at DESC
LIMIT 10;
*/
