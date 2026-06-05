-- Make patient_gender truly optional ("بدون" / none) instead of always defaulting to 'ذكر'.
-- Applied to production 2026-06-05.
--
-- Root cause of "بدون not saved / exports show ذكر":
--   * column default 'ذكر'
--   * insert_client_multi_category used COALESCE(p_patient_gender, 'ذكر')  -> forced ذكر
--   * update_client_group used COALESCE(p_patient_gender, patient_gender) -> could never CLEAR gender
--   * function param default was 'ذكر'
-- Fix: store the passed value directly (NULL = بدون). The CHECK constraint already permits NULL.

-- 1) Drop the column default so omitted gender stays NULL
ALTER TABLE public.clients ALTER COLUMN patient_gender DROP DEFAULT;

-- 2) insert_client_multi_category (legacy overload, no phone)
CREATE OR REPLACE FUNCTION public.insert_client_multi_category(
    p_lab_id uuid, p_patient_name text, p_notes text, p_categories text[],
    p_daily_date date, p_manual_id integer, p_created_by uuid,
    p_selected_tests text[] DEFAULT '{}'::text[],
    p_patient_gender text DEFAULT NULL::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer)
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
            WHERE lab_id = p_lab_id AND daily_date = p_daily_date AND daily_id = v_daily_id
        ) THEN
            PERFORM public.shift_daily_ids(p_lab_id, p_daily_date, v_daily_id);
        END IF;
    ELSE
        SELECT COALESCE(MAX(c.daily_id), 0) + 1 INTO v_daily_id
        FROM clients c
        WHERE c.lab_id = p_lab_id AND c.daily_date = p_daily_date;
    END IF;

    INSERT INTO clients (
        lab_id, patient_name, notes, categories, primary_category, daily_date, daily_id,
        client_group_id, created_by, results, selected_tests, patient_gender,
        insurance_number, entity, patient_age
    )
    VALUES (
        p_lab_id, p_patient_name, p_notes, p_categories, v_primary_category, p_daily_date, v_daily_id,
        v_client_group_id, p_created_by, '{}'::jsonb, p_selected_tests, p_patient_gender,
        p_insurance_number, p_entity, p_patient_age
    )
    RETURNING uuid, client_group_id, daily_id, primary_category
    INTO ret_uuid, ret_client_group_id, ret_daily_id, ret_primary_category;

    RETURN NEXT;
END;
$function$;

-- 3) insert_client_multi_category (current overload, with phone) — the one the app calls
CREATE OR REPLACE FUNCTION public.insert_client_multi_category(
    p_lab_id uuid, p_patient_name text, p_notes text, p_categories text[],
    p_daily_date date, p_manual_id integer, p_created_by uuid,
    p_selected_tests text[] DEFAULT '{}'::text[],
    p_patient_gender text DEFAULT NULL::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer,
    p_patient_phone text DEFAULT NULL::text)
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
            WHERE lab_id = p_lab_id AND daily_date = p_daily_date AND daily_id = v_daily_id
        ) THEN
            PERFORM public.shift_daily_ids(p_lab_id, p_daily_date, v_daily_id);
        END IF;
    ELSE
        SELECT COALESCE(MAX(c.daily_id), 0) + 1 INTO v_daily_id
        FROM clients c
        WHERE c.lab_id = p_lab_id AND c.daily_date = p_daily_date;
    END IF;

    INSERT INTO clients (
        lab_id, patient_name, notes, categories, primary_category, daily_date, daily_id,
        client_group_id, created_by, results, selected_tests, patient_gender, patient_phone,
        insurance_number, entity, patient_age
    )
    VALUES (
        p_lab_id, p_patient_name, p_notes, p_categories, v_primary_category, p_daily_date, v_daily_id,
        v_client_group_id, p_created_by, '{}'::jsonb, p_selected_tests, p_patient_gender, p_patient_phone,
        p_insurance_number, p_entity, p_patient_age
    )
    RETURNING uuid, client_group_id, daily_id, primary_category
    INTO ret_uuid, ret_client_group_id, ret_daily_id, ret_primary_category;

    RETURN NEXT;
END;
$function$;

-- 4) update_client_group (legacy overload, no phone)
CREATE OR REPLACE FUNCTION public.update_client_group(
    p_client_group_id uuid, p_patient_name text, p_notes text, p_categories text[],
    p_daily_date date, p_manual_id integer,
    p_selected_tests text[] DEFAULT NULL::text[],
    p_patient_gender text DEFAULT NULL::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_lab_id uuid;
    v_daily_id int;
    v_first_uuid uuid;
BEGIN
    SELECT c.lab_id, c.daily_id INTO v_lab_id, v_daily_id
    FROM clients c WHERE c.client_group_id = p_client_group_id LIMIT 1;

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    IF p_manual_id IS NOT NULL AND p_manual_id != v_daily_id THEN
        v_daily_id := p_manual_id;
        IF EXISTS (
            SELECT 1 FROM clients
            WHERE lab_id = v_lab_id AND daily_date = p_daily_date
              AND daily_id = v_daily_id AND client_group_id != p_client_group_id
        ) THEN
            PERFORM public.shift_daily_ids(v_lab_id, p_daily_date, v_daily_id);
        END IF;
    END IF;

    SELECT uuid INTO v_first_uuid
    FROM clients WHERE client_group_id = p_client_group_id ORDER BY created_at ASC LIMIT 1;

    DELETE FROM clients WHERE client_group_id = p_client_group_id AND uuid != v_first_uuid;

    UPDATE clients
    SET patient_name = p_patient_name,
        notes = p_notes,
        categories = p_categories,
        primary_category = p_categories[1],
        daily_date = p_daily_date,
        daily_id = v_daily_id,
        selected_tests = COALESCE(p_selected_tests, selected_tests),
        patient_gender = p_patient_gender,
        insurance_number = p_insurance_number,
        entity = p_entity,
        patient_age = p_patient_age
    WHERE uuid = v_first_uuid;
END;
$function$;

-- 5) update_client_group (current overload, with phone) — the one the app calls
CREATE OR REPLACE FUNCTION public.update_client_group(
    p_client_group_id uuid, p_patient_name text, p_notes text, p_categories text[],
    p_daily_date date, p_manual_id integer,
    p_selected_tests text[] DEFAULT NULL::text[],
    p_patient_gender text DEFAULT NULL::text,
    p_insurance_number text DEFAULT NULL::text,
    p_entity text DEFAULT NULL::text,
    p_patient_age integer DEFAULT NULL::integer,
    p_patient_phone text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_lab_id uuid;
    v_daily_id int;
    v_first_uuid uuid;
BEGIN
    SELECT c.lab_id, c.daily_id INTO v_lab_id, v_daily_id
    FROM clients c WHERE c.client_group_id = p_client_group_id LIMIT 1;

    IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN
        p_categories := ARRAY['عام'];
    END IF;

    IF p_manual_id IS NOT NULL AND p_manual_id != v_daily_id THEN
        v_daily_id := p_manual_id;
        IF EXISTS (
            SELECT 1 FROM clients
            WHERE lab_id = v_lab_id AND daily_date = p_daily_date
              AND daily_id = v_daily_id AND client_group_id != p_client_group_id
        ) THEN
            PERFORM public.shift_daily_ids(v_lab_id, p_daily_date, v_daily_id);
        END IF;
    END IF;

    SELECT uuid INTO v_first_uuid
    FROM clients WHERE client_group_id = p_client_group_id ORDER BY created_at ASC LIMIT 1;

    DELETE FROM clients WHERE client_group_id = p_client_group_id AND uuid != v_first_uuid;

    UPDATE clients
    SET patient_name = p_patient_name,
        notes = p_notes,
        categories = p_categories,
        primary_category = p_categories[1],
        daily_date = p_daily_date,
        daily_id = v_daily_id,
        selected_tests = COALESCE(p_selected_tests, selected_tests),
        patient_gender = p_patient_gender,
        patient_phone = p_patient_phone,
        insurance_number = p_insurance_number,
        entity = p_entity,
        patient_age = p_patient_age
    WHERE uuid = v_first_uuid;
END;
$function$;

-- 6) One-time backfill: clear previously-defaulted ذكر to NULL (بدون).
-- A reversible snapshot was taken into clients_gender_backup_<timestamp> before running this.
-- UPDATE public.clients SET patient_gender = NULL WHERE patient_gender = 'ذكر';
