-- ============================================================================
-- FIX: Categories RLS Policy - Use proper array syntax
-- ============================================================================
-- The issue: my_lab_ids() returns UUID[] but IN operator expects rows
-- The fix: Use = ANY() for array comparison or unnest() the array
-- ============================================================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Lab users can view their lab categories" ON categories;

-- Recreate with correct array syntax using = ANY()
CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (lab_id = ANY(SELECT my_lab_ids()));

-- Verify the policy is now correct
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories' AND cmd = 'SELECT';

-- Test that categories can now be fetched
SELECT *
FROM categories
LIMIT 10;
