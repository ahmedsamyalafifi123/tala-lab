-- Rollback for migrations/2026-11-16_lab_scoped_tests.sql
-- Refuses to run while lab-owned tests exist, so no lab data is silently lost.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM lab_tests WHERE lab_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Lab-owned tests exist; move or delete them before rolling back';
  END IF;
END $$;

DROP TABLE IF EXISTS lab_test_overrides;

DROP POLICY IF EXISTS "Users can view shared and own lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers and lab admins can insert lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers and lab admins can update lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers and lab admins can delete lab tests" ON lab_tests;

CREATE POLICY "Anyone can view active lab tests" ON lab_tests
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Managers can insert lab tests" ON lab_tests
  FOR INSERT TO authenticated WITH CHECK (check_is_manager());
CREATE POLICY "Managers can update lab tests" ON lab_tests
  FOR UPDATE TO authenticated USING (check_is_manager());
CREATE POLICY "Managers can delete lab tests" ON lab_tests
  FOR DELETE TO authenticated USING (check_is_manager());

DROP FUNCTION IF EXISTS is_lab_admin(uuid);
DROP INDEX IF EXISTS lab_tests_lab_id_idx;
ALTER TABLE lab_tests DROP COLUMN IF EXISTS lab_id;

COMMIT;
