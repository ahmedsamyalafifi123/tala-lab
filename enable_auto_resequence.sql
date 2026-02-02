-- ============================================================================
-- ENABLE: Auto-resequence daily_ids after delete
-- ============================================================================
-- This will automatically shift all IDs down when a client is deleted
-- Example: If you delete #2, then #3 becomes #2, #4 becomes #3, etc.
-- ============================================================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_resequence_after_delete ON clients;

-- Create the trigger
CREATE TRIGGER trigger_resequence_after_delete
  AFTER DELETE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION resequence_after_delete();

-- Verify trigger is created
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_resequence_after_delete';
