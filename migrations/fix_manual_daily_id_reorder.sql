-- ============================================================================
-- MIGRATION: Fix manual daily_id reordering on client edit (rank-based)
-- ============================================================================
-- Problem: editing a client and setting a manual case number (رقم الحالة)
-- did not produce a clean, contiguous sequence. The original code only
-- pushed clients at/after the target up by one, and a later attempt only
-- shifted rows that actually existed in the moved range — so with gaps
-- (left by deleted clients) moving e.g. 6 -> 5 when no row 5 exists dropped
-- the client into the hole and never cascaded the rows after it.
--
-- Fix: treat the manual number as a target RANK and fully renumber the
-- sequence 1..N (no gaps). The moved client is inserted at the target rank
-- and everyone else keeps their relative order, so:
--   1,2,3 with #1 -> 3  =>  1->3, 2->1, 3->2
--   and with a gap (…4,6,7) moving 6 -> 5 => …4,5(was6),6(was7)
--
-- The sequence domain is (lab_id, daily_date, primary_category) — the UNIQUE
-- key on clients. To avoid tripping the non-deferrable unique constraint, all
-- rows in the domain are first parked in negative space, then assigned their
-- final contiguous positions. If the edit moved the client to a different
-- date/category, the old domain is also compacted to stay gap-free.
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
$function$;
