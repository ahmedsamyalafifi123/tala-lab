-- ============================================================================
-- FORCE FIX RLS RECURSION (THE "NUCLEAR" OPTION)
-- ============================================================================
-- This script dynamically finds and drops ALL policies on lab_users.
-- This ensures no lingering recursive policies remain, regardless of their name.

DO $$ 
DECLARE 
    pol record; 
BEGIN 
    -- 1. Loop through all policies on 'lab_users' and drop them
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'lab_users' 
        AND schemaname = 'public'
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.lab_users', pol.policyname); 
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP; 
END $$;

-- 2. Re-create Helper Functions (Force Security Definer)
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  -- Security Definer ensures this runs as Superuser/Owner, bypassing RLS
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

-- 3. Re-create Safe Policies

-- A. Manager Policy (Full Access)
-- Uses SECURITY DEFINER function to break the loop
CREATE POLICY "mgr_full_access" ON lab_users
FOR ALL TO authenticated
USING (public.check_is_manager());

-- B. Self View Policy (View own row)
CREATE POLICY "view_own_row" ON lab_users
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- C. Co-worker View Policy (View users in same labs)
CREATE POLICY "view_coworkers" ON lab_users
FOR SELECT TO authenticated
USING (
  lab_id IN (SELECT public.get_my_lab_ids())
);

-- 4. Verify/Fix Other Tables (Just to be safe)

-- Labs
DO $$ 
BEGIN 
    EXECUTE 'DROP POLICY IF EXISTS "Managers can view all labs" ON labs';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their assigned labs" ON labs';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "mgr_view_labs" ON labs FOR SELECT TO authenticated USING (public.check_is_manager());
CREATE POLICY "user_view_labs" ON labs FOR SELECT TO authenticated USING (uuid IN (SELECT public.get_my_lab_ids()));

-- Clients
DO $$ 
BEGIN 
   EXECUTE 'DROP POLICY IF EXISTS "Lab users can view their lab clients" ON clients';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

CREATE POLICY "user_view_clients" ON clients FOR SELECT TO authenticated USING (lab_id IN (SELECT public.get_my_lab_ids()));
