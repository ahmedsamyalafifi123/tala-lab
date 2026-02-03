-- ============================================================================
-- FIX: Complete Categories RLS Policies Fix
-- ============================================================================
-- This fixes the DELETE policy and updates all policies to use = ANY()
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Lab users can view their lab categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can update categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can delete categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can update categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Lab admins/staff can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab admins/staff can update categories" ON categories;
DROP POLICY IF EXISTS "Lab admins/staff can delete categories" ON categories;

-- Create clean policies using = ANY() for array comparison
CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (lab_id = ANY(SELECT my_lab_ids()));

CREATE POLICY "Lab staff can insert categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (lab_id = ANY(SELECT my_lab_ids()));

CREATE POLICY "Lab staff can update categories" ON categories
FOR UPDATE TO authenticated
USING (lab_id = ANY(SELECT my_lab_ids()))
WITH CHECK (lab_id = ANY(SELECT my_lab_ids()));

CREATE POLICY "Lab staff can delete categories" ON categories
FOR DELETE TO authenticated
USING (lab_id = ANY(SELECT my_lab_ids()));

-- Verify policies are created
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- Expected result:
-- policyname                                  | cmd    | permissive
-- --------------------------------------------|--------|------------
-- Lab staff can delete categories             | DELETE | t
-- Lab staff can insert categories             | INSERT | t
-- Lab staff can update categories             | UPDATE | t
-- Lab users can view their lab categories     | SELECT | t
