-- ============================================================================
-- FIX: Audit Log Verification & Repair
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- 1. Update the log_audit_changes function to use SECURITY DEFINER.
--    This ensures the trigger runs with the privileges of the creator (admin),
--    bypassing RLS checks on the 'audit_log' table itself.
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_lab_id UUID;
  v_user_id UUID;
BEGIN
  -- Get lab_id from the record
  IF TG_TABLE_NAME = 'clients' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  ELSIF TG_TABLE_NAME = 'categories' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  ELSIF TG_TABLE_NAME = 'lab_users' THEN
    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);
  END IF;

  v_user_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, new_values)
    VALUES (v_lab_id, v_user_id, 'create', TG_TABLE_NAME, NEW.uuid, to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values, new_values)
    VALUES (v_lab_id, v_user_id, 'update', TG_TABLE_NAME, NEW.uuid, to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values)
    VALUES (v_lab_id, v_user_id, 'delete', TG_TABLE_NAME, OLD.uuid, to_jsonb(OLD));
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add an explicit INSERT policy for audit_log just in case
--    (If SECURITY DEFINER fails or isn't supported in some context)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_log;
CREATE POLICY "Authenticated users can insert audit logs" ON audit_log
FOR INSERT TO authenticated
WITH CHECK (true);

-- 3. Verify Lab User Delete Policy again (Force it to be sure)
DROP POLICY IF EXISTS "Lab admins can delete users" ON lab_users;
CREATE POLICY "Lab admins can delete users" ON lab_users
FOR DELETE TO authenticated
USING (
  lab_id IN (
    SELECT lab_id FROM lab_users
    WHERE user_id = auth.uid()
    AND role = 'lab_admin'
    AND status = 'active'
  )
);
