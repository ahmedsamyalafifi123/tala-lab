-- ============================================================================
-- Multi-Category Duplication Feature - Using "General" Category
-- ============================================================================
-- Clients with multiple categories appear as separate records (one per category)
-- Each with its own independent daily_id in its category sequence
-- Records are linked by client_group_id
-- When no categories are selected, client goes under "عام" (General) category
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add client_group_id column to link multiple category copies
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'client_group_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN client_group_id UUID;
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_clients_client_group_id ON clients(client_group_id);

-- ----------------------------------------------------------------------------
-- 2. Migration: Set client_group_id for existing clients
-- ----------------------------------------------------------------------------

-- For existing single-category clients, use their UUID as group_id
UPDATE clients
SET client_group_id = uuid
WHERE client_group_id IS NULL;

-- Set default for future inserts
ALTER TABLE clients ALTER COLUMN client_group_id SET DEFAULT gen_random_uuid();

-- ----------------------------------------------------------------------------
-- 3. Ensure "General" (عام) category exists for all labs
-- ----------------------------------------------------------------------------

INSERT INTO categories (lab_id, name, color, tests)
SELECT
  uuid,
  'عام',
  'default',
  '[]'::jsonb
FROM labs
WHERE NOT EXISTS (
  SELECT 1 FROM categories
  WHERE lab_id = labs.uuid AND name = 'عام'
);

-- ----------------------------------------------------------------------------
-- 4. Function: insert_client_multi_category
-- Inserts a client record for each selected category, all sharing the same
-- client_group_id. If no categories, uses "عام" (General)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION insert_client_multi_category(
  p_lab_id UUID,
  p_patient_name TEXT,
  p_notes TEXT DEFAULT '',
  p_categories TEXT[] DEFAULT '{}',
  p_daily_date DATE DEFAULT CURRENT_DATE,
  p_manual_id INTEGER DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_group_id UUID := gen_random_uuid();
  v_category TEXT;
  v_daily_id INTEGER;
  v_new_uuid UUID;
  v_clients JSONB := '[]';
  v_primary_cat TEXT;
  v_has_categories BOOLEAN;
  v_general_category_exists BOOLEAN;
BEGIN
  -- Check if categories are provided (non-empty array)
  v_has_categories := p_categories IS NOT NULL AND array_length(p_categories, 1) IS NOT NULL AND array_length(p_categories, 1) > 0;

  -- Check if "عام" category exists for this lab
  SELECT EXISTS(
    SELECT 1 FROM categories
    WHERE lab_id = p_lab_id AND name = 'عام'
  ) INTO v_general_category_exists;

  -- If no categories provided, use "عام" (General) as the default
  IF NOT v_has_categories THEN
    IF v_general_category_exists THEN
      v_primary_cat := 'عام';
    ELSE
      v_primary_cat := '_default';
    END IF;

    -- Handle manual ID
    IF p_manual_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM clients
        WHERE lab_id = p_lab_id
          AND daily_date = p_daily_date
          AND primary_category = v_primary_cat
          AND daily_id = p_manual_id
      ) THEN
        PERFORM shift_daily_ids(p_lab_id, p_daily_date, v_primary_cat, p_manual_id);
      END IF;
      v_daily_id := p_manual_id;
    ELSE
      v_daily_id := get_next_available_daily_id(p_lab_id, p_daily_date, v_primary_cat);
    END IF;

    INSERT INTO clients (
      lab_id, patient_name, notes, categories,
      primary_category, daily_date, daily_id, created_by, client_group_id
    ) VALUES (
      p_lab_id, p_patient_name, p_notes, '{}',
      v_primary_cat, p_daily_date, v_daily_id, p_created_by, v_group_id
    ) RETURNING uuid INTO v_new_uuid;

    RETURN jsonb_build_object(
      'success', true,
      'client_group_id', v_group_id,
      'clients', jsonb_build_object(
        'uuid', v_new_uuid,
        'category', v_primary_cat,
        'daily_id', v_daily_id
      ),
      'count', 1
    );
  END IF;

  -- Categories provided - create a record for each
  v_primary_cat := p_categories[1];

  FOREACH v_category IN ARRAY p_categories
  LOOP
    -- For primary category with manual ID, use manual; otherwise auto
    IF v_category = v_primary_cat AND p_manual_id IS NOT NULL THEN
      IF EXISTS (
        SELECT 1 FROM clients
        WHERE lab_id = p_lab_id
          AND daily_date = p_daily_date
          AND primary_category = v_category
          AND daily_id = p_manual_id
      ) THEN
        PERFORM shift_daily_ids(p_lab_id, p_daily_date, v_category, p_manual_id);
      END IF;
      v_daily_id := p_manual_id;
    ELSE
      v_daily_id := get_next_available_daily_id(p_lab_id, p_daily_date, v_category);
    END IF;

    INSERT INTO clients (
      lab_id, patient_name, notes, categories,
      primary_category, daily_date, daily_id, created_by, client_group_id
    ) VALUES (
      p_lab_id, p_patient_name, p_notes, p_categories,
      v_category, p_daily_date, v_daily_id, p_created_by, v_group_id
    ) RETURNING uuid INTO v_new_uuid;

    v_clients := v_clients || jsonb_build_object(
      'uuid', v_new_uuid,
      'category', v_category,
      'daily_id', v_daily_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'client_group_id', v_group_id,
    'clients', v_clients,
    'count', array_length(p_categories, 1)
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION insert_client_multi_category TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Function: update_client_group
-- Updates all records in a client group when editing
-- When all categories removed, keeps one record under "عام" (General)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_client_group(
  p_client_group_id UUID,
  p_patient_name TEXT,
  p_notes TEXT,
  p_categories TEXT[],
  p_daily_date DATE,
  p_manual_id INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_existing_categories TEXT[];
  v_target_categories TEXT[];
  v_removed_categories TEXT[];
  v_added_categories TEXT[];
  v_general_category_exists BOOLEAN;
  v_category TEXT;
  v_daily_id INTEGER;
  v_lab_id UUID;
  v_first_record RECORD;
  v_old_daily_date DATE;
  v_has_categories BOOLEAN;
  v_final_categories TEXT[];
BEGIN
  -- Get the first record to extract lab_id
  SELECT * INTO v_first_record
  FROM clients
  WHERE client_group_id = p_client_group_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client group not found';
  END IF;

  v_lab_id := v_first_record.lab_id;
  v_old_daily_date := v_first_record.daily_date;

  -- Check if "عام" category exists
  SELECT EXISTS(
    SELECT 1 FROM categories
    WHERE lab_id = v_lab_id AND name = 'عام'
  ) INTO v_general_category_exists;

  -- Check if categories are provided (non-empty array)
  v_has_categories := p_categories IS NOT NULL AND array_length(p_categories, 1) IS NOT NULL AND array_length(p_categories, 1) > 0;

  -- Get existing categories
  SELECT array_agg(DISTINCT primary_category) INTO v_existing_categories
  FROM clients
  WHERE client_group_id = p_client_group_id;

  -- Determine target categories
  IF v_has_categories THEN
    v_target_categories := p_categories;
    v_final_categories := p_categories;
  ELSE
    -- No categories - use "عام" (General) as default
    IF v_general_category_exists THEN
      v_target_categories := ARRAY['عام'];
    ELSE
      v_target_categories := ARRAY['_default'];
    END IF;
    v_final_categories := ARRAY[]::TEXT[];
  END IF;

  -- Calculate changes
  v_added_categories := array(SELECT unnest(v_target_categories) EXCEPT SELECT unnest(COALESCE(v_existing_categories, ARRAY[]::TEXT[])));
  v_removed_categories := array(SELECT unnest(COALESCE(v_existing_categories, ARRAY[]::TEXT[])) EXCEPT SELECT unnest(v_target_categories));

  -- Handle date change - resequence old date categories
  IF v_old_daily_date != p_daily_date THEN
    FOREACH v_category IN ARRAY v_existing_categories
    LOOP
      PERFORM resequence_daily_ids(v_lab_id, v_old_daily_date, v_category);
    END LOOP;
  END IF;

  -- Update all existing records in the group
  UPDATE clients
  SET
    patient_name = p_patient_name,
    notes = p_notes,
    categories = v_final_categories,
    daily_date = p_daily_date
  WHERE client_group_id = p_client_group_id;

  -- Delete records for removed categories and resequence
  FOREACH v_category IN ARRAY v_removed_categories
  LOOP
    DELETE FROM clients
    WHERE client_group_id = p_client_group_id
      AND primary_category = v_category;

    -- Resequence the category we removed from
    IF v_old_daily_date = p_daily_date THEN
      PERFORM resequence_daily_ids(v_lab_id, p_daily_date, v_category);
    ELSE
      PERFORM resequence_daily_ids(v_lab_id, v_old_daily_date, v_category);
    END IF;
  END LOOP;

  -- Add records for new categories
  FOREACH v_category IN ARRAY v_added_categories
  LOOP
    v_daily_id := get_next_available_daily_id(v_lab_id, p_daily_date, v_category);

    INSERT INTO clients (
      lab_id, patient_name, notes, categories,
      primary_category, daily_date, daily_id,
      created_by, client_group_id, created_at
    ) VALUES (
      v_lab_id, p_patient_name, p_notes, v_final_categories,
      v_category, p_daily_date, v_daily_id,
      v_first_record.created_by, p_client_group_id,
      v_first_record.created_at
    );
  END LOOP;

  -- Ensure at least one record exists
  IF (SELECT COUNT(*) FROM clients WHERE client_group_id = p_client_group_id) = 0 THEN
    v_daily_id := get_next_available_daily_id(v_lab_id, p_daily_date, v_target_categories[1]);

    INSERT INTO clients (
      lab_id, patient_name, notes, categories,
      primary_category, daily_date, daily_id,
      created_by, client_group_id, created_at
    ) VALUES (
      v_lab_id, p_patient_name, p_notes, ARRAY[]::TEXT[],
      v_target_categories[1], p_daily_date, v_daily_id,
      v_first_record.created_by, p_client_group_id,
      v_first_record.created_at
    );
  END IF;

  -- Handle manual ID change for primary category
  IF p_manual_id IS NOT NULL THEN
    v_category := CASE
      WHEN v_has_categories THEN v_target_categories[1]
      ELSE v_target_categories[1]
    END;

    IF EXISTS (
      SELECT 1 FROM clients
      WHERE client_group_id = p_client_group_id
        AND primary_category = v_category
    ) THEN
      IF EXISTS (
        SELECT 1 FROM clients
        WHERE lab_id = v_lab_id
          AND daily_date = p_daily_date
          AND primary_category = v_category
          AND daily_id = p_manual_id
          AND client_group_id != p_client_group_id
      ) THEN
        PERFORM shift_daily_ids(v_lab_id, p_daily_date, v_category, p_manual_id);
      END IF;

      UPDATE clients
      SET daily_id = p_manual_id
      WHERE client_group_id = p_client_group_id
        AND primary_category = v_category;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'client_group_id', p_client_group_id,
    'updated_count', (SELECT COUNT(*) FROM clients WHERE client_group_id = p_client_group_id)
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION update_client_group TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. Function: delete_client_single_category
-- Deletes only one category copy while preserving others
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION delete_client_single_category(
  p_uuid UUID
)
RETURNS JSONB AS $$
DECLARE
  v_group_id UUID;
  v_category TEXT;
  v_lab_id UUID;
  v_daily_date DATE;
  v_remaining_count INTEGER;
BEGIN
  -- Get info before delete
  SELECT client_group_id, primary_category, lab_id, daily_date
    INTO v_group_id, v_category, v_lab_id, v_daily_date
  FROM clients
  WHERE uuid = p_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client not found';
  END IF;

  -- Delete this specific record
  DELETE FROM clients WHERE uuid = p_uuid;

  -- Check remaining copies
  SELECT COUNT(*) INTO v_remaining_count
  FROM clients
  WHERE client_group_id = v_group_id;

  -- Resequence this category to fill the gap
  PERFORM resequence_daily_ids(v_lab_id, v_daily_date, v_category);

  RETURN jsonb_build_object(
    'success', true,
    'deleted_category', v_category,
    'remaining_copies', v_remaining_count
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION delete_client_single_category TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. Verification
-- ----------------------------------------------------------------------------

-- Check that "عام" category exists
SELECT * FROM categories WHERE name = 'عام';

-- Check functions were created
SELECT
  proname AS function_name,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname IN (
  'insert_client_multi_category',
  'update_client_group',
  'delete_client_single_category'
)
ORDER BY proname;
