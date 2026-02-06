# Debug Checklist - Lab Tests System

## Step 1: Run the Migration ⚠️ CRITICAL

**You MUST run this first!**

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `RUN_THIS_MIGRATION.sql`
3. Click "Run"
4. Check the verification queries at the bottom show:
   - `selected_tests` column exists in clients table
   - At least 3 rows in `lab_tests` table
   - At least 1 row in `test_groups` table

**Without this, nothing will work!**

---

## Step 2: Verify Data is Saving

### Test Creating a New Client:

1. Click the "+" button to add a new client
2. Fill in name: "Test Client"
3. **SCROLL DOWN** in the modal - you should see:
   - "التحاليل المطلوبة" section
   - Quick select badges (مجموعات سريعة)
   - Individual tests accordion

4. Select some tests:
   - Click "الفحص الروتيني" badge (should turn blue)
   - OR expand a category and check individual tests

5. Save the client

6. **Check in Supabase**:
   ```sql
   SELECT uuid, patient_name, selected_tests
   FROM clients
   WHERE patient_name = 'Test Client';
   ```

   Expected result: `selected_tests` should be an array like `{CBC_WBC, GLUC_FBS}`

---

## Step 3: Check Flask Icon Appears

### If you don't see the flask icon in the table:

1. **Make sure the client has tests:**
   ```sql
   -- Update an existing client manually to test
   UPDATE clients
   SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS']
   WHERE uuid = 'YOUR_CLIENT_UUID';
   ```

2. Refresh the page

3. The flask icon (🧪) should appear in the "إجراءات" column

---

## Step 4: Test Editing Client

1. Click the pencil icon (✏️) on a client with tests
2. The modal should open
3. **Check if tests are selected:**
   - Previously selected test groups should be highlighted
   - Individual tests should have checkmarks

**If tests don't show:**
- Make sure the migration ran
- Check browser console for errors (F12)
- Verify the client has `selected_tests` in database

---

## Step 5: Add Full Test Library (Optional)

If you only see 3 tests, you can run the full seed by copying the content from:
`migrations/add_lab_tests_and_groups.sql` (lines 90-300 approximately)

This will add all 40+ tests and 8 test groups.

---

## Common Issues:

### ❌ "No flask icon appears"
**Solution**: Client doesn't have tests. Either:
- Create a new client and SELECT tests
- Or manually update via SQL (see Step 3)

### ❌ "Tests don't show when editing"
**Solution**:
- Clear browser cache
- Check if `selected_tests` column exists: `\d clients` in psql
- Verify data: `SELECT selected_tests FROM clients LIMIT 1;`

### ❌ "Modal doesn't show test section"
**Solution**:
- Check browser console for errors
- Verify hooks are loading: `use-lab-tests.ts` and `use-test-groups.ts`
- Make sure migration created the tables

### ❌ "Tests show but don't save"
**Solution**:
- Check browser console for Supabase errors
- Verify RLS policies allow insert/update
- Check if the column accepts TEXT[] arrays

---

## Quick Test Query

Run this in Supabase SQL Editor to check everything:

```sql
-- Check if tables exist
SELECT
  (SELECT COUNT(*) FROM lab_tests) as tests_count,
  (SELECT COUNT(*) FROM test_groups) as groups_count,
  (SELECT COUNT(*) FROM clients WHERE selected_tests IS NOT NULL AND array_length(selected_tests, 1) > 0) as clients_with_tests;

-- Show sample data
SELECT test_code, test_name_ar, category FROM lab_tests LIMIT 5;
SELECT group_code, group_name_ar, test_codes FROM test_groups LIMIT 3;
SELECT uuid, patient_name, selected_tests FROM clients WHERE selected_tests IS NOT NULL LIMIT 5;
```

Expected results:
- tests_count: At least 3 (or 40+ if full seed)
- groups_count: At least 1 (or 8 if full seed)
- Sample data should show

---

## If All Else Fails:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Create a client and watch for errors
4. Share any error messages

The most common issue is **the migration wasn't run**. Double-check Step 1!
