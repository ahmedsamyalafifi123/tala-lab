-- ============================================================================
-- FORCE CLEANUP: Inspect and Remove Legacy Users
-- ============================================================================

-- 1. First, let's see what is actually in the table
SELECT role, is_manager, count(*) as count 
FROM lab_users 
GROUP BY role, is_manager;

-- 2. Delete anyone who is NOT explicitly the 'manager' role
--    (This is stronger than checking the is_manager flag which might be wrong)
DELETE FROM lab_users
WHERE role <> 'manager';

-- 3. If you also want to remove them from the Authentication system (auth.users):
--    (DANGER: This deletes their login account entirely)
DELETE FROM auth.users
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM lab_users) -- Delete orphans
);
