# 🤖 AI Quick Reference - Database Operations

## For AI Assistants Working with This Database

### 📖 Read This First

**Main Guide**: [`DATABASE_GUIDE.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/DATABASE_GUIDE.md)  
**Current Schema**: [`schema_rls.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/schema_rls.md)

---

## 🚀 Quick Start

### View Current Database Structure

```bash
npm run export-schema
# Then read schema_rls.md
```

### Make Database Changes

**❌ DON'T**: Create `.sql` files  
**✅ DO**: Provide SQL for Supabase SQL Editor or create TypeScript migration script

---

## 📊 Database Overview

**8 Tables**: audit_log, categories, clients, daily_id_sequences, lab_tests, lab_users, labs, test_groups  
**26 Functions**: check_is_manager(), get_my_lab_ids(), assign_daily_id(), etc.  
**34 RLS Policies**: Multi-tenant security via lab_id  
**7 Triggers**: Auto-assign IDs, audit trails  
**26 Indexes**: Performance optimizations  
**80 Constraints**: Data integrity rules

---

## 🔧 Common Operations

### Add Column

```sql
ALTER TABLE table_name
ADD COLUMN IF NOT EXISTS column_name TYPE;
```

### Create RLS Policy

```sql
CREATE POLICY "policy_name"
  ON table_name FOR SELECT
  TO authenticated
  USING (lab_id IN (SELECT get_my_lab_ids()));
```

### Create Function

```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS TYPE AS $$
BEGIN
  -- logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Create Index

```sql
CREATE INDEX IF NOT EXISTS idx_name
ON table_name(column_name);
```

---

## 📋 Workflow

1. **Check schema**: `npm run export-schema`
2. **Plan change**: Review `schema_rls.md`
3. **Execute**: Provide SQL or create script
4. **Update docs**: `npm run export-schema`
5. **Verify**: Check updated `schema_rls.md`

---

## 🔑 Key Patterns

### Multi-Tenancy

All tables use `lab_id` for isolation. Always include in RLS policies:

```sql
USING (lab_id IN (SELECT get_my_lab_ids()))
```

### Manager Access

Managers bypass restrictions:

```sql
USING (check_is_manager())
```

### Security Definer

Helper functions need SECURITY DEFINER to bypass RLS:

```sql
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔗 Connection

```bash
# Session Pooler (in .env.local)
DATABASE_URL=postgresql://postgres.zibfhrlcwftxewwsmekj:123ewqAa@Supa@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

---

## ✅ Best Practices

- ✅ Use `IF EXISTS` / `IF NOT EXISTS`
- ✅ Test changes before production
- ✅ Update docs after changes
- ✅ Use transactions for multiple changes
- ✅ Add RLS to new tables
- ❌ Never create `.sql` files
- ❌ Never drop tables without backup

---

## 📚 Full Documentation

See [`DATABASE_GUIDE.md`](file:///c:/Users/ahmed/Desktop/lab/tala-lab/DATABASE_GUIDE.md) for:

- Complete table descriptions
- Detailed operation examples
- Migration script templates
- Security best practices
- Troubleshooting guide
