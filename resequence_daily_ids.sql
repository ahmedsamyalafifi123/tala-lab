-- ============================================================================
-- FIX: Daily ID Resequence with Gap Reuse and Proper Shifting
-- ============================================================================
-- This implements the user's expected behavior:
-- 1. When a client is deleted, the next new client fills the gap
-- 2. When adding with manual ID, shift existing IDs to make room
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Function: Get next available daily ID (finds gaps first)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_available_daily_id(p_lab_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
  v_existing_id INTEGER;
BEGIN
  -- Find the first gap in the sequence
  -- We look for the smallest daily_id that doesn't exist starting from 1
  FOR v_next_id IN 1..10000 LOOP
    SELECT daily_id INTO v_existing_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND daily_id = v_next_id
    LIMIT 1;

    IF v_existing_id IS NULL THEN
      -- Found a gap, return this ID
      -- Update the sequence tracker
      INSERT INTO daily_id_sequences (lab_id, date, last_id)
      VALUES (p_lab_id, p_date, v_next_id)
      ON CONFLICT (lab_id, date)
      DO UPDATE SET
        last_id = GREATEST(daily_id_sequences.last_id, v_next_id),
        updated_at = NOW();

      RETURN v_next_id;
    END IF;
  END LOOP;

  -- If we get here, we have 10000 clients (shouldn't happen)
  RAISE EXCEPTION 'Maximum daily ID limit reached';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. Function: Shift daily_ids to make room for a specific ID
-- Shifts all existing IDs >= p_target_id by +1
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION shift_daily_ids(p_lab_id UUID, p_date DATE, p_target_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_client RECORD;
BEGIN
  -- Shift IDs starting from the highest to avoid conflicts
  -- We need to do this in a loop to avoid unique constraint violations
  FOR v_client IN
    SELECT uuid, daily_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND daily_id >= p_target_id
    ORDER BY daily_id DESC
  LOOP
    UPDATE clients
    SET daily_id = v_client.daily_id + 1
    WHERE uuid = v_client.uuid;
  END LOOP;

  -- Update the sequence tracker
  INSERT INTO daily_id_sequences (lab_id, date, last_id)
  VALUES (p_lab_id, p_date, p_target_id)
  ON CONFLICT (lab_id, date)
  DO UPDATE SET
    last_id = GREATEST(daily_id_sequences.last_id, (
      SELECT COALESCE(MAX(daily_id), 0)
      FROM clients
      WHERE lab_id = p_lab_id AND daily_date = p_date
    )),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Function: Resequence all daily_ids to fill gaps (no gaps left)
-- Called after deletion to compact the sequence
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resequence_daily_ids(p_lab_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
  v_client RECORD;
  v_new_id INTEGER := 1;
BEGIN
  -- Lock the table to prevent concurrent modifications
  LOCK TABLE clients IN EXCLUSIVE MODE;

  -- Get all clients ordered by current daily_id
  FOR v_client IN
    SELECT uuid
    FROM clients
    WHERE lab_id = p_lab_id AND daily_date = p_date
    ORDER BY daily_id ASC
  LOOP
    -- Update with new sequential ID
    UPDATE clients
    SET daily_id = v_new_id
    WHERE uuid = v_client.uuid;

    v_new_id := v_new_id + 1;
  END LOOP;

  -- Update the sequence tracker
  INSERT INTO daily_id_sequences (lab_id, date, last_id)
  VALUES (p_lab_id, p_date, v_new_id - 1)
  ON CONFLICT (lab_id, date)
  DO UPDATE SET
    last_id = v_new_id - 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. Drop old trigger that doesn't support gap reuse
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_assign_daily_id ON clients;

-- ----------------------------------------------------------------------------
-- 5. Function: Auto-assign daily_id using gap reuse logic
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if daily_id is NULL (not manually set)
  IF NEW.daily_id IS NULL THEN
    NEW.daily_id := get_next_available_daily_id(NEW.lab_id, NEW.daily_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. Create new trigger with gap reuse
-- ----------------------------------------------------------------------------
CREATE TRIGGER trigger_assign_daily_id
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION assign_daily_id();

-- ----------------------------------------------------------------------------
-- 7. Function: Handle manual ID assignment with shifting
-- This is called via RPC when adding a client with a specific ID
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION insert_with_manual_id(
  p_lab_id UUID,
  p_patient_name TEXT,
  p_notes TEXT DEFAULT '',
  p_categories TEXT[] DEFAULT '{}',
  p_daily_date DATE DEFAULT CURRENT_DATE,
  p_daily_id INTEGER DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_final_daily_id INTEGER;
  v_new_client UUID;
BEGIN
  -- Start transaction
  IF p_daily_id IS NOT NULL THEN
    -- Check if this ID already exists
    IF EXISTS (
      SELECT 1 FROM clients
      WHERE lab_id = p_lab_id
        AND daily_date = p_daily_date
        AND daily_id = p_daily_id
    ) THEN
      -- Shift existing IDs to make room
      PERFORM shift_daily_ids(p_lab_id, p_daily_date, p_daily_id);
    END IF;
    v_final_daily_id := p_daily_id;
  ELSE
    -- Use gap-finding logic
    v_final_daily_id := get_next_available_daily_id(p_lab_id, p_daily_date);
  END IF;

  -- Insert the new client
  INSERT INTO clients (
    lab_id, patient_name, notes, categories,
    daily_date, daily_id, created_by
  )
  VALUES (
    p_lab_id, p_patient_name, p_notes, p_categories,
    p_daily_date, v_final_daily_id, p_created_by
  )
  RETURNING uuid INTO v_new_client;

  -- Return the created client
  RETURN jsonb_build_object(
    'success', true,
    'uuid', v_new_client,
    'daily_id', v_final_daily_id
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. Function: Trigger to resequence after delete
-- This ensures gaps are filled after any deletion
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resequence_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Resequence IDs for this lab/date to fill the gap
  PERFORM resequence_daily_ids(OLD.lab_id, OLD.daily_date);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. Create trigger for post-delete resequencing
-- Note: This is optional - if you want gaps to persist until next add,
-- don't enable this trigger. If you want immediate resequencing, enable it.
-- ----------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS trigger_resequence_after_delete ON clients;
-- CREATE TRIGGER trigger_resequence_after_delete
--   AFTER DELETE ON clients
--   FOR EACH ROW
--   EXECUTE FUNCTION resequence_after_delete();

-- ----------------------------------------------------------------------------
-- 10. Grant execute permissions
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION get_next_available_daily_id(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION shift_daily_ids(UUID, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION resequence_daily_ids(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_with_manual_id(UUID, TEXT, TEXT, TEXT[], DATE, INTEGER, UUID) TO authenticated;
