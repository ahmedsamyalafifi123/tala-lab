-- ============================================================================
-- DEBUG: Inspect Lab Users and Audit Log
-- ============================================================================

-- 1. List all Lab Users to check for anomalies (NULLs, weird roles, etc.)
SELECT 
    lu.uuid,
    lu.lab_id,
    lu.user_id,
    lu.role,
    lu.status,
    au.email,
    au.created_at as auth_created_at
FROM lab_users lu
LEFT JOIN auth.users au ON lu.user_id = au.id;

-- 2. Check Audit Log for recent failures (if any partial inserts happened)
-- Note: Failed transactions usually don't leave audit logs, but good to check.
SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5;

-- 3. Check specific RLS policy status (system catalog)
SELECT * FROM pg_policies WHERE tablename = 'lab_users';
