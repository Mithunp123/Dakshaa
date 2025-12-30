-- Seed Events
INSERT INTO events (event_id, category, price, capacity, is_active) VALUES
('ws_iot', 'workshop', 500, 50, true),
('ws_ai', 'workshop', 600, 40, true),
('tech_paper', 'tech', 200, 100, true),
('tech_coding', 'tech', 150, 200, true),
('nt_treasure', 'non-tech', 100, 300, true),
('nt_gaming', 'non-tech', 150, 100, true),
('cul_dance', 'cultural', 200, 50, true),
('cul_music', 'cultural', 300, 30, true),
('sp_startup', 'special', 1000, 20, true),
('sp_hack', 'special', 500, 100, true),
('conf_tech', 'conference', 0, 500, true),
('conf_edu', 'conference', 0, 500, true)
ON CONFLICT (event_id) DO UPDATE SET 
    price = EXCLUDED.price,
    capacity = EXCLUDED.capacity,
    is_active = EXCLUDED.is_active;

-- Seed Combos
INSERT INTO combos (combo_id, name, price, is_active) VALUES
('gold_pass', 'Gold Pass', 1200, true),
('platinum_pass', 'Platinum Pass', 2000, true)
ON CONFLICT (combo_id) DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    is_active = EXCLUDED.is_active;

-- Seed Combo Rules
-- Gold Pass: 1 Workshop, 2 Tech, 2 Non-Tech
INSERT INTO combo_rules (combo_id, category, allowed_count) VALUES
('gold_pass', 'workshop', 1),
('gold_pass', 'tech', 2),
('gold_pass', 'non-tech', 2),
-- Platinum Pass: 2 Workshops, 3 Tech, 3 Non-Tech, 1 Special
('platinum_pass', 'workshop', 2),
('platinum_pass', 'tech', 3),
('platinum_pass', 'non-tech', 3),
('platinum_pass', 'special', 1)
ON CONFLICT DO NOTHING;

-- Set Super Admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = '62896266-b7a7-4c14-9e44-57a3d966aac2';
