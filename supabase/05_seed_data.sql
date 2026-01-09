-- =============================================================================
-- SEED DATA - Training Types and Requirements
-- Run this once after schema creation
-- =============================================================================

-- =============================================================================
-- TRAINING TYPES (4 fixed types for pilot)
-- =============================================================================

INSERT INTO training_types (key, name, unit) VALUES
  ('placing_ce_partner', 'הנחת ח.ע על חבר', 'seconds'),
  ('placing_ce_self_standing', 'הנחת ח.ע עצמי ברגל', 'seconds'),
  ('placing_ta', 'הנחת ת״א', 'boolean'),
  ('aran_participation', 'תרגול אר״ן - השתתפות', 'boolean')
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- REQUIREMENTS (pass/fail thresholds)
-- =============================================================================

-- Insert requirements by looking up training_type_id from the key
INSERT INTO requirements (training_type_id, rule_type, threshold_int)
SELECT id, 'max_seconds', 25
FROM training_types
WHERE key = 'placing_ce_partner'
ON CONFLICT (training_type_id) DO NOTHING;

INSERT INTO requirements (training_type_id, rule_type, threshold_int)
SELECT id, 'max_seconds', 25
FROM training_types
WHERE key = 'placing_ce_self_standing'
ON CONFLICT (training_type_id) DO NOTHING;

INSERT INTO requirements (training_type_id, rule_type, threshold_int)
SELECT id, 'must_be_true', NULL
FROM training_types
WHERE key = 'placing_ta'
ON CONFLICT (training_type_id) DO NOTHING;

INSERT INTO requirements (training_type_id, rule_type, threshold_int)
SELECT id, 'must_be_true', NULL
FROM training_types
WHERE key = 'aran_participation'
ON CONFLICT (training_type_id) DO NOTHING;

-- =============================================================================
-- DEMO DATA (Optional - for development/testing)
-- Uncomment to create a sample organization structure
-- =============================================================================

-- -- Create demo magama
-- INSERT INTO magamas (name) VALUES ('מגמה א׳')
-- ON CONFLICT (name) DO NOTHING;
--
-- -- Create demo company
-- INSERT INTO companies (magama_id, name)
-- SELECT id, 'פלוגה א׳'
-- FROM magamas
-- WHERE name = 'מגמה א׳'
-- ON CONFLICT (magama_id, name) DO NOTHING;
--
-- -- Create demo department
-- INSERT INTO departments (company_id, name)
-- SELECT c.id, 'מחלקה א׳'
-- FROM companies c
-- JOIN magamas m ON c.magama_id = m.id
-- WHERE m.name = 'מגמה א׳' AND c.name = 'פלוגה א׳'
-- ON CONFLICT (company_id, name) DO NOTHING;
--
-- -- Create demo class
-- INSERT INTO classes (department_id, name)
-- SELECT d.id, 'כיתה א׳'
-- FROM departments d
-- JOIN companies c ON d.company_id = c.id
-- JOIN magamas m ON c.magama_id = m.id
-- WHERE m.name = 'מגמה א׳' AND c.name = 'פלוגה א׳' AND d.name = 'מחלקה א׳'
-- ON CONFLICT (department_id, name) DO NOTHING;
