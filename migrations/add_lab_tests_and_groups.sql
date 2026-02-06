-- ============================================================================
-- MIGRATION: Add Lab Tests and Test Groups System
-- Description: Global test management system for all labs
-- Date: 2024-02-06
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LAB_TESTS TABLE - Global test definitions (shared across all labs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_tests (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_code TEXT NOT NULL UNIQUE, -- e.g., "CBC_WBC", "GLUC_FBS"
  test_name_ar TEXT NOT NULL, -- Arabic name
  test_name_en TEXT NOT NULL, -- English name
  category TEXT NOT NULL, -- e.g., "Hematology", "Diabetes", "Lipid Profile"
  unit TEXT, -- e.g., "mg/dL", "×10³/µL"
  reference_ranges JSONB DEFAULT '{}', -- Gender/age-specific ranges
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- For sorting in UI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_lab_tests_category ON lab_tests(category);
CREATE INDEX idx_lab_tests_active ON lab_tests(is_active);

-- Reference ranges structure example:
-- {
--   "default": {"min": 70, "max": 100},
--   "male": {"min": 70, "max": 100},
--   "female": {"min": 70, "max": 100},
--   "age_ranges": [
--     {"min_age": 0, "max_age": 12, "min": 60, "max": 100}
--   ]
-- }

-- ----------------------------------------------------------------------------
-- 2. TEST_GROUPS TABLE - Predefined test panels (global)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS test_groups (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_code TEXT NOT NULL UNIQUE, -- e.g., "CBC_PANEL", "DIABETES_PANEL"
  group_name_ar TEXT NOT NULL,
  group_name_en TEXT NOT NULL,
  test_codes TEXT[] NOT NULL DEFAULT '{}', -- Array of test_code values
  is_predefined BOOLEAN DEFAULT false, -- System groups vs custom
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_test_groups_active ON test_groups(is_active);

-- ----------------------------------------------------------------------------
-- 3. UPDATE CLIENTS TABLE - Add selected_tests field
-- ----------------------------------------------------------------------------
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS selected_tests TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN clients.selected_tests IS 'Array of test codes selected for this client during creation';

-- ----------------------------------------------------------------------------
-- 4. RLS POLICIES FOR LAB_TESTS
-- ----------------------------------------------------------------------------
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;

-- Everyone can view active tests
CREATE POLICY "Anyone can view active lab tests"
  ON lab_tests FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only managers can insert tests
CREATE POLICY "Managers can insert lab tests"
  ON lab_tests FOR INSERT
  TO authenticated
  WITH CHECK (check_is_manager());

-- Only managers can update tests
CREATE POLICY "Managers can update lab tests"
  ON lab_tests FOR UPDATE
  TO authenticated
  USING (check_is_manager());

-- Only managers can delete tests (soft delete by setting is_active = false)
CREATE POLICY "Managers can delete lab tests"
  ON lab_tests FOR DELETE
  TO authenticated
  USING (check_is_manager());

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR TEST_GROUPS
-- ----------------------------------------------------------------------------
ALTER TABLE test_groups ENABLE ROW LEVEL SECURITY;

-- Everyone can view active test groups
CREATE POLICY "Anyone can view active test groups"
  ON test_groups FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only managers can insert test groups
CREATE POLICY "Managers can insert test groups"
  ON test_groups FOR INSERT
  TO authenticated
  WITH CHECK (check_is_manager());

-- Only managers can update test groups
CREATE POLICY "Managers can update test groups"
  ON test_groups FOR UPDATE
  TO authenticated
  USING (check_is_manager());

-- Only managers can delete test groups
CREATE POLICY "Managers can delete test groups"
  ON test_groups FOR DELETE
  TO authenticated
  USING (check_is_manager());

-- ----------------------------------------------------------------------------
-- 6. SEED FUNCTION - Predefined Lab Tests
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_lab_tests()
RETURNS void AS $$
BEGIN
  -- Only insert if tests don't exist
  IF NOT EXISTS (SELECT 1 FROM lab_tests LIMIT 1) THEN

    -- HEMATOLOGY / COMPLETE BLOOD COUNT (CBC)
    INSERT INTO lab_tests (test_code, test_name_ar, test_name_en, category, unit, reference_ranges, display_order) VALUES
    ('CBC_WBC', 'عدد خلايا الدم البيضاء', 'White Blood Cells', 'Hematology', '×10³/µL', '{"default": {"min": 4.0, "max": 11.0}}', 1),
    ('CBC_RBC', 'عدد خلايا الدم الحمراء', 'Red Blood Cells', 'Hematology', '×10⁶/µL', '{"male": {"min": 4.5, "max": 5.9}, "female": {"min": 4.1, "max": 5.1}}', 2),
    ('CBC_HGB', 'الهيموجلوبين', 'Hemoglobin', 'Hematology', 'g/dL', '{"male": {"min": 13.5, "max": 17.5}, "female": {"min": 12.0, "max": 15.5}}', 3),
    ('CBC_HCT', 'الهيماتوكريت', 'Hematocrit', 'Hematology', '%', '{"male": {"min": 38.8, "max": 50.0}, "female": {"min": 34.9, "max": 44.5}}', 4),
    ('CBC_MCV', 'متوسط حجم الكرية', 'Mean Corpuscular Volume', 'Hematology', 'fL', '{"default": {"min": 80, "max": 100}}', 5),
    ('CBC_MCH', 'متوسط هيموجلوبين الكرية', 'Mean Corpuscular Hemoglobin', 'Hematology', 'pg', '{"default": {"min": 27, "max": 33}}', 6),
    ('CBC_MCHC', 'تركيز متوسط هيموجلوبين الكرية', 'Mean Corpuscular Hemoglobin Concentration', 'Hematology', 'g/dL', '{"default": {"min": 32, "max": 36}}', 7),
    ('CBC_PLT', 'الصفائح الدموية', 'Platelets', 'Hematology', '×10³/µL', '{"default": {"min": 150, "max": 400}}', 8),
    ('CBC_NEUT', 'العدلات', 'Neutrophils', 'Hematology', '%', '{"default": {"min": 40, "max": 70}}', 9),
    ('CBC_LYMPH', 'الخلايا الليمفاوية', 'Lymphocytes', 'Hematology', '%', '{"default": {"min": 20, "max": 45}}', 10),
    ('CBC_MONO', 'الخلايا الوحيدة', 'Monocytes', 'Hematology', '%', '{"default": {"min": 2, "max": 10}}', 11),
    ('CBC_EOS', 'الحمضات', 'Eosinophils', 'Hematology', '%', '{"default": {"min": 1, "max": 6}}', 12),
    ('CBC_BASO', 'القعدات', 'Basophils', 'Hematology', '%', '{"default": {"min": 0, "max": 2}}', 13),

    -- DIABETES / GLUCOSE TESTS
    ('GLUC_FBS', 'سكر الدم صائم', 'Fasting Blood Sugar', 'Diabetes', 'mg/dL', '{"default": {"min": 70, "max": 100}}', 20),
    ('GLUC_PPS', 'سكر الدم فاطر', 'Postprandial Blood Sugar', 'Diabetes', 'mg/dL', '{"default": {"min": 0, "max": 140}}', 21),
    ('GLUC_RBS', 'سكر الدم العشوائي', 'Random Blood Sugar', 'Diabetes', 'mg/dL', '{"default": {"min": 70, "max": 125}}', 22),
    ('GLUC_HBA1C', 'الهيموجلوبين السكري', 'HbA1c', 'Diabetes', '%', '{"default": {"min": 4, "max": 5.6}}', 23),

    -- LIPID PROFILE
    ('LIPID_CHOL', 'الكوليسترول الكلي', 'Total Cholesterol', 'Lipid Profile', 'mg/dL', '{"default": {"min": 0, "max": 200}}', 30),
    ('LIPID_TG', 'الدهون الثلاثية', 'Triglycerides', 'Lipid Profile', 'mg/dL', '{"default": {"min": 0, "max": 150}}', 31),
    ('LIPID_HDL', 'الكوليسترول الجيد', 'HDL Cholesterol', 'Lipid Profile', 'mg/dL', '{"male": {"min": 40, "max": 999}, "female": {"min": 50, "max": 999}}', 32),
    ('LIPID_LDL', 'الكوليسترول الضار', 'LDL Cholesterol', 'Lipid Profile', 'mg/dL', '{"default": {"min": 0, "max": 100}}', 33),
    ('LIPID_VLDL', 'الكوليسترول منخفض الكثافة جداً', 'VLDL Cholesterol', 'Lipid Profile', 'mg/dL', '{"default": {"min": 5, "max": 30}}', 34),

    -- LIVER FUNCTION TESTS
    ('LIVER_ALT', 'إنزيم الكبد ALT', 'Alanine Aminotransferase', 'Liver Function', 'U/L', '{"male": {"min": 7, "max": 55}, "female": {"min": 7, "max": 45}}', 40),
    ('LIVER_AST', 'إنزيم الكبد AST', 'Aspartate Aminotransferase', 'Liver Function', 'U/L', '{"male": {"min": 8, "max": 48}, "female": {"min": 8, "max": 40}}', 41),
    ('LIVER_ALP', 'الفوسفاتيز القلوي', 'Alkaline Phosphatase', 'Liver Function', 'U/L', '{"default": {"min": 44, "max": 147}}', 42),
    ('LIVER_TBIL', 'البيليروبين الكلي', 'Total Bilirubin', 'Liver Function', 'mg/dL', '{"default": {"min": 0.1, "max": 1.2}}', 43),
    ('LIVER_DBIL', 'البيليروبين المباشر', 'Direct Bilirubin', 'Liver Function', 'mg/dL', '{"default": {"min": 0, "max": 0.3}}', 44),
    ('LIVER_ALB', 'الألبومين', 'Albumin', 'Liver Function', 'g/dL', '{"default": {"min": 3.5, "max": 5.5}}', 45),
    ('LIVER_TP', 'البروتين الكلي', 'Total Protein', 'Liver Function', 'g/dL', '{"default": {"min": 6.0, "max": 8.3}}', 46),

    -- KIDNEY FUNCTION TESTS
    ('KIDNEY_CREAT', 'الكرياتينين', 'Creatinine', 'Kidney Function', 'mg/dL', '{"male": {"min": 0.7, "max": 1.3}, "female": {"min": 0.6, "max": 1.1}}', 50),
    ('KIDNEY_BUN', 'نيتروجين اليوريا', 'Blood Urea Nitrogen', 'Kidney Function', 'mg/dL', '{"default": {"min": 7, "max": 20}}', 51),
    ('KIDNEY_UA', 'حمض اليوريك', 'Uric Acid', 'Kidney Function', 'mg/dL', '{"male": {"min": 3.5, "max": 7.2}, "female": {"min": 2.6, "max": 6.0}}', 52),

    -- THYROID TESTS
    ('THYROID_TSH', 'الهرمون المحفز للغدة الدرقية', 'Thyroid Stimulating Hormone', 'Thyroid Function', 'mIU/L', '{"default": {"min": 0.4, "max": 4.0}}', 60),
    ('THYROID_T3', 'هرمون T3', 'Triiodothyronine (T3)', 'Thyroid Function', 'ng/dL', '{"default": {"min": 80, "max": 200}}', 61),
    ('THYROID_T4', 'هرمون T4', 'Thyroxine (T4)', 'Thyroid Function', 'µg/dL', '{"default": {"min": 5.0, "max": 12.0}}', 62),
    ('THYROID_FT3', 'هرمون T3 الحر', 'Free T3', 'Thyroid Function', 'pg/mL', '{"default": {"min": 2.0, "max": 4.4}}', 63),
    ('THYROID_FT4', 'هرمون T4 الحر', 'Free T4', 'Thyroid Function', 'ng/dL', '{"default": {"min": 0.8, "max": 1.8}}', 64),

    -- ELECTROLYTES
    ('ELEC_NA', 'الصوديوم', 'Sodium', 'Electrolytes', 'mEq/L', '{"default": {"min": 136, "max": 145}}', 70),
    ('ELEC_K', 'البوتاسيوم', 'Potassium', 'Electrolytes', 'mEq/L', '{"default": {"min": 3.5, "max": 5.1}}', 71),
    ('ELEC_CL', 'الكلور', 'Chloride', 'Electrolytes', 'mEq/L', '{"default": {"min": 98, "max": 107}}', 72),
    ('ELEC_CA', 'الكالسيوم', 'Calcium', 'Electrolytes', 'mg/dL', '{"default": {"min": 8.5, "max": 10.5}}', 73),
    ('ELEC_MG', 'المغنيسيوم', 'Magnesium', 'Electrolytes', 'mg/dL', '{"default": {"min": 1.7, "max": 2.2}}', 74),
    ('ELEC_PHOS', 'الفوسفور', 'Phosphorus', 'Electrolytes', 'mg/dL', '{"default": {"min": 2.5, "max": 4.5}}', 75);

  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. SEED FUNCTION - Predefined Test Groups
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION seed_test_groups()
RETURNS void AS $$
BEGIN
  -- Only insert if test groups don't exist
  IF NOT EXISTS (SELECT 1 FROM test_groups LIMIT 1) THEN

    INSERT INTO test_groups (group_code, group_name_ar, group_name_en, test_codes, is_predefined, display_order) VALUES
    ('CBC_PANEL', 'صورة دم كاملة', 'Complete Blood Count',
     ARRAY['CBC_WBC', 'CBC_RBC', 'CBC_HGB', 'CBC_HCT', 'CBC_MCV', 'CBC_MCH', 'CBC_MCHC', 'CBC_PLT', 'CBC_NEUT', 'CBC_LYMPH', 'CBC_MONO', 'CBC_EOS', 'CBC_BASO'],
     true, 1),

    ('DIABETES_PANEL', 'فحص السكري', 'Diabetes Panel',
     ARRAY['GLUC_FBS', 'GLUC_PPS', 'GLUC_HBA1C'],
     true, 2),

    ('LIPID_PANEL', 'فحص الدهون', 'Lipid Profile',
     ARRAY['LIPID_CHOL', 'LIPID_TG', 'LIPID_HDL', 'LIPID_LDL', 'LIPID_VLDL'],
     true, 3),

    ('LIVER_PANEL', 'فحص وظائف الكبد', 'Liver Function Tests',
     ARRAY['LIVER_ALT', 'LIVER_AST', 'LIVER_ALP', 'LIVER_TBIL', 'LIVER_DBIL', 'LIVER_ALB', 'LIVER_TP'],
     true, 4),

    ('KIDNEY_PANEL', 'فحص وظائف الكلى', 'Kidney Function Tests',
     ARRAY['KIDNEY_CREAT', 'KIDNEY_BUN', 'KIDNEY_UA'],
     true, 5),

    ('THYROID_PANEL', 'فحص الغدة الدرقية', 'Thyroid Function Tests',
     ARRAY['THYROID_TSH', 'THYROID_T3', 'THYROID_T4', 'THYROID_FT3', 'THYROID_FT4'],
     true, 6),

    ('ELECTROLYTES_PANEL', 'فحص الأملاح', 'Electrolytes Panel',
     ARRAY['ELEC_NA', 'ELEC_K', 'ELEC_CL', 'ELEC_CA', 'ELEC_MG', 'ELEC_PHOS'],
     true, 7),

    ('ROUTINE_PANEL', 'الفحص الروتيني', 'Routine Panel',
     ARRAY['GLUC_FBS', 'CBC_WBC', 'CBC_HGB', 'CBC_PLT'],
     true, 8);

  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. RUN SEED FUNCTIONS
-- ----------------------------------------------------------------------------
SELECT seed_lab_tests();
SELECT seed_test_groups();

-- ----------------------------------------------------------------------------
-- 9. TRIGGERS FOR UPDATED_AT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_tests_updated_at
  BEFORE UPDATE ON lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_groups_updated_at
  BEFORE UPDATE ON test_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
