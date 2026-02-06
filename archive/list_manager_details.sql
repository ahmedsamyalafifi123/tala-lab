-- ============================================================================
-- INSPECT MANAGERS
-- Run this in Supabase SQL Editor
-- ============================================================================

SELECT 
    lu.user_id,
    au.email,
    lu.role,
    lu.is_manager,
    lu.status,
    lu.created_at
FROM lab_users lu
JOIN auth.users au ON lu.user_id = au.id
WHERE lu.role = 'manager' OR lu.is_manager = true;

-- After running this, look at the EMAILS.
-- Identify which email is YOURS (the one you want to keep).
