-- check_roles.sql
SELECT role, count(*) FROM lab_users GROUP BY role;
