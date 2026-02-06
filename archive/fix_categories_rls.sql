-- ============================================================================
-- FIX: Categories RLS Policies - Allow lab_staff to manage categories too
-- ============================================================================
-- The original policy only allowed lab_admin, but lab_staff should also
-- be able to insert/update categories
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Lab admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can update categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can delete categories" ON categories;

-- Create new policies that allow both lab_admin AND lab_staff
CREATE POLICY "Lab admins/staff can insert categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
);

CREATE POLICY "Lab admins/staff can update categories" ON categories
FOR UPDATE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
)
WITH CHECK (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role IN ('lab_admin', 'lab_staff')
    AND status = 'active'
  )
);

CREATE POLICY "Lab admins can delete categories" ON categories
FOR DELETE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);

-- Verify policies are created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories';
