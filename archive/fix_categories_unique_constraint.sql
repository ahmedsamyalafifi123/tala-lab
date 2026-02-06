-- ============================================================================
-- FIX: Remove wrong unique constraint and add correct one
-- ============================================================================
-- Problem: categories_name_key makes name globally unique (wrong!)
-- Solution: Remove it and add UNIQUE(lab_id, name) instead
-- ============================================================================

-- 1. Drop the wrong constraint (name only)
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

-- 2. Drop any other wrong constraints
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_lab_id_name_key;

-- 3. Add the CORRECT unique constraint (lab_id + name together)
ALTER TABLE categories ADD CONSTRAINT categories_lab_id_name_key UNIQUE (lab_id, name);

-- 4. Verify the constraint is correct
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'categories'::regclass
  AND contype = 'u';

-- Expected result should show:
-- categories_lab_id_name_key | UNIQUE (lab_id, name)
