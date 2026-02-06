-- ============================================================================
-- FIX: Update logic to respect the provided date for imports and daily sequences
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- 1. Drop old function (signature change requires drop first often, or OR REPLACE handling)
DROP FUNCTION IF EXISTS get_next_daily_id(UUID);

-- 2. Create updated function with Date parameter
CREATE OR REPLACE FUNCTION get_next_daily_id(p_lab_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
BEGIN
  -- Insert or update the sequence for the SPECIFIC DATE provided
  INSERT INTO daily_id_sequences (lab_id, date, last_id)
  VALUES (p_lab_id, p_date, 1)
  ON CONFLICT (lab_id, date)
  DO UPDATE SET
    last_id = daily_id_sequences.last_id + 1,
    updated_at = NOW()
  RETURNING last_id INTO v_next_id;

  RETURN v_next_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the trigger function to use the new logic
CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If daily_date is not provided, default to today
  IF NEW.daily_date IS NULL THEN
     NEW.daily_date := CURRENT_DATE;
  END IF;

  -- If daily_id is ALREADY provided (e.g. from import), respect it?
  -- Usually for imports we might want to keep the ID from the file.
  -- BUT if the ID is just a sequence, maybe we want to re-calculate it to ensure uniqueness?
  -- The user said "if i made 40 case today when i start tomoorow it should start with 1".
  -- The user's compliant was about the SEQUENCE, not specifically about keeping excact IDs from excel.
  -- Let's always calculate ID based on the date, UNLESS strict ID preservation is needed.
  -- Safest approach for "Resetting sequence": Calculate based on date.
  
  -- However, if the user explicitly provided an ID (e.g. manual override), we should probably keep it?
  -- The frontend sends specific IDs for imports if columns exist.
  -- Let's say: If NEW.daily_id IS NULL, generate it.
  
  IF NEW.daily_id IS NULL THEN
      NEW.daily_id := get_next_daily_id(NEW.lab_id, NEW.daily_date);
  ELSE
      -- Even if ID is provided, we should probably ensure the sequence table is updated 
      -- so future inserts don't clash.
      -- Or we just trust the import.
      -- If we trust the import, we might have collisions later if sequence isn't updated.
      -- Let's just generate it for now to ensure consistency and correct resetting.
      -- If the user wants to keep exact IDs, they might need to update the sequence manually.
      -- Given the user's specific issue is "it continues counting", generating distinct IDs per day is the goal.
      
      -- Recalculating is safer for the "Reset per day" requirement.
      NEW.daily_id := get_next_daily_id(NEW.lab_id, NEW.daily_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
