# Database Operations Guide for AI Assistants

> **Purpose**: This guide helps AI assistants understand and modify the Supabase database directly without creating `.sql` files.

## Table of Contents

1. [Understanding the Database](#understanding-the-database)
2. [How to View Current Schema](#how-to-view-current-schema)
3. [How to Make Database Changes](#how-to-make-database-changes)
4. [Common Operations](#common-operations)
5. [Best Practices](#best-practices)

---

## Understanding the Database

### Current Database Structure

The database consists of **8 main tables**:

| Table                | Purpose                       | Key Columns                                  |
| -------------------- | ----------------------------- | -------------------------------------------- |
| `audit_log`          | Track all database changes    | `id`, `table_name`, `action`, `user_id`      |
| `categories`         | Lab test categories           | `id`, `name`, `lab_id`, `tests`              |
| `clients`            | Patient/client records        | `uuid`, `daily_id`, `patient_name`, `lab_id` |
| `daily_id_sequences` | Daily ID counter per category | `lab_id`, `date`, `category`, `last_id`      |
| `lab_tests`          | Available lab tests           | `uuid`, `name`, `price`, `category`          |
| `lab_users`          | Users assigned to labs        | `uuid`, `lab_id`, `user_id`, `role`          |
| `labs`               | Laboratory entities           | `uuid`, `slug`, `name`, `settings`           |
| `test_groups`        | Grouped test packages         | `uuid`, `name`, `tests`, `total_price`       |

### Key Functions (26 total)

Important functions you should know:

- **`check_is_manager()`** - Returns true if current user is a manager
- **`get_my_lab_ids()`** - Returns lab IDs for current user
- **`assign_daily_id()`** - Auto-assigns daily ID to new clients
- **`get_next_available_daily_id(lab_id, date, category)`** - Gets next ID in sequence
- **`add_lab_user_by_email(lab_id, email, role)`** - Adds user to lab

### Security (RLS Policies)

The database uses Row Level Security (RLS) with 34 policies. Key patterns:

- Managers have full access via `check_is_manager()`
- Users can only see data from their assigned labs via `get_my_lab_ids()`
- Most tables use `lab_id` for multi-tenancy isolation

---

## How to View Current Schema

### Method 1: Export Current Schema (Recommended)

Run the export script to get the complete current database structure:

```bash
npm run export-schema
```

This creates/updates `schema_rls.md` with:

- All table schemas
- All RLS policies
- All functions (with source code)
- All triggers
- All indexes
- All constraints

### Method 2: Query Specific Information

Use the Supabase SQL Editor or create a script to query:

```sql
-- View all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- View columns for a specific table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clients' AND table_schema = 'public';

-- View RLS policies for a table
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- View all functions
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace;
```

---

## How to Make Database Changes

### ⚠️ IMPORTANT: Never Create `.sql` Files

Instead, use one of these methods:

### Method 1: Direct Supabase SQL Editor (Recommended for Quick Changes)

1. Go to Supabase Dashboard → SQL Editor
2. Write your SQL directly
3. Execute immediately
4. After changes, run `npm run export-schema` to update documentation

### Method 2: Create a Migration Script (For Complex Changes)

Create a TypeScript script in `scripts/` folder:

```typescript
// scripts/add-new-column.ts
import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Your migration SQL
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS phone_number TEXT;
    `);

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await client.end();
  }
}

migrate();
```

Then run: `npx tsx scripts/add-new-column.ts`

### Method 3: Use Supabase Client in Your App

For application-level changes (not schema changes):

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Insert data
await supabase.from("clients").insert({
  patient_name: "John Doe",
  lab_id: "some-uuid",
  // ...
});
```

---

## Common Operations

### 1. Add a New Column to a Table

```sql
-- Add column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add column with default
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add column with constraint
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0);
```

### 2. Create a New Table

```sql
CREATE TABLE IF NOT EXISTS appointments (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(uuid) ON DELETE CASCADE,
  lab_id UUID REFERENCES labs(uuid) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Lab users can view their lab appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (lab_id IN (SELECT get_my_lab_ids()));

CREATE POLICY "Lab users can insert appointments"
  ON appointments FOR INSERT
  TO authenticated
  WITH CHECK (lab_id IN (SELECT get_my_lab_ids()));
```

### 3. Modify RLS Policies

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "old_policy_name" ON table_name;

-- Create new policy
CREATE POLICY "new_policy_name"
  ON table_name
  FOR SELECT
  TO authenticated
  USING (lab_id IN (SELECT get_my_lab_ids()));
```

### 4. Create or Update a Function

```sql
CREATE OR REPLACE FUNCTION public.my_function(param1 TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Function logic
  RETURN 'result';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Create a Trigger

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### 6. Create an Index

```sql
-- Simple index
CREATE INDEX IF NOT EXISTS idx_clients_lab_id
ON clients(lab_id);

-- Composite index
CREATE INDEX IF NOT EXISTS idx_clients_lab_date
ON clients(lab_id, daily_date);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_labs_slug
ON labs(slug);
```

### 7. Add Foreign Key Constraint

```sql
ALTER TABLE clients
ADD CONSTRAINT fk_clients_lab
FOREIGN KEY (lab_id)
REFERENCES labs(uuid)
ON DELETE CASCADE;
```

---

## Best Practices

### ✅ DO

1. **Always check current schema first**

   ```bash
   npm run export-schema
   ```

2. **Use IF EXISTS / IF NOT EXISTS**

   ```sql
   ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
   DROP POLICY IF EXISTS "old_policy" ON clients;
   ```

3. **Test on a small scale first**
   - Test with a single record
   - Verify the change works
   - Then apply to production

4. **Update documentation after changes**

   ```bash
   npm run export-schema  # Updates schema_rls.md
   ```

5. **Use transactions for multiple changes**

   ```sql
   BEGIN;
   -- Your changes here
   COMMIT;
   -- Or ROLLBACK if something fails
   ```

6. **Use SECURITY DEFINER for helper functions**
   ```sql
   CREATE FUNCTION my_helper() RETURNS BOOLEAN
   LANGUAGE plpgsql SECURITY DEFINER AS $$
   -- This bypasses RLS when needed
   $$;
   ```

### ❌ DON'T

1. **Don't create `.sql` files** - Execute directly or use TypeScript scripts
2. **Don't forget RLS policies** - New tables need security policies
3. **Don't drop tables without backup** - Always verify first
4. **Don't modify production without testing** - Test locally first
5. **Don't forget to update schema export** - Run `npm run export-schema` after changes

---

## Connection Details

### Database Connection

```bash
# Session Pooler (Use this!)
postgresql://postgres.zibfhrlcwftxewwsmekj:123ewqAa@Supa@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

### Environment Variables

Located in `.env.local`:

```bash
DATABASE_URL=postgresql://postgres.zibfhrlcwftxewwsmekj:123ewqAa@Supa@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://zibfhrlcwftxewwsmekj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Workflow for AI Assistants

When asked to make database changes:

1. **Understand the request**
   - What table(s) are affected?
   - What type of change (add column, modify RLS, create function)?

2. **Check current schema**

   ```bash
   npm run export-schema
   # Review schema_rls.md
   ```

3. **Plan the change**
   - Write the SQL needed
   - Consider RLS implications
   - Think about indexes/performance

4. **Execute the change**
   - Option A: Provide SQL for user to run in Supabase SQL Editor
   - Option B: Create a TypeScript migration script
   - Option C: Use Supabase client for data changes

5. **Update documentation**

   ```bash
   npm run export-schema
   ```

6. **Verify the change**
   - Check the updated `schema_rls.md`
   - Test the functionality

---

## Example: Complete Workflow

**Request**: "Add an email column to the clients table"

**AI Response**:

```sql
-- Step 1: Add the column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Add index for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Step 3: Update RLS if needed (clients already has proper RLS)
-- No changes needed - existing policies cover new column
```

**Instructions for user**:

1. Go to Supabase Dashboard → SQL Editor
2. Paste and run the above SQL
3. Run `npm run export-schema` to update documentation
4. Verify in `schema_rls.md` that the new column appears

---

## Quick Reference

| Task                | Command/Method                                                    |
| ------------------- | ----------------------------------------------------------------- |
| View current schema | `npm run export-schema`                                           |
| Execute SQL         | Supabase SQL Editor                                               |
| Create migration    | `scripts/migration-name.ts` + `npx tsx scripts/migration-name.ts` |
| Update docs         | `npm run export-schema`                                           |
| View functions      | Check `schema_rls.md` → Functions section                         |
| View RLS policies   | Check `schema_rls.md` → RLS Policies section                      |

---

## Support Files

- **Schema Export**: [`schema_rls.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/schema_rls.md) - Complete database structure
- **Export Script**: [`scripts/export-schema.ts`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/scripts/export-schema.ts) - Generates schema export
- **Connection Config**: [`.env.local`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/.env.local) - Database credentials
