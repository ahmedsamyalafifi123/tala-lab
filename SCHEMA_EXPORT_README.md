# Supabase Schema Export - Quick Reference

## Export Current Schema

Run this command to get the latest schema and RLS policies from your Supabase database:

```bash
npm run export-schema
```

## What It Does

- Connects to your Supabase PostgreSQL database
- Exports all table schemas (columns, types, defaults)
- Exports all RLS policies
- Saves to `schema_rls.md`

## Output

- **6 tables**: audit_log, categories, clients, daily_id_sequences, lab_users, labs
- **56 columns** with full metadata
- **34 RLS policies** with permissions

## Files

- **Script**: [`scripts/export-schema.ts`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/scripts/export-schema.ts)
- **Output**: [`schema_rls.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/schema_rls.md)
- **Config**: [`.env.local`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/.env.local) (contains `DATABASE_URL`)

## Connection Details

Uses Supabase **session pooler** for reliable connectivity:

```
postgresql://postgres.zibfhrlcwftxewwsmekj:[PASSWORD]@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```
