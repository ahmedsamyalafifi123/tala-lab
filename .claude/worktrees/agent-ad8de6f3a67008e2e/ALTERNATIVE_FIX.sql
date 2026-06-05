-- ============================================================================
-- ALTERNATIVE FIX: Modify RPC Function to Accept selected_tests
-- ============================================================================
-- This is a better approach - pass selected_tests directly to the RPC function

-- Drop existing function
DROP FUNCTION IF EXISTS insert_client_multi_category;

-- Recreate with selected_tests parameter
CREATE OR REPLACE FUNCTION insert_client_multi_category(
  p_lab_id UUID,
  p_patient_name TEXT,
  p_notes TEXT,
  p_categories TEXT[],
  p_daily_date DATE,
  p_manual_id INT,
  p_created_by UUID,
  p_selected_tests TEXT[] DEFAULT '{}'  -- NEW PARAMETER
)
RETURNS TABLE(
  uuid UUID,
  client_group_id UUID,
  daily_id INT,
  primary_category TEXT
) AS $$
DECLARE
  v_client_group_id UUID;
  v_category TEXT;
  v_daily_id INT;
  v_result RECORD;
BEGIN
  -- Generate a shared client_group_id for all category copies
  v_client_group_id := gen_random_uuid();

  -- If no categories provided, use default "عام"
  IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
    p_categories := ARRAY['عام'];
  END IF;

  -- Get next daily_id for first category
  SELECT COALESCE(MAX(daily_id), 0) + 1
  INTO v_daily_id
  FROM clients
  WHERE lab_id = p_lab_id
    AND daily_date = p_daily_date
    AND primary_category = p_categories[1];

  -- Override with manual ID if provided
  IF p_manual_id IS NOT NULL THEN
    v_daily_id := p_manual_id;
  END IF;

  -- Insert one record per category
  FOREACH v_category IN ARRAY p_categories
  LOOP
    INSERT INTO clients (
      lab_id,
      patient_name,
      notes,
      categories,
      primary_category,
      daily_date,
      daily_id,
      client_group_id,
      created_by,
      results,
      selected_tests  -- NEW: Insert selected_tests directly
    )
    VALUES (
      p_lab_id,
      p_patient_name,
      p_notes,
      p_categories,
      v_category,
      p_daily_date,
      v_daily_id,
      v_client_group_id,
      p_created_by,
      '{}'::jsonb,
      p_selected_tests  -- NEW: Use the parameter
    )
    RETURNING
      clients.uuid AS uuid,
      clients.client_group_id AS client_group_id,
      clients.daily_id AS daily_id,
      clients.primary_category AS primary_category
    INTO v_result;

    -- Return the first inserted record info
    IF v_result IS NOT NULL THEN
      RETURN QUERY SELECT
        v_result.uuid AS uuid,
        v_result.client_group_id AS client_group_id,
        v_result.daily_id AS daily_id,
        v_result.primary_category AS primary_category;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ALSO UPDATE THE UPDATE FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS update_client_group;

CREATE OR REPLACE FUNCTION update_client_group(
  p_client_group_id UUID,
  p_patient_name TEXT,
  p_notes TEXT,
  p_categories TEXT[],
  p_daily_date DATE,
  p_manual_id INT,
  p_selected_tests TEXT[] DEFAULT NULL  -- NEW PARAMETER (optional)
)
RETURNS void AS $$
DECLARE
  v_existing_categories TEXT[];
  v_category TEXT;
  v_daily_id INT;
  v_lab_id UUID;
  v_primary_category TEXT;
BEGIN
  -- Get existing info
  SELECT
    lab_id,
    primary_category,
    daily_id,
    array_agg(DISTINCT primary_category) as cats
  INTO v_lab_id, v_primary_category, v_daily_id, v_existing_categories
  FROM clients
  WHERE client_group_id = p_client_group_id
  GROUP BY lab_id, primary_category, daily_id
  LIMIT 1;

  -- Determine daily_id
  IF p_manual_id IS NOT NULL THEN
    v_daily_id := p_manual_id;
  END IF;

  -- Update existing records that match new categories
  UPDATE clients
  SET
    patient_name = p_patient_name,
    notes = p_notes,
    categories = p_categories,
    daily_date = p_daily_date,
    daily_id = v_daily_id,
    selected_tests = COALESCE(p_selected_tests, selected_tests)  -- NEW: Update if provided
  WHERE client_group_id = p_client_group_id
    AND primary_category = ANY(p_categories);

  -- Delete records for removed categories
  DELETE FROM clients
  WHERE client_group_id = p_client_group_id
    AND primary_category != ALL(p_categories);

  -- Insert records for new categories
  FOREACH v_category IN ARRAY p_categories
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM clients
      WHERE client_group_id = p_client_group_id
        AND primary_category = v_category
    ) THEN
      INSERT INTO clients (
        lab_id,
        patient_name,
        notes,
        categories,
        primary_category,
        daily_date,
        daily_id,
        client_group_id,
        results,
        selected_tests  -- NEW: Include in new records
      )
      VALUES (
        v_lab_id,
        p_patient_name,
        p_notes,
        p_categories,
        v_category,
        p_daily_date,
        v_daily_id,
        p_client_group_id,
        '{}'::jsonb,
        p_selected_tests  -- NEW: Use the parameter
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this migration:
-- 1. The RPC functions will now accept selected_tests as a parameter
-- 2. The TypeScript code will be updated to pass selected_tests to the RPC
-- 3. No more separate UPDATE query needed!
--
-- To test manually after running:
-- SELECT * FROM clients WHERE patient_name = 'aaaaaaaaaaa';
