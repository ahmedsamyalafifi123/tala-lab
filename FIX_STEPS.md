# 🔧 Fix Steps - Selected Tests Not Saving

## Problem Confirmed
Your database query shows: `"selected_tests": []` - empty array.

The issue: The separate UPDATE query after RPC was not executing properly.

## Solution
Modified the RPC functions to accept `selected_tests` as a parameter directly, eliminating the need for a separate UPDATE.

---

## Step 1: Run the SQL Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy **ALL** content from `ALTERNATIVE_FIX.sql`
5. Paste and click **Run**

**Expected output:**
```
Success. No rows returned.
```

This updates both RPC functions:
- `insert_client_multi_category` - now accepts `p_selected_tests`
- `update_client_group` - now accepts `p_selected_tests`

---

## Step 2: Restart Dev Server

The TypeScript code has been updated to pass `selected_tests` to the RPC functions.

```bash
# Press Ctrl+C in terminal to stop
# Then restart:
npm run dev
```

---

## Step 3: Test Creating a Client

1. Open your app
2. Click **"+"** to add new client
3. Fill name: `Test With Tests`
4. Scroll down to **"التحاليل المطلوبة"**
5. Click any test group (e.g., "الفحص الروتيني")
6. Click **"حفظ"**

**Watch console for:**
```
💾 Saving client with tests: (X) [...]
✅ Client created with selected_tests: X tests
📊 Fetched clients sample: [...has_selected_tests: true...]
🔍 Found 1 clients with selected_tests out of Y total
✅ FLASK RENDERED for: Test With Tests
```

---

## Step 4: Verify in Database

Run in Supabase SQL Editor:

```sql
SELECT patient_name, selected_tests, array_length(selected_tests, 1) as count
FROM clients
WHERE patient_name = 'Test With Tests';
```

**Expected:**
```
patient_name     | selected_tests              | count
-----------------+-----------------------------+-------
Test With Tests  | {CBC_WBC,GLUC_FBS,...}      | 5
```

---

## Step 5: Verify Flask Icon

1. Refresh the page
2. Look at the **إجراءات** column
3. You should see 🧪 (flask icon) next to clients with tests

---

## Step 6: Test Editing

1. Click the flask icon → Results modal should open
2. Click the pencil icon (✏️) → Edit modal opens
3. Previously selected tests should be **checked** ✅
4. Previously selected groups should be **blue/highlighted**

---

## If It Still Doesn't Work

### Check Console Logs:
- Look for ❌ errors in red
- Share the full console output

### Check Database:
```sql
-- See all clients with their selected_tests
SELECT patient_name, selected_tests, array_length(selected_tests, 1) as count
FROM clients
WHERE selected_tests IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### Manual Test:
```sql
-- Update an existing client manually
UPDATE clients
SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS', 'LIPID_CHOL']
WHERE patient_name = 'aaaaaaaaaaa';

-- Verify
SELECT patient_name, selected_tests FROM clients WHERE patient_name = 'aaaaaaaaaaa';
```

Then refresh app. If flask appears → Code is working, just need to create new clients.

---

## Success Criteria

✅ SQL migration runs without errors
✅ Console shows "Client created with selected_tests: X tests"
✅ Database shows selected_tests array with values
✅ Flask icon appears in table
✅ Edit modal shows checked tests
✅ Results modal opens when clicking flask

If ALL work → System is fixed! 🎉
