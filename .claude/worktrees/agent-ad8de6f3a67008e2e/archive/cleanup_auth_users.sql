-- ============================================================================
-- FINAL CLEANUP: Delete ALL Auth Users Except Manager (FIXED)
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  v_keep_email TEXT := 'manager@gmail.com';
  v_keep_id UUID;
BEGIN
  -- 1. Get the manager ID to keep
  SELECT id INTO v_keep_id FROM auth.users WHERE email = v_keep_email;

  IF v_keep_id IS NULL THEN
    RAISE EXCEPTION 'Manager user % not found!', v_keep_email;
  END IF;

  -- 2. Unlink from AUDIT LOG (Set user_id to NULL to preserve log history)
  UPDATE audit_log
  SET user_id = NULL
  WHERE user_id IS DISTINCT FROM v_keep_id;

  -- 3. Unlink from CLIENTS (Set created_by to NULL)
  --    This prevents deleting clients when deleting the user who created them
  UPDATE clients
  SET created_by = NULL
  WHERE created_by IS DISTINCT FROM v_keep_id;

  -- 4. Unlink from LAB_USERS metadata (created_by field)
  UPDATE lab_users
  SET created_by = NULL
  WHERE created_by IS DISTINCT FROM v_keep_id;

  -- 5. NOW we can safely delete the users
  --    (lab_users tables will cascade delete because of ON DELETE CASCADE on user_id)
  DELETE FROM auth.users
  WHERE id IS DISTINCT FROM v_keep_id;
  
END $$;

-- Verify results
SELECT email as remaining_user FROM auth.users;
