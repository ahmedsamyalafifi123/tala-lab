-- Add new columns to clients table
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS patient_gender text DEFAULT 'ذكر',
ADD COLUMN IF NOT EXISTS insurance_number text,
ADD COLUMN IF NOT EXISTS entity text,
ADD COLUMN IF NOT EXISTS patient_age integer;

-- Add check constraints
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_patient_gender_check;
ALTER TABLE public.clients
ADD CONSTRAINT clients_patient_gender_check 
CHECK (patient_gender IN ('male', 'female', 'ذكر', 'أنثى'));

-- Expanded list of entities
ALTER TABLE public.clients
DROP CONSTRAINT IF EXISTS clients_entity_check;
ALTER TABLE public.clients
ADD CONSTRAINT clients_entity_check 
CHECK (entity IN ('معاشات', 'ارامل', 'موظفين', 'طلبة', 'المرأة المعيلة', 'المقاولات'));

-- Update insert_client_multi_category RPC
CREATE OR REPLACE FUNCTION public.insert_client_multi_category(
    p_lab_id uuid,
    p_patient_name text,
    p_notes text,
    p_categories text[],
    p_daily_date date,
    p_manual_id integer,
    p_created_by uuid,
    p_selected_tests text[] DEFAULT '{}'::text[],
    p_patient_gender text DEFAULT 'ذكر',
    p_insurance_number text DEFAULT NULL,
    p_entity text DEFAULT NULL,
    p_patient_age integer DEFAULT NULL
)
RETURNS TABLE(ret_uuid uuid, ret_client_group_id uuid, ret_daily_id integer, ret_primary_category text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      selected_tests,
      patient_gender,
      insurance_number,
      entity,
      patient_age
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
      p_selected_tests,
      COALESCE(p_patient_gender, 'ذكر'),
      p_insurance_number,
      p_entity,
      p_patient_age
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
    ret_uuid := v_inserted_uuid;
    ret_client_group_id := v_inserted_group_id;
    ret_daily_id := v_inserted_daily_id;
    ret_primary_category := v_inserted_category;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Update update_client_group RPC
CREATE OR REPLACE FUNCTION public.update_client_group(
    p_client_group_id uuid,
    p_patient_name text,
    p_notes text,
    p_categories text[],
    p_daily_date date,
    p_manual_id integer,
    p_selected_tests text[] DEFAULT NULL::text[],
    p_patient_gender text DEFAULT NULL,
    p_insurance_number text DEFAULT NULL,
    p_entity text DEFAULT NULL,
    p_patient_age integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    selected_tests = COALESCE(p_selected_tests, c.selected_tests),
    patient_gender = COALESCE(p_patient_gender, c.patient_gender),
    insurance_number = p_insurance_number,
    entity = p_entity,
    patient_age = p_patient_age
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
        selected_tests,
        patient_gender,
        insurance_number,
        entity,
        patient_age
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
        p_selected_tests,
        COALESCE(p_patient_gender, 'ذكر'),
        p_insurance_number,
        p_entity,
        p_patient_age
      );
    END IF;
  END LOOP;
END;
$$;
