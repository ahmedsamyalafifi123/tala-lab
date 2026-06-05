-- ============================================================================
-- FIX: Force Reset Daily Sequence
-- Purpose: Remove the incorrect sequence record for TODAY that has the high number.
--          This forces the system to create a NEW sequence starting at 1.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- 1. Delete the sequence for today (so it starts fresh at 1)
DELETE FROM daily_id_sequences 
WHERE date = CURRENT_DATE;

-- Optional: If you want to delete the test clients you created today with high numbers:
-- DELETE FROM clients WHERE daily_date = CURRENT_DATE AND daily_id > 1000;
