-- Convert lab_tests.reference_ranges from a min/max object into an ordered
-- list of reference rules.
--
--   before: {"default": {"min": 4.0, "max": 11.0}}
--   after:  [{"id": "...", "label": "Normal", "op": "between",
--             "min": 4.0, "max": 11.0, "flag": "normal"}]
--
-- Tests whose range was empty become an empty list. They keep behaving as they
-- do today -- free-text entry, no flag -- until someone authors rules for them.
--
-- Idempotent: the guard skips rows already holding an array, so a re-run is a
-- no-op. Run this BEFORE deploying the matching app bundle; older bundles read
-- an array as "no range" and render "-" rather than failing.

BEGIN;

UPDATE lab_tests
SET reference_ranges =
  -- default range -> one unconditional rule
  (CASE
     WHEN jsonb_typeof(reference_ranges -> 'default' -> 'min') = 'number'
      AND jsonb_typeof(reference_ranges -> 'default' -> 'max') = 'number'
     THEN jsonb_build_array(jsonb_build_object(
            'id',    gen_random_uuid()::text,
            'label', 'Normal',
            'op',    'between',
            'min',   reference_ranges -> 'default' -> 'min',
            'max',   reference_ranges -> 'default' -> 'max',
            'flag',  'normal'))
     ELSE '[]'::jsonb
   END)
  ||
  -- male range -> rule conditioned on gender
  (CASE
     WHEN jsonb_typeof(reference_ranges -> 'male' -> 'min') = 'number'
      AND jsonb_typeof(reference_ranges -> 'male' -> 'max') = 'number'
     THEN jsonb_build_array(jsonb_build_object(
            'id',    gen_random_uuid()::text,
            'label', 'Normal',
            'op',    'between',
            'min',   reference_ranges -> 'male' -> 'min',
            'max',   reference_ranges -> 'male' -> 'max',
            'flag',  'normal',
            'applies_to', jsonb_build_object('gender', 'male')))
     ELSE '[]'::jsonb
   END)
  ||
  -- female range -> rule conditioned on gender
  (CASE
     WHEN jsonb_typeof(reference_ranges -> 'female' -> 'min') = 'number'
      AND jsonb_typeof(reference_ranges -> 'female' -> 'max') = 'number'
     THEN jsonb_build_array(jsonb_build_object(
            'id',    gen_random_uuid()::text,
            'label', 'Normal',
            'op',    'between',
            'min',   reference_ranges -> 'female' -> 'min',
            'max',   reference_ranges -> 'female' -> 'max',
            'flag',  'normal',
            'applies_to', jsonb_build_object('gender', 'female')))
     ELSE '[]'::jsonb
   END)
  ||
  -- age brackets -> one rule each, conditioned on the age window
  (CASE
     WHEN jsonb_typeof(reference_ranges -> 'age_ranges') = 'array'
     THEN COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                     'id',    gen_random_uuid()::text,
                     'label', 'Normal',
                     'op',    'between',
                     'min',   bracket -> 'min',
                     'max',   bracket -> 'max',
                     'flag',  'normal',
                     'applies_to', jsonb_strip_nulls(jsonb_build_object(
                       'min_age', bracket -> 'min_age',
                       'max_age', bracket -> 'max_age'))))
            FROM jsonb_array_elements(reference_ranges -> 'age_ranges') AS bracket
            WHERE jsonb_typeof(bracket -> 'min') = 'number'
              AND jsonb_typeof(bracket -> 'max') = 'number'
          ), '[]'::jsonb)
     ELSE '[]'::jsonb
   END)
WHERE jsonb_typeof(reference_ranges) = 'object';

-- Rows that were NULL never held a range; give them an empty list too.
UPDATE lab_tests SET reference_ranges = '[]'::jsonb WHERE reference_ranges IS NULL;

ALTER TABLE lab_tests ALTER COLUMN reference_ranges SET DEFAULT '[]'::jsonb;

-- Writes come straight from the browser through supabase-js, with no server
-- route to validate them. This is the backstop against a malformed write.
ALTER TABLE lab_tests DROP CONSTRAINT IF EXISTS lab_tests_reference_ranges_is_array;
ALTER TABLE lab_tests ADD CONSTRAINT lab_tests_reference_ranges_is_array
  CHECK (reference_ranges IS NULL OR jsonb_typeof(reference_ranges) = 'array');

COMMIT;
