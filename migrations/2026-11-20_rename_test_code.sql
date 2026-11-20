-- Rename a test code across the whole system (تعديل كود التحليل)
--
-- test_code is the key every stored reference uses, so a rename must rewrite
-- all of them in one transaction:
--   * lab_tests.test_code
--   * test_groups.test_codes            (text[])
--   * clients.selected_tests            (text[])
--   * clients.results.entries[].tests   (jsonb object keyed by code)
--   * categories.tests                  (jsonb array of codes, if used)
-- audit_log keeps history as it was and is not rewritten.
--
-- Who may rename: the manager for shared tests (lab_id IS NULL), the owning
-- lab's admin (or the manager) for a lab's own test. Same rule as the
-- lab_tests UPDATE policy.
--
-- A trigger rejects any other change to lab_tests.test_code, so a plain
-- UPDATE can never orphan stored results.
--
-- Idempotent: safe to re-run. Rollback: migrations/rollback/2026-11-20_rename_test_code_down.sql

BEGIN;

-- 1. Guard: test_code changes only through rename_lab_test_code() ------------
CREATE OR REPLACE FUNCTION guard_lab_test_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.test_code IS DISTINCT FROM OLD.test_code
     AND coalesce(current_setting('app.test_code_rename', true), '') <> 'on' THEN
    RAISE EXCEPTION 'test_code can only be changed with rename_lab_test_code()'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_lab_test_code ON lab_tests;
CREATE TRIGGER guard_lab_test_code
  BEFORE UPDATE OF test_code ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION guard_lab_test_code();

-- 2. The rename itself --------------------------------------------------------
CREATE OR REPLACE FUNCTION rename_lab_test_code(p_test_uuid uuid, p_new_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old     text;
  v_lab     uuid;
  v_new     text := upper(btrim(coalesce(p_new_code, '')));
  v_groups  integer := 0;
  v_sel     integer := 0;
  v_results integer := 0;
  v_cats    integer := 0;
BEGIN
  SELECT test_code, lab_id INTO v_old, v_lab
  FROM lab_tests
  WHERE uuid = p_test_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'التحليل غير موجود' USING ERRCODE = 'no_data_found';
  END IF;

  IF NOT (
    (v_lab IS NULL AND check_is_manager())
    OR (v_lab IS NOT NULL AND (check_is_manager() OR is_lab_admin(v_lab)))
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل كود هذا التحليل' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_new = '' THEN
    RAISE EXCEPTION 'كود التحليل مطلوب' USING ERRCODE = 'check_violation';
  END IF;

  IF v_new = v_old THEN
    RETURN jsonb_build_object('old_code', v_old, 'new_code', v_new, 'changed', false);
  END IF;

  IF EXISTS (SELECT 1 FROM lab_tests WHERE test_code = v_new) THEN
    RAISE EXCEPTION 'الكود % مستخدم لتحليل آخر', v_new USING ERRCODE = 'unique_violation';
  END IF;

  -- Stored data already holding the new code would be merged with this test's
  -- data and could not be told apart again. Refuse instead.
  IF EXISTS (SELECT 1 FROM test_groups WHERE v_new = ANY (test_codes))
     OR EXISTS (SELECT 1 FROM clients WHERE v_new = ANY (selected_tests))
     OR EXISTS (
       SELECT 1 FROM clients c, jsonb_array_elements(
         CASE WHEN jsonb_typeof(c.results -> 'entries') = 'array' THEN c.results -> 'entries' ELSE '[]'::jsonb END
       ) e
       WHERE e -> 'tests' ? v_new
     ) THEN
    RAISE EXCEPTION 'الكود % موجود في بيانات محفوظة سابقاً، اختر كوداً آخر', v_new
      USING ERRCODE = 'unique_violation';
  END IF;

  PERFORM set_config('app.test_code_rename', 'on', true);
  UPDATE lab_tests SET test_code = v_new WHERE uuid = p_test_uuid;
  PERFORM set_config('app.test_code_rename', 'off', true);

  UPDATE test_groups
  SET test_codes = array_replace(test_codes, v_old, v_new)
  WHERE v_old = ANY (test_codes);
  GET DIAGNOSTICS v_groups = ROW_COUNT;

  UPDATE clients
  SET selected_tests = array_replace(selected_tests, v_old, v_new)
  WHERE v_old = ANY (selected_tests);
  GET DIAGNOSTICS v_sel = ROW_COUNT;

  -- Rename the key inside every entry, keeping entry order.
  UPDATE clients c
  SET results = jsonb_set(
    c.results,
    '{entries}',
    (
      SELECT jsonb_agg(
        CASE
          WHEN jsonb_typeof(e -> 'tests') = 'object' AND e -> 'tests' ? v_old THEN
            jsonb_set(e, '{tests}', ((e -> 'tests') - v_old) || jsonb_build_object(v_new, e -> 'tests' -> v_old))
          ELSE e
        END
        ORDER BY ord
      )
      FROM jsonb_array_elements(c.results -> 'entries') WITH ORDINALITY AS t(e, ord)
    )
  )
  WHERE jsonb_typeof(c.results -> 'entries') = 'array'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(c.results -> 'entries') e
      WHERE e -> 'tests' ? v_old
    );
  GET DIAGNOSTICS v_results = ROW_COUNT;

  UPDATE categories
  SET tests = (
    SELECT jsonb_agg(CASE WHEN x = to_jsonb(v_old) THEN to_jsonb(v_new) ELSE x END ORDER BY ord)
    FROM jsonb_array_elements(tests) WITH ORDINALITY AS t(x, ord)
  )
  WHERE jsonb_typeof(tests) = 'array'
    AND tests @> jsonb_build_array(v_old);
  GET DIAGNOSTICS v_cats = ROW_COUNT;

  RETURN jsonb_build_object(
    'old_code', v_old,
    'new_code', v_new,
    'changed', true,
    'groups', v_groups,
    'clients_selected', v_sel,
    'clients_results', v_results,
    'categories', v_cats
  );
END;
$$;

REVOKE ALL ON FUNCTION rename_lab_test_code(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rename_lab_test_code(uuid, text) TO authenticated;

COMMIT;
