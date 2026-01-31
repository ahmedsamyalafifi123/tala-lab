-- ============================================================================
-- RLS RECURSION FIX & POLICY UPDATE (v2 - PUBLIC SCHEMA)
-- ============================================================================
-- The previous RLS policies caused "Infinite Recursion".
-- We fix this by using SECURITY DEFINER functions in the PUBLIC schema.
-- ============================================================================

-- 1. Helper Function: Check if user is manager (Bypasses RLS)
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

-- 2. Helper Function: Get user's lab IDs (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.my_lab_ids()
RETURNS TABLE(lab_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT lu.lab_id 
  FROM public.lab_users lu
  WHERE lu.user_id = auth.uid()
  AND lu.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- UPDATE LAB_USERS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Managers can view all lab users" ON lab_users;
DROP POLICY IF EXISTS "Lab admins can view their lab users" ON lab_users;
DROP POLICY IF EXISTS "Users can view their own lab_users row" ON lab_users;
DROP POLICY IF EXISTS "Users can see own lab_user row" ON lab_users;
DROP POLICY IF EXISTS "Managers can view all lab_users" ON lab_users;
DROP POLICY IF EXISTS "Users can see co-workers" ON lab_users;

-- Base Policy: Users can see their own row
CREATE POLICY "Users can see own lab_user row" ON lab_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Manager Policy: Managers can see ALL rows
CREATE POLICY "Managers can view all lab_users" ON lab_users
FOR SELECT TO authenticated
USING (public.is_manager());

-- Admin/Staff Policy: Can see users in their labs
CREATE POLICY "Users can see co-workers" ON lab_users
FOR SELECT TO authenticated
USING (lab_id IN (SELECT public.my_lab_ids()));


-- ============================================================================
-- UPDATE LABS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Managers can view all labs" ON labs;
DROP POLICY IF EXISTS "Lab users can view their lab" ON labs;
DROP POLICY IF EXISTS "Managers can insert labs" ON labs;
DROP POLICY IF EXISTS "Managers can update labs" ON labs;
DROP POLICY IF EXISTS "Managers can delete labs" ON labs;
DROP POLICY IF EXISTS "Users can view their assigned labs" ON labs;

-- Manager Policy
CREATE POLICY "Managers can view all labs" ON labs
FOR SELECT TO authenticated
USING (public.is_manager());

-- User Policy
CREATE POLICY "Users can view their assigned labs" ON labs
FOR SELECT TO authenticated
USING (uuid IN (SELECT public.my_lab_ids()));

-- Manager Write Access
CREATE POLICY "Managers can insert labs" ON labs
FOR INSERT TO authenticated
WITH CHECK (public.is_manager());

CREATE POLICY "Managers can update labs" ON labs
FOR UPDATE TO authenticated
USING (public.is_manager());

CREATE POLICY "Managers can delete labs" ON labs
FOR DELETE TO authenticated
USING (public.is_manager());


-- ============================================================================
-- UPDATE CLIENTS POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Lab users can view their lab clients" ON clients;

CREATE POLICY "Lab users can view their lab clients" ON clients
FOR SELECT TO authenticated
USING (lab_id IN (SELECT public.my_lab_ids()));


-- ============================================================================
-- UPDATE CATEGORIES POLICIES
-- ============================================================================
DROP POLICY IF EXISTS "Lab users can view their lab categories" ON categories;

CREATE POLICY "Lab users can view their lab categories" ON categories
FOR SELECT TO authenticated
USING (lab_id IN (SELECT public.my_lab_ids()));
