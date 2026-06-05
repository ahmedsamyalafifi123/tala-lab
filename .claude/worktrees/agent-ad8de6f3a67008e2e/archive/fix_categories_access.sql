-- ============================================================================
-- FIX: Restore Categories Access
-- ============================================================================
-- Run this in Supabase SQL Editor to fix categories not appearing
-- ============================================================================

-- 1. First, let's see what categories exist
-- SELECT * FROM categories;

-- 2. Check what policies exist on categories
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'categories';

-- 3. Drop all existing policies on categories and recreate them properly
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

-- 4. Create clean policies using the my_lab_ids() function
CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (lab_id IN (SELECT my_lab_ids()));

CREATE POLICY "Lab staff can insert categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (lab_id IN (SELECT my_lab_ids()));

CREATE POLICY "Lab staff can update categories" ON categories
FOR UPDATE TO authenticated
USING (lab_id IN (SELECT my_lab_ids()))
WITH CHECK (lab_id IN (SELECT my_lab_ids()));

CREATE POLICY "Lab admins can delete categories" ON categories
FOR DELETE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid() AND role = 'lab_admin'
  )
);

-- 5. Verify policies are created
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
-- Lab users can view their lab categories     | SELECT | t
-- Lab staff can insert categories             | INSERT | t
-- Lab staff can update categories             | UPDATE | t
-- Lab admins can delete categories            | DELETE | t
