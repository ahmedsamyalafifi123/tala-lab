-- ============================================================================
-- FIX: Resequence both old and new categories when category changes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Function to handle category change with resequencing
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resequence_category_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_category TEXT;
  v_new_category TEXT;
BEGIN
  -- Only run if primary_category actually changed
  IF TG_OP = 'UPDATE' AND OLD.primary_category IS DISTINCT FROM NEW.primary_category THEN
    v_old_category := COALESCE(OLD.primary_category, '_default');
    v_new_category := COALESCE(NEW.primary_category, '_default');

    -- First, check if the new daily_id already exists in the new category
    IF EXISTS (
      SELECT 1 FROM clients
      WHERE lab_id = NEW.lab_id
        AND daily_date = NEW.daily_date
        AND primary_category = v_new_category
        AND daily_id = NEW.daily_id
        AND uuid != NEW.uuid
    ) THEN
      -- Shift all IDs >= NEW.daily_id in the new category
      PERFORM shift_daily_ids(NEW.lab_id, NEW.daily_date, v_new_category, NEW.daily_id);
    END IF;

    -- Now update the client
    -- (This happens automatically after the trigger returns)

    -- After the update, resequence the OLD category to fill the gap
    -- We need to do this in a separate transaction via a job or after the fact
    -- For now, let's use a 2-step approach:

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. Better approach: Use an AFTER UPDATE trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resequence_after_category_change()
RETURNS TRIGGER AS $$
DECLARE
  v_old_category TEXT;
  v_new_category TEXT;
  v_new_daily_id INTEGER;
BEGIN
  -- Only run if primary_category changed
  IF OLD.primary_category IS DISTINCT FROM NEW.primary_category THEN
    v_old_category := COALESCE(OLD.primary_category, '_default');
    v_new_category := COALESCE(NEW.primary_category, '_default');

    -- Find the next available ID in the NEW category
    -- (or use the current one if it's available)
    SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_new_daily_id
    FROM clients
    WHERE lab_id = NEW.lab_id
      AND daily_date = NEW.daily_date
      AND primary_category = v_new_category;

    -- Update the client with the new category and new daily_id
    UPDATE clients
    SET primary_category = v_new_category,
        daily_id = v_new_daily_id
    WHERE uuid = NEW.uuid;

    -- Resequence the OLD category (fill the gap)
    PERFORM resequence_daily_ids(OLD.lab_id, OLD.daily_date, v_old_category);

    -- Note: No need to resequence new category since we appended at the end
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. Create triggers for category change handling
-- ----------------------------------------------------------------------------

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_resequence_category_change ON clients;
DROP TRIGGER IF EXISTS trigger_resequence_after_category_change ON clients;

-- Create BEFORE UPDATE trigger to prevent conflicts
CREATE TRIGGER trigger_resequence_category_change
  BEFORE UPDATE OF primary_category ON clients
  FOR EACH ROW
  EXECUTE FUNCTION resequence_category_change();

-- Create AFTER UPDATE trigger to resequence
CREATE TRIGGER trigger_resequence_after_category_change
  AFTER UPDATE OF primary_category ON clients
  FOR EACH ROW
  EXECUTE FUNCTION resequence_after_category_change();

-- ----------------------------------------------------------------------------
-- 4. Simplified function to manually resequence a specific category
-- Useful for manual calls from frontend
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION resequence_category(
  p_lab_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_category TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result INTEGER;
BEGIN
  PERFORM resequence_daily_ids(p_lab_id, p_date, p_category);

  SELECT COUNT(*) INTO v_result
  FROM clients
  WHERE lab_id = p_lab_id
    AND daily_date = p_date
    AND (p_category IS NULL OR primary_category = p_category);

  RETURN jsonb_build_object(
    'success', true,
    'lab_id', p_lab_id,
    'date', p_date,
    'category', COALESCE(p_category, '_default'),
    'total_clients', v_result
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION resequence_category(UUID, DATE, TEXT) TO authenticated;
