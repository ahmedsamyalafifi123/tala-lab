-- Undo 2026-09-06_rls_hardening.sql.
--
-- Restores the permissive state exactly as it was. Only run this if the
-- hardening locked out a legitimate user; the right fix is normally to give
-- that user an active lab_users row instead.

BEGIN;

CREATE POLICY "Anyone can insert clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON clients
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete clients" ON clients
  FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can view lab test categories" ON lab_test_categories;
DROP POLICY IF EXISTS "Managers can insert lab test categories" ON lab_test_categories;
DROP POLICY IF EXISTS "Managers can update lab test categories" ON lab_test_categories;
DROP POLICY IF EXISTS "Managers can delete lab test categories" ON lab_test_categories;
ALTER TABLE lab_test_categories DISABLE ROW LEVEL SECURITY;

ALTER TABLE clients_gender_backup_20260605_143442 DISABLE ROW LEVEL SECURITY;

COMMIT;
