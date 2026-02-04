-- Fix for add_lab_user_by_email function
-- Removes reference to non-existent 'updated_at' column in lab_users table

CREATE OR REPLACE FUNCTION add_lab_user_by_email(
  p_lab_id UUID, 
  p_email TEXT, 
  p_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_new_record JSONB;
  v_caller_id UUID;
  v_is_authorized BOOLEAN;
BEGIN
  v_caller_id := auth.uid();
  
  -- 1. Check permissions
  SELECT EXISTS (
    SELECT 1 FROM lab_users 
    WHERE user_id = v_caller_id 
    AND status = 'active'
    AND (
      is_manager = true 
      OR (lab_id = p_lab_id AND role = 'lab_admin')
    )
  ) INTO v_is_authorized;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to add users to this lab';
  END IF;

  -- 2. Find the user ID from email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  -- 3. Insert or Update lab_users record
  INSERT INTO lab_users (lab_id, user_id, role, status, created_by)
  VALUES (p_lab_id, v_user_id, p_role, 'active', v_caller_id)
  ON CONFLICT (lab_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    status = 'active'
    -- updated_at removed as column does not exist
  RETURNING to_jsonb(lab_users.*) INTO v_new_record;

  RETURN v_new_record;
END;
$$;
