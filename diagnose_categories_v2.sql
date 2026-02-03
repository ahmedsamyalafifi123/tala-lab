-- ============================================================================
-- DIAGNOSTIC: Check Categories Access Issue - Version 2
-- ============================================================================

-- 1. First, just get the actual structure of categories table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 2. Check if any categories exist (only using columns we know exist)
SELECT *
FROM categories
LIMIT 10;

-- 3. Check what my_lab_ids() returns for current user
SELECT my_lab_ids() AS current_user_lab_ids;

-- 4. Check the RLS policy definition for SELECT on categories
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories' AND cmd = 'SELECT';

-- 5. Check lab_users to see what labs the current user belongs to
SELECT
  lu.uuid,
  lu.lab_id,
  lu.user_id,
  lu.role,
  l.name AS lab_name,
  l.slug AS lab_slug
FROM lab_users lu
JOIN labs l ON lu.lab_id = l.uuid
WHERE lu.user_id = auth.uid();
