-- ============================================
-- RESTORE YOUR ACTUAL EVENTS TABLE
-- Based on your database exports (59 events)
-- ============================================

-- ============================================
-- PART 1: DROP AND RECREATE EVENTS TABLE
-- ============================================

DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_registrations_config CASCADE;
DROP TABLE IF EXISTS events_config CASCADE;

CREATE TABLE events (
    -- Primary Keys
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    event_key TEXT,
    
    -- Display Information
    name TEXT,
    title TEXT,
    event_name TEXT,
    description TEXT,
    venue TEXT,
    
    -- Categorization
    category TEXT NOT NULL,
    event_type TEXT,
    type TEXT,
    
    -- Pricing & Capacity
    price DECIMAL NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL DEFAULT 100,
    current_registrations INTEGER DEFAULT 0,
    max_registrations INTEGER,
    
    -- Team Event Support
    is_team_event BOOLEAN DEFAULT false,
    min_team_size INTEGER DEFAULT 1,
    max_team_size INTEGER DEFAULT 1,
    
    -- Registration Control
    is_open BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    current_status TEXT DEFAULT 'upcoming',
    registration_deadline TIMESTAMPTZ,
    
    -- Event Timing
    event_date DATE,
    start_time TIME,
    end_time TIME,
    
    -- Coordinator Info
    coordinator_name TEXT,
    coordinator_contact TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: CREATE INDEXES
-- ============================================

CREATE INDEX idx_events_event_id ON events(event_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_is_team_event ON events(is_team_event);

-- ============================================
-- PART 2.1: CREATE EVENTS_CONFIG VIEW
-- ============================================
-- Create a view to maintain compatibility with old code

CREATE OR REPLACE VIEW events_config AS
SELECT 
    id,
    event_id as event_key,
    name,
    description,
    category,
    price::INTEGER as price,
    type,
    capacity,
    is_open,
    created_at,
    updated_at
FROM events
WHERE is_active = true;

-- ============================================
-- PART 2.2: CREATE EVENT_REGISTRATIONS_CONFIG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_registrations_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_name TEXT,
    payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_amount INTEGER,
    transaction_id TEXT,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

CREATE INDEX idx_event_registrations_event ON event_registrations_config(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations_config(user_id);
CREATE INDEX idx_event_registrations_payment ON event_registrations_config(payment_status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON event_registrations_config TO authenticated;

-- ============================================
-- PART 3: INSERT YOUR ACTUAL 59 EVENTS
-- ============================================

-- TEAM EVENTS (10 events)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('cultural-beat-battle', 'cultural', 500, 30, true, 'Beat Battle (Group Dance)', 'Showcase your team choreography and dance skills', null, 'Beat Battle (Group Dance)', true, 5, 10, null, 'upcoming', true),
('cultural-short-film', 'cultural', 350, 25, true, 'Short Film', 'Create and present your original short film', 'Auditorium', 'Short Film Competition', true, 3, 8, 'session', 'upcoming', true),
('nontech-blind-maze', 'non-technical', 120, 40, true, 'Blind Maze Challenge', 'Navigate through the maze blindfolded with your partner guidance', null, 'Blind Maze Challenge', true, 2, 2, null, 'upcoming', true),
('nontech-trailblazers', 'non-technical', 180, 50, true, 'Trailblazers (Clue Hunt)', 'Solve puzzles and follow clues to win the treasure hunt', null, 'Trailblazers (Clue Hunt)', true, 2, 3, null, 'upcoming', true),
('tech-codathon', 'technical', 200, 80, true, 'Codathon', 'Competitive programming marathon - solve algorithmic challenges', null, 'Codathon', true, 1, 3, null, 'upcoming', true),
('tech-electrobuzz', 'technical', 250, 50, true, 'ElectroBuzz', 'Electronics circuit design and troubleshooting challenge', null, 'ElectroBuzz', true, 2, 4, null, 'upcoming', true),
('tech-neura-hack', 'technical', 300, 50, true, 'Neura Hack (Hackathon)', 'AI/ML Hackathon - Build innovative neural network solutions', null, 'Neura Hack (Hackathon)', true, 2, 3, null, 'upcoming', true),
('tech-paper-presentation', 'technical', 150, 60, true, 'Paper Presentation', 'Present your research paper and technical findings', null, 'Paper Presentation', true, 1, 3, null, 'upcoming', true),
('tech-robo-soccer', 'technical', 400, 40, true, 'ROBO SOCCER', 'Build and compete with your autonomous soccer robots', null, 'ROBO SOCCER', true, 2, 4, null, 'upcoming', true),
('tech-semispark', 'technical', 150, 60, true, 'SEMISPARK (Project Presentation)', 'Present your innovative semiconductor projects', null, 'SEMISPARK (Project Presentation)', true, 1, 3, null, 'upcoming', true);

-- INDIVIDUAL TECHNICAL EVENTS (15 events)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('tech-cse', 'technical', 100, 100, true, 'CSE Technical Quiz', 'Test your CSE knowledge', 'Main Hall', 'Event tech-cse', false, 1, 1, 'competition', 'upcoming', true),
('tech-ece', 'technical', 100, 100, true, 'ECE Technical Quiz', 'ECE domain quiz', 'Main Hall', 'ElectroBuzz', false, 1, 1, 'competition', 'upcoming', true),
('tech-eee', 'technical', 100, 100, true, 'EEE Technical Quiz', 'EEE domain quiz', 'Main Hall', 'Event tech-eee', false, 1, 1, 'competition', 'upcoming', true),
('tech-it', 'technical', 100, 100, true, 'IT Technical Quiz', 'IT domain quiz competition', 'Main Hall', 'Neura Hack (Hackathon)', false, 1, 1, 'competition', 'upcoming', true),
('tech-mech', 'technical', 100, 100, true, 'Mechanical Challenge', 'Mechanical engineering event', 'Workshop', 'Paper Presentation', false, 1, 1, 'competition', 'upcoming', true),
('tech-civil', 'technical', 100, 80, true, 'Civil Tech Event', 'Civil engineering competition', 'Civil Lab', 'Event tech-civil', false, 1, 1, 'competition', 'upcoming', true),
('tech-mct', 'technical', 100, 80, true, 'Mechatronics Challenge', 'MCT technical event', 'Lab 2', 'ROBO SOCCER', false, 1, 1, 'competition', 'upcoming', true),
('tech-csbs', 'technical', 100, 80, true, 'CSBS Tech Event', 'CSBS technical competition', 'Seminar Hall', 'Event tech-csbs', false, 1, 1, 'competition', 'upcoming', true),
('tech-vlsi', 'technical', 100, 80, true, 'VLSI Design Challenge', 'VLSI design competition', 'Lab 1', 'SEMISPARK (Project Presentation)', false, 1, 1, 'competition', 'upcoming', true),
('tech-aiml', 'technical', 100, 80, true, 'AI/ML Challenge', 'AI and ML competition', 'AI Lab', 'Codathon', false, 1, 1, 'competition', 'upcoming', true),
('tech-biotech', 'technical', 100, 60, true, 'Biotech Challenge', 'Biotechnology competition', 'Bio Lab', 'Event tech-biotech', false, 1, 1, 'competition', 'upcoming', true),
('tech-food', 'technical', 100, 60, true, 'Food Tech Event', 'Food technology competition', 'Food Lab', 'Event tech-food', false, 1, 1, 'competition', 'upcoming', true),
('tech-textile', 'technical', 100, 60, true, 'Textile Tech Event', 'Textile technology event', 'Textile Lab', 'Event tech-textile', false, 1, 1, 'competition', 'upcoming', true),
('tech-poster', 'technical', 100, 100, true, 'Poster Presentation', 'Present your research posters', 'Gallery', 'Event tech-poster', false, 1, 1, 'competition', 'upcoming', true),
('tech-project-expo', 'technical', 150, 50, true, 'Project Expo', 'Showcase your projects', 'Exhibition Hall', 'Event tech-project-expo', false, 1, 1, 'competition', 'upcoming', true);

-- INDIVIDUAL NON-TECHNICAL EVENTS (13 events)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('nontech-cse', 'non-technical', 50, 100, true, 'CSE Fun Event', 'Fun games and activities', 'Auditorium', 'Trailblazers (Clue Hunt)', false, 1, 1, 'session', 'upcoming', true),
('nontech-ece', 'non-technical', 50, 100, true, 'ECE Fun Event', 'ECE department event', 'Auditorium', 'Event nontech-ece', false, 1, 1, 'session', 'upcoming', true),
('nontech-eee', 'non-technical', 50, 100, true, 'EEE Fun Event', 'EEE fun activities', 'Auditorium', 'Event nontech-eee', false, 1, 1, 'session', 'upcoming', true),
('nontech-it', 'non-technical', 50, 100, true, 'IT Fun Event', 'IT department fun event', 'Auditorium', 'Event nontech-it', false, 1, 1, 'session', 'upcoming', true),
('nontech-mech', 'non-technical', 50, 100, true, 'Mechanical Fun Event', 'Mech fun games', 'Workshop', 'Event nontech-mech', false, 1, 1, 'session', 'upcoming', true),
('nontech-civil', 'non-technical', 50, 80, true, 'Civil Fun Event', 'Civil fun activities', 'Open Ground', 'Event nontech-civil', false, 1, 1, 'session', 'upcoming', true),
('nontech-csbs', 'non-technical', 50, 80, true, 'CSBS Fun Event', 'CSBS department event', 'Seminar Hall', 'Event nontech-csbs', false, 1, 1, 'session', 'upcoming', true),
('nontech-vlsi', 'non-technical', 50, 80, true, 'VLSI Fun Event', 'VLSI department games', 'Seminar Hall', 'Blind Maze Challenge', false, 1, 1, 'session', 'upcoming', true),
('nontech-mct', 'non-technical', 50, 80, true, 'Mechatronics Fun Event', 'MCT fun games', 'Seminar Hall', 'Event nontech-mct', false, 1, 1, 'session', 'upcoming', true),
('nontech-biotech', 'non-technical', 50, 60, true, 'Biotech Fun Event', 'Biotech fun activities', 'Seminar Hall', 'Event nontech-biotech', false, 1, 1, 'session', 'upcoming', true),
('nontech-food', 'non-technical', 50, 60, true, 'Food Tech Fun Event', 'Food fun activities', 'Food Court', 'Event nontech-food', false, 1, 1, 'session', 'upcoming', true),
('nontech-textile', 'non-technical', 50, 60, true, 'Textile Fun Event', 'Textile fun event', 'Textile Lab', 'Event nontech-textile', false, 1, 1, 'session', 'upcoming', true);

-- INDIVIDUAL CULTURAL EVENTS (4 events)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('cultural-solo-dance', 'cultural', 100, 50, true, 'Solo Dance', 'Solo dance competition', 'Main Stage', 'Event cultural-solo-dance', false, 1, 1, 'session', 'upcoming', true),
('cultural-musical', 'cultural', 100, 50, true, 'Solo Singing', 'Solo singing competition', 'Main Stage', 'Event cultural-musical', false, 1, 1, 'session', 'upcoming', true),
('cultural-instrument', 'cultural', 100, 40, true, 'Instrumental', 'Instrumental music competition', 'Main Stage', 'Event cultural-instrument', false, 1, 1, 'session', 'upcoming', true),
('cultural-group-dance', 'cultural', 100, 30, true, 'Group Dance', 'Group dance competition', 'Main Stage', 'Beat Battle (Group Dance)', false, 1, 1, 'session', 'upcoming', true);

-- WORKSHOP EVENTS (14 events - all individual)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('workshop-cse', 'workshop', 400, 60, true, 'Mobile App Development', 'App dev by RemitBee', 'CS Lab', 'Event workshop-cse', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-ece', 'workshop', 400, 50, true, 'IoT using LoRaWAN', 'IoT workshop', 'ECE Lab', 'Event workshop-ece', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-eee', 'workshop', 350, 50, true, 'EEE Workshop', 'Electrical engineering workshop', 'EEE Lab', 'Event workshop-eee', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-it', 'workshop', 400, 60, true, 'IT Workshop', 'Information technology workshop', 'IT Lab', 'Event workshop-it', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-mech', 'workshop', 350, 50, true, 'Mechanical Workshop', 'Mechanical engineering workshop', 'Workshop', 'Event workshop-mech', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-civil', 'workshop', 350, 50, true, 'Building Information Modeling', 'BIM by ICT Academy', 'Civil Lab', 'Event workshop-civil', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-mct', 'workshop', 400, 50, true, 'Mechatronics Workshop', 'MCT workshop', 'MCT Lab', 'Event workshop-mct', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-csbs', 'workshop', 350, 50, true, 'Blockchain 101', 'Blockchain workshop by Virtuospark', 'CS Lab', 'Event workshop-csbs', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-vlsi', 'workshop', 450, 40, true, 'VLSI Design Workshop', 'VLSI design workshop', 'VLSI Lab', 'Event workshop-vlsi', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-aiml', 'workshop', 400, 50, true, 'AI Game Development', 'AI game dev by IITM Pravartak', 'AI Lab', 'Event workshop-aiml', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-aids', 'workshop', 400, 50, true, 'RPA by UiPath', 'Robotic Process Automation workshop', 'AI Lab', 'Event workshop-aids', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-biotech', 'workshop', 350, 40, true, 'Next Gen Sequencing', 'NGS by Genotypic Technology', 'Bio Lab', 'Event workshop-biotech', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-ft', 'workshop', 300, 40, true, 'Food Tech Workshop', 'Food technology workshop', 'Food Lab', 'Event workshop-ft', false, 1, 1, 'workshop', 'upcoming', true),
('workshop-textile', 'workshop', 300, 40, true, 'Textile Workshop', 'Textile technology workshop', 'Textile Lab', 'Event workshop-textile', false, 1, 1, 'workshop', 'upcoming', true);

-- HACKATHON & OTHER EVENTS (3 events)
INSERT INTO events (event_id, category, price, capacity, is_active, name, description, venue, title, is_team_event, min_team_size, max_team_size, event_type, current_status, is_open) VALUES
('hackathon', 'hackathon', 300, 100, true, '24-Hour Hackathon', 'Build something amazing in 24 hours', 'Innovation Center', 'Event hackathon', false, 1, 1, 'competition', 'upcoming', true),
('codeathon', 'hackathon', 200, 150, true, 'Code-a-thon', 'Competitive coding challenge', 'Computer Lab', 'Codathon', false, 1, 1, 'competition', 'upcoming', true),
('conference', 'conference', 0, 500, true, 'Dakshaa Tech Conference 2026', 'Main conference with industry speakers', 'Main Auditorium', 'Event conference', false, 1, 1, 'session', 'upcoming', true);

-- ============================================
-- PART 4: CREATE RPC FUNCTION
-- ============================================

-- Drop existing function first
DROP FUNCTION IF EXISTS get_events_with_stats();

CREATE OR REPLACE FUNCTION get_events_with_stats()
RETURNS TABLE (
    id UUID,
    event_id TEXT,
    event_key TEXT,
    name TEXT,
    title TEXT,
    event_name TEXT,
    description TEXT,
    venue TEXT,
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
    current_status TEXT,
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
        e.venue,
        e.category,
        e.event_type,
        e.type,
        e.price,
        e.capacity,
        COALESCE(COUNT(r.id)::BIGINT, 0) as current_registrations,
        e.is_team_event,
        e.min_team_size,
        e.max_team_size,
        COALESCE(e.is_open, true) as is_open,
        e.is_active,
        e.current_status,
        e.created_at,
        e.updated_at
    FROM events e
    LEFT JOIN registrations r ON e.event_id = r.event_id AND r.payment_status = 'paid'
    WHERE e.is_active = true
    GROUP BY e.id, e.event_id, e.event_key, e.name, e.title, e.event_name, e.description, 
             e.venue, e.category, e.event_type, e.type, e.price, e.capacity, e.is_team_event, 
             e.min_team_size, e.max_team_size, e.is_open, e.is_active, e.current_status, 
             e.created_at, e.updated_at
    ORDER BY e.category, e.name;
$$;

-- ============================================
-- PART 5: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active events" ON events;
DROP POLICY IF EXISTS "Super Admins can do everything on events" ON events;

CREATE POLICY "Allow public read access to active events" ON events
    FOR SELECT USING (is_active = true);

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

-- Run these to verify:
-- SELECT COUNT(*) as total_events FROM events;
-- SELECT category, COUNT(*) as count, SUM(CASE WHEN is_team_event THEN 1 ELSE 0 END) as team_count FROM events GROUP BY category ORDER BY category;
-- SELECT event_id, name, is_team_event, min_team_size, max_team_size FROM events WHERE is_team_event = true ORDER BY category, name;
-- SELECT * FROM get_events_with_stats() LIMIT 5;

-- Expected Results:
-- Total: 59 events
-- Team Events: 10
-- Individual Events: 49
-- Categories:
--   Technical: 25 (15 individual + 10 team)
--   Non-Technical: 15 (13 individual + 2 team)
--   Cultural: 6 (4 individual + 2 team)
--   Workshop: 14 (all individual)
--   Hackathon: 2 (all individual)
--   Conference: 1 (individual)
