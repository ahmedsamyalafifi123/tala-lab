-- ============================================================================
-- FIX: Allow Lab Admins to delete users from their lab
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- Add policy for Lab Admins to delete users
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
