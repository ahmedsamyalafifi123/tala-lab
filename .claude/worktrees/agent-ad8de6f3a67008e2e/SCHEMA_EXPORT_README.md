# Supabase Schema Export - Quick Reference

## Export Complete Database

Run this command to get **everything** from your Supabase database:

```bash
npm run export-schema
```

## What Gets Exported

✅ **77 columns** across 8 tables  
✅ **34 RLS policies** (all security rules)  
✅ **26 functions** (with full source code!)  
✅ **7 triggers** (automated actions)  
✅ **26 indexes** (performance optimizations)  
✅ **80 constraints** (foreign keys, unique, check)

## Output File

**File**: [`schema_rls.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/schema_rls.md) (2,015 lines)

Contains 6 sections:

1. Table Schemas
2. RLS Policies
3. Functions (with source code)
4. Triggers
5. Indexes
6. Constraints

## Tables Included

- `audit_log`
- `categories`
- `clients`
- `daily_id_sequences`
- `lab_tests`
- `lab_users`
- `labs`
- `test_groups`

## Key Functions Exported

- `add_lab_user_by_email()` - Add users to labs
- `assign_daily_id()` - Auto-assign daily IDs
- `check_is_manager()` - Manager permission check
- `get_my_lab_ids()` - Get user's lab IDs
- `get_next_available_daily_id()` - ID sequencing
- And 21 more with complete source code!

## No More SQL Files Needed!

This single export replaces all your `.sql` files:

- ❌ `archive/force_fix_rls.sql`
- ❌ `archive/supabase-schema.sql`
- ❌ All other migration files

Everything is now in one place: `schema_rls.md`

## Connection

Uses Supabase **session pooler**:

```
postgresql://postgres.zibfhrlcwftxewwsmekj:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

## Files

- **Script**: [`scripts/export-schema.ts`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/scripts/export-schema.ts)
- **Output**: [`schema_rls.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/schema_rls.md)
- **Config**: [`.env.local`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/.env.local)
