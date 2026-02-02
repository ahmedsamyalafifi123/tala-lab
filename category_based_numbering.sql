-- ============================================================================
-- CHANGE: Category-based numbering system
-- ============================================================================
-- Each category now has its own daily numbering (1, 2, 3...)
-- Uniqueness: (lab_id, daily_date, category_name, daily_id)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add a column to store the primary category for numbering
-- We'll add a 'primary_category' text column to clients
-- ----------------------------------------------------------------------------

-- Check if column exists first, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'primary_category'
  ) THEN
    ALTER TABLE clients ADD COLUMN primary_category TEXT;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Change the unique constraint to include category
-- ----------------------------------------------------------------------------

-- Drop old constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_lab_id_daily_date_daily_id_key;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_date_daily_id_key;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_daily_date_daily_id_key;

-- Add new constraint with category
ALTER TABLE clients ADD CONSTRAINT clients_lab_id_date_category_daily_id_key
  UNIQUE (lab_id, daily_date, primary_category, daily_id);

-- ----------------------------------------------------------------------------
-- 3. Update the sequence table to track per-category
-- ----------------------------------------------------------------------------

-- Drop old sequence table
DROP TABLE IF EXISTS daily_id_sequences;

-- Create new sequence table with category
CREATE TABLE daily_id_sequences (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  last_id INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, date, category)
);

-- Enable RLS
ALTER TABLE daily_id_sequences ENABLE ROW LEVEL SECURITY;

-- RLS policies for sequences
CREATE POLICY "Lab users can view their lab sequences" ON daily_id_sequences
FOR SELECT TO authenticated
USING (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

CREATE POLICY "Lab users can insert sequences" ON daily_id_sequences
FOR INSERT TO authenticated
WITH CHECK (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

CREATE POLICY "Lab users can update sequences" ON daily_id_sequences
FOR UPDATE TO authenticated
USING (lab_id IN (SELECT my_lab_ids() AS my_lab_ids));

-- ----------------------------------------------------------------------------
-- 4. Update get_next_available_daily_id to support categories
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_next_available_daily_id(p_lab_id UUID, p_date DATE DEFAULT CURRENT_DATE, p_category TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
  v_existing_id INTEGER;
  v_check_category TEXT := COALESCE(p_category, '_default');
BEGIN
  -- Find the first gap in the sequence for this category
  FOR v_next_id IN 1..10000 LOOP
    SELECT daily_id INTO v_existing_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND primary_category = v_check_category
      AND daily_id = v_next_id
    LIMIT 1;

    IF v_existing_id IS NULL THEN
      -- Found a gap, update sequence tracker and return
      INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
      VALUES (p_lab_id, p_date, v_check_category, v_next_id)
      ON CONFLICT (lab_id, date, category)
      DO UPDATE SET
        last_id = GREATEST(daily_id_sequences.last_id, v_next_id),
        updated_at = NOW();

      RETURN v_next_id;
    END IF;
  END LOOP;

  RAISE EXCEPTION 'Maximum daily ID limit reached';
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 5. Update shift_daily_ids to support categories
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION shift_daily_ids(p_lab_id UUID, p_date DATE, p_category TEXT, p_target_id INTEGER)
RETURNS VOID AS $$
DECLARE
  v_client RECORD;
  v_check_category TEXT := COALESCE(p_category, '_default');
BEGIN
  -- Shift IDs starting from highest to avoid conflicts
  FOR v_client IN
    SELECT uuid, daily_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND primary_category = v_check_category
      AND daily_id >= p_target_id
    ORDER BY daily_id DESC
  LOOP
    UPDATE clients
    SET daily_id = v_client.daily_id + 1
    WHERE uuid = v_client.uuid;
  END LOOP;

  -- Update sequence tracker
  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
  VALUES (p_lab_id, p_date, v_check_category, p_target_id)
  ON CONFLICT (lab_id, date, category)
  DO UPDATE SET
    last_id = GREATEST(daily_id_sequences.last_id, (
      SELECT COALESCE(MAX(daily_id), 0)
      FROM clients
      WHERE lab_id = p_lab_id
        AND daily_date = p_date
        AND primary_category = v_check_category
    )),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 6. Update resequence_daily_ids to support categories
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION resequence_daily_ids(p_lab_id UUID, p_date DATE DEFAULT CURRENT_DATE, p_category TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_client RECORD;
  v_new_id INTEGER := 1;
  v_check_category TEXT;
BEGIN
  v_check_category := COALESCE(p_category, '_default');

  LOCK TABLE clients IN EXCLUSIVE MODE;

  -- Get all clients for this category ordered by current daily_id
  FOR v_client IN
    SELECT uuid
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND (p_category IS NULL OR primary_category = v_check_category)
    ORDER BY daily_id ASC
  LOOP
    UPDATE clients
    SET daily_id = v_new_id
    WHERE uuid = v_client.uuid;

    v_new_id := v_new_id + 1;
  END LOOP;

  -- Update sequence tracker
  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
  VALUES (p_lab_id, p_date, v_check_category, v_new_id - 1)
  ON CONFLICT (lab_id, date, category)
  DO UPDATE SET
    last_id = v_new_id - 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 7. Update the insert trigger to use category
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assign_daily_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if daily_id is NULL
  IF NEW.daily_id IS NULL THEN
    NEW.daily_id := get_next_available_daily_id(
      NEW.lab_id,
      NEW.daily_date,
      COALESCE(NEW.primary_category, (NEW.categories::text[])[1], '_default')
    );
    -- Ensure primary_category is set
    IF NEW.primary_category IS NULL THEN
      NEW.primary_category := COALESCE((NEW.categories::text[])[1], '_default');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 8. Update insert_with_manual_id function
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
  v_primary_cat TEXT;
BEGIN
  -- Get primary category (first one or default)
  v_primary_cat := COALESCE(
    CASE WHEN p_categories IS NULL OR array_length(p_categories, 1) IS NULL THEN NULL ELSE p_categories[1] END,
    '_default'
  );

  IF p_daily_id IS NOT NULL THEN
    -- Check if this ID already exists for this category
    IF EXISTS (
      SELECT 1 FROM clients
      WHERE lab_id = p_lab_id
        AND daily_date = p_daily_date
        AND primary_category = v_primary_cat
        AND daily_id = p_daily_id
    ) THEN
      -- Shift existing IDs
      PERFORM shift_daily_ids(p_lab_id, p_daily_date, v_primary_cat, p_daily_id);
    END IF;
    v_final_daily_id := p_daily_id;
  ELSE
    -- Use gap-finding logic
    v_final_daily_id := get_next_available_daily_id(p_lab_id, p_daily_date, v_primary_cat);
  END IF;

  -- Insert the new client
  INSERT INTO clients (
    lab_id, patient_name, notes, categories,
    daily_date, daily_id, created_by, primary_category
  )
  VALUES (
    p_lab_id, p_patient_name, p_notes, p_categories,
    p_daily_date, v_final_daily_id, p_created_by, v_primary_cat
  )
  RETURNING uuid INTO v_new_client;

  RETURN jsonb_build_object(
    'success', true,
    'uuid', v_new_client,
    'daily_id', v_final_daily_id,
    'primary_category', v_primary_cat
  );
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 9. Update resequence_after_delete to handle category
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION resequence_after_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Resequence IDs for this lab/date/category to fill the gap
  PERFORM resequence_daily_ids(OLD.lab_id, OLD.daily_date, OLD.primary_category);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 10. Migrate existing data - set primary_category from categories array
-- ----------------------------------------------------------------------------

-- Update existing clients to have primary_category
UPDATE clients
SET primary_category = COALESCE(
  CASE
    WHEN categories IS NULL OR array_length(categories, 1) IS NULL THEN NULL
    ELSE categories[1]
  END,
  '_default'
)
WHERE primary_category IS NULL;

-- ----------------------------------------------------------------------------
-- 11. Grant permissions
-- ----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON TABLE daily_id_sequences TO authenticated;

-- Verify the new constraint
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'clients'::regclass
  AND contype = 'u';
