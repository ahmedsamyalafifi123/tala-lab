-- ============================================================================
-- FIX: Clients Unique Constraint (v2 - Fixed Syntax)
-- Problem: The error 'duplicate key value violates unique constraint "clients_client_date_daily_id_key"'
--          indicates a constraint that might be missing 'lab_id' or is conflicting with legacy data.
--          We need to ensure the constraint is UNIQUE(lab_id, daily_date, daily_id).
-- ============================================================================

DO $$
BEGIN
    -- 1. Drop the problematic constraint causing the error
    BEGIN
        ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_client_date_daily_id_key;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Constraint clients_client_date_daily_id_key not found';
    END;

    -- 2. Drop other potentially incorrect constraints
    BEGIN
        ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_daily_date_daily_id_key;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 3. Ensure the CORRECT unique constraint exists: (lab_id, daily_date, daily_id)
    BEGIN
        ALTER TABLE clients ADD CONSTRAINT clients_lab_id_daily_date_daily_id_key UNIQUE (lab_id, daily_date, daily_id);
    EXCEPTION WHEN duplicate_object THEN
        -- If it already exists, just ignore
        NULL;
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding correct constraint: %', SQLERRM;
    END;

END $$;
