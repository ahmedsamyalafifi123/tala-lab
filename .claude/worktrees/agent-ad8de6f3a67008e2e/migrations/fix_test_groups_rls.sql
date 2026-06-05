-- ============================================================================
-- FIX TEST GROUPS RLS - Add Missing Helper Functions
-- ============================================================================
-- This script adds the missing check_is_manager() and get_my_lab_ids() 
-- functions that are required by the RLS policies on test_groups and lab_tests
-- ============================================================================

-- 1. Create check_is_manager() function with SECURITY DEFINER
-- This function checks if the current user is a manager
-- SECURITY DEFINER ensures it runs with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has is_manager = true in lab_users
  RETURN EXISTS (
    SELECT 1 FROM public.lab_users
    WHERE user_id = auth.uid()
    AND is_manager = true
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create get_my_lab_ids() function with SECURITY DEFINER
-- This function returns all lab IDs that the current user has access to
-- SECURITY DEFINER ensures it runs with elevated privileges to avoid RLS recursion
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

-- 3. Create my_lab_ids() function (alias for compatibility)
-- Some policies might use my_lab_ids() instead of get_my_lab_ids()
CREATE OR REPLACE FUNCTION public.my_lab_ids()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT lu.lab_id 
  FROM public.lab_users lu
  WHERE lu.user_id = auth.uid()
  AND lu.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create is_manager() function (alias for compatibility)
-- Some policies might use is_manager() instead of check_is_manager()
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.check_is_manager();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if functions were created successfully
SELECT 
  routine_name, 
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('check_is_manager', 'get_my_lab_ids', 'my_lab_ids', 'is_manager')
ORDER BY routine_name;

-- Test the functions (should return results if you're logged in as a manager)
SELECT public.check_is_manager() as am_i_manager;
SELECT * FROM public.get_my_lab_ids();

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this migration:
-- 1. The test_groups DELETE policy should work correctly
-- 2. The lab_tests policies should work correctly
-- 3. All manager-related RLS policies should function without recursion errors
-- ============================================================================
