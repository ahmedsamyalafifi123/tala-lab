-- ============================================================================
-- FIX: Daily ID Reset Logic
-- Problem: IDs were not resetting daily because the unique sequence constraints 
--          might have been set on 'lab_id' only, or the date was ignored.
-- Solution: 
-- 1. Enforce UNIQUE(lab_id, date) on daily_id_sequences.
-- 2. Update get_next_daily_id to require and use the specific date.
-- 3. Update assign_daily_id trigger to pass the client's date.
-- ============================================================================

-- 1. FIX CONSTRAINTS
DO $$
BEGIN
    -- Try to drop incorrect constraint if it exists (commonly named for single column)
    BEGIN
        ALTER TABLE daily_id_sequences DROP CONSTRAINT IF EXISTS daily_id_sequences_lab_id_key;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Constraint daily_id_sequences_lab_id_key not found or could not be dropped';
    END;

    -- Drop the correct constraint if it exists (to ensure we can recreate it cleanly)
    BEGIN
        ALTER TABLE daily_id_sequences DROP CONSTRAINT IF EXISTS daily_id_sequences_lab_id_date_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    -- Add the CORRECT constraint
    ALTER TABLE daily_id_sequences ADD CONSTRAINT daily_id_sequences_lab_id_date_key UNIQUE (lab_id, date);
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error adjusting constraints: %', SQLERRM;
END $$;

-- 2. UPDATE HELPER FUNCTION
-- Accepts Date explicitly to ensure we increment the counter for THAT specific day
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

-- 3. UPDATE TRIGGER
CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure daily_date is set
  IF NEW.daily_date IS NULL THEN
     NEW.daily_date := CURRENT_DATE;
  END IF;

  -- Generate ID based on the client's date (allows backdating or correct daily reset)
  NEW.daily_id := get_next_daily_id(NEW.lab_id, NEW.daily_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. VERIFY/RECREATE TRIGGER
DROP TRIGGER IF EXISTS trigger_assign_daily_id ON clients;
CREATE TRIGGER trigger_assign_daily_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION assign_daily_id();
