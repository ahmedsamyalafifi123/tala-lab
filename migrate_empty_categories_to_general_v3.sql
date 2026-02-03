-- ============================================================================
-- Migration: Update old clients with empty categories to use "عام"
-- ============================================================================

-- Step 1: Disable triggers temporarily
SET session_replication_role = 'replica';

-- Step 2: First, set all the categories and primary_category
-- We'll set daily_id to NULL temporarily to avoid conflicts
UPDATE clients
SET
  categories = ARRAY['عام'],
  primary_category = 'عام',
  daily_id = NULL  -- Temporary NULL to avoid unique constraint conflicts
WHERE categories = '{}'::TEXT[]
   OR array_length(categories, 1) IS NULL
   OR primary_category IS NULL
   OR primary_category = '_default'
   OR primary_category = '';

-- Step 3: Now assign proper daily_ids by resequencing each date
-- We need to process each date separately

DO $$
DECLARE
  v_date DATE;
  v_lab_id UUID;
  v_client RECORD;
  v_new_id INTEGER := 1;
BEGIN
  -- Loop through each unique (lab_id, date) combination that needs fixing
  FOR v_lab_id, v_date IN
    SELECT DISTINCT lab_id, daily_date
    FROM clients
    WHERE daily_id IS NULL
    AND primary_category = 'عام'
  LOOP
    v_new_id := 1;

    -- Update each client for this date/lab with sequential IDs
    FOR v_client IN
      SELECT uuid
      FROM clients
      WHERE lab_id = v_lab_id
        AND daily_date = v_date
        AND primary_category = 'عام'
        AND daily_id IS NULL
      ORDER BY created_at  -- Use creation order to determine sequence
    LOOP
      UPDATE clients
      SET daily_id = v_new_id
      WHERE uuid = v_client.uuid;

      v_new_id := v_new_id + 1;
    END LOOP;
  END LOOP;
END $$;

-- Step 4: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 5: Verify the update
SELECT
  uuid,
  patient_name,
  categories,
  primary_category,
  daily_id,
  daily_date
FROM clients
WHERE categories = ARRAY['عام']::TEXT[]
ORDER BY daily_date DESC, daily_id ASC
LIMIT 10;

-- Step 6: Show count of updated clients
SELECT
  COUNT(*) as total_general_clients
FROM clients
WHERE categories = ARRAY['عام']::TEXT[];
