-- Run this in Supabase SQL Editor to inspect your database state

-- 1. Check Columns in 'clients' table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- 2. Check Triggers on 'clients' table
SELECT trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'clients';

-- 3. Check the definition of the 'assign_daily_id' function
SELECT pg_get_functiondef((SELECT oid FROM pg_proc WHERE proname = 'assign_daily_id'));

-- 4. Check for any other functions that might reference 'clients'
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%client_date%';
