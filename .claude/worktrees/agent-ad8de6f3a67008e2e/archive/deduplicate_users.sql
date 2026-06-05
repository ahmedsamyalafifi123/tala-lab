-- ============================================================================
-- FIX: Deduplicate Users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- This script keeps the LATEST entry for each user in each lab
-- and deletes the older duplicates.

DELETE FROM lab_users
WHERE uuid NOT IN (
    SELECT uuid FROM (
        SELECT uuid, ROW_NUMBER() OVER (PARTITION BY lab_id, user_id ORDER BY created_at DESC) as rn
        FROM lab_users
    ) sub
    WHERE sub.rn = 1
);

-- Optional: Verify that now we have unique users
SELECT user_id, count(*) FROM lab_users GROUP BY user_id HAVING count(*) > 1;
