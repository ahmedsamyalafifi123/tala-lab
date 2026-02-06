-- ============================================================================
-- CLEANUP: Fix Existing Clients with Empty selected_tests
-- ============================================================================
-- This script helps fix clients that were created before the fix
-- They have empty selected_tests arrays even though tests were selected

-- ============================================================================
-- Option 1: Delete Test Clients (Recommended)
-- ============================================================================
-- If "aaaaaaaaaaa" was just a test, delete it:

DELETE FROM clients WHERE patient_name = 'aaaaaaaaaaa';

-- Delete any other test clients:
-- DELETE FROM clients WHERE patient_name LIKE '%test%';
-- DELETE FROM clients WHERE patient_name = 'ششيييييييييييي';

-- ============================================================================
-- Option 2: Manually Assign Tests to Existing Clients
-- ============================================================================
-- If you want to keep existing clients but add tests to them:

-- Example: Add common tests to a specific client
UPDATE clients
SET selected_tests = ARRAY[
  'CBC_WBC',
  'CBC_RBC',
  'CBC_HGB',
  'CBC_HCT',
  'CBC_PLT',
  'GLUC_FBS',
  'LIPID_CHOL',
  'LIPID_TG',
  'LIPID_HDL',
  'LIPID_LDL'
]
WHERE patient_name = 'CLIENT_NAME_HERE';

-- Verify it worked:
-- SELECT patient_name, selected_tests FROM clients WHERE patient_name = 'CLIENT_NAME_HERE';

-- ============================================================================
-- Option 3: Set Default Tests for All Clients with Empty Arrays
-- ============================================================================
-- Add a basic test panel to all clients that have empty selected_tests:

-- First, check how many clients have empty arrays:
SELECT COUNT(*) as clients_with_empty_tests
FROM clients
WHERE selected_tests = '{}';

-- If you want to add default tests to all of them:
/*
UPDATE clients
SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS']
WHERE selected_tests = '{}'
  AND created_at > '2026-02-06';  -- Only recent ones
*/

-- ============================================================================
-- Option 4: Copy Tests from Similar Clients
-- ============================================================================
-- If you have multiple clients with same name pattern, copy tests from one to others:

/*
-- Find a client with tests:
SELECT uuid, patient_name, selected_tests
FROM clients
WHERE selected_tests != '{}'
LIMIT 1;

-- Copy tests to other clients with same name pattern:
UPDATE clients c1
SET selected_tests = (
  SELECT selected_tests
  FROM clients c2
  WHERE c2.patient_name LIKE '%pattern%'
    AND c2.selected_tests != '{}'
  LIMIT 1
)
WHERE c1.patient_name LIKE '%pattern%'
  AND c1.selected_tests = '{}';
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- See all clients and their test status:
SELECT
  patient_name,
  CASE
    WHEN selected_tests IS NULL THEN 'NULL'
    WHEN selected_tests = '{}' THEN 'EMPTY'
    ELSE array_length(selected_tests, 1)::text || ' tests'
  END as test_status,
  selected_tests,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 20;

-- Count clients by test status:
SELECT
  CASE
    WHEN selected_tests IS NULL THEN 'NULL'
    WHEN selected_tests = '{}' THEN 'EMPTY'
    WHEN array_length(selected_tests, 1) > 0 THEN 'HAS TESTS'
  END as status,
  COUNT(*) as count
FROM clients
GROUP BY status;

-- Show clients that SHOULD have flask icon:
SELECT patient_name, selected_tests
FROM clients
WHERE selected_tests IS NOT NULL
  AND selected_tests != '{}'
ORDER BY created_at DESC
LIMIT 10;
