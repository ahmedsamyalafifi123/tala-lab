-- ============================================================================
-- BULK DELETE: Remove all non-manager users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- This will remove all users from the labs EXCEPT those marked as managers.
DELETE FROM lab_users
WHERE is_manager IS DISTINCT FROM true;

-- Note: This removes their access to the lab. 
-- It does NOT delete their Supabase Auth account (email/password login).
-- If you want to delete the Auth accounts as well, you would need to run:
-- DELETE FROM auth.users WHERE id IN (SELECT user_id FROM lab_users WHERE is_manager IS DISTINCT FROM true);
-- BUT you must run that BEFORE deleting from lab_users (or rely on Cascade if configured).
-- Given the safety risk, we are only deleting the lab access (lab_users) first.
