-- ============================================================================
-- FIX: Create missing helper function get_next_daily_id
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- Function: Get next daily ID for a lab
CREATE OR REPLACE FUNCTION get_next_daily_id(p_lab_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
BEGIN
  -- Insert or update the sequence for today
  INSERT INTO daily_id_sequences (lab_id, date, last_id)
  VALUES (p_lab_id, CURRENT_DATE, 1)
  ON CONFLICT (lab_id, date)
  DO UPDATE SET
    last_id = daily_id_sequences.last_id + 1,
    updated_at = NOW()
  RETURNING last_id INTO v_next_id;

  RETURN v_next_id;
END;
$$ LANGUAGE plpgsql;

-- Ensure the table exists too, just in case
CREATE TABLE IF NOT EXISTS daily_id_sequences (
  uuid UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES labs(uuid) ON DELETE CASCADE,
  date DATE NOT NULL,
  last_id INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, date)
);

-- Enable RLS for it
ALTER TABLE daily_id_sequences ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if missing (simple open policy for internal use/authenticated users for now to avoid permission errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'daily_id_sequences' AND policyname = 'Allow authenticated access'
    ) THEN
        CREATE POLICY "Allow authenticated access" ON daily_id_sequences
        FOR ALL TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END
$$;
