-- RLS hardening.
--
-- 1. clients carried both lab-scoped write policies and legacy blanket ones.
--    RLS policies are OR'd, so "USING (true)" let any authenticated user of
--    the project update or delete any lab's patient rows. The lab-scoped
--    policies already cover every active user, so the blanket ones go.
--
-- 2. lab_test_categories had RLS switched off while anon holds full DML, so
--    anyone with the public anon key could rewrite or wipe it. It now matches
--    lab_tests: read for signed-in users, write for managers.
--
-- 3. clients_gender_backup_20260605_143442 is a one-off migration artifact
--    with RLS off and 8,740 (patient uuid, gender) rows readable with the anon
--    key. RLS is enabled with no policy, which denies every role but the
--    service key. Drop the table once it is confirmed unneeded.
--
-- Rollback: migrations/rollback/2026-09-06_rls_hardening_down.sql

BEGIN;

DROP POLICY IF EXISTS "Anyone can insert clients" ON clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON clients;

ALTER TABLE lab_test_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view lab test categories" ON lab_test_categories;
CREATE POLICY "Anyone can view lab test categories" ON lab_test_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Managers can insert lab test categories" ON lab_test_categories;
CREATE POLICY "Managers can insert lab test categories" ON lab_test_categories
  FOR INSERT TO authenticated WITH CHECK (check_is_manager());

DROP POLICY IF EXISTS "Managers can update lab test categories" ON lab_test_categories;
CREATE POLICY "Managers can update lab test categories" ON lab_test_categories
  FOR UPDATE TO authenticated
  USING (check_is_manager()) WITH CHECK (check_is_manager());

DROP POLICY IF EXISTS "Managers can delete lab test categories" ON lab_test_categories;
CREATE POLICY "Managers can delete lab test categories" ON lab_test_categories
  FOR DELETE TO authenticated USING (check_is_manager());

ALTER TABLE clients_gender_backup_20260605_143442 ENABLE ROW LEVEL SECURITY;

COMMIT;
