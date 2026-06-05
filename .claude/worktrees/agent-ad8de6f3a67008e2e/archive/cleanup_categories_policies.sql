-- ============================================================================
-- CLEANUP: Remove duplicate/conflicting category policies and add helpful error
-- ============================================================================

-- Drop all the duplicate policies first
DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
DROP POLICY IF EXISTS "Lab admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Lab admins/staff can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab admins/staff can update categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can delete categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can insert categories" ON categories;
DROP POLICY IF EXISTS "Lab staff can update categories" ON categories;
DROP POLICY IF EXISTS "Lab users can view their lab categories" ON categories;

-- Create clean, simple policies
CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

CREATE POLICY "Lab staff can insert categories" ON categories
FOR INSERT TO authenticated
WITH CHECK (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

CREATE POLICY "Lab staff can update categories" ON categories
FOR UPDATE TO authenticated
USING (lab_id IN (SELECT my_lab_ids() AS my_lab_ids))
WITH CHECK (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

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

-- ============================================================================
-- DEBUG: Check for existing categories with same name
-- ============================================================================
-- Run this to see if there are duplicates:
-- SELECT lab_id, name, COUNT(*) as count
-- FROM categories
-- GROUP BY lab_id, name
-- HAVING COUNT(*) > 1;

-- ============================================================================
-- Function to provide better error message for duplicate categories
-- ============================================================================
CREATE OR REPLACE FUNCTION check_duplicate_category()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check if category with same name already exists for this lab
  SELECT COUNT(*) INTO existing_count
  FROM categories
  WHERE lab_id = NEW.lab_id
    AND name = NEW.name;

  IF existing_count > 0 THEN
    RAISE EXCEPTION 'التصنيف "%" موجود بالفعل في هذا المعمل', NEW.name
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_check_duplicate_category ON categories;

-- Create trigger to check duplicates before insert
CREATE TRIGGER trigger_check_duplicate_category
  BEFORE INSERT ON categories
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_category();

-- Verify policies are correct
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY cmd, policyname;
