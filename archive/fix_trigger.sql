-- ============================================================================
-- FIX: Update assign_daily_id function to use correct column name
-- Run this script in the Supabase SQL Editor
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign the next daily ID for this lab
  NEW.daily_id := get_next_daily_id(NEW.lab_id);
  
  -- The column is now 'daily_date', not 'client_date'
  NEW.daily_date := CURRENT_DATE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify/Re-create the trigger to be safe
DROP TRIGGER IF EXISTS trigger_assign_daily_id ON clients;
CREATE TRIGGER trigger_assign_daily_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION assign_daily_id();
