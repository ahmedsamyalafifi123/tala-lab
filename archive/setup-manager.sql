-- ============================================================================
-- SCRIPT: SETUP MANAGER ACCOUNT
-- ============================================================================
-- NOTE: You cannot securely create the User Account (password) via simple SQL.
-- STEP 1: Go to Supabase Dashboard > Authentication > Users > "Add User"
-- STEP 2: Create a user with:
--         Email: manager@gmail.com
--         Password: manager123@
--         And confirm "Auto Confirm Email"
-- STEP 3: Run this script to give that user Manager permissions.
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_lab_id UUID;
  v_email TEXT := 'manager@gmail.com';
BEGIN
  -- 1. Create the Main Lab (if it doesn't exist yet)
  INSERT INTO labs (name, slug, status)
  VALUES ('Main Lab', 'main', 'active')
  ON CONFLICT (slug) DO NOTHING;
  
  -- Get the Lab ID
  SELECT uuid INTO v_lab_id FROM labs WHERE slug = 'main';

  -- 2. Get the User ID from Auth system
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  -- Stop if user wasn't created in Dashboard yet
  IF v_user_id IS NULL THEN
     RAISE EXCEPTION 'User % not found! Please create the user manually in Supabase Dashboard first.', v_email;
  END IF;

  -- 3. Assign Manager Role
  INSERT INTO lab_users (lab_id, user_id, role, is_manager, status)
  VALUES (v_lab_id, v_user_id, 'manager', true, 'active')
  ON CONFLICT (lab_id, user_id) 
  DO UPDATE SET 
    role = 'manager', 
    is_manager = true, 
    status = 'active';

  RAISE NOTICE 'Success! User % is now a Global Manager linked to Main Lab.', v_email;

END $$;
