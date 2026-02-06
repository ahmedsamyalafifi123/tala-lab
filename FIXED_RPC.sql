-- ============================================================================
-- FIXED: RPC Function with No Ambiguous References
-- ============================================================================

-- Drop and recreate insert function
DROP FUNCTION IF EXISTS insert_client_multi_category(UUID, TEXT, TEXT, TEXT[], DATE, INT, UUID, TEXT[]);

CREATE OR REPLACE FUNCTION insert_client_multi_category(
  p_lab_id UUID,
  p_patient_name TEXT,
  p_notes TEXT,
  p_categories TEXT[],
  p_daily_date DATE,
  p_manual_id INT,
  p_created_by UUID,
  p_selected_tests TEXT[] DEFAULT '{}'
)
RETURNS TABLE(
  ret_uuid UUID,
  ret_client_group_id UUID,
  ret_daily_id INT,
  ret_primary_category TEXT
) AS $$
DECLARE
  v_client_group_id UUID;
  v_category TEXT;
  v_daily_id INT;
  v_inserted_uuid UUID;
  v_inserted_group_id UUID;
  v_inserted_daily_id INT;
  v_inserted_category TEXT;
BEGIN
  -- Generate a shared client_group_id for all category copies
  v_client_group_id := gen_random_uuid();

  -- If no categories provided, use default "عام"
  IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
    p_categories := ARRAY['عام'];
  END IF;

  -- Get next daily_id for first category
  SELECT COALESCE(MAX(c.daily_id), 0) + 1
  INTO v_daily_id
  FROM clients c
  WHERE c.lab_id = p_lab_id
    AND c.daily_date = p_daily_date
    AND c.primary_category = p_categories[1];

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
      selected_tests
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
      p_selected_tests
    )
    RETURNING
      uuid,
      client_group_id,
      daily_id,
      primary_category
    INTO
      v_inserted_uuid,
      v_inserted_group_id,
      v_inserted_daily_id,
      v_inserted_category;

    -- Return the inserted record info
    RETURN QUERY SELECT
      v_inserted_uuid,
      v_inserted_group_id,
      v_inserted_daily_id,
      v_inserted_category;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Update function
-- ============================================================================

DROP FUNCTION IF EXISTS update_client_group(UUID, TEXT, TEXT, TEXT[], DATE, INT, TEXT[]);

CREATE OR REPLACE FUNCTION update_client_group(
  p_client_group_id UUID,
  p_patient_name TEXT,
  p_notes TEXT,
  p_categories TEXT[],
  p_daily_date DATE,
  p_manual_id INT,
  p_selected_tests TEXT[] DEFAULT NULL
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
    c.lab_id,
    c.primary_category,
    c.daily_id
  INTO v_lab_id, v_primary_category, v_daily_id
  FROM clients c
  WHERE c.client_group_id = p_client_group_id
  LIMIT 1;

  -- Determine daily_id
  IF p_manual_id IS NOT NULL THEN
    v_daily_id := p_manual_id;
  END IF;

  -- Update existing records that match new categories
  UPDATE clients c
  SET
    patient_name = p_patient_name,
    notes = p_notes,
    categories = p_categories,
    daily_date = p_daily_date,
    daily_id = v_daily_id,
    selected_tests = COALESCE(p_selected_tests, c.selected_tests)
  WHERE c.client_group_id = p_client_group_id
    AND c.primary_category = ANY(p_categories);

  -- Delete records for removed categories
  DELETE FROM clients c
  WHERE c.client_group_id = p_client_group_id
    AND c.primary_category != ALL(p_categories);

  -- Insert records for new categories
  FOREACH v_category IN ARRAY p_categories
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM clients c
      WHERE c.client_group_id = p_client_group_id
        AND c.primary_category = v_category
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
        selected_tests
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
        p_selected_tests
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION insert_client_multi_category TO authenticated;
GRANT EXECUTE ON FUNCTION update_client_group TO authenticated;
