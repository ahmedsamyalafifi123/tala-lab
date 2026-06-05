-- 1) FORCE CLEAN ALL EXISTING OVERLOADS (drop any old versions)
DO $$
DECLARE
    _func record;
BEGIN
    FOR _func IN
        SELECT
            n.nspname,
            p.proname,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname IN ('insert_client_multi_category', 'update_client_group')
    LOOP
        EXECUTE format(
            'DROP FUNCTION %I.%I(%s) CASCADE',
            _func.nspname,
            _func.proname,
            _func.args
        );
    END LOOP;
END $$;

-- 2) RECREATE FUNCTION: insert_client_multi_category
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
    v_category text;
    v_daily_id int;
BEGIN
    v_client_group_id := gen_random_uuid();

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    SELECT COALESCE(MAX(c.daily_id), 0) + 1
    INTO v_daily_id
    FROM clients c
    WHERE c.lab_id = p_lab_id
      AND c.daily_date = p_daily_date
      AND c.primary_category = p_categories[1];

    IF p_manual_id IS NOT NULL THEN
        v_daily_id := p_manual_id;
    END IF;

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
            ret_uuid,
            ret_client_group_id,
            ret_daily_id,
            ret_primary_category;

        RETURN NEXT;
    END LOOP;
END;
$$;

-- 3) RECREATE FUNCTION: update_client_group
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
    v_lab_id uuid;
    v_daily_id int;
    v_category text;
BEGIN
    SELECT c.lab_id, c.daily_id
    INTO v_lab_id, v_daily_id
    FROM clients c
    WHERE c.client_group_id = p_client_group_id
    LIMIT 1;

    IF p_manual_id IS NOT NULL THEN
        v_daily_id := p_manual_id;
    END IF;

    UPDATE clients c
    SET
        patient_name     = p_patient_name,
        notes            = p_notes,
        categories       = p_categories,
        daily_date       = p_daily_date,
        daily_id         = v_daily_id,
        selected_tests   = COALESCE(p_selected_tests, c.selected_tests),
        patient_gender   = COALESCE(p_patient_gender, c.patient_gender),
        insurance_number = p_insurance_number,
        entity           = p_entity,
        patient_age      = p_patient_age
    WHERE c.client_group_id = p_client_group_id
      AND c.primary_category = ANY(p_categories);

    DELETE FROM clients c
    WHERE c.client_group_id = p_client_group_id
      AND c.primary_category != ALL(p_categories);

    FOREACH v_category IN ARRAY p_categories
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM clients c
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

-- 4) RESTORE PERMISSIONS
GRANT EXECUTE ON FUNCTION public.insert_client_multi_category TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_client_group TO authenticated, service_role;
