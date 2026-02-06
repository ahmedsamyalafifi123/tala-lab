-- ============================================================================
-- AGGRESSIVE CLEANUP: Keep ONLY the latest manager entry
-- Run this in Supabase SQL Editor
-- ============================================================================

-- This script deletes ALL entries for the manager user except the very latest one.
-- It ignores different labs, assuming you only want one active assignment.

DELETE FROM lab_users
WHERE user_id = 'd14e9cae-d6f3-4b3e-b10f-a5e1f33c5859'
AND uuid NOT IN (
    SELECT uuid FROM (
        SELECT uuid 
        FROM lab_users
        WHERE user_id = 'd14e9cae-d6f3-4b3e-b10f-a5e1f33c5859'
        ORDER BY created_at DESC
        LIMIT 1
    ) keep_me
);

-- Verify the result
SELECT user_id, count(*) FROM lab_users WHERE user_id = 'd14e9cae-d6f3-4b3e-b10f-a5e1f33c5859' GROUP BY user_id;
