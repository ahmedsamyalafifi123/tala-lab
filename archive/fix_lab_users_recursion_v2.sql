-- ============================================================================
-- FIX INFINITE RECURSION ON LAB_USERS (V2 - COMPREHENSIVE)
-- ============================================================================
-- The previous fix only addressed WRITE policies, but SELECT policies 
-- were still recursive and triggered during operations.
-- This script drops ALL policies on lab_users and replaces them.

-- 1. Helper Functions (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  -- This query runs with privileges of the function creator (postgres/admin)
  -- bypassing RLS on lab_users table
  RETURN EXISTS (
    SELECT 1 FROM public.lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_lab_ids()
RETURNS TABLE(lab_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT lu.lab_id 
  FROM public.lab_users lu
  WHERE lu.user_id = auth.uid()
  AND lu.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop ALL existing policies on lab_users
DROP POLICY IF EXISTS "Managers can view all lab users" ON lab_users;
DROP POLICY IF EXISTS "Lab admins can view their lab users" ON lab_users;
DROP POLICY IF EXISTS "Managers can insert lab users" ON lab_users;
DROP POLICY IF EXISTS "Managers can update lab users" ON lab_users;
DROP POLICY IF EXISTS "Managers can delete lab users" ON lab_users;
-- Also drop potential policies from other migrations
DROP POLICY IF EXISTS "Users can view their own lab_users row" ON lab_users;
DROP POLICY IF EXISTS "Managers can view all lab_users" ON lab_users;
DROP POLICY IF EXISTS "Users can see co-workers" ON lab_users;

-- 3. Re-create Safe Policies using Helper Functions

-- Policy 1: Managers can do EVERYTHING (Select, Insert, Update, Delete)
CREATE POLICY "Managers can manage all lab users" ON lab_users
FOR ALL TO authenticated
USING (public.check_is_manager());

-- Policy 2: Users can view their OWN row (Essential for initial load)
CREATE POLICY "Users can view own row" ON lab_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Lab Admins/Staff can view users in their same lab
CREATE POLICY "Users can view co-workers" ON lab_users
FOR SELECT TO authenticated
USING (
  lab_id IN (SELECT public.get_my_lab_ids())
);

-- ============================================================================
-- OPTIONAL: Fix other tables just in case (Labs, Clients) 
-- ============================================================================
-- Labs
DROP POLICY IF EXISTS "Managers can view all labs" ON labs;
CREATE POLICY "Managers can view all labs" ON labs FOR SELECT USING (public.check_is_manager());

-- Clients
DROP POLICY IF EXISTS "Lab users can view their lab clients" ON clients;
CREATE POLICY "Lab users can view their lab clients" ON clients 
FOR SELECT USING (lab_id IN (SELECT public.get_my_lab_ids()));
