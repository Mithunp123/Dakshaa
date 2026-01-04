-- ============================================
-- REBUILD EVENTS TABLE - Based on Frontend Requirements
-- ============================================
-- This script rebuilds the events table with ALL columns needed by the frontend
-- Analysis of frontend code shows usage of BOTH 'events' and 'events_config' tables

-- ============================================
-- PART 1: DROP AND RECREATE EVENTS TABLE
-- ============================================

-- Drop existing constraints and table
DROP TABLE IF EXISTS events CASCADE;

-- Create events table with ALL required columns
CREATE TABLE events (
    -- Primary Keys (Frontend uses both!)
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,  -- Text-based identifier (e.g., 'tech-cse', 'workshop-vlsi')
    event_key TEXT,  -- Alternative key for frontend mapping
    
    -- Display Information
    name TEXT,  -- Also called 'event_name' in some places
    title TEXT,  -- Used by some components
    event_name TEXT,  -- Legacy field name
    description TEXT,
    
    -- Categorization
    category TEXT DEFAULT 'Technical' CHECK (category IN ('Technical', 'Non-Technical', 'Workshop', 'Conference', 'Cultural', 'Sports', 'Gaming', 'Other', 'Hackathon', 'Special')),
    event_type TEXT,  -- Event subtype
    type TEXT CHECK (type IN ('SOLO', 'TEAM', 'BOTH')),
    
    -- Pricing
    price DECIMAL NOT NULL DEFAULT 0,
    
    -- Capacity Management
    capacity INTEGER NOT NULL DEFAULT 100,
    current_registrations INTEGER DEFAULT 0,
    
    -- Team Event Support
    is_team_event BOOLEAN DEFAULT false,
    min_team_size INTEGER DEFAULT 1,
    max_team_size INTEGER DEFAULT 1,
    
    -- Registration Control
    is_open BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PART 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_is_open ON events(is_open);
CREATE INDEX idx_events_is_team_event ON events(is_team_event);
CREATE INDEX idx_events_team_size ON events(min_team_size, max_team_size);

-- ============================================
-- PART 3: CREATE RPC FUNCTION FOR FRONTEND
-- ============================================

-- Function to get events with registration stats (used by RegistrationForm.jsx)
CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
    id UUID,
    event_id TEXT,
    event_key TEXT,
    name TEXT,
    title TEXT,
    event_name TEXT,
    description TEXT,
    category TEXT,
    event_type TEXT,
    type TEXT,
    price DECIMAL,
    capacity INTEGER,
    current_registrations BIGINT,
    is_team_event BOOLEAN,
    min_team_size INTEGER,
    max_team_size INTEGER,
    is_open BOOLEAN,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        e.id,
        e.event_id,
        e.event_key,
        e.name,
        e.title,
        e.event_name,
        e.description,
        e.category,
        e.event_type,
        e.type,
        e.price,
        e.capacity,
        COALESCE(COUNT(r.id)::BIGINT, 0) as current_registrations,
        e.is_team_event,
        e.min_team_size,
        e.max_team_size,
        e.is_open,
        e.is_active,
        e.created_at,
        e.updated_at
    FROM events e
    LEFT JOIN registrations r ON e.id = r.event_id AND r.payment_status = 'paid'
    WHERE e.is_active = true
    GROUP BY e.id, e.event_id, e.event_key, e.name, e.title, e.event_name, e.description, 
             e.category, e.event_type, e.type, e.price, e.capacity, e.is_team_event, 
             e.min_team_size, e.max_team_size, e.is_open, e.is_active, e.created_at, e.updated_at
    ORDER BY e.category, e.name;
$$;

-- ============================================
-- PART 4: INSERT SAMPLE EVENTS DATA (49 TOTAL)
-- ============================================
-- Mix of Individual and Team Events from your 49 total events

-- TECHNICAL EVENTS (15 events - 9 individual + 6 team)
INSERT INTO events (event_id, name, title, event_name, category, event_type, type, price, capacity, is_team_event, min_team_size, max_team_size, is_open, is_active) VALUES
-- Individual Technical (9)
('tech-cse', 'Code Sprint', 'Code Sprint', 'Code Sprint', 'Technical', 'CSE', 'SOLO', 200, 100, false, 1, 1, true, true),
('tech-it', 'Web Development Challenge', 'Web Development Challenge', 'Web Development Challenge', 'Technical', 'IT', 'SOLO', 200, 80, false, 1, 1, true, true),
('tech-ece', 'Circuit Design', 'Circuit Design', 'Circuit Design', 'Technical', 'ECE', 'SOLO', 250, 60, false, 1, 1, true, true),
('tech-ai', 'AI Model Challenge', 'AI Model Challenge', 'AI Model Challenge', 'Technical', 'AI/ML', 'SOLO', 300, 100, false, 1, 1, true, true),
('tech-iot', 'IoT Innovation', 'IoT Innovation', 'IoT Innovation', 'Technical', 'IoT', 'SOLO', 350, 60, false, 1, 1, true, true),
('tech-cyber', 'Cybersecurity CTF', 'Cybersecurity CTF', 'Cybersecurity CTF', 'Technical', 'Cybersecurity', 'SOLO', 200, 80, false, 1, 1, true, true),
('tech-data', 'Data Analytics Sprint', 'Data Analytics Sprint', 'Data Analytics Sprint', 'Technical', 'Data Science', 'SOLO', 250, 70, false, 1, 1, true, true),
('tech-mobile', 'Mobile App Dev', 'Mobile App Dev', 'Mobile App Dev', 'Technical', 'Mobile Dev', 'SOLO', 250, 60, false, 1, 1, true, true),
('tech-blockchain', 'Blockchain Innovation', 'Blockchain Innovation', 'Blockchain Innovation', 'Technical', 'Blockchain', 'SOLO', 350, 40, false, 1, 1, true, true),
-- Team Technical (6)
('team-neura-hack', 'Neura Hack', 'Neura Hack', 'Neura Hack', 'Technical', 'AI Competition', 'TEAM', 400, 30, true, 2, 4, true, true),
('team-semispark', 'SEMISPARK', 'SEMISPARK', 'SEMISPARK', 'Technical', 'Electronics', 'TEAM', 350, 25, true, 2, 3, true, true),
('team-robo-race', 'Robo Race', 'Robo Race', 'Robo Race', 'Technical', 'Robotics', 'TEAM', 500, 20, true, 3, 5, true, true),
('team-web-wars', 'Web Wars', 'Web Wars', 'Web Wars', 'Technical', 'Web Development', 'TEAM', 300, 30, true, 2, 4, true, true),
('team-circuit-masters', 'Circuit Masters', 'Circuit Masters', 'Circuit Masters', 'Technical', 'Electronics', 'TEAM', 400, 25, true, 2, 4, true, true),
('team-code-relay', 'Code Relay', 'Code Relay', 'Code Relay', 'Technical', 'Programming', 'TEAM', 300, 40, true, 3, 4, true, true);

-- NON-TECHNICAL EVENTS (12 events - 10 individual + 2 team)
INSERT INTO events (event_id, name, title, event_name, category, event_type, type, price, capacity, is_team_event, min_team_size, max_team_size, is_open, is_active) VALUES
-- Individual Non-Technical (10)
('nontech-quiz', 'General Quiz', 'General Quiz', 'General Quiz', 'Non-Technical', 'Quiz', 'SOLO', 100, 150, false, 1, 1, true, true),
('nontech-debate', 'Debate Competition', 'Debate Competition', 'Debate Competition', 'Non-Technical', 'Debate', 'SOLO', 150, 60, false, 1, 1, true, true),
('nontech-paper', 'Paper Presentation', 'Paper Presentation', 'Paper Presentation', 'Non-Technical', 'Presentation', 'SOLO', 200, 80, false, 1, 1, true, true),
('nontech-photography', 'Photography Contest', 'Photography Contest', 'Photography Contest', 'Non-Technical', 'Arts', 'SOLO', 150, 100, false, 1, 1, true, true),
('nontech-writing', 'Creative Writing', 'Creative Writing', 'Creative Writing', 'Non-Technical', 'Writing', 'SOLO', 100, 100, false, 1, 1, true, true),
('nontech-painting', 'Digital Painting', 'Digital Painting', 'Digital Painting', 'Non-Technical', 'Arts', 'SOLO', 150, 60, false, 1, 1, true, true),
('nontech-entrepreneur', 'Business Plan', 'Business Plan', 'Business Plan', 'Non-Technical', 'Entrepreneurship', 'SOLO', 200, 50, false, 1, 1, true, true),
('nontech-marketing', 'Marketing Campaign', 'Marketing Campaign', 'Marketing Campaign', 'Non-Technical', 'Marketing', 'SOLO', 150, 60, false, 1, 1, true, true),
('nontech-design', 'Graphic Design', 'Graphic Design', 'Graphic Design', 'Non-Technical', 'Design', 'SOLO', 150, 80, false, 1, 1, true, true),
('nontech-video', 'Video Editing', 'Video Editing', 'Video Editing', 'Non-Technical', 'Media', 'SOLO', 200, 50, false, 1, 1, true, true),
-- Team Non-Technical (2)
('team-trailblazers', 'Trailblazers', 'Trailblazers', 'Trailblazers', 'Non-Technical', 'Adventure', 'TEAM', 200, 30, true, 2, 4, true, true),
('team-blind-maze', 'Blind Maze Challenge', 'Blind Maze Challenge', 'Blind Maze Challenge', 'Non-Technical', 'Adventure', 'TEAM', 150, 25, true, 2, 3, true, true);

-- CULTURAL EVENTS (7 events - 5 individual + 2 team)
INSERT INTO events (event_id, name, title, event_name, category, event_type, type, price, capacity, is_team_event, min_team_size, max_team_size, is_open, is_active) VALUES
-- Individual Cultural (5)
('cultural-dance', 'Solo Dance', 'Solo Dance', 'Solo Dance', 'Cultural', 'Dance', 'SOLO', 150, 80, false, 1, 1, true, true),
('cultural-singing', 'Solo Singing', 'Solo Singing', 'Solo Singing', 'Cultural', 'Music', 'SOLO', 150, 100, false, 1, 1, true, true),
('cultural-instrument', 'Instrumental Solo', 'Instrumental Solo', 'Instrumental Solo', 'Cultural', 'Music', 'SOLO', 150, 60, false, 1, 1, true, true),
('cultural-drama', 'Mono Acting', 'Mono Acting', 'Mono Acting', 'Cultural', 'Drama', 'SOLO', 150, 50, false, 1, 1, true, true),
('cultural-standup', 'Stand-up Comedy', 'Stand-up Comedy', 'Stand-up Comedy', 'Cultural', 'Comedy', 'SOLO', 100, 80, false, 1, 1, true, true),
-- Team Cultural (2)
('team-beat-battle', 'Beat Battle', 'Beat Battle', 'Beat Battle', 'Cultural', 'Music', 'TEAM', 250, 20, true, 4, 6, true, true),
('team-short-film', 'Short Film Competition', 'Short Film Competition', 'Short Film Competition', 'Cultural', 'Media', 'TEAM', 500, 15, true, 3, 8, true, true);

-- WORKSHOP EVENTS (14 events - all individual)
INSERT INTO events (event_id, name, title, event_name, category, event_type, type, price, capacity, is_team_event, min_team_size, max_team_size, is_open, is_active) VALUES
('workshop-python', 'Python for Beginners', 'Python for Beginners', 'Python for Beginners', 'Workshop', 'Programming', 'SOLO', 300, 100, false, 1, 1, true, true),
('workshop-react', 'React Development', 'React Development', 'React Development', 'Workshop', 'Web Dev', 'SOLO', 400, 80, false, 1, 1, true, true),
('workshop-arduino', 'Arduino Basics', 'Arduino Basics', 'Arduino Basics', 'Workshop', 'IoT', 'SOLO', 350, 60, false, 1, 1, true, true),
('workshop-ml', 'Machine Learning', 'Machine Learning', 'Machine Learning', 'Workshop', 'AI/ML', 'SOLO', 500, 100, false, 1, 1, true, true),
('workshop-pcb', 'PCB Design', 'PCB Design', 'PCB Design', 'Workshop', 'Electronics', 'SOLO', 400, 50, false, 1, 1, true, true),
('workshop-docker', 'Docker & Kubernetes', 'Docker & Kubernetes', 'Docker & Kubernetes', 'Workshop', 'DevOps', 'SOLO', 450, 60, false, 1, 1, true, true),
('workshop-figma', 'UI/UX with Figma', 'UI/UX with Figma', 'UI/UX with Figma', 'Workshop', 'Design', 'SOLO', 300, 80, false, 1, 1, true, true),
('workshop-aws', 'AWS Cloud Essentials', 'AWS Cloud Essentials', 'AWS Cloud Essentials', 'Workshop', 'Cloud', 'SOLO', 500, 70, false, 1, 1, true, true),
('workshop-android', 'Android App Development', 'Android App Development', 'Android App Development', 'Workshop', 'Mobile', 'SOLO', 400, 60, false, 1, 1, true, true),
('workshop-ethical', 'Ethical Hacking', 'Ethical Hacking', 'Ethical Hacking', 'Workshop', 'Security', 'SOLO', 450, 80, false, 1, 1, true, true),
('workshop-3d', '3D Printing', '3D Printing', '3D Printing', 'Workshop', 'Manufacturing', 'SOLO', 350, 40, false, 1, 1, true, true),
('workshop-drone', 'Drone Technology', 'Drone Technology', 'Drone Technology', 'Workshop', 'Robotics', 'SOLO', 600, 50, false, 1, 1, true, true),
('workshop-vr', 'VR Development', 'VR Development', 'VR Development', 'Workshop', 'Gaming', 'SOLO', 500, 40, false, 1, 1, true, true),
('workshop-robotics', 'Robotics Fundamentals', 'Robotics Fundamentals', 'Robotics Fundamentals', 'Workshop', 'Robotics', 'SOLO', 550, 50, false, 1, 1, true, true);

-- CONFERENCE EVENT (1 event - individual)
INSERT INTO events (event_id, name, title, event_name, category, event_type, type, price, capacity, is_team_event, min_team_size, max_team_size, is_open, is_active) VALUES
('conf-tech', 'Tech Conference 2026', 'Tech Conference 2026', 'Tech Conference 2026', 'Conference', 'Technology', 'SOLO', 1000, 500, false, 1, 1, true, true);

-- ============================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to active events" ON events;
DROP POLICY IF EXISTS "Super Admins can do everything on events" ON events;

-- Everyone can read active events
CREATE POLICY "Allow public read access to active events" ON events
    FOR SELECT USING (is_active = true);

-- Super admins can do everything
CREATE POLICY "Super Admins can do everything on events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('super_admin', 'admin')
        )
    );

-- ============================================
-- PART 6: GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON events TO authenticated;
GRANT SELECT ON events TO anon;
GRANT EXECUTE ON FUNCTION get_events_with_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_events_with_stats TO anon;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the setup:
-- SELECT COUNT(*) as total_events FROM events;
-- SELECT category, COUNT(*) as count FROM events GROUP BY category;
-- SELECT COUNT(*) as team_events FROM events WHERE is_team_event = true;
-- SELECT COUNT(*) as individual_events FROM events WHERE is_team_event = false;
-- SELECT * FROM get_events_with_stats() LIMIT 5;

-- Expected Results:
-- Total: 49 events EXACTLY
-- Technical: 15 events (9 individual + 6 team)
-- Non-Technical: 12 events (10 individual + 2 team)
-- Cultural: 7 events (5 individual + 2 team)
-- Workshop: 14 events (all individual)
-- Conference: 1 event (individual)
-- 
-- Breakdown:
-- Team Events: 10 (6 Technical + 2 Non-Technical + 2 Cultural)
-- Individual Events: 39
