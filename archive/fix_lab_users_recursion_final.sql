-- ============================================================================
-- FIX INFINITE RECURSION ON LAB_USERS DELETE
-- ============================================================================

-- 1. Ensure helper function exists (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Managers can insert lab users" ON lab_users;
DROP POLICY IF EXISTS "Managers can update lab users" ON lab_users;
DROP POLICY IF EXISTS "Managers can delete lab users" ON lab_users;

-- 3. Create new optimized policies using the helper function
CREATE POLICY "Managers can insert lab users" ON lab_users
FOR INSERT TO authenticated
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update lab users" ON lab_users
FOR UPDATE TO authenticated
USING (public.is_manager());

CREATE POLICY "Managers can delete lab users" ON lab_users
FOR DELETE TO authenticated
USING (public.is_manager());
