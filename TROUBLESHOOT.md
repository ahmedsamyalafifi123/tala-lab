# 🔧 Troubleshooting Guide

## Your Current Situation:

✅ Migration ran
✅ Tests are being saved (console shows: `selected_tests: Array(12)`)
❌ Flask icon not appearing
❌ Tests not loading when editing

---

## Step 1: Check Database (MOST IMPORTANT!)

1. Open Supabase SQL Editor
2. Open `CHECK_DATABASE.sql`
3. Run queries 1-4

**What to look for:**
- Query 1: Should show `selected_tests` column exists
- Query 2: Look for your recently created client (ششيييييييييييي)
- Query 4: Should show clients with tests

**Expected Result:**
```
patient_name  | selected_tests                         | test_count
--------------+---------------------------------------+------------
ششيييييييييييي  | {LIPID_CHOL,LIPID_TG,LIVER_ALT,...}  | 12
```

**If `selected_tests` is NULL or empty:**
→ The save isn't working properly
→ Go to Step 2

**If `selected_tests` has data:**
→ The database is fine
→ Go to Step 3

---

## Step 2: Manual Test (If Database Shows NULL)

Run this in Supabase SQL Editor:

```sql
-- Find your recent client
SELECT uuid, patient_name FROM clients ORDER BY created_at DESC LIMIT 1;

-- Copy the UUID and update (replace YOUR_UUID):
UPDATE clients
SET selected_tests = ARRAY['CBC_WBC', 'GLUC_FBS', 'LIPID_CHOL']
WHERE uuid = 'YOUR_UUID_HERE';

-- Verify
SELECT patient_name, selected_tests FROM clients WHERE uuid = 'YOUR_UUID_HERE';
```

Then:
1. Refresh your app
2. Check if flask icon appears

**If flask appears now:**
→ The fetch is working, but save isn't
→ Check browser console for errors when saving

**If still no flask:**
→ Go to Step 3

---

## Step 3: Check Browser Console Logs

After refreshing the page, look for these logs:

```
📊 Fetched clients sample: [{name: "...", has_selected_tests: true, ...}]
```

**What each client should show:**
- `has_selected_tests: true` ← Good!
- `has_selected_tests: false` ← Problem!

**Then scroll through the table and look for:**
```
🧪 Rendering flask for client: ششيييييييييييي tests: ["LIPID_CHOL", ...]
```

**If you see this log:**
→ The icon IS rendering, but might be invisible (CSS issue)

**If you DON'T see this log:**
→ The condition `client.selected_tests && client.selected_tests.length > 0` is false

---

## Step 4: Force Re-fetch

In browser console (F12 → Console tab), run:

```javascript
location.reload(true)
```

This does a hard refresh. Check again for:
1. The fetch log
2. The flask icon rendering log

---

## Step 5: Check the Actual DOM

1. Right-click on the pencil icon (✏️) in the table
2. Select "Inspect Element"
3. Look at the parent `<div>` - it should have 2-3 buttons:
   - Flask (if tests exist)
   - Pencil (edit)
   - Trash (delete)

**If you only see 2 buttons (no flask):**
→ The condition is failing

**In the Elements tab, search for "FlaskConical":**
- Press Ctrl+F
- Search for "FlaskConical"
- If found → Icon exists but hidden
- If not found → Condition is false

---

## Step 6: Test Edit Modal

1. Create a NEW client with tests
2. Watch console for:
   ```
   💾 Saving client with tests: [...]
   ```
3. After save, immediately click Edit (✏️)
4. Watch console for:
   ```
   🔍 Loading client for edit: {selected_tests: [...]}
   ✅ Loaded tests: [...]
   ✅ Loaded groups: [...]
   ```

**If you see the loading logs:**
→ Data is there, but UI isn't updating

**If selected_tests is undefined/null:**
→ Save didn't work

---

## Common Fixes:

### Fix 1: Clear Cache
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
location.reload(true)
```

### Fix 2: Check TypeScript Types
The issue might be that TypeScript doesn't know about `selected_tests`.

Run in your terminal:
```bash
# Restart the dev server
npm run dev
```

### Fix 3: Verify Supabase Client Cache
```javascript
// In browser console, check what Supabase returns:
const { createClient } = await import('/src/lib/supabase.ts')
const supabase = createClient()
const { data } = await supabase.from('clients').select('*').limit(1)
console.log('Sample client:', data[0])
// Check if selected_tests is in the object
```

---

## Debug Commands

### Check if icon component is imported:
```javascript
// In browser console:
console.log(window.lucide || 'Lucide not found')
```

### Check if client has the field:
```javascript
// After page loads, in console:
const clients = document.querySelectorAll('table tbody tr')
console.log('Total rows:', clients.length)
```

---

## What to Share If Still Not Working:

1. **Screenshot of Supabase query results** (Query 4 from CHECK_DATABASE.sql)
2. **Screenshot of browser console** showing:
   - The 📊 fetch log
   - Any 🧪 rendering logs
   - Any errors (red text)
3. **Screenshot of the table** showing the actions column
4. **Result of this query:**
   ```sql
   SELECT patient_name, selected_tests
   FROM clients
   WHERE patient_name = 'ششيييييييييييي';
   ```

---

## Expected Working State:

✅ Database shows `selected_tests` with values
✅ Console shows: `📊 Fetched clients sample: [...has_selected_tests: true...]`
✅ Console shows: `🧪 Rendering flask for client: ...`
✅ Flask icon visible next to pencil icon
✅ Clicking flask opens results modal
✅ Editing shows tests checked

If ALL of these work → System is functional! 🎉
