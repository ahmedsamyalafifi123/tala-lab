-- ============================================================================
-- IMPORTANT: RUN THIS MIGRATION IN SUPABASE SQL EDITOR
-- This adds the lab tests system to your database
-- ============================================================================

-- 1. Add selected_tests column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS selected_tests TEXT[] DEFAULT '{}';

COMMENT ON COLUMN clients.selected_tests IS 'Array of test codes selected for this client during creation';

-- 2. Create lab_tests table (global)
CREATE TABLE IF NOT EXISTS lab_tests (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_code TEXT NOT NULL UNIQUE,
  test_name_ar TEXT NOT NULL,
  test_name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT,
  reference_ranges JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON lab_tests(is_active);

-- 3. Create test_groups table (global)
CREATE TABLE IF NOT EXISTS test_groups (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_code TEXT NOT NULL UNIQUE,
  group_name_ar TEXT NOT NULL,
  group_name_en TEXT NOT NULL,
  test_codes TEXT[] NOT NULL DEFAULT '{}',
  is_predefined BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_groups_active ON test_groups(is_active);

-- 4. RLS Policies for lab_tests
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active lab tests" ON lab_tests;
CREATE POLICY "Anyone can view active lab tests"
  ON lab_tests FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Managers can insert lab tests" ON lab_tests;
CREATE POLICY "Managers can insert lab tests"
  ON lab_tests FOR INSERT
  TO authenticated
  WITH CHECK (check_is_manager());

DROP POLICY IF EXISTS "Managers can update lab tests" ON lab_tests;
CREATE POLICY "Managers can update lab tests"
  ON lab_tests FOR UPDATE
  TO authenticated
  USING (check_is_manager());

DROP POLICY IF EXISTS "Managers can delete lab tests" ON lab_tests;
CREATE POLICY "Managers can delete lab tests"
  ON lab_tests FOR DELETE
  TO authenticated
  USING (check_is_manager());

-- 5. RLS Policies for test_groups
ALTER TABLE test_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active test groups" ON test_groups;
CREATE POLICY "Anyone can view active test groups"
  ON test_groups FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Managers can insert test groups" ON test_groups;
CREATE POLICY "Managers can insert test groups"
  ON test_groups FOR INSERT
  TO authenticated
  WITH CHECK (check_is_manager());

DROP POLICY IF EXISTS "Managers can update test groups" ON test_groups;
CREATE POLICY "Managers can update test groups"
  ON test_groups FOR UPDATE
  TO authenticated
  USING (check_is_manager());

DROP POLICY IF EXISTS "Managers can delete test groups" ON test_groups;
CREATE POLICY "Managers can delete test groups"
  ON test_groups FOR DELETE
  TO authenticated
  USING (check_is_manager());

-- 6. Seed predefined tests (run this separately if needed - it's a lot of data)
-- See the full migration file for the complete seed function

-- Quick test: Insert a few sample tests to verify it works
INSERT INTO lab_tests (test_code, test_name_ar, test_name_en, category, unit, reference_ranges, display_order) VALUES
('CBC_WBC', 'عدد خلايا الدم البيضاء', 'White Blood Cells', 'Hematology', '×10³/µL', '{"default": {"min": 4.0, "max": 11.0}}', 1),
('GLUC_FBS', 'سكر الدم صائم', 'Fasting Blood Sugar', 'Diabetes', 'mg/dL', '{"default": {"min": 70, "max": 100}}', 20),
('LIPID_CHOL', 'الكوليسترول الكلي', 'Total Cholesterol', 'Lipid Profile', 'mg/dL', '{"default": {"min": 0, "max": 200}}', 30)
ON CONFLICT (test_code) DO NOTHING;

-- Insert a sample test group
INSERT INTO test_groups (group_code, group_name_ar, group_name_en, test_codes, is_predefined, display_order) VALUES
('ROUTINE_PANEL', 'الفحص الروتيني', 'Routine Panel', ARRAY['CBC_WBC', 'GLUC_FBS'], true, 1)
ON CONFLICT (group_code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES - Run these to check if migration worked
-- ============================================================================

-- Check if selected_tests column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'selected_tests';

-- Check if lab_tests table exists and has data
SELECT COUNT(*) as test_count FROM lab_tests;

-- Check if test_groups table exists and has data
SELECT COUNT(*) as group_count FROM test_groups;

-- ============================================================================
-- If the above queries return results, the migration was successful!
-- ============================================================================
