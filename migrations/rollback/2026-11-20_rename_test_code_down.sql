-- Rollback for migrations/2026-11-20_rename_test_code.sql
-- Removes the rename RPC and the guard. Codes already renamed stay renamed.
BEGIN;
DROP FUNCTION IF EXISTS rename_lab_test_code(uuid, text);
DROP TRIGGER IF EXISTS guard_lab_test_code ON lab_tests;
DROP FUNCTION IF EXISTS guard_lab_test_code();
COMMIT;
