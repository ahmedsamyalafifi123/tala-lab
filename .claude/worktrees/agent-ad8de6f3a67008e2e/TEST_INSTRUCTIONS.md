# Testing Instructions - Lab Tests System

## 🚨 CRITICAL FIRST STEP

**YOU MUST RUN THE DATABASE MIGRATION FIRST!**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open the file `RUN_THIS_MIGRATION.sql` from your project root
4. Copy ALL the content
5. Paste into SQL Editor
6. Click "Run"

**Verify it worked:**
```sql
SELECT COUNT(*) FROM lab_tests;
SELECT COUNT(*) FROM test_groups;
```
Should return at least 3 and 1 respectively.

---

## 🧪 Testing the System

### Test 1: Create a New Client with Tests

1. Open your app in browser
2. Open browser DevTools (Press F12)
3. Go to Console tab
4. Click "+" button to add new client
5. Fill in name: "Test Patient"

6. **SCROLL DOWN** in the modal - Look for:
   ```
   التحاليل المطلوبة (0 تحليل)
   ```

7. Click on "الفحص الروتيني" badge (should turn blue)

8. **Watch the console** - You should see:
   ```
   Selected tests update or similar logs
   ```

9. Click "حفظ" (Save)

10. **Check console logs** - You should see:
   ```
   💾 Saving client with tests: ["CBC_WBC", "GLUC_FBS"]
   💾 handleSave called with: {...}
   ```

11. **Refresh the page** and check if the flask icon appears

---

### Test 2: Verify Data in Database

Run this query in Supabase SQL Editor:

```sql
SELECT
  uuid,
  patient_name,
  selected_tests,
  array_length(selected_tests, 1) as test_count,
  created_at
FROM clients
WHERE patient_name = 'Test Patient';
```

**Expected:** You should see the selected_tests array with values like `{CBC_WBC,GLUC_FBS}`

**If selected_tests is NULL or empty:**
- The migration didn't run properly
- Check for errors in browser console
- Verify the column exists: `\d clients` in Supabase SQL

---

### Test 3: Check Flask Icon

The flask icon will ONLY appear if:
1. Migration ran successfully ✅
2. Client was saved with tests ✅
3. `client.selected_tests` array has items ✅

**Debug:** Add a temporary client manually:

```sql
-- Pick any existing client
UPDATE clients
SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS', 'LIPID_CHOL']
WHERE uuid = 'ANY_EXISTING_CLIENT_UUID_HERE';
```

Refresh the page. The flask icon should now appear for that client.

---

### Test 4: Edit Client (Retrieve Tests)

1. Click the pencil icon (✏️) on the client you just updated
2. **Check console logs** - Should see:
   ```
   🔍 Loading client for edit: {name: "...", selected_tests: [...], ...}
   ✅ Loaded tests: ["CBC_WBC", "GLUC_FBS"]
   ✅ Loaded groups: ["ROUTINE_PANEL"]
   ```

3. In the modal, scroll to tests section:
   - The "الفحص الروتيني" badge should be blue (selected)
   - Individual tests should be checked

**If tests don't appear:**
- Check console for the "Loading client" log
- If `selected_tests: null`, the data didn't save
- Run the query from Test 2 to verify database

---

### Test 5: Add Results

1. Click the flask icon (🧪) in the table
2. Modal should open showing ONLY the selected tests
3. Enter some values
4. Click Save
5. Go to client details → "النتائج" tab
6. Results should appear with color-coded flags

---

## 🐛 Common Issues & Solutions

### Issue: "No test section in modal"

**Check:**
```javascript
// In browser console
localStorage.clear()
location.reload()
```

**Verify hooks are working:**
- Look for network requests to Supabase
- Check console for errors from `use-lab-tests.ts`

---

### Issue: "Flask icon not showing"

**Solution 1:** Manually add tests to a client (see Test 3)

**Solution 2:** Check database:
```sql
-- Are there any clients with tests?
SELECT COUNT(*)
FROM clients
WHERE selected_tests IS NOT NULL
AND array_length(selected_tests, 1) > 0;
```

If 0, no clients have tests yet.

---

### Issue: "Tests don't save"

**Check browser console for errors like:**
- `column "selected_tests" does not exist` → Migration didn't run
- `RLS policy violation` → Policy issues
- Any Supabase error → Check SQL editor

**Solution:**
1. Verify column exists:
   ```sql
   SELECT column_name
   FROM information_schema.columns
   WHERE table_name = 'clients' AND column_name = 'selected_tests';
   ```

2. If no result, run migration again

---

### Issue: "Tests selected but not retrieved on edit"

**Symptoms:** You select tests, save, but when you edit they're not checked

**Debug:**
1. After saving, immediately query:
   ```sql
   SELECT selected_tests FROM clients ORDER BY created_at DESC LIMIT 1;
   ```

2. If NULL → Save isn't working
3. If has data → Retrieval logic issue (check console logs)

---

## 📊 Full System Verification

Run this comprehensive check:

```sql
-- 1. Tables exist
SELECT
  'lab_tests' as table_name,
  COUNT(*) as row_count
FROM lab_tests
UNION ALL
SELECT
  'test_groups',
  COUNT(*)
FROM test_groups
UNION ALL
SELECT
  'clients_with_tests',
  COUNT(*)
FROM clients
WHERE selected_tests IS NOT NULL
AND array_length(selected_tests, 1) > 0;

-- 2. Sample data
SELECT
  c.uuid,
  c.patient_name,
  c.selected_tests,
  array_length(c.selected_tests, 1) as test_count
FROM clients c
WHERE c.selected_tests IS NOT NULL
LIMIT 5;

-- 3. Test library
SELECT
  category,
  COUNT(*) as test_count
FROM lab_tests
GROUP BY category
ORDER BY category;
```

**Expected Results:**
- lab_tests: 3-40 rows
- test_groups: 1-8 rows
- clients_with_tests: At least 1 after Test 1
- Sample data: Shows test arrays
- Test library: Shows categories

---

## 🎯 Success Criteria

✅ Migration ran without errors
✅ Browser console shows save/load logs
✅ Database query shows selected_tests array
✅ Flask icon appears in table
✅ Edit modal shows checked tests
✅ Results modal works

If ALL of the above work, the system is functioning correctly! 🎉
