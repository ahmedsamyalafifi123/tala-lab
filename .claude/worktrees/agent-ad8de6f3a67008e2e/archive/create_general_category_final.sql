-- ============================================================================
-- Create a "General" (عام) category as default for all labs
-- ============================================================================

-- Insert General category for each existing lab
INSERT INTO categories (lab_id, name, color, tests)
SELECT
  uuid,
  'عام',
  'default',
  '[]'::jsonb
FROM labs
WHERE NOT EXISTS (
  SELECT 1 FROM categories
  WHERE lab_id = labs.uuid AND name = 'عام'
);

-- Verify the General category was created
SELECT * FROM categories WHERE name = 'عام';
