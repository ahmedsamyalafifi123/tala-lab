-- Per-lab test catalogue (التحاليل داخل إعدادات المعمل)
--
-- lab_tests becomes a two-level catalogue:
--   * lab_id IS NULL  -> shared test, managed by the manager (unchanged behaviour)
--   * lab_id = <lab>  -> test owned by that lab, managed by the lab's admin
--
-- lab_test_overrides lets a lab customise a SHARED test without touching the
-- shared row: a patch of changed fields and/or is_hidden for that lab only.
-- Manager edits to a shared test flow to every lab that has not overridden
-- that field.
--
-- Existing rows keep lab_id NULL, so every lab sees all current tests at once.
-- Test codes stay globally unique (lab_tests_test_code_key), so client results
-- keep resolving by code.
--
-- Idempotent: safe to re-run. Rollback: migrations/rollback/2026-11-16_lab_scoped_tests_down.sql

BEGIN;

-- 1. Ownership column ---------------------------------------------------------
ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS lab_id uuid REFERENCES labs(uuid) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS lab_tests_lab_id_idx ON lab_tests (lab_id);

-- 2. Helper: is the caller an active admin of this lab? -----------------------
-- A lab admin is a lab_users row with role 'lab_admin' or is_manager = true.
CREATE OR REPLACE FUNCTION is_lab_admin(p_lab uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM lab_users lu
    WHERE lu.user_id = auth.uid()
      AND lu.lab_id = p_lab
      AND lu.status = 'active'
      AND (lu.is_manager = true OR lu.role = 'lab_admin')
  );
$$;

-- 3. Per-lab overrides of shared tests ---------------------------------------
CREATE TABLE IF NOT EXISTS lab_test_overrides (
  uuid       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id     uuid NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  test_uuid  uuid NOT NULL REFERENCES lab_tests(uuid) ON DELETE CASCADE,
  patch      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_hidden  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lab_test_overrides_patch_is_object CHECK (jsonb_typeof(patch) = 'object'),
  CONSTRAINT lab_test_overrides_lab_test_key UNIQUE (lab_id, test_uuid)
);

ALTER TABLE lab_test_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lab staff can view test overrides" ON lab_test_overrides;
CREATE POLICY "Lab staff can view test overrides" ON lab_test_overrides
  FOR SELECT TO authenticated
  USING (lab_id IN (SELECT my_lab_ids()));

-- Only lab admins write overrides, and only for shared tests or their own tests.
DROP POLICY IF EXISTS "Lab admins can insert test overrides" ON lab_test_overrides;
CREATE POLICY "Lab admins can insert test overrides" ON lab_test_overrides
  FOR INSERT TO authenticated
  WITH CHECK (
    is_lab_admin(lab_id)
    AND EXISTS (
      SELECT 1 FROM lab_tests t
      WHERE t.uuid = test_uuid AND (t.lab_id IS NULL OR t.lab_id = lab_test_overrides.lab_id)
    )
  );

DROP POLICY IF EXISTS "Lab admins can update test overrides" ON lab_test_overrides;
CREATE POLICY "Lab admins can update test overrides" ON lab_test_overrides
  FOR UPDATE TO authenticated
  USING (is_lab_admin(lab_id))
  WITH CHECK (is_lab_admin(lab_id));

DROP POLICY IF EXISTS "Lab admins can delete test overrides" ON lab_test_overrides;
CREATE POLICY "Lab admins can delete test overrides" ON lab_test_overrides
  FOR DELETE TO authenticated
  USING (is_lab_admin(lab_id));

-- 4. lab_tests policies ------------------------------------------------------
-- Readers see shared tests plus their own labs' tests. Writers are the manager
-- (shared rows) or the owning lab's admin (lab rows). Shared rows can never be
-- changed by a lab admin: labs customise them through lab_test_overrides.
DROP POLICY IF EXISTS "Anyone can view active lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers can insert lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers can update lab tests" ON lab_tests;
DROP POLICY IF EXISTS "Managers can delete lab tests" ON lab_tests;

CREATE POLICY "Users can view shared and own lab tests" ON lab_tests
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (lab_id IS NULL OR lab_id IN (SELECT my_lab_ids()))
  );

CREATE POLICY "Managers and lab admins can insert lab tests" ON lab_tests
  FOR INSERT TO authenticated
  WITH CHECK (
    (lab_id IS NULL AND check_is_manager())
    OR (lab_id IS NOT NULL AND is_lab_admin(lab_id))
  );

CREATE POLICY "Managers and lab admins can update lab tests" ON lab_tests
  FOR UPDATE TO authenticated
  USING (
    (lab_id IS NULL AND check_is_manager())
    OR (lab_id IS NOT NULL AND is_lab_admin(lab_id))
  )
  WITH CHECK (
    (lab_id IS NULL AND check_is_manager())
    OR (lab_id IS NOT NULL AND is_lab_admin(lab_id))
  );

CREATE POLICY "Managers and lab admins can delete lab tests" ON lab_tests
  FOR DELETE TO authenticated
  USING (
    (lab_id IS NULL AND check_is_manager())
    OR (lab_id IS NOT NULL AND is_lab_admin(lab_id))
  );

COMMIT;
