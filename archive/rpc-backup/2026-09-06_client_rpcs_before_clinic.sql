CREATE OR REPLACE FUNCTION public.update_client_group(p_client_group_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_selected_tests text[] DEFAULT NULL::text[], p_patient_gender text DEFAULT NULL::text, p_insurance_number text DEFAULT NULL::text, p_entity text DEFAULT NULL::text, p_patient_age integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        patient_gender   = p_patient_gender,
        insurance_number = p_insurance_number,
        entity           = p_entity,
        patient_age      = p_patient_age
    WHERE uuid = v_first_uuid;
END;
$function$

CREATE OR REPLACE FUNCTION public.insert_client_multi_category(p_lab_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_created_by uuid, p_selected_tests text[] DEFAULT '{}'::text[], p_patient_gender text DEFAULT NULL::text, p_insurance_number text DEFAULT NULL::text, p_entity text DEFAULT NULL::text, p_patient_age integer DEFAULT NULL::integer)
 RETURNS TABLE(ret_uuid uuid, ret_client_group_id uuid, ret_daily_id integer, ret_primary_category text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        p_patient_gender,
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
$function$

CREATE OR REPLACE FUNCTION public.update_client_group(p_client_group_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_selected_tests text[] DEFAULT NULL::text[], p_patient_gender text DEFAULT NULL::text, p_insurance_number text DEFAULT NULL::text, p_entity text DEFAULT NULL::text, p_patient_age integer DEFAULT NULL::integer, p_patient_phone text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_lab_id uuid;
    v_old_id int;
    v_old_date date;
    v_old_cat text;
    v_new_cat text;
    v_new_id int;
    v_first_uuid uuid;
    v_others uuid[];
    v_n int;
    v_domain_changed boolean;
    i int;
    v_pos int;
BEGIN
    SELECT c.lab_id, c.daily_id, c.daily_date, c.primary_category
    INTO v_lab_id, v_old_id, v_old_date, v_old_cat
    FROM clients c
    WHERE c.client_group_id = p_client_group_id
    LIMIT 1;

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    v_new_cat := p_categories[1];
    v_new_id  := v_old_id;
    v_domain_changed := (p_daily_date IS DISTINCT FROM v_old_date)
                     OR (v_new_cat IS DISTINCT FROM v_old_cat);

    IF p_manual_id IS NOT NULL THEN
        -- Other groups in the TARGET domain, ordered by current position.
        SELECT array_agg(client_group_id ORDER BY daily_id)
        INTO v_others
        FROM (
            SELECT client_group_id, MIN(daily_id) AS daily_id
            FROM clients
            WHERE lab_id = v_lab_id
              AND daily_date = p_daily_date
              AND primary_category = v_new_cat
              AND client_group_id != p_client_group_id
            GROUP BY client_group_id
        ) s;

        v_n := COALESCE(array_length(v_others, 1), 0);
        -- Valid target ranks are 1 .. v_n + 1 (last position appends).
        v_new_id := GREATEST(1, LEAST(p_manual_id, v_n + 1));

        -- Park the whole target domain into negative space so the final
        -- contiguous assignment never collides with a live positive value.
        UPDATE clients SET daily_id = daily_id - 1000000
        WHERE lab_id = v_lab_id
          AND daily_date = p_daily_date
          AND primary_category = v_new_cat
          AND client_group_id != p_client_group_id;

        UPDATE clients SET daily_id = -1 WHERE client_group_id = p_client_group_id;

        -- Renumber others 1..v_n, leaving v_new_id free for the moved client.
        IF v_n > 0 THEN
            FOR i IN 1 .. v_n LOOP
                IF i < v_new_id THEN v_pos := i; ELSE v_pos := i + 1; END IF;
                UPDATE clients SET daily_id = v_pos
                WHERE client_group_id = v_others[i]
                  AND lab_id = v_lab_id
                  AND daily_date = p_daily_date;
            END LOOP;
        END IF;

        -- If the client left a different domain, compact that one too.
        IF v_domain_changed THEN
            DECLARE
                v_old_others uuid[];
                v_m int;
            BEGIN
                SELECT array_agg(client_group_id ORDER BY daily_id)
                INTO v_old_others
                FROM (
                    SELECT client_group_id, MIN(daily_id) AS daily_id
                    FROM clients
                    WHERE lab_id = v_lab_id
                      AND daily_date = v_old_date
                      AND primary_category = v_old_cat
                      AND client_group_id != p_client_group_id
                    GROUP BY client_group_id
                ) s;
                v_m := COALESCE(array_length(v_old_others, 1), 0);
                IF v_m > 0 THEN
                    UPDATE clients SET daily_id = daily_id - 1000000
                    WHERE lab_id = v_lab_id
                      AND daily_date = v_old_date
                      AND primary_category = v_old_cat
                      AND client_group_id != p_client_group_id;
                    FOR i IN 1 .. v_m LOOP
                        UPDATE clients SET daily_id = i
                        WHERE client_group_id = v_old_others[i]
                          AND lab_id = v_lab_id
                          AND daily_date = v_old_date;
                    END LOOP;
                END IF;
            END;
        END IF;
    END IF;

    -- Collapse the group to a single row (multi-category stored as array).
    SELECT uuid INTO v_first_uuid
    FROM clients
    WHERE client_group_id = p_client_group_id
    ORDER BY created_at ASC
    LIMIT 1;

    DELETE FROM clients
    WHERE client_group_id = p_client_group_id
      AND uuid != v_first_uuid;

    UPDATE clients
    SET
        patient_name     = p_patient_name,
        notes            = p_notes,
        categories       = p_categories,
        primary_category = v_new_cat,
        daily_date       = p_daily_date,
        daily_id         = v_new_id,
        selected_tests   = COALESCE(p_selected_tests, selected_tests),
        patient_gender   = p_patient_gender,
        patient_phone    = p_patient_phone,
        insurance_number = p_insurance_number,
        entity           = p_entity,
        patient_age      = p_patient_age
    WHERE uuid = v_first_uuid;
END;
$function$

CREATE OR REPLACE FUNCTION public.insert_client_multi_category(p_lab_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_created_by uuid, p_selected_tests text[] DEFAULT '{}'::text[], p_patient_gender text DEFAULT NULL::text, p_insurance_number text DEFAULT NULL::text, p_entity text DEFAULT NULL::text, p_patient_age integer DEFAULT NULL::integer, p_patient_phone text DEFAULT NULL::text)
 RETURNS TABLE(ret_uuid uuid, ret_client_group_id uuid, ret_daily_id integer, ret_primary_category text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
        IF EXISTS (
            SELECT 1 FROM clients
            WHERE lab_id = p_lab_id
              AND daily_date = p_daily_date
              AND daily_id = v_daily_id
        ) THEN
            PERFORM public.shift_daily_ids(p_lab_id, p_daily_date, v_daily_id);
        END IF;
    ELSE
        SELECT COALESCE(MAX(c.daily_id), 0) + 1
        INTO v_daily_id
        FROM clients c
        WHERE c.lab_id = p_lab_id
          AND c.daily_date = p_daily_date;
    END IF;

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
        patient_phone,
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
        p_patient_gender,
        p_patient_phone,
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
$function$

