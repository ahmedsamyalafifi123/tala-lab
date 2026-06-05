-- Check current policies on categories table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'categories'
ORDER BY policyname;

-- Check if categories exist in the database
SELECT 
  uuid,
  lab_id,
  name,
  is_active,
  display_order
FROM categories
LIMIT 10;

-- Check lab_users for current user
SELECT 
  lu.uuid,
  lu.lab_id,
  lu.user_id,
  lu.role,
  l.name as lab_name
FROM lab_users lu
JOIN labs l ON lu.lab_id = l.uuid
WHERE lu.user_id = auth.uid();
