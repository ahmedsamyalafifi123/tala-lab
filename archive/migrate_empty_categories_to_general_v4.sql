-- ============================================================================
-- Migration: Update old clients with empty categories to use "عام"
-- ============================================================================

-- Step 1: Disable triggers temporarily
SET session_replication_role = 'replica';

-- Step 2: For each client that needs updating, we need to find a unique daily_id
-- We'll do this in batches to avoid conflicts

DO $$
DECLARE
  v_client RECORD;
  v_new_id INTEGER;
  v_max_id INTEGER;
BEGIN
  -- Loop through each client that needs updating
  FOR v_client IN
    SELECT uuid, lab_id, daily_date, created_at
    FROM clients
    WHERE (categories = '{}'::TEXT[]
       OR array_length(categories, 1) IS NULL
       OR primary_category IS NULL
       OR primary_category = '_default'
       OR primary_category = '')
    ORDER BY daily_date, created_at
  LOOP
    -- Find the next available daily_id for this lab/date/category combo
    SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_max_id
    FROM clients
    WHERE lab_id = v_client.lab_id
      AND daily_date = v_client.daily_date
      AND primary_category = 'عام';

    -- Update this single client
    UPDATE clients
    SET
      categories = ARRAY['عام'],
      primary_category = 'عام',
      daily_id = v_max_id
    WHERE uuid = v_client.uuid;
  END LOOP;
END $$;

-- Step 3: Re-enable triggers
SET session_replication_role = 'origin';

-- Step 4: Verify the update
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

-- Step 5: Show count of updated clients
SELECT
  COUNT(*) as total_general_clients
FROM clients
WHERE categories = ARRAY['عام']::TEXT[];
