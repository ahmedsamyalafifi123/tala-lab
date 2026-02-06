-- ============================================================================
-- FIX: Remove obsolete trigger and function causing the error (UPDATED)
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- 1. Drop the specific dependent trigger found in the error message
DROP TRIGGER IF EXISTS set_daily_id ON clients;

-- 2. Drop other potential legacy triggers (just in case)
DROP TRIGGER IF EXISTS generate_daily_id ON clients;
DROP TRIGGER IF EXISTS trigger_generate_daily_id ON clients;

-- 3. Drop the old function with CASCADE to remove any remaining links
DROP FUNCTION IF EXISTS generate_daily_id() CASCADE;

-- 4. Ensure the correct trigger is active and clean
DROP TRIGGER IF EXISTS trigger_assign_daily_id ON clients;
CREATE TRIGGER trigger_assign_daily_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION assign_daily_id();
