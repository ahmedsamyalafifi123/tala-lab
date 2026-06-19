-- ============================================================================
-- MIGRATION: Fix manual daily_id reordering on client edit
-- ============================================================================
-- Problem: editing a client and setting a manual case number (رقم الحالة)
-- called shift_daily_ids(), which only pushes every client at/after the
-- target UP by one. Moving an existing client therefore left a gap at its
-- old position and produced duplicate-looking numbers.
--
-- Desired: a proper "move" that keeps the sequence contiguous, e.g. with
-- 1,2,3 setting client #1 to 3 gives  1->3, 2->1, 3->2.
--   * Move down (old < new): rows in (old .. new] shift -1, moved -> new.
--   * Move up   (old > new): rows in [new .. old) shift +1, moved -> new.
--
-- The sequence domain is (lab_id, daily_date, primary_category) — that is the
-- UNIQUE key on clients. Shifts run in an ordered loop (DESC for +1, ASC for
-- -1) so each row moves into a slot that was just vacated, avoiding transient
-- unique-constraint violations (the constraint is non-deferrable).
--
-- If the edit also moved the client to a different date or category, the old
-- position can't be rotated, so we fall back to insert semantics (make room at
-- the target in the new domain).
-- ============================================================================

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
    p_patient_age integer DEFAULT NULL::integer,
    p_patient_phone text DEFAULT NULL::text
)
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
    v_max_id int;
    v_first_uuid uuid;
    v_rec RECORD;
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

    -- Manual case-number reordering
    IF p_manual_id IS NOT NULL THEN
        IF p_daily_date = v_old_date AND v_new_cat = v_old_cat THEN
            -- Same sequence: rotate to keep it contiguous.
            SELECT COALESCE(MAX(daily_id), 1) INTO v_max_id
            FROM clients
            WHERE lab_id = v_lab_id
              AND daily_date = p_daily_date
              AND primary_category = v_old_cat;

            v_new_id := GREATEST(1, LEAST(p_manual_id, v_max_id));

            -- Park self so a shifted row can reuse its vacated slot without
            -- tripping the non-deferrable unique constraint. Restored below.
            UPDATE clients SET daily_id = -1 WHERE client_group_id = p_client_group_id;

            IF v_new_id < v_old_id THEN
                -- Moving up: bump rows in [new, old) up by one, highest first.
                FOR v_rec IN
                    SELECT client_group_id
                    FROM clients
                    WHERE lab_id = v_lab_id
                      AND daily_date = p_daily_date
                      AND primary_category = v_old_cat
                      AND client_group_id != p_client_group_id
                      AND daily_id >= v_new_id
                      AND daily_id <  v_old_id
                    ORDER BY daily_id DESC
                LOOP
                    UPDATE clients SET daily_id = daily_id + 1
                    WHERE client_group_id = v_rec.client_group_id
                      AND lab_id = v_lab_id
                      AND daily_date = p_daily_date;
                END LOOP;
            ELSIF v_new_id > v_old_id THEN
                -- Moving down: pull rows in (old, new] down by one, lowest first.
                FOR v_rec IN
                    SELECT client_group_id
                    FROM clients
                    WHERE lab_id = v_lab_id
                      AND daily_date = p_daily_date
                      AND primary_category = v_old_cat
                      AND client_group_id != p_client_group_id
                      AND daily_id >  v_old_id
                      AND daily_id <= v_new_id
                    ORDER BY daily_id ASC
                LOOP
                    UPDATE clients SET daily_id = daily_id - 1
                    WHERE client_group_id = v_rec.client_group_id
                      AND lab_id = v_lab_id
                      AND daily_date = p_daily_date;
                END LOOP;
            END IF;
        ELSE
            -- Moved to a different date/category sequence: insert at target,
            -- pushing the destination rows at/after it up by one.
            v_new_id := p_manual_id;
            -- Park self (it lives in the old domain; keep it clear of the shift).
            UPDATE clients SET daily_id = -1 WHERE client_group_id = p_client_group_id;
            IF EXISTS (
                SELECT 1 FROM clients
                WHERE lab_id = v_lab_id
                  AND daily_date = p_daily_date
                  AND primary_category = v_new_cat
                  AND daily_id = v_new_id
                  AND client_group_id != p_client_group_id
            ) THEN
                FOR v_rec IN
                    SELECT client_group_id
                    FROM clients
                    WHERE lab_id = v_lab_id
                      AND daily_date = p_daily_date
                      AND primary_category = v_new_cat
                      AND client_group_id != p_client_group_id
                      AND daily_id >= v_new_id
                    ORDER BY daily_id DESC
                LOOP
                    UPDATE clients SET daily_id = daily_id + 1
                    WHERE client_group_id = v_rec.client_group_id
                      AND lab_id = v_lab_id
                      AND daily_date = p_daily_date;
                END LOOP;
            END IF;
        END IF;
    END IF;

    -- Collapse the group to a single row (multi-category stored as array)
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
$function$;
