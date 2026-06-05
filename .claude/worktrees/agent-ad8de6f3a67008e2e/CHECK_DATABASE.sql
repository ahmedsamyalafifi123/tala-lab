-- ============================================================================
-- DATABASE VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to check if everything is working
-- ============================================================================

-- 1. Check if selected_tests column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clients' AND column_name = 'selected_tests';
-- Expected: Should show one row with data_type = ARRAY

-- 2. Check recent clients with their selected_tests
SELECT
  uuid,
  patient_name,
  selected_tests,
  CASE
    WHEN selected_tests IS NULL THEN 'NULL'
    WHEN array_length(selected_tests, 1) IS NULL THEN 'EMPTY ARRAY'
    ELSE array_length(selected_tests, 1)::text || ' tests'
  END as test_status,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 10;
-- Look for the client you just created

-- 3. Count clients by test status
SELECT
  CASE
    WHEN selected_tests IS NULL THEN 'NULL (not set)'
    WHEN array_length(selected_tests, 1) IS NULL THEN 'Empty array'
    WHEN array_length(selected_tests, 1) > 0 THEN 'Has tests'
  END as status,
  COUNT(*) as count
FROM clients
GROUP BY status;

-- 4. Show clients that SHOULD have flask icon (have tests)
SELECT
  patient_name,
  selected_tests,
  array_length(selected_tests, 1) as test_count
FROM clients
WHERE selected_tests IS NOT NULL
  AND array_length(selected_tests, 1) > 0
ORDER BY created_at DESC
LIMIT 5;
-- These clients should show the flask icon!

-- 5. Check if lab_tests table has data
SELECT COUNT(*) as total_tests FROM lab_tests;
-- Should be at least 3

-- 6. Check if test_groups table has data
SELECT COUNT(*) as total_groups FROM test_groups;
-- Should be at least 1

-- 7. Sample test data
SELECT test_code, test_name_ar, category
FROM lab_tests
ORDER BY display_order
LIMIT 10;

-- ============================================================================
-- FIX: If clients have NULL selected_tests, update them manually for testing
-- ============================================================================

-- Find a client to update (replace the UUID)
SELECT uuid, patient_name, selected_tests
FROM clients
WHERE selected_tests IS NULL
LIMIT 1;

-- Update that client with test data (REPLACE 'YOUR_UUID_HERE')
-- Uncomment and run:
/*
UPDATE clients
SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS', 'LIPID_CHOL']
WHERE uuid = 'YOUR_UUID_HERE';
*/

-- Verify it worked
-- SELECT patient_name, selected_tests FROM clients WHERE uuid = 'YOUR_UUID_HERE';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If selected_tests column doesn't exist, run this:
/*
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS selected_tests TEXT[] DEFAULT '{}';
*/

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('lab_tests', 'test_groups', 'clients')
ORDER BY tablename, policyname;
