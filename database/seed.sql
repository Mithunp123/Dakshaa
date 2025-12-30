-- ============================================
-- DAKSHAA 2026 - SEED DATA
-- This file seeds the database with events and combos
-- ============================================

-- Seed Technical Events (15 events) - ₹100 each
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('tech-cse', 'technical', 100, 100, true),
('tech-it', 'technical', 100, 100, true),
('tech-vlsi', 'technical', 100, 80, true),
('tech-mct', 'technical', 100, 80, true),
('tech-csbs', 'technical', 100, 80, true),
('tech-ece', 'technical', 100, 100, true),
('tech-food', 'technical', 100, 60, true),
('tech-mech', 'technical', 100, 100, true),
('tech-aiml', 'technical', 100, 80, true),
('tech-civil', 'technical', 100, 80, true),
('tech-project-expo', 'technical', 150, 50, true),
('tech-textile', 'technical', 100, 60, true),
('tech-biotech', 'technical', 100, 60, true),
('tech-poster', 'technical', 100, 100, true),
('tech-eee', 'technical', 100, 100, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Non-Technical Events (12 events) - ₹50 each
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('nontech-cse', 'non-technical', 50, 100, true),
('nontech-it', 'non-technical', 50, 100, true),
('nontech-eee', 'non-technical', 50, 100, true),
('nontech-vlsi', 'non-technical', 50, 80, true),
('nontech-biotech', 'non-technical', 50, 60, true),
('nontech-mct', 'non-technical', 50, 80, true),
('nontech-csbs', 'non-technical', 50, 80, true),
('nontech-food', 'non-technical', 50, 60, true),
('nontech-mech', 'non-technical', 50, 100, true),
('nontech-ece', 'non-technical', 50, 100, true),
('nontech-civil', 'non-technical', 50, 80, true),
('nontech-textile', 'non-technical', 50, 60, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Cultural Events (5 events) - ₹100 each
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('cultural-musical', 'cultural', 100, 50, true),
('cultural-instrument', 'cultural', 100, 40, true),
('cultural-group-dance', 'cultural', 100, 30, true),
('cultural-solo-dance', 'cultural', 100, 50, true),
('cultural-short-film', 'cultural', 150, 30, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Hackathon Events (2 events)
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('hackathon', 'hackathon', 300, 100, true),
('codeathon', 'hackathon', 200, 150, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Workshop Events (14 events) - ₹300-450 each
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('workshop-aids', 'workshop', 400, 50, true),
('workshop-aiml', 'workshop', 400, 50, true),
('workshop-biotech', 'workshop', 350, 40, true),
('workshop-civil', 'workshop', 350, 50, true),
('workshop-csbs', 'workshop', 350, 50, true),
('workshop-cse', 'workshop', 400, 60, true),
('workshop-ece', 'workshop', 400, 50, true),
('workshop-eee', 'workshop', 350, 50, true),
('workshop-ft', 'workshop', 300, 40, true),
('workshop-it', 'workshop', 400, 60, true),
('workshop-mct', 'workshop', 400, 50, true),
('workshop-mech', 'workshop', 350, 50, true),
('workshop-textile', 'workshop', 300, 40, true),
('workshop-vlsi', 'workshop', 450, 40, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Conference (1 event) - FREE
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('conference', 'conference', 0, 500, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Delete old combos first
DELETE FROM combo_rules WHERE combo_id IN ('gold_pass', 'platinum_pass', 'silver_pass');
DELETE FROM combos WHERE combo_id IN ('gold_pass', 'platinum_pass', 'silver_pass');

-- Seed Combos
INSERT INTO combos (combo_id, name, price, is_active) VALUES
('silver_pass', 'Silver Pass', 399, true),
('gold_pass', 'Gold Pass', 699, true),
('platinum_pass', 'Platinum Pass', 999, true)
ON CONFLICT (combo_id) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active;

-- Seed Combo Rules
-- Silver Pass: 2 Technical + 2 Non-Technical + 1 Cultural
INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
('silver_pass', 'technical', 2),
('silver_pass', 'non-technical', 2),
('silver_pass', 'cultural', 1);

-- Gold Pass: 4 Technical + 4 Non-Technical + 2 Cultural + 1 Hackathon
INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
('gold_pass', 'technical', 4),
('gold_pass', 'non-technical', 4),
('gold_pass', 'cultural', 2),
('gold_pass', 'hackathon', 1);

-- Platinum Pass: ALL Events + 1 Workshop + Conference
INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
('platinum_pass', 'technical', 15),
('platinum_pass', 'non-technical', 12),
('platinum_pass', 'cultural', 5),
('platinum_pass', 'hackathon', 2),
('platinum_pass', 'workshop', 1),
('platinum_pass', 'conference', 1);

-- Set Super Admin (update this with your user ID)
-- UPDATE profiles 
-- SET role = 'super_admin' 
-- WHERE id = 'YOUR-USER-ID-HERE';
