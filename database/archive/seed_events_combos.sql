-- ============================================
-- DAKSHAA 2026 - COMPLETE EVENTS SEED DATA
-- Run this in Supabase SQL Editor
-- ============================================
-- This script will:
-- 1. Delete ALL old test data (events, registrations, combos)
-- 2. Insert new events into BOTH events and events_config tables
-- 3. Insert 3 combo packages
-- ============================================

-- ============================================
-- STEP 0: ALTER TABLES - Add missing columns
-- ============================================

-- Add columns to events table if they don't exist
DO $$
BEGIN
    -- events table columns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        ALTER TABLE events ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS venue TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT;
        ALTER TABLE events ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- combos table columns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combos') THEN
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS original_price DECIMAL(10,2);
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS category_quotas JSONB;
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS max_purchases INTEGER DEFAULT 100;
        ALTER TABLE combos ADD COLUMN IF NOT EXISTS current_purchases INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================
-- STEP 1: DELETE ALL OLD DATA (clean slate)
-- ============================================

DO $$
BEGIN
    RAISE NOTICE 'Starting cleanup of old data...';

    -- Delete event coordinators first (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_coordinators') THEN
        DELETE FROM event_coordinators;
        RAISE NOTICE 'Deleted event_coordinators';
    END IF;

    -- Delete attendance records (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance') THEN
        DELETE FROM attendance;
        RAISE NOTICE 'Deleted attendance';
    END IF;

    -- Delete event_registrations_config (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'event_registrations_config') THEN
        DELETE FROM event_registrations_config;
        RAISE NOTICE 'Deleted event_registrations_config';
    END IF;

    -- Delete registrations (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'registrations') THEN
        DELETE FROM registrations;
        RAISE NOTICE 'Deleted registrations';
    END IF;

    -- Delete combo rules (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combo_rules') THEN
        DELETE FROM combo_rules;
        RAISE NOTICE 'Deleted combo_rules';
    END IF;

    -- Delete all combos
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combos') THEN
        DELETE FROM combos;
        RAISE NOTICE 'Deleted combos';
    END IF;

    -- Delete from events_config (if exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events_config') THEN
        DELETE FROM events_config;
        RAISE NOTICE 'Deleted events_config';
    END IF;

    -- Delete all events
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        DELETE FROM events;
        RAISE NOTICE 'Deleted events';
    END IF;
    
    RAISE NOTICE '✅ All old data deleted successfully!';
END $$;

-- ============================================
-- STEP 2A: INSERT ALL EVENTS into 'events' table
-- Using event_id TEXT as primary key (original schema)
-- ============================================

INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, event_type) VALUES
-- Technical Events (15 events) - ₹100 each
('tech-cse', 'technical', 100, 100, true, 'CSE Technical Quiz', 'Test your CSE knowledge', 'Main Hall', 'competition'),
('tech-it', 'technical', 100, 100, true, 'IT Technical Quiz', 'IT domain quiz competition', 'Main Hall', 'competition'),
('tech-vlsi', 'technical', 100, 80, true, 'VLSI Design Challenge', 'VLSI design competition', 'Lab 1', 'competition'),
('tech-mct', 'technical', 100, 80, true, 'Mechatronics Challenge', 'MCT technical event', 'Lab 2', 'competition'),
('tech-csbs', 'technical', 100, 80, true, 'CSBS Tech Event', 'CSBS technical competition', 'Seminar Hall', 'competition'),
('tech-ece', 'technical', 100, 100, true, 'ECE Technical Quiz', 'ECE domain quiz', 'Main Hall', 'competition'),
('tech-food', 'technical', 100, 60, true, 'Food Tech Event', 'Food technology competition', 'Food Lab', 'competition'),
('tech-mech', 'technical', 100, 100, true, 'Mechanical Challenge', 'Mechanical engineering event', 'Workshop', 'competition'),
('tech-aiml', 'technical', 100, 80, true, 'AI/ML Challenge', 'AI and ML competition', 'AI Lab', 'competition'),
('tech-civil', 'technical', 100, 80, true, 'Civil Tech Event', 'Civil engineering competition', 'Civil Lab', 'competition'),
('tech-project-expo', 'technical', 150, 50, true, 'Project Expo', 'Showcase your projects', 'Exhibition Hall', 'competition'),
('tech-textile', 'technical', 100, 60, true, 'Textile Tech Event', 'Textile technology event', 'Textile Lab', 'competition'),
('tech-biotech', 'technical', 100, 60, true, 'Biotech Challenge', 'Biotechnology competition', 'Bio Lab', 'competition'),
('tech-poster', 'technical', 100, 100, true, 'Poster Presentation', 'Present your research posters', 'Gallery', 'competition'),
('tech-eee', 'technical', 100, 100, true, 'EEE Technical Quiz', 'EEE domain quiz', 'Main Hall', 'competition'),

-- Non-Technical Events (12 events) - ₹50 each
('nontech-cse', 'non-technical', 50, 100, true, 'CSE Fun Event', 'Fun games and activities', 'Auditorium', 'session'),
('nontech-it', 'non-technical', 50, 100, true, 'IT Fun Event', 'IT department fun event', 'Auditorium', 'session'),
('nontech-eee', 'non-technical', 50, 100, true, 'EEE Fun Event', 'EEE fun activities', 'Auditorium', 'session'),
('nontech-vlsi', 'non-technical', 50, 80, true, 'VLSI Fun Event', 'VLSI department games', 'Seminar Hall', 'session'),
('nontech-biotech', 'non-technical', 50, 60, true, 'Biotech Fun Event', 'Biotech fun activities', 'Seminar Hall', 'session'),
('nontech-mct', 'non-technical', 50, 80, true, 'Mechatronics Fun Event', 'MCT fun games', 'Seminar Hall', 'session'),
('nontech-csbs', 'non-technical', 50, 80, true, 'CSBS Fun Event', 'CSBS department event', 'Seminar Hall', 'session'),
('nontech-food', 'non-technical', 50, 60, true, 'Food Tech Fun Event', 'Food fun activities', 'Food Court', 'session'),
('nontech-mech', 'non-technical', 50, 100, true, 'Mechanical Fun Event', 'Mech fun games', 'Workshop', 'session'),
('nontech-ece', 'non-technical', 50, 100, true, 'ECE Fun Event', 'ECE department event', 'Auditorium', 'session'),
('nontech-civil', 'non-technical', 50, 80, true, 'Civil Fun Event', 'Civil fun activities', 'Open Ground', 'session'),
('nontech-textile', 'non-technical', 50, 60, true, 'Textile Fun Event', 'Textile fun event', 'Textile Lab', 'session'),

-- Cultural Events (5 events) - ₹100 each
('cultural-musical', 'cultural', 100, 50, true, 'Solo Singing', 'Solo singing competition', 'Main Stage', 'session'),
('cultural-instrument', 'cultural', 100, 40, true, 'Instrumental', 'Instrumental music competition', 'Main Stage', 'session'),
('cultural-group-dance', 'cultural', 100, 30, true, 'Group Dance', 'Group dance competition', 'Main Stage', 'session'),
('cultural-solo-dance', 'cultural', 100, 50, true, 'Solo Dance', 'Solo dance competition', 'Main Stage', 'session'),
('cultural-short-film', 'cultural', 150, 30, true, 'Short Film', 'Short film competition', 'Auditorium', 'session'),

-- Hackathon Events (2 events) - ₹200-300
('hackathon', 'hackathon', 300, 100, true, '24-Hour Hackathon', 'Build something amazing in 24 hours', 'Innovation Center', 'competition'),
('codeathon', 'hackathon', 200, 150, true, 'Code-a-thon', 'Competitive coding challenge', 'Computer Lab', 'competition'),

-- Workshop Events (14 events) - ₹300-450 each
('workshop-aids', 'workshop', 400, 50, true, 'RPA by UiPath', 'Robotic Process Automation workshop', 'AI Lab', 'workshop'),
('workshop-aiml', 'workshop', 400, 50, true, 'AI Game Development', 'AI game dev by IITM Pravartak', 'AI Lab', 'workshop'),
('workshop-biotech', 'workshop', 350, 40, true, 'Next Gen Sequencing', 'NGS by Genotypic Technology', 'Bio Lab', 'workshop'),
('workshop-civil', 'workshop', 350, 50, true, 'Building Information Modeling', 'BIM by ICT Academy', 'Civil Lab', 'workshop'),
('workshop-csbs', 'workshop', 350, 50, true, 'Blockchain 101', 'Blockchain workshop by Virtuospark', 'CS Lab', 'workshop'),
('workshop-cse', 'workshop', 400, 60, true, 'Mobile App Development', 'App dev by RemitBee', 'CS Lab', 'workshop'),
('workshop-ece', 'workshop', 400, 50, true, 'IoT using LoRaWAN', 'IoT workshop', 'ECE Lab', 'workshop'),
('workshop-eee', 'workshop', 350, 50, true, 'EEE Workshop', 'Electrical engineering workshop', 'EEE Lab', 'workshop'),
('workshop-ft', 'workshop', 300, 40, true, 'Food Tech Workshop', 'Food technology workshop', 'Food Lab', 'workshop'),
('workshop-it', 'workshop', 400, 60, true, 'IT Workshop', 'Information technology workshop', 'IT Lab', 'workshop'),
('workshop-mct', 'workshop', 400, 50, true, 'Mechatronics Workshop', 'MCT workshop', 'MCT Lab', 'workshop'),
('workshop-mech', 'workshop', 350, 50, true, 'Mechanical Workshop', 'Mechanical engineering workshop', 'Workshop', 'workshop'),
('workshop-textile', 'workshop', 300, 40, true, 'Textile Workshop', 'Textile technology workshop', 'Textile Lab', 'workshop'),
('workshop-vlsi', 'workshop', 450, 40, true, 'VLSI Design Workshop', 'VLSI design workshop', 'VLSI Lab', 'workshop'),

-- Conference (1 event) - FREE
('conference', 'conference', 0, 500, true, 'Dakshaa Tech Conference 2026', 'Main conference with industry speakers', 'Main Auditorium', 'session');

-- ============================================
-- STEP 2B: INSERT ALL EVENTS into 'events_config' table
-- Uses UUID, event_key, and capitalized categories
-- type = SOLO for individual events, TEAM for group events
-- ============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events_config') THEN
        INSERT INTO events_config (event_key, name, description, category, price, type, capacity, is_open) VALUES
        -- Technical Events (15 events) - ₹100 each
        ('tech-cse', 'CSE Technical Quiz', 'Test your CSE knowledge', 'Technical', 100, 'SOLO', 100, true),
        ('tech-it', 'IT Technical Quiz', 'IT domain quiz competition', 'Technical', 100, 'SOLO', 100, true),
        ('tech-vlsi', 'VLSI Design Challenge', 'VLSI design competition', 'Technical', 100, 'SOLO', 80, true),
        ('tech-mct', 'Mechatronics Challenge', 'MCT technical event', 'Technical', 100, 'SOLO', 80, true),
        ('tech-csbs', 'CSBS Tech Event', 'CSBS technical competition', 'Technical', 100, 'SOLO', 80, true),
        ('tech-ece', 'ECE Technical Quiz', 'ECE domain quiz', 'Technical', 100, 'SOLO', 100, true),
        ('tech-food', 'Food Tech Event', 'Food technology competition', 'Technical', 100, 'SOLO', 60, true),
        ('tech-mech', 'Mechanical Challenge', 'Mechanical engineering event', 'Technical', 100, 'SOLO', 100, true),
        ('tech-aiml', 'AI/ML Challenge', 'AI and ML competition', 'Technical', 100, 'SOLO', 80, true),
        ('tech-civil', 'Civil Tech Event', 'Civil engineering competition', 'Technical', 100, 'SOLO', 80, true),
        ('tech-project-expo', 'Project Expo', 'Showcase your projects', 'Technical', 150, 'TEAM', 50, true),
        ('tech-textile', 'Textile Tech Event', 'Textile technology event', 'Technical', 100, 'SOLO', 60, true),
        ('tech-biotech', 'Biotech Challenge', 'Biotechnology competition', 'Technical', 100, 'SOLO', 60, true),
        ('tech-poster', 'Poster Presentation', 'Present your research posters', 'Technical', 100, 'SOLO', 100, true),
        ('tech-eee', 'EEE Technical Quiz', 'EEE domain quiz', 'Technical', 100, 'SOLO', 100, true),

        -- Non-Technical Events (12 events) - ₹50 each
        ('nontech-cse', 'CSE Fun Event', 'Fun games and activities', 'Non-Technical', 50, 'SOLO', 100, true),
        ('nontech-it', 'IT Fun Event', 'IT department fun event', 'Non-Technical', 50, 'SOLO', 100, true),
        ('nontech-eee', 'EEE Fun Event', 'EEE fun activities', 'Non-Technical', 50, 'SOLO', 100, true),
        ('nontech-vlsi', 'VLSI Fun Event', 'VLSI department games', 'Non-Technical', 50, 'SOLO', 80, true),
        ('nontech-biotech', 'Biotech Fun Event', 'Biotech fun activities', 'Non-Technical', 50, 'SOLO', 60, true),
        ('nontech-mct', 'Mechatronics Fun Event', 'MCT fun games', 'Non-Technical', 50, 'SOLO', 80, true),
        ('nontech-csbs', 'CSBS Fun Event', 'CSBS department event', 'Non-Technical', 50, 'SOLO', 80, true),
        ('nontech-food', 'Food Tech Fun Event', 'Food fun activities', 'Non-Technical', 50, 'SOLO', 60, true),
        ('nontech-mech', 'Mechanical Fun Event', 'Mech fun games', 'Non-Technical', 50, 'SOLO', 100, true),
        ('nontech-ece', 'ECE Fun Event', 'ECE department event', 'Non-Technical', 50, 'SOLO', 100, true),
        ('nontech-civil', 'Civil Fun Event', 'Civil fun activities', 'Non-Technical', 50, 'SOLO', 80, true),
        ('nontech-textile', 'Textile Fun Event', 'Textile fun event', 'Non-Technical', 50, 'SOLO', 60, true),

        -- Cultural Events (5 events) - ₹100 each
        ('cultural-musical', 'Solo Singing', 'Solo singing competition', 'Cultural', 100, 'SOLO', 50, true),
        ('cultural-instrument', 'Instrumental', 'Instrumental music competition', 'Cultural', 100, 'SOLO', 40, true),
        ('cultural-group-dance', 'Group Dance', 'Group dance competition', 'Cultural', 100, 'TEAM', 30, true),
        ('cultural-solo-dance', 'Solo Dance', 'Solo dance competition', 'Cultural', 100, 'SOLO', 50, true),
        ('cultural-short-film', 'Short Film', 'Short film competition', 'Cultural', 150, 'TEAM', 30, true),

        -- Hackathon Events (2 events) - ₹200-300 - TEAM events
        ('hackathon', '24-Hour Hackathon', 'Build something amazing in 24 hours', 'Other', 300, 'TEAM', 100, true),
        ('codeathon', 'Code-a-thon', 'Competitive coding challenge', 'Other', 200, 'SOLO', 150, true),

        -- Workshop Events (14 events) - ₹300-450 each
        ('workshop-aids', 'RPA by UiPath', 'Robotic Process Automation workshop', 'Workshop', 400, 'SOLO', 50, true),
        ('workshop-aiml', 'AI Game Development', 'AI game dev by IITM Pravartak', 'Workshop', 400, 'SOLO', 50, true),
        ('workshop-biotech', 'Next Gen Sequencing', 'NGS by Genotypic Technology', 'Workshop', 350, 'SOLO', 40, true),
        ('workshop-civil', 'Building Information Modeling', 'BIM by ICT Academy', 'Workshop', 350, 'SOLO', 50, true),
        ('workshop-csbs', 'Blockchain 101', 'Blockchain workshop by Virtuospark', 'Workshop', 350, 'SOLO', 50, true),
        ('workshop-cse', 'Mobile App Development', 'App dev by RemitBee', 'Workshop', 400, 'SOLO', 60, true),
        ('workshop-ece', 'IoT using LoRaWAN', 'IoT workshop', 'Workshop', 400, 'SOLO', 50, true),
        ('workshop-eee', 'EEE Workshop', 'Electrical engineering workshop', 'Workshop', 350, 'SOLO', 50, true),
        ('workshop-ft', 'Food Tech Workshop', 'Food technology workshop', 'Workshop', 300, 'SOLO', 40, true),
        ('workshop-it', 'IT Workshop', 'Information technology workshop', 'Workshop', 400, 'SOLO', 60, true),
        ('workshop-mct', 'Mechatronics Workshop', 'MCT workshop', 'Workshop', 400, 'SOLO', 50, true),
        ('workshop-mech', 'Mechanical Workshop', 'Mechanical engineering workshop', 'Workshop', 350, 'SOLO', 50, true),
        ('workshop-textile', 'Textile Workshop', 'Textile technology workshop', 'Workshop', 300, 'SOLO', 40, true),
        ('workshop-vlsi', 'VLSI Design Workshop', 'VLSI design workshop', 'Workshop', 450, 'SOLO', 40, true),

        -- Conference (1 event) - FREE
        ('conference', 'Dakshaa Tech Conference 2026', 'Main conference with industry speakers', 'Conference', 0, 'SOLO', 500, true);
        
        RAISE NOTICE '✅ events_config table populated with 49 events';
    ELSE
        RAISE NOTICE '⚠️ events_config table does not exist - skipping';
    END IF;
END $$;

-- ============================================
-- STEP 3: INSERT COMBO PACKAGES
-- Using id UUID as primary key (production schema)
-- ============================================

INSERT INTO combos (id, name, price, is_active, description, original_price, discount_percentage, category_quotas) VALUES
(
    'a1111111-1111-1111-1111-111111111111'::uuid, 
    'Silver Pass', 
    399, 
    true,
    'Basic package: 2 Technical + 2 Non-Technical + 1 Cultural event',
    500,
    20,
    '{"technical": 2, "non-technical": 2, "cultural": 1}'::jsonb
),
(
    'b2222222-2222-2222-2222-222222222222'::uuid, 
    'Gold Pass', 
    699, 
    true,
    'Popular package: 4 Technical + 4 Non-Technical + 2 Cultural + 1 Hackathon',
    900,
    22,
    '{"technical": 4, "non-technical": 4, "cultural": 2, "hackathon": 1}'::jsonb
),
(
    'c3333333-3333-3333-3333-333333333333'::uuid, 
    'Platinum Pass', 
    999, 
    true,
    'All Access: ALL events + 1 Workshop + Conference access',
    1500,
    33,
    '{"technical": 15, "non-technical": 12, "cultural": 5, "hackathon": 2, "workshop": 1, "conference": 1}'::jsonb
);

-- ============================================
-- STEP 4: INSERT COMBO RULES (if table exists)
-- Note: Production schema may use category_quotas JSONB instead
-- ============================================

-- Try to insert combo rules (will fail silently if table doesn't exist)
DO $$
BEGIN
    -- Check if combo_rules table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combo_rules') THEN
        -- SILVER PASS (₹399) - Basic Package
        INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
        ('a1111111-1111-1111-1111-111111111111', 'technical', 2),
        ('a1111111-1111-1111-1111-111111111111', 'non-technical', 2),
        ('a1111111-1111-1111-1111-111111111111', 'cultural', 1);

        -- GOLD PASS (₹699) - Popular Package
        INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
        ('b2222222-2222-2222-2222-222222222222', 'technical', 4),
        ('b2222222-2222-2222-2222-222222222222', 'non-technical', 4),
        ('b2222222-2222-2222-2222-222222222222', 'cultural', 2),
        ('b2222222-2222-2222-2222-222222222222', 'hackathon', 1);

        -- PLATINUM PASS (₹999) - All Access Package
        INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
        ('c3333333-3333-3333-3333-333333333333', 'technical', 15),
        ('c3333333-3333-3333-3333-333333333333', 'non-technical', 12),
        ('c3333333-3333-3333-3333-333333333333', 'cultural', 5),
        ('c3333333-3333-3333-3333-333333333333', 'hackathon', 2),
        ('c3333333-3333-3333-3333-333333333333', 'workshop', 1),
        ('c3333333-3333-3333-3333-333333333333', 'conference', 1);
        
        RAISE NOTICE 'Combo rules inserted successfully';
    ELSE
        RAISE NOTICE 'combo_rules table does not exist - using category_quotas JSONB instead';
    END IF;
END $$;

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================
DO $$
DECLARE
    event_count INTEGER;
    event_config_count INTEGER;
    combo_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count FROM events WHERE is_active = true;
    SELECT COUNT(*) INTO combo_count FROM combos WHERE is_active = true;
    
    -- Check events_config if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events_config') THEN
        SELECT COUNT(*) INTO event_config_count FROM events_config WHERE is_open = true;
        RAISE NOTICE '';
        RAISE NOTICE '📋 events_config Table: % events', event_config_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ DATABASE SEEDED SUCCESSFULLY!';
    RAISE NOTICE '================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '  📋 events Table: % events', event_count;
    RAISE NOTICE '  🎁 combos Table: % combos', combo_count;
    RAISE NOTICE '';
    RAISE NOTICE '🏷️ Combo Packages:';
    RAISE NOTICE '  🥈 Silver Pass - ₹399 (2T + 2NT + 1C)';
    RAISE NOTICE '  🥇 Gold Pass - ₹699 (4T + 4NT + 2C + 1H)';
    RAISE NOTICE '  💎 Platinum Pass - ₹999 (ALL + 1W + Conf)';
    RAISE NOTICE '';
    RAISE NOTICE '📂 Categories: Technical(15), Non-Technical(12), Cultural(5), Hackathon(2), Workshop(14), Conference(1)';
END $$;

-- ============================================
-- Show all events from 'events' table by category with prices
-- ============================================
SELECT 
    '📋 events table' as source,
    category, 
    COUNT(*) as count, 
    MIN(price) as min_price,
    MAX(price) as max_price
FROM events 
WHERE is_active = true 
GROUP BY category 
ORDER BY category;

-- ============================================
-- Show all combos
-- ============================================
SELECT 
    id,
    name, 
    price,
    description,
    category_quotas
FROM combos
WHERE is_active = true
ORDER BY price;

-- ============================================
-- Show events_config summary (if table exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events_config') THEN
        RAISE NOTICE '';
        RAISE NOTICE '🔍 Run this query to see events_config:';
        RAISE NOTICE 'SELECT category, COUNT(*) as count, MIN(price) as min_price, MAX(price) as max_price FROM events_config WHERE is_open = true GROUP BY category ORDER BY category;';
    END IF;
END $$;
