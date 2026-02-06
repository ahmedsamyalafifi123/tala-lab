-- ============================================================================
-- DIAGNOSTIC: Check Categories Access Issue (Fixed for 'id' column)
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose the problem
-- ============================================================================

-- 1. Check if categories table structure is correct
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 2. Check if any categories exist
SELECT
  id,
  lab_id,
  name,
  is_active,
  display_order,
  created_at
FROM categories
LIMIT 10;

-- 3. Check what my_lab_ids() returns for current user
SELECT my_lab_ids() AS current_user_lab_ids;

-- 4. Check if the current user has access to categories through RLS
-- This simulates what the frontend query does
SELECT
  c.id,
  c.lab_id,
  c.name,
  (SELECT my_lab_ids()) AS my_lab_ids,
  c.lab_id = ANY((SELECT my_lab_ids())::uuid[]) AS has_access
FROM categories c
LIMIT 10;

-- 5. Check the RLS policy definition for SELECT on categories
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories' AND cmd = 'SELECT';

-- 6. Check lab_users to see what labs the current user belongs to
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

-- 7. Try a direct query like the frontend does
SELECT *
FROM categories
WHERE lab_id IN (SELECT my_lab_ids());
