-- ============================================================================
-- FIX: Restore Manager Access to ALL Labs
-- Run this in Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  v_manager_email TEXT := 'manager@gmail.com';
  v_manager_id UUID;
BEGIN
  -- 1. Get the Manager's User ID
  SELECT id INTO v_manager_id FROM auth.users WHERE email = v_manager_email;

  IF v_manager_id IS NULL THEN
    RAISE EXCEPTION 'Manager user % not found!', v_manager_email;
  END IF;

  -- 2. Insert/Update the manager into EVERY Lab
  INSERT INTO lab_users (lab_id, user_id, role, is_manager, status)
  SELECT 
    l.uuid,             -- lab_id
    v_manager_id,       -- user_id
    'manager',          -- role
    true,               -- is_manager
    'active'            -- status
  FROM labs l
  ON CONFLICT (lab_id, user_id) 
  DO UPDATE SET
    role = 'manager',
    is_manager = true,
    status = 'active';

END $$;
