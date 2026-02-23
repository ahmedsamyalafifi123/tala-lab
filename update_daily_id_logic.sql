-- 1. Remove triggers that resequence based on category change
DROP TRIGGER IF EXISTS trigger_resequence_after_category_change ON clients;
DROP TRIGGER IF EXISTS trigger_resequence_category_change ON clients;

-- 2. Update insert_client_multi_category
CREATE OR REPLACE FUNCTION public.insert_client_multi_category(
    p_lab_id uuid,
    p_patient_name text,
    p_notes text,
    p_categories text[],
    p_daily_date date,
    p_manual_id integer,
    p_created_by uuid,
    p_selected_tests text[] DEFAULT '{}'::text[],
    p_patient_gender text DEFAULT 'ذكر'::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer
)
RETURNS TABLE (
    ret_uuid uuid,
    ret_client_group_id uuid,
    ret_daily_id integer,
    ret_primary_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_group_id uuid;
    v_daily_id int;
    v_primary_category text;
BEGIN
    v_client_group_id := gen_random_uuid();

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    v_primary_category := p_categories[1];

    IF p_manual_id IS NOT NULL THEN
        v_daily_id := p_manual_id;
        
        -- CHECK IF MANUAL ID EXISTS globally for this lab & date, and shift if it does
        IF EXISTS (
            SELECT 1 FROM clients
            WHERE lab_id = p_lab_id
              AND daily_date = p_daily_date
              AND daily_id = v_daily_id
        ) THEN
            -- Push all IDs >= v_daily_id up by 1
            PERFORM public.shift_daily_ids(p_lab_id, p_daily_date, v_daily_id);
        END IF;

    ELSE
        -- Find MAX global ID
        SELECT COALESCE(MAX(c.daily_id), 0) + 1
        INTO v_daily_id
        FROM clients c
        WHERE c.lab_id = p_lab_id
          AND c.daily_date = p_daily_date;
    END IF;

    -- ONLY INSERT ONE RECORD INSTEAD OF LOOPING
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
        v_primary_category,
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
        ret_uuid,
        ret_client_group_id,
        ret_daily_id,
        ret_primary_category;

    RETURN NEXT;
END;
$$;

-- 2.1. Update update_client_group 
CREATE OR REPLACE FUNCTION public.update_client_group(
    p_client_group_id uuid,
    p_patient_name text,
    p_notes text,
    p_categories text[],
    p_daily_date date,
    p_manual_id integer,
    p_selected_tests text[] DEFAULT NULL::text[],
    p_patient_gender text DEFAULT NULL::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer
) RETURNS void AS $$
DECLARE
    v_lab_id uuid;
    v_daily_id int;
    v_first_uuid uuid;
BEGIN
    SELECT c.lab_id, c.daily_id
    INTO v_lab_id, v_daily_id
    FROM clients c
    WHERE c.client_group_id = p_client_group_id
    LIMIT 1;

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    -- Handle Manual ID change on Edit
    IF p_manual_id IS NOT NULL AND p_manual_id != v_daily_id THEN
        v_daily_id := p_manual_id;
        
        -- CHECK IF MANUAL ID EXISTS globally for this lab & date, and shift if it does
        IF EXISTS (
            SELECT 1 FROM clients
            WHERE lab_id = v_lab_id
              AND daily_date = p_daily_date
              AND daily_id = v_daily_id
              AND client_group_id != p_client_group_id
        ) THEN
            -- Push all IDs >= v_daily_id up by 1
            PERFORM public.shift_daily_ids(v_lab_id, p_daily_date, v_daily_id);
        END IF;
    END IF;

    -- Keep only original record (fix old duplicates if exists)
    SELECT uuid INTO v_first_uuid
    FROM clients
    WHERE client_group_id = p_client_group_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Delete any clones
    DELETE FROM clients
    WHERE client_group_id = p_client_group_id
      AND uuid != v_first_uuid;

    -- Update the single remaining row
    UPDATE clients
    SET
        patient_name     = p_patient_name,
        notes            = p_notes,
        categories       = p_categories,
        primary_category = p_categories[1],
        daily_date       = p_daily_date,
        daily_id         = v_daily_id,
        selected_tests   = COALESCE(p_selected_tests, selected_tests),
        patient_gender   = COALESCE(p_patient_gender, patient_gender),
        insurance_number = p_insurance_number,
        entity           = p_entity,
        patient_age      = p_patient_age
    WHERE uuid = v_first_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update BOTH signatures of get_next_available_daily_id
CREATE OR REPLACE FUNCTION public.get_next_available_daily_id(
  p_lab_id uuid,
  p_date date DEFAULT CURRENT_DATE,
  p_category text DEFAULT NULL::text
) RETURNS integer AS $$
DECLARE
  v_next_id INTEGER;
  v_existing_id INTEGER;
BEGIN
  -- We ignore p_category to ensure global numbering
  FOR v_next_id IN 1..10000 LOOP
    SELECT daily_id INTO v_existing_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND daily_id = v_next_id
    LIMIT 1;

    IF v_existing_id IS NULL THEN
      -- Use 'عام' to store sequence but meaning is global
      INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
      VALUES (p_lab_id, p_date, 'عام', v_next_id)
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

CREATE OR REPLACE FUNCTION public.get_next_available_daily_id(
  p_lab_id uuid,
  p_date date DEFAULT CURRENT_DATE
) RETURNS integer AS $$
BEGIN
  RETURN public.get_next_available_daily_id(p_lab_id, p_date, NULL);
END;
$$ LANGUAGE plpgsql;

-- 4. Update BOTH signatures of resequence_daily_ids
CREATE OR REPLACE FUNCTION public.resequence_daily_ids(
    p_lab_id uuid,
    p_date date DEFAULT CURRENT_DATE,
    p_category text DEFAULT NULL::text
) RETURNS void AS $$
DECLARE
  v_client RECORD;
  v_new_id INTEGER := 1;
BEGIN
  LOCK TABLE clients IN EXCLUSIVE MODE;

  FOR v_client IN
    SELECT client_group_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
    GROUP BY client_group_id
    ORDER BY MIN(daily_id) ASC
  LOOP
    UPDATE clients
    SET daily_id = v_new_id
    WHERE client_group_id = v_client.client_group_id
      AND lab_id = p_lab_id
      AND daily_date = p_date;

    v_new_id := v_new_id + 1;
  END LOOP;

  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
  VALUES (p_lab_id, p_date, 'عام', v_new_id - 1)
  ON CONFLICT (lab_id, date, category)
  DO UPDATE SET
    last_id = v_new_id - 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.resequence_daily_ids(
    p_lab_id uuid,
    p_date date DEFAULT CURRENT_DATE
) RETURNS void AS $$
BEGIN
  PERFORM public.resequence_daily_ids(p_lab_id, p_date, NULL);
END;
$$ LANGUAGE plpgsql;

-- 5. Update BOTH signatures of shift_daily_ids
CREATE OR REPLACE FUNCTION public.shift_daily_ids(
    p_lab_id uuid,
    p_date date,
    p_category text,
    p_target_id integer
) RETURNS void AS $$
DECLARE
  v_client RECORD;
BEGIN
  FOR v_client IN
    SELECT client_group_id, MIN(daily_id) as min_daily_id
    FROM clients
    WHERE lab_id = p_lab_id
      AND daily_date = p_date
      AND daily_id >= p_target_id
    GROUP BY client_group_id
    ORDER BY min_daily_id DESC
  LOOP
    UPDATE clients
    SET daily_id = daily_id + 1
    WHERE client_group_id = v_client.client_group_id
      AND lab_id = p_lab_id
      AND daily_date = p_date;
  END LOOP;

  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)
  VALUES (p_lab_id, p_date, 'عام', p_target_id)
  ON CONFLICT (lab_id, date, category)
  DO UPDATE SET
    last_id = GREATEST(daily_id_sequences.last_id, (
      SELECT COALESCE(MAX(daily_id), 0)
      FROM clients
      WHERE lab_id = p_lab_id
        AND daily_date = p_date
    )),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.shift_daily_ids(
    p_lab_id uuid,
    p_date date,
    p_target_id integer
) RETURNS void AS $$
BEGIN
  PERFORM public.shift_daily_ids(p_lab_id, p_date, NULL, p_target_id);
END;
$$ LANGUAGE plpgsql;

-- 6. Update assign_daily_id trigger
CREATE OR REPLACE FUNCTION public.assign_daily_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.daily_id IS NULL THEN
    NEW.daily_id := get_next_available_daily_id(
      NEW.lab_id,
      NEW.daily_date,
      NULL
    );
    IF NEW.primary_category IS NULL THEN
      NEW.primary_category := COALESCE((NEW.categories::text[])[1], '_default');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Grant execution
GRANT EXECUTE ON FUNCTION public.insert_client_multi_category(uuid, text, text, text[], date, integer, uuid, text[], text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_client_group(uuid, text, text, text[], date, integer, text[], text, text, text, integer) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_next_available_daily_id(uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_available_daily_id(uuid, date) TO authenticated;

GRANT EXECUTE ON FUNCTION public.resequence_daily_ids(uuid, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resequence_daily_ids(uuid, date) TO authenticated;

GRANT EXECUTE ON FUNCTION public.shift_daily_ids(uuid, date, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shift_daily_ids(uuid, date, integer) TO authenticated;
