# Database Schema Export
Generated: 2026-02-07T18:49:00.947Z

## Table Schemas
[
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "table_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "record_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "action",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "old_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "new_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "user_email",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "audit_log",
    "column_name": "lab_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "color",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'default'::text"
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "lab_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "categories",
    "column_name": "tests",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'[]'::jsonb"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "daily_id",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "daily_date",
    "data_type": "date",
    "is_nullable": "YES",
    "column_default": "CURRENT_DATE"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "patient_name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "notes",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "updated_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "lab_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "results",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "categories",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::text[]"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "primary_category",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "client_group_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "clients",
    "column_name": "selected_tests",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": "'{}'::text[]"
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "lab_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "date",
    "data_type": "date",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "last_id",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_schema": "public",
    "table_name": "daily_id_sequences",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "test_code",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "test_name_ar",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "test_name_en",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "category",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "unit",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "reference_ranges",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "display_order",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_tests",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "lab_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "role",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "is_manager",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'active'::text"
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "lab_users",
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "slug",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "name",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "name_en",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "logo_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'active'::text"
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "settings",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "labs",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "uuid",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "group_code",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "group_name_ar",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "group_name_en",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "test_codes",
    "data_type": "ARRAY",
    "is_nullable": "NO",
    "column_default": "'{}'::text[]"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "is_predefined",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "is_active",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "true"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "display_order",
    "data_type": "integer",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "table_schema": "public",
    "table_name": "test_groups",
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  }
]

## RLS Policies
[
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "policyname": "Anyone can insert audit_log",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "policyname": "Anyone can view audit_log",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "policyname": "Authenticated users can insert audit logs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "policyname": "Lab staff can delete categories",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "policyname": "Lab staff can insert categories",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "policyname": "Lab staff can update categories",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "policyname": "Lab users can view their lab categories",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Anyone can delete clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Anyone can insert clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Anyone can update clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Lab staff can delete clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Lab staff can insert clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "Lab staff can update clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "policyname": "user_view_clients",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(lab_id IN ( SELECT get_my_lab_ids() AS get_my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "daily_id_sequences",
    "policyname": "Lab users can insert sequences",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))"
  },
  {
    "schemaname": "public",
    "tablename": "daily_id_sequences",
    "policyname": "Lab users can update sequences",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "daily_id_sequences",
    "policyname": "Lab users can view their lab sequences",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(lab_id IN ( SELECT my_lab_ids() AS my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "policyname": "Anyone can view active lab tests",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(is_active = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "policyname": "Managers can delete lab tests",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "check_is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "policyname": "Managers can insert lab tests",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "check_is_manager()"
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "policyname": "Managers can update lab tests",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "check_is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_users",
    "policyname": "mgr_full_access",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "check_is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_users",
    "policyname": "view_coworkers",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(lab_id IN ( SELECT get_my_lab_ids() AS get_my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "lab_users",
    "policyname": "view_own_row",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(user_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "Managers can delete labs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "Managers can insert labs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "is_manager()"
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "Managers can update labs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "Public can view active labs",
    "permissive": "PERMISSIVE",
    "roles": "{anon,authenticated}",
    "cmd": "SELECT",
    "qual": "(status = 'active'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "mgr_view_labs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "check_is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "policyname": "user_view_labs",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(uuid IN ( SELECT get_my_lab_ids() AS get_my_lab_ids))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "policyname": "Anyone can view active test groups",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(is_active = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "policyname": "Managers can delete test groups",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "check_is_manager()",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "policyname": "Managers can insert test groups",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "check_is_manager()"
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "policyname": "Managers can update test groups",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "check_is_manager()",
    "with_check": null
  }
]

## Functions
[
  {
    "schema": "public",
    "name": "add_lab_user_by_email",
    "result_type": "jsonb",
    "argument_types": "p_lab_id uuid, p_email text, p_role text",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_user_id UUID;\r\n  v_new_record JSONB;\r\n  v_caller_id UUID;\r\n  v_is_authorized BOOLEAN;\r\nBEGIN\r\n  v_caller_id := auth.uid();\r\n  \r\n  -- 1. Check permissions\r\n  SELECT EXISTS (\r\n    SELECT 1 FROM lab_users \r\n    WHERE user_id = v_caller_id \r\n    AND status = 'active'\r\n    AND (\r\n      is_manager = true \r\n      OR (lab_id = p_lab_id AND role = 'lab_admin')\r\n    )\r\n  ) INTO v_is_authorized;\r\n\r\n  IF NOT v_is_authorized THEN\r\n    RAISE EXCEPTION 'Not authorized to add users to this lab';\r\n  END IF;\r\n\r\n  -- 2. Find the user ID from email\r\n  SELECT id INTO v_user_id\r\n  FROM auth.users\r\n  WHERE email = p_email;\r\n\r\n  IF v_user_id IS NULL THEN\r\n    RAISE EXCEPTION 'User with email % not found', p_email;\r\n  END IF;\r\n\r\n  -- 3. Insert or Update lab_users record\r\n  INSERT INTO lab_users (lab_id, user_id, role, status, created_by)\r\n  VALUES (p_lab_id, v_user_id, p_role, 'active', v_caller_id)\r\n  ON CONFLICT (lab_id, user_id) \r\n  DO UPDATE SET \r\n    role = EXCLUDED.role,\r\n    status = 'active'\r\n    -- updated_at removed as column does not exist\r\n  RETURNING to_jsonb(lab_users.*) INTO v_new_record;\r\n\r\n  RETURN v_new_record;\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "assign_daily_id",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  -- Only assign if daily_id is NULL\r\n  IF NEW.daily_id IS NULL THEN\r\n    NEW.daily_id := get_next_available_daily_id(\r\n      NEW.lab_id,\r\n      NEW.daily_date,\r\n      COALESCE(NEW.primary_category, (NEW.categories::text[])[1], '_default')\r\n    );\r\n    -- Ensure primary_category is set\r\n    IF NEW.primary_category IS NULL THEN\r\n      NEW.primary_category := COALESCE((NEW.categories::text[])[1], '_default');\r\n    END IF;\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "check_duplicate_category",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  existing_count INTEGER;\r\nBEGIN\r\n  -- Check if category with same name already exists for this lab\r\n  SELECT COUNT(*) INTO existing_count\r\n  FROM categories\r\n  WHERE lab_id = NEW.lab_id\r\n    AND name = NEW.name;\r\n\r\n  IF existing_count > 0 THEN\r\n    RAISE EXCEPTION 'التصنيف \"%\" موجود بالفعل في هذا المعمل', NEW.name\r\n      USING ERRCODE = 'unique_violation';\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "check_is_manager",
    "result_type": "boolean",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  -- Check if the current user has is_manager = true in lab_users\r\n  RETURN EXISTS (\r\n    SELECT 1 FROM public.lab_users\r\n    WHERE user_id = auth.uid()\r\n    AND is_manager = true\r\n    AND status = 'active'\r\n  );\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "delete_client_single_category",
    "result_type": "jsonb",
    "argument_types": "p_uuid uuid",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_group_id UUID;\r\n  v_category TEXT;\r\n  v_lab_id UUID;\r\n  v_daily_date DATE;\r\n  v_remaining_count INTEGER;\r\nBEGIN\r\n  -- Get info before delete\r\n  SELECT client_group_id, primary_category, lab_id, daily_date\r\n    INTO v_group_id, v_category, v_lab_id, v_daily_date\r\n  FROM clients\r\n  WHERE uuid = p_uuid;\r\n\r\n  IF NOT FOUND THEN\r\n    RAISE EXCEPTION 'Client not found';\r\n  END IF;\r\n\r\n  -- Delete this specific record\r\n  DELETE FROM clients WHERE uuid = p_uuid;\r\n\r\n  -- Check remaining copies\r\n  SELECT COUNT(*) INTO v_remaining_count\r\n  FROM clients\r\n  WHERE client_group_id = v_group_id;\r\n\r\n  -- Resequence this category to fill the gap\r\n  PERFORM resequence_daily_ids(v_lab_id, v_daily_date, v_category);\r\n\r\n  RETURN jsonb_build_object(\r\n    'success', true,\r\n    'deleted_category', v_category,\r\n    'remaining_copies', v_remaining_count\r\n  );\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "get_my_lab_ids",
    "result_type": "TABLE(lab_id uuid)",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT lu.lab_id \r\n  FROM public.lab_users lu\r\n  WHERE lu.user_id = auth.uid()\r\n  AND lu.status = 'active';\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "get_next_available_daily_id",
    "result_type": "integer",
    "argument_types": "p_lab_id uuid, p_date date DEFAULT CURRENT_DATE, p_category text DEFAULT NULL::text",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_next_id INTEGER;\r\n  v_existing_id INTEGER;\r\n  v_check_category TEXT := COALESCE(p_category, '_default');\r\nBEGIN\r\n  -- Find the first gap in the sequence for this category\r\n  FOR v_next_id IN 1..10000 LOOP\r\n    SELECT daily_id INTO v_existing_id\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id\r\n      AND daily_date = p_date\r\n      AND primary_category = v_check_category\r\n      AND daily_id = v_next_id\r\n    LIMIT 1;\r\n\r\n    IF v_existing_id IS NULL THEN\r\n      -- Found a gap, update sequence tracker and return\r\n      INSERT INTO daily_id_sequences (lab_id, date, category, last_id)\r\n      VALUES (p_lab_id, p_date, v_check_category, v_next_id)\r\n      ON CONFLICT (lab_id, date, category)\r\n      DO UPDATE SET\r\n        last_id = GREATEST(daily_id_sequences.last_id, v_next_id),\r\n        updated_at = NOW();\r\n\r\n      RETURN v_next_id;\r\n    END IF;\r\n  END LOOP;\r\n\r\n  RAISE EXCEPTION 'Maximum daily ID limit reached';\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "get_next_available_daily_id",
    "result_type": "integer",
    "argument_types": "p_lab_id uuid, p_date date DEFAULT CURRENT_DATE",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_next_id INTEGER;\r\n  v_existing_id INTEGER;\r\nBEGIN\r\n  -- Find the first gap in the sequence\r\n  -- We look for the smallest daily_id that doesn't exist starting from 1\r\n  FOR v_next_id IN 1..10000 LOOP\r\n    SELECT daily_id INTO v_existing_id\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id\r\n      AND daily_date = p_date\r\n      AND daily_id = v_next_id\r\n    LIMIT 1;\r\n\r\n    IF v_existing_id IS NULL THEN\r\n      -- Found a gap, return this ID\r\n      -- Update the sequence tracker\r\n      INSERT INTO daily_id_sequences (lab_id, date, last_id)\r\n      VALUES (p_lab_id, p_date, v_next_id)\r\n      ON CONFLICT (lab_id, date)\r\n      DO UPDATE SET\r\n        last_id = GREATEST(daily_id_sequences.last_id, v_next_id),\r\n        updated_at = NOW();\r\n\r\n      RETURN v_next_id;\r\n    END IF;\r\n  END LOOP;\r\n\r\n  -- If we get here, we have 10000 clients (shouldn't happen)\r\n  RAISE EXCEPTION 'Maximum daily ID limit reached';\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "get_next_daily_id",
    "result_type": "integer",
    "argument_types": "p_lab_id uuid, p_date date",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_next_id INTEGER;\r\nBEGIN\r\n  -- Insert or update the sequence for the SPECIFIC DATE provided\r\n  INSERT INTO daily_id_sequences (lab_id, date, last_id)\r\n  VALUES (p_lab_id, p_date, 1)\r\n  ON CONFLICT (lab_id, date)\r\n  DO UPDATE SET\r\n    last_id = daily_id_sequences.last_id + 1,\r\n    updated_at = NOW()\r\n  RETURNING last_id INTO v_next_id;\r\n\r\n  RETURN v_next_id;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "insert_client_multi_category",
    "result_type": "TABLE(ret_uuid uuid, ret_client_group_id uuid, ret_daily_id integer, ret_primary_category text)",
    "argument_types": "p_lab_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_created_by uuid, p_selected_tests text[] DEFAULT '{}'::text[]",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_client_group_id UUID;\r\n  v_category TEXT;\r\n  v_daily_id INT;\r\n  v_inserted_uuid UUID;\r\n  v_inserted_group_id UUID;\r\n  v_inserted_daily_id INT;\r\n  v_inserted_category TEXT;\r\nBEGIN\r\n  -- Generate a shared client_group_id for all category copies\r\n  v_client_group_id := gen_random_uuid();\r\n\r\n  -- If no categories provided, use default \"عام\"\r\n  IF array_length(p_categories, 1) IS NULL OR array_length(p_categories, 1) = 0 THEN\r\n    p_categories := ARRAY['عام'];\r\n  END IF;\r\n\r\n  -- Get next daily_id for first category\r\n  SELECT COALESCE(MAX(c.daily_id), 0) + 1\r\n  INTO v_daily_id\r\n  FROM clients c\r\n  WHERE c.lab_id = p_lab_id\r\n    AND c.daily_date = p_daily_date\r\n    AND c.primary_category = p_categories[1];\r\n\r\n  -- Override with manual ID if provided\r\n  IF p_manual_id IS NOT NULL THEN\r\n    v_daily_id := p_manual_id;\r\n  END IF;\r\n\r\n  -- Insert one record per category\r\n  FOREACH v_category IN ARRAY p_categories\r\n  LOOP\r\n    INSERT INTO clients (\r\n      lab_id,\r\n      patient_name,\r\n      notes,\r\n      categories,\r\n      primary_category,\r\n      daily_date,\r\n      daily_id,\r\n      client_group_id,\r\n      created_by,\r\n      results,\r\n      selected_tests\r\n    )\r\n    VALUES (\r\n      p_lab_id,\r\n      p_patient_name,\r\n      p_notes,\r\n      p_categories,\r\n      v_category,\r\n      p_daily_date,\r\n      v_daily_id,\r\n      v_client_group_id,\r\n      p_created_by,\r\n      '{}'::jsonb,\r\n      p_selected_tests\r\n    )\r\n    RETURNING\r\n      uuid,\r\n      client_group_id,\r\n      daily_id,\r\n      primary_category\r\n    INTO\r\n      v_inserted_uuid,\r\n      v_inserted_group_id,\r\n      v_inserted_daily_id,\r\n      v_inserted_category;\r\n\r\n    -- Return the inserted record info\r\n    RETURN QUERY SELECT\r\n      v_inserted_uuid,\r\n      v_inserted_group_id,\r\n      v_inserted_daily_id,\r\n      v_inserted_category;\r\n  END LOOP;\r\n\r\n  RETURN;\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "insert_with_manual_id",
    "result_type": "jsonb",
    "argument_types": "p_lab_id uuid, p_patient_name text, p_notes text DEFAULT ''::text, p_categories text[] DEFAULT '{}'::text[], p_daily_date date DEFAULT CURRENT_DATE, p_daily_id integer DEFAULT NULL::integer, p_created_by uuid DEFAULT NULL::uuid",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_final_daily_id INTEGER;\r\n  v_new_client UUID;\r\n  v_primary_cat TEXT;\r\nBEGIN\r\n  -- Get primary category (first one or default)\r\n  v_primary_cat := COALESCE(\r\n    CASE WHEN p_categories IS NULL OR array_length(p_categories, 1) IS NULL THEN NULL ELSE p_categories[1] END,\r\n    '_default'\r\n  );\r\n\r\n  IF p_daily_id IS NOT NULL THEN\r\n    -- Check if this ID already exists for this category\r\n    IF EXISTS (\r\n      SELECT 1 FROM clients\r\n      WHERE lab_id = p_lab_id\r\n        AND daily_date = p_daily_date\r\n        AND primary_category = v_primary_cat\r\n        AND daily_id = p_daily_id\r\n    ) THEN\r\n      -- Shift existing IDs\r\n      PERFORM shift_daily_ids(p_lab_id, p_daily_date, v_primary_cat, p_daily_id);\r\n    END IF;\r\n    v_final_daily_id := p_daily_id;\r\n  ELSE\r\n    -- Use gap-finding logic\r\n    v_final_daily_id := get_next_available_daily_id(p_lab_id, p_daily_date, v_primary_cat);\r\n  END IF;\r\n\r\n  -- Insert the new client\r\n  INSERT INTO clients (\r\n    lab_id, patient_name, notes, categories,\r\n    daily_date, daily_id, created_by, primary_category\r\n  )\r\n  VALUES (\r\n    p_lab_id, p_patient_name, p_notes, p_categories,\r\n    p_daily_date, v_final_daily_id, p_created_by, v_primary_cat\r\n  )\r\n  RETURNING uuid INTO v_new_client;\r\n\r\n  RETURN jsonb_build_object(\r\n    'success', true,\r\n    'uuid', v_new_client,\r\n    'daily_id', v_final_daily_id,\r\n    'primary_category', v_primary_cat\r\n  );\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "is_manager",
    "result_type": "boolean",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  RETURN public.check_is_manager();\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "log_audit_changes",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_lab_id UUID;\r\n  v_user_id UUID;\r\nBEGIN\r\n  -- Get lab_id from the record\r\n  IF TG_TABLE_NAME = 'clients' THEN\r\n    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);\r\n  ELSIF TG_TABLE_NAME = 'categories' THEN\r\n    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);\r\n  ELSIF TG_TABLE_NAME = 'lab_users' THEN\r\n    v_lab_id := COALESCE(NEW.lab_id, OLD.lab_id);\r\n  END IF;\r\n\r\n  v_user_id := auth.uid();\r\n\r\n  IF TG_OP = 'INSERT' THEN\r\n    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, new_values)\r\n    VALUES (v_lab_id, v_user_id, 'create', TG_TABLE_NAME, NEW.uuid, to_jsonb(NEW));\r\n  ELSIF TG_OP = 'UPDATE' THEN\r\n    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values, new_values)\r\n    VALUES (v_lab_id, v_user_id, 'update', TG_TABLE_NAME, NEW.uuid, to_jsonb(OLD), to_jsonb(NEW));\r\n  ELSIF TG_OP = 'DELETE' THEN\r\n    INSERT INTO audit_log (lab_id, user_id, action, table_name, record_id, old_values)\r\n    VALUES (v_lab_id, v_user_id, 'delete', TG_TABLE_NAME, OLD.uuid, to_jsonb(OLD));\r\n  END IF;\r\n\r\n  IF TG_OP = 'DELETE' THEN\r\n    RETURN OLD;\r\n  ELSE\r\n    RETURN NEW;\r\n  END IF;\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "my_lab_ids",
    "result_type": "SETOF uuid",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT lu.lab_id \r\n  FROM public.lab_users lu\r\n  WHERE lu.user_id = auth.uid()\r\n  AND lu.status = 'active';\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "resequence_after_category_change",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_old_category TEXT;\r\n  v_new_category TEXT;\r\n  v_new_daily_id INTEGER;\r\nBEGIN\r\n  -- Only run if primary_category changed\r\n  IF OLD.primary_category IS DISTINCT FROM NEW.primary_category THEN\r\n    v_old_category := COALESCE(OLD.primary_category, '_default');\r\n    v_new_category := COALESCE(NEW.primary_category, '_default');\r\n\r\n    -- Find the next available ID in the NEW category\r\n    -- (or use the current one if it's available)\r\n    SELECT COALESCE(MAX(daily_id), 0) + 1 INTO v_new_daily_id\r\n    FROM clients\r\n    WHERE lab_id = NEW.lab_id\r\n      AND daily_date = NEW.daily_date\r\n      AND primary_category = v_new_category;\r\n\r\n    -- Update the client with the new category and new daily_id\r\n    UPDATE clients\r\n    SET primary_category = v_new_category,\r\n        daily_id = v_new_daily_id\r\n    WHERE uuid = NEW.uuid;\r\n\r\n    -- Resequence the OLD category (fill the gap)\r\n    PERFORM resequence_daily_ids(OLD.lab_id, OLD.daily_date, v_old_category);\r\n\r\n    -- Note: No need to resequence new category since we appended at the end\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "resequence_after_delete",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  -- Resequence IDs for this lab/date/category to fill the gap\r\n  PERFORM resequence_daily_ids(OLD.lab_id, OLD.daily_date, OLD.primary_category);\r\n  RETURN OLD;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "resequence_category",
    "result_type": "jsonb",
    "argument_types": "p_lab_id uuid, p_date date DEFAULT CURRENT_DATE, p_category text DEFAULT NULL::text",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_result INTEGER;\r\nBEGIN\r\n  PERFORM resequence_daily_ids(p_lab_id, p_date, p_category);\r\n\r\n  SELECT COUNT(*) INTO v_result\r\n  FROM clients\r\n  WHERE lab_id = p_lab_id\r\n    AND daily_date = p_date\r\n    AND (p_category IS NULL OR primary_category = p_category);\r\n\r\n  RETURN jsonb_build_object(\r\n    'success', true,\r\n    'lab_id', p_lab_id,\r\n    'date', p_date,\r\n    'category', COALESCE(p_category, '_default'),\r\n    'total_clients', v_result\r\n  );\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "resequence_category_change",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_old_category TEXT;\r\n  v_new_category TEXT;\r\nBEGIN\r\n  -- Only run if primary_category actually changed\r\n  IF TG_OP = 'UPDATE' AND OLD.primary_category IS DISTINCT FROM NEW.primary_category THEN\r\n    v_old_category := COALESCE(OLD.primary_category, '_default');\r\n    v_new_category := COALESCE(NEW.primary_category, '_default');\r\n\r\n    -- First, check if the new daily_id already exists in the new category\r\n    IF EXISTS (\r\n      SELECT 1 FROM clients\r\n      WHERE lab_id = NEW.lab_id\r\n        AND daily_date = NEW.daily_date\r\n        AND primary_category = v_new_category\r\n        AND daily_id = NEW.daily_id\r\n        AND uuid != NEW.uuid\r\n    ) THEN\r\n      -- Shift all IDs >= NEW.daily_id in the new category\r\n      PERFORM shift_daily_ids(NEW.lab_id, NEW.daily_date, v_new_category, NEW.daily_id);\r\n    END IF;\r\n\r\n    -- Now update the client\r\n    -- (This happens automatically after the trigger returns)\r\n\r\n    -- After the update, resequence the OLD category to fill the gap\r\n    -- We need to do this in a separate transaction via a job or after the fact\r\n    -- For now, let's use a 2-step approach:\r\n\r\n    RETURN NEW;\r\n  END IF;\r\n\r\n  RETURN NEW;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "resequence_daily_ids",
    "result_type": "void",
    "argument_types": "p_lab_id uuid, p_date date DEFAULT CURRENT_DATE, p_category text DEFAULT NULL::text",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_client RECORD;\r\n  v_new_id INTEGER := 1;\r\n  v_check_category TEXT;\r\nBEGIN\r\n  v_check_category := COALESCE(p_category, '_default');\r\n\r\n  LOCK TABLE clients IN EXCLUSIVE MODE;\r\n\r\n  -- Get all clients for this category ordered by current daily_id\r\n  FOR v_client IN\r\n    SELECT uuid\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id\r\n      AND daily_date = p_date\r\n      AND (p_category IS NULL OR primary_category = v_check_category)\r\n    ORDER BY daily_id ASC\r\n  LOOP\r\n    UPDATE clients\r\n    SET daily_id = v_new_id\r\n    WHERE uuid = v_client.uuid;\r\n\r\n    v_new_id := v_new_id + 1;\r\n  END LOOP;\r\n\r\n  -- Update sequence tracker\r\n  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)\r\n  VALUES (p_lab_id, p_date, v_check_category, v_new_id - 1)\r\n  ON CONFLICT (lab_id, date, category)\r\n  DO UPDATE SET\r\n    last_id = v_new_id - 1,\r\n    updated_at = NOW();\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "resequence_daily_ids",
    "result_type": "void",
    "argument_types": "p_lab_id uuid, p_date date DEFAULT CURRENT_DATE",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_client RECORD;\r\n  v_new_id INTEGER := 1;\r\nBEGIN\r\n  -- Lock the table to prevent concurrent modifications\r\n  LOCK TABLE clients IN EXCLUSIVE MODE;\r\n\r\n  -- Get all clients ordered by current daily_id\r\n  FOR v_client IN\r\n    SELECT uuid\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id AND daily_date = p_date\r\n    ORDER BY daily_id ASC\r\n  LOOP\r\n    -- Update with new sequential ID\r\n    UPDATE clients\r\n    SET daily_id = v_new_id\r\n    WHERE uuid = v_client.uuid;\r\n\r\n    v_new_id := v_new_id + 1;\r\n  END LOOP;\r\n\r\n  -- Update the sequence tracker\r\n  INSERT INTO daily_id_sequences (lab_id, date, last_id)\r\n  VALUES (p_lab_id, p_date, v_new_id - 1)\r\n  ON CONFLICT (lab_id, date)\r\n  DO UPDATE SET\r\n    last_id = v_new_id - 1,\r\n    updated_at = NOW();\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "seed_lab_tests",
    "result_type": "void",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  -- Only insert if tests don't exist\r\n  IF NOT EXISTS (SELECT 1 FROM lab_tests LIMIT 1) THEN\r\n\r\n    -- HEMATOLOGY / COMPLETE BLOOD COUNT (CBC)\r\n    INSERT INTO lab_tests (test_code, test_name_ar, test_name_en, category, unit, reference_ranges, display_order) VALUES\r\n    ('CBC_WBC', 'عدد خلايا الدم البيضاء', 'White Blood Cells', 'Hematology', '×10³/µL', '{\"default\": {\"min\": 4.0, \"max\": 11.0}}', 1),\r\n    ('CBC_RBC', 'عدد خلايا الدم الحمراء', 'Red Blood Cells', 'Hematology', '×10⁶/µL', '{\"male\": {\"min\": 4.5, \"max\": 5.9}, \"female\": {\"min\": 4.1, \"max\": 5.1}}', 2),\r\n    ('CBC_HGB', 'الهيموجلوبين', 'Hemoglobin', 'Hematology', 'g/dL', '{\"male\": {\"min\": 13.5, \"max\": 17.5}, \"female\": {\"min\": 12.0, \"max\": 15.5}}', 3),\r\n    ('CBC_HCT', 'الهيماتوكريت', 'Hematocrit', 'Hematology', '%', '{\"male\": {\"min\": 38.8, \"max\": 50.0}, \"female\": {\"min\": 34.9, \"max\": 44.5}}', 4),\r\n    ('CBC_MCV', 'متوسط حجم الكرية', 'Mean Corpuscular Volume', 'Hematology', 'fL', '{\"default\": {\"min\": 80, \"max\": 100}}', 5),\r\n    ('CBC_MCH', 'متوسط هيموجلوبين الكرية', 'Mean Corpuscular Hemoglobin', 'Hematology', 'pg', '{\"default\": {\"min\": 27, \"max\": 33}}', 6),\r\n    ('CBC_MCHC', 'تركيز متوسط هيموجلوبين الكرية', 'Mean Corpuscular Hemoglobin Concentration', 'Hematology', 'g/dL', '{\"default\": {\"min\": 32, \"max\": 36}}', 7),\r\n    ('CBC_PLT', 'الصفائح الدموية', 'Platelets', 'Hematology', '×10³/µL', '{\"default\": {\"min\": 150, \"max\": 400}}', 8),\r\n    ('CBC_NEUT', 'العدلات', 'Neutrophils', 'Hematology', '%', '{\"default\": {\"min\": 40, \"max\": 70}}', 9),\r\n    ('CBC_LYMPH', 'الخلايا الليمفاوية', 'Lymphocytes', 'Hematology', '%', '{\"default\": {\"min\": 20, \"max\": 45}}', 10),\r\n    ('CBC_MONO', 'الخلايا الوحيدة', 'Monocytes', 'Hematology', '%', '{\"default\": {\"min\": 2, \"max\": 10}}', 11),\r\n    ('CBC_EOS', 'الحمضات', 'Eosinophils', 'Hematology', '%', '{\"default\": {\"min\": 1, \"max\": 6}}', 12),\r\n    ('CBC_BASO', 'القعدات', 'Basophils', 'Hematology', '%', '{\"default\": {\"min\": 0, \"max\": 2}}', 13),\r\n\r\n    -- DIABETES / GLUCOSE TESTS\r\n    ('GLUC_FBS', 'سكر الدم صائم', 'Fasting Blood Sugar', 'Diabetes', 'mg/dL', '{\"default\": {\"min\": 70, \"max\": 100}}', 20),\r\n    ('GLUC_PPS', 'سكر الدم فاطر', 'Postprandial Blood Sugar', 'Diabetes', 'mg/dL', '{\"default\": {\"min\": 0, \"max\": 140}}', 21),\r\n    ('GLUC_RBS', 'سكر الدم العشوائي', 'Random Blood Sugar', 'Diabetes', 'mg/dL', '{\"default\": {\"min\": 70, \"max\": 125}}', 22),\r\n    ('GLUC_HBA1C', 'الهيموجلوبين السكري', 'HbA1c', 'Diabetes', '%', '{\"default\": {\"min\": 4, \"max\": 5.6}}', 23),\r\n\r\n    -- LIPID PROFILE\r\n    ('LIPID_CHOL', 'الكوليسترول الكلي', 'Total Cholesterol', 'Lipid Profile', 'mg/dL', '{\"default\": {\"min\": 0, \"max\": 200}}', 30),\r\n    ('LIPID_TG', 'الدهون الثلاثية', 'Triglycerides', 'Lipid Profile', 'mg/dL', '{\"default\": {\"min\": 0, \"max\": 150}}', 31),\r\n    ('LIPID_HDL', 'الكوليسترول الجيد', 'HDL Cholesterol', 'Lipid Profile', 'mg/dL', '{\"male\": {\"min\": 40, \"max\": 999}, \"female\": {\"min\": 50, \"max\": 999}}', 32),\r\n    ('LIPID_LDL', 'الكوليسترول الضار', 'LDL Cholesterol', 'Lipid Profile', 'mg/dL', '{\"default\": {\"min\": 0, \"max\": 100}}', 33),\r\n    ('LIPID_VLDL', 'الكوليسترول منخفض الكثافة جداً', 'VLDL Cholesterol', 'Lipid Profile', 'mg/dL', '{\"default\": {\"min\": 5, \"max\": 30}}', 34),\r\n\r\n    -- LIVER FUNCTION TESTS\r\n    ('LIVER_ALT', 'إنزيم الكبد ALT', 'Alanine Aminotransferase', 'Liver Function', 'U/L', '{\"male\": {\"min\": 7, \"max\": 55}, \"female\": {\"min\": 7, \"max\": 45}}', 40),\r\n    ('LIVER_AST', 'إنزيم الكبد AST', 'Aspartate Aminotransferase', 'Liver Function', 'U/L', '{\"male\": {\"min\": 8, \"max\": 48}, \"female\": {\"min\": 8, \"max\": 40}}', 41),\r\n    ('LIVER_ALP', 'الفوسفاتيز القلوي', 'Alkaline Phosphatase', 'Liver Function', 'U/L', '{\"default\": {\"min\": 44, \"max\": 147}}', 42),\r\n    ('LIVER_TBIL', 'البيليروبين الكلي', 'Total Bilirubin', 'Liver Function', 'mg/dL', '{\"default\": {\"min\": 0.1, \"max\": 1.2}}', 43),\r\n    ('LIVER_DBIL', 'البيليروبين المباشر', 'Direct Bilirubin', 'Liver Function', 'mg/dL', '{\"default\": {\"min\": 0, \"max\": 0.3}}', 44),\r\n    ('LIVER_ALB', 'الألبومين', 'Albumin', 'Liver Function', 'g/dL', '{\"default\": {\"min\": 3.5, \"max\": 5.5}}', 45),\r\n    ('LIVER_TP', 'البروتين الكلي', 'Total Protein', 'Liver Function', 'g/dL', '{\"default\": {\"min\": 6.0, \"max\": 8.3}}', 46),\r\n\r\n    -- KIDNEY FUNCTION TESTS\r\n    ('KIDNEY_CREAT', 'الكرياتينين', 'Creatinine', 'Kidney Function', 'mg/dL', '{\"male\": {\"min\": 0.7, \"max\": 1.3}, \"female\": {\"min\": 0.6, \"max\": 1.1}}', 50),\r\n    ('KIDNEY_BUN', 'نيتروجين اليوريا', 'Blood Urea Nitrogen', 'Kidney Function', 'mg/dL', '{\"default\": {\"min\": 7, \"max\": 20}}', 51),\r\n    ('KIDNEY_UA', 'حمض اليوريك', 'Uric Acid', 'Kidney Function', 'mg/dL', '{\"male\": {\"min\": 3.5, \"max\": 7.2}, \"female\": {\"min\": 2.6, \"max\": 6.0}}', 52),\r\n\r\n    -- THYROID TESTS\r\n    ('THYROID_TSH', 'الهرمون المحفز للغدة الدرقية', 'Thyroid Stimulating Hormone', 'Thyroid Function', 'mIU/L', '{\"default\": {\"min\": 0.4, \"max\": 4.0}}', 60),\r\n    ('THYROID_T3', 'هرمون T3', 'Triiodothyronine (T3)', 'Thyroid Function', 'ng/dL', '{\"default\": {\"min\": 80, \"max\": 200}}', 61),\r\n    ('THYROID_T4', 'هرمون T4', 'Thyroxine (T4)', 'Thyroid Function', 'µg/dL', '{\"default\": {\"min\": 5.0, \"max\": 12.0}}', 62),\r\n    ('THYROID_FT3', 'هرمون T3 الحر', 'Free T3', 'Thyroid Function', 'pg/mL', '{\"default\": {\"min\": 2.0, \"max\": 4.4}}', 63),\r\n    ('THYROID_FT4', 'هرمون T4 الحر', 'Free T4', 'Thyroid Function', 'ng/dL', '{\"default\": {\"min\": 0.8, \"max\": 1.8}}', 64),\r\n\r\n    -- ELECTROLYTES\r\n    ('ELEC_NA', 'الصوديوم', 'Sodium', 'Electrolytes', 'mEq/L', '{\"default\": {\"min\": 136, \"max\": 145}}', 70),\r\n    ('ELEC_K', 'البوتاسيوم', 'Potassium', 'Electrolytes', 'mEq/L', '{\"default\": {\"min\": 3.5, \"max\": 5.1}}', 71),\r\n    ('ELEC_CL', 'الكلور', 'Chloride', 'Electrolytes', 'mEq/L', '{\"default\": {\"min\": 98, \"max\": 107}}', 72),\r\n    ('ELEC_CA', 'الكالسيوم', 'Calcium', 'Electrolytes', 'mg/dL', '{\"default\": {\"min\": 8.5, \"max\": 10.5}}', 73),\r\n    ('ELEC_MG', 'المغنيسيوم', 'Magnesium', 'Electrolytes', 'mg/dL', '{\"default\": {\"min\": 1.7, \"max\": 2.2}}', 74),\r\n    ('ELEC_PHOS', 'الفوسفور', 'Phosphorus', 'Electrolytes', 'mg/dL', '{\"default\": {\"min\": 2.5, \"max\": 4.5}}', 75);\r\n\r\n  END IF;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "seed_test_groups",
    "result_type": "void",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  -- Only insert if test groups don't exist\r\n  IF NOT EXISTS (SELECT 1 FROM test_groups LIMIT 1) THEN\r\n\r\n    INSERT INTO test_groups (group_code, group_name_ar, group_name_en, test_codes, is_predefined, display_order) VALUES\r\n    ('CBC_PANEL', 'صورة دم كاملة', 'Complete Blood Count',\r\n     ARRAY['CBC_WBC', 'CBC_RBC', 'CBC_HGB', 'CBC_HCT', 'CBC_MCV', 'CBC_MCH', 'CBC_MCHC', 'CBC_PLT', 'CBC_NEUT', 'CBC_LYMPH', 'CBC_MONO', 'CBC_EOS', 'CBC_BASO'],\r\n     true, 1),\r\n\r\n    ('DIABETES_PANEL', 'فحص السكري', 'Diabetes Panel',\r\n     ARRAY['GLUC_FBS', 'GLUC_PPS', 'GLUC_HBA1C'],\r\n     true, 2),\r\n\r\n    ('LIPID_PANEL', 'فحص الدهون', 'Lipid Profile',\r\n     ARRAY['LIPID_CHOL', 'LIPID_TG', 'LIPID_HDL', 'LIPID_LDL', 'LIPID_VLDL'],\r\n     true, 3),\r\n\r\n    ('LIVER_PANEL', 'فحص وظائف الكبد', 'Liver Function Tests',\r\n     ARRAY['LIVER_ALT', 'LIVER_AST', 'LIVER_ALP', 'LIVER_TBIL', 'LIVER_DBIL', 'LIVER_ALB', 'LIVER_TP'],\r\n     true, 4),\r\n\r\n    ('KIDNEY_PANEL', 'فحص وظائف الكلى', 'Kidney Function Tests',\r\n     ARRAY['KIDNEY_CREAT', 'KIDNEY_BUN', 'KIDNEY_UA'],\r\n     true, 5),\r\n\r\n    ('THYROID_PANEL', 'فحص الغدة الدرقية', 'Thyroid Function Tests',\r\n     ARRAY['THYROID_TSH', 'THYROID_T3', 'THYROID_T4', 'THYROID_FT3', 'THYROID_FT4'],\r\n     true, 6),\r\n\r\n    ('ELECTROLYTES_PANEL', 'فحص الأملاح', 'Electrolytes Panel',\r\n     ARRAY['ELEC_NA', 'ELEC_K', 'ELEC_CL', 'ELEC_CA', 'ELEC_MG', 'ELEC_PHOS'],\r\n     true, 7),\r\n\r\n    ('ROUTINE_PANEL', 'الفحص الروتيني', 'Routine Panel',\r\n     ARRAY['GLUC_FBS', 'CBC_WBC', 'CBC_HGB', 'CBC_PLT'],\r\n     true, 8);\r\n\r\n  END IF;\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "shift_daily_ids",
    "result_type": "void",
    "argument_types": "p_lab_id uuid, p_date date, p_target_id integer",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_client RECORD;\r\nBEGIN\r\n  -- Shift IDs starting from the highest to avoid conflicts\r\n  -- We need to do this in a loop to avoid unique constraint violations\r\n  FOR v_client IN\r\n    SELECT uuid, daily_id\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id\r\n      AND daily_date = p_date\r\n      AND daily_id >= p_target_id\r\n    ORDER BY daily_id DESC\r\n  LOOP\r\n    UPDATE clients\r\n    SET daily_id = v_client.daily_id + 1\r\n    WHERE uuid = v_client.uuid;\r\n  END LOOP;\r\n\r\n  -- Update the sequence tracker\r\n  INSERT INTO daily_id_sequences (lab_id, date, last_id)\r\n  VALUES (p_lab_id, p_date, p_target_id)\r\n  ON CONFLICT (lab_id, date)\r\n  DO UPDATE SET\r\n    last_id = GREATEST(daily_id_sequences.last_id, (\r\n      SELECT COALESCE(MAX(daily_id), 0)\r\n      FROM clients\r\n      WHERE lab_id = p_lab_id AND daily_date = p_date\r\n    )),\r\n    updated_at = NOW();\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "shift_daily_ids",
    "result_type": "void",
    "argument_types": "p_lab_id uuid, p_date date, p_category text, p_target_id integer",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_client RECORD;\r\n  v_check_category TEXT := COALESCE(p_category, '_default');\r\nBEGIN\r\n  -- Shift IDs starting from highest to avoid conflicts\r\n  FOR v_client IN\r\n    SELECT uuid, daily_id\r\n    FROM clients\r\n    WHERE lab_id = p_lab_id\r\n      AND daily_date = p_date\r\n      AND primary_category = v_check_category\r\n      AND daily_id >= p_target_id\r\n    ORDER BY daily_id DESC\r\n  LOOP\r\n    UPDATE clients\r\n    SET daily_id = v_client.daily_id + 1\r\n    WHERE uuid = v_client.uuid;\r\n  END LOOP;\r\n\r\n  -- Update sequence tracker\r\n  INSERT INTO daily_id_sequences (lab_id, date, category, last_id)\r\n  VALUES (p_lab_id, p_date, v_check_category, p_target_id)\r\n  ON CONFLICT (lab_id, date, category)\r\n  DO UPDATE SET\r\n    last_id = GREATEST(daily_id_sequences.last_id, (\r\n      SELECT COALESCE(MAX(daily_id), 0)\r\n      FROM clients\r\n      WHERE lab_id = p_lab_id\r\n        AND daily_date = p_date\r\n        AND primary_category = v_check_category\r\n    )),\r\n    updated_at = NOW();\r\nEND;\r\n",
    "is_security_definer": false
  },
  {
    "schema": "public",
    "name": "update_client_group",
    "result_type": "void",
    "argument_types": "p_client_group_id uuid, p_patient_name text, p_notes text, p_categories text[], p_daily_date date, p_manual_id integer, p_selected_tests text[] DEFAULT NULL::text[]",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nDECLARE\r\n  v_existing_categories TEXT[];\r\n  v_category TEXT;\r\n  v_daily_id INT;\r\n  v_lab_id UUID;\r\n  v_primary_category TEXT;\r\nBEGIN\r\n  -- Get existing info\r\n  SELECT\r\n    c.lab_id,\r\n    c.primary_category,\r\n    c.daily_id\r\n  INTO v_lab_id, v_primary_category, v_daily_id\r\n  FROM clients c\r\n  WHERE c.client_group_id = p_client_group_id\r\n  LIMIT 1;\r\n\r\n  -- Determine daily_id\r\n  IF p_manual_id IS NOT NULL THEN\r\n    v_daily_id := p_manual_id;\r\n  END IF;\r\n\r\n  -- Update existing records that match new categories\r\n  UPDATE clients c\r\n  SET\r\n    patient_name = p_patient_name,\r\n    notes = p_notes,\r\n    categories = p_categories,\r\n    daily_date = p_daily_date,\r\n    daily_id = v_daily_id,\r\n    selected_tests = COALESCE(p_selected_tests, c.selected_tests)\r\n  WHERE c.client_group_id = p_client_group_id\r\n    AND c.primary_category = ANY(p_categories);\r\n\r\n  -- Delete records for removed categories\r\n  DELETE FROM clients c\r\n  WHERE c.client_group_id = p_client_group_id\r\n    AND c.primary_category != ALL(p_categories);\r\n\r\n  -- Insert records for new categories\r\n  FOREACH v_category IN ARRAY p_categories\r\n  LOOP\r\n    IF NOT EXISTS (\r\n      SELECT 1 FROM clients c\r\n      WHERE c.client_group_id = p_client_group_id\r\n        AND c.primary_category = v_category\r\n    ) THEN\r\n      INSERT INTO clients (\r\n        lab_id,\r\n        patient_name,\r\n        notes,\r\n        categories,\r\n        primary_category,\r\n        daily_date,\r\n        daily_id,\r\n        client_group_id,\r\n        results,\r\n        selected_tests\r\n      )\r\n      VALUES (\r\n        v_lab_id,\r\n        p_patient_name,\r\n        p_notes,\r\n        p_categories,\r\n        v_category,\r\n        p_daily_date,\r\n        v_daily_id,\r\n        p_client_group_id,\r\n        '{}'::jsonb,\r\n        p_selected_tests\r\n      );\r\n    END IF;\r\n  END LOOP;\r\nEND;\r\n",
    "is_security_definer": true
  },
  {
    "schema": "public",
    "name": "update_updated_at_column",
    "result_type": "trigger",
    "argument_types": "",
    "type": "function",
    "language": "plpgsql",
    "source_code": "\r\nBEGIN\r\n  NEW.updated_at = NOW();\r\n  RETURN NEW;\r\nEND;\r\n",
    "is_security_definer": false
  }
]

## Triggers
[
  {
    "trigger_schema": "public",
    "trigger_name": "trigger_check_duplicate_category",
    "event_manipulation": "INSERT",
    "event_object_table": "categories",
    "action_statement": "EXECUTE FUNCTION check_duplicate_category()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "trigger_assign_daily_id",
    "event_manipulation": "INSERT",
    "event_object_table": "clients",
    "action_statement": "EXECUTE FUNCTION assign_daily_id()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "trigger_resequence_after_category_change",
    "event_manipulation": "UPDATE",
    "event_object_table": "clients",
    "action_statement": "EXECUTE FUNCTION resequence_after_category_change()",
    "action_timing": "AFTER"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "trigger_resequence_after_delete",
    "event_manipulation": "DELETE",
    "event_object_table": "clients",
    "action_statement": "EXECUTE FUNCTION resequence_after_delete()",
    "action_timing": "AFTER"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "trigger_resequence_category_change",
    "event_manipulation": "UPDATE",
    "event_object_table": "clients",
    "action_statement": "EXECUTE FUNCTION resequence_category_change()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "update_lab_tests_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "lab_tests",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  },
  {
    "trigger_schema": "public",
    "trigger_name": "update_test_groups_updated_at",
    "event_manipulation": "UPDATE",
    "event_object_table": "test_groups",
    "action_statement": "EXECUTE FUNCTION update_updated_at_column()",
    "action_timing": "BEFORE"
  }
]

## Indexes
[
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "indexname": "audit_log_pkey",
    "indexdef": "CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "indexname": "idx_audit_log_created",
    "indexdef": "CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "audit_log",
    "indexname": "idx_audit_log_record",
    "indexdef": "CREATE INDEX idx_audit_log_record ON public.audit_log USING btree (record_id)"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "indexname": "categories_lab_id_name_key",
    "indexdef": "CREATE UNIQUE INDEX categories_lab_id_name_key ON public.categories USING btree (lab_id, name)"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "indexname": "categories_pkey",
    "indexdef": "CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id)"
  },
  {
    "schemaname": "public",
    "tablename": "categories",
    "indexname": "idx_categories_lab_id",
    "indexdef": "CREATE INDEX idx_categories_lab_id ON public.categories USING btree (lab_id)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "clients_lab_id_date_category_daily_id_key",
    "indexdef": "CREATE UNIQUE INDEX clients_lab_id_date_category_daily_id_key ON public.clients USING btree (lab_id, daily_date, primary_category, daily_id)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "clients_pkey",
    "indexdef": "CREATE UNIQUE INDEX clients_pkey ON public.clients USING btree (uuid)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "idx_clients_category",
    "indexdef": "CREATE INDEX idx_clients_category ON public.clients USING btree (category)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "idx_clients_client_group_id",
    "indexdef": "CREATE INDEX idx_clients_client_group_id ON public.clients USING btree (client_group_id)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "idx_clients_date",
    "indexdef": "CREATE INDEX idx_clients_date ON public.clients USING btree (daily_date DESC)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "idx_clients_lab_id",
    "indexdef": "CREATE INDEX idx_clients_lab_id ON public.clients USING btree (lab_id)"
  },
  {
    "schemaname": "public",
    "tablename": "clients",
    "indexname": "idx_clients_name",
    "indexdef": "CREATE INDEX idx_clients_name ON public.clients USING btree (patient_name)"
  },
  {
    "schemaname": "public",
    "tablename": "daily_id_sequences",
    "indexname": "daily_id_sequences_lab_id_date_category_key",
    "indexdef": "CREATE UNIQUE INDEX daily_id_sequences_lab_id_date_category_key ON public.daily_id_sequences USING btree (lab_id, date, category)"
  },
  {
    "schemaname": "public",
    "tablename": "daily_id_sequences",
    "indexname": "daily_id_sequences_pkey",
    "indexdef": "CREATE UNIQUE INDEX daily_id_sequences_pkey ON public.daily_id_sequences USING btree (uuid)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "indexname": "idx_lab_tests_active",
    "indexdef": "CREATE INDEX idx_lab_tests_active ON public.lab_tests USING btree (is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "indexname": "idx_lab_tests_category",
    "indexdef": "CREATE INDEX idx_lab_tests_category ON public.lab_tests USING btree (category)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "indexname": "lab_tests_pkey",
    "indexdef": "CREATE UNIQUE INDEX lab_tests_pkey ON public.lab_tests USING btree (uuid)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_tests",
    "indexname": "lab_tests_test_code_key",
    "indexdef": "CREATE UNIQUE INDEX lab_tests_test_code_key ON public.lab_tests USING btree (test_code)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_users",
    "indexname": "lab_users_lab_id_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX lab_users_lab_id_user_id_key ON public.lab_users USING btree (lab_id, user_id)"
  },
  {
    "schemaname": "public",
    "tablename": "lab_users",
    "indexname": "lab_users_pkey",
    "indexdef": "CREATE UNIQUE INDEX lab_users_pkey ON public.lab_users USING btree (uuid)"
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "indexname": "labs_pkey",
    "indexdef": "CREATE UNIQUE INDEX labs_pkey ON public.labs USING btree (uuid)"
  },
  {
    "schemaname": "public",
    "tablename": "labs",
    "indexname": "labs_slug_key",
    "indexdef": "CREATE UNIQUE INDEX labs_slug_key ON public.labs USING btree (slug)"
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "indexname": "idx_test_groups_active",
    "indexdef": "CREATE INDEX idx_test_groups_active ON public.test_groups USING btree (is_active)"
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "indexname": "test_groups_group_code_key",
    "indexdef": "CREATE UNIQUE INDEX test_groups_group_code_key ON public.test_groups USING btree (group_code)"
  },
  {
    "schemaname": "public",
    "tablename": "test_groups",
    "indexname": "test_groups_pkey",
    "indexdef": "CREATE UNIQUE INDEX test_groups_pkey ON public.test_groups USING btree (uuid)"
  }
]

## Constraints
[
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17510_1_not_null",
    "table_name": "audit_log",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17510_2_not_null",
    "table_name": "audit_log",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17510_3_not_null",
    "table_name": "audit_log",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17510_4_not_null",
    "table_name": "audit_log",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "audit_log_action_check",
    "table_name": "audit_log",
    "constraint_type": "CHECK",
    "definition": "CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "audit_log_lab_id_fkey",
    "table_name": "audit_log",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (lab_id) REFERENCES labs(uuid)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "audit_log_user_id_fkey",
    "table_name": "audit_log",
    "constraint_type": "FOREIGN KEY",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17547_1_not_null",
    "table_name": "categories",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17547_2_not_null",
    "table_name": "categories",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17547_6_not_null",
    "table_name": "categories",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "categories_lab_id_fkey",
    "table_name": "categories",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (lab_id) REFERENCES labs(uuid)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "categories_lab_id_name_key",
    "table_name": "categories",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (name)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "categories_lab_id_name_key",
    "table_name": "categories",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "categories_lab_id_name_key",
    "table_name": "categories",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "categories_lab_id_name_key",
    "table_name": "categories",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (name)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17484_11_not_null",
    "table_name": "clients",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17484_1_not_null",
    "table_name": "clients",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17484_2_not_null",
    "table_name": "clients",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_17484_4_not_null",
    "table_name": "clients",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_created_by_fkey",
    "table_name": "clients",
    "constraint_type": "FOREIGN KEY",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_fkey",
    "table_name": "clients",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (lab_id) REFERENCES labs(uuid)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_updated_by_fkey",
    "table_name": "clients",
    "constraint_type": "FOREIGN KEY",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (primary_category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (primary_category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (primary_category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (primary_category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "clients_lab_id_date_category_daily_id_key",
    "table_name": "clients",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (daily_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_57728_1_not_null",
    "table_name": "daily_id_sequences",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_57728_2_not_null",
    "table_name": "daily_id_sequences",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_57728_3_not_null",
    "table_name": "daily_id_sequences",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_57728_4_not_null",
    "table_name": "daily_id_sequences",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_fkey",
    "table_name": "daily_id_sequences",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (lab_id) REFERENCES labs(uuid)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (category)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "daily_id_sequences_lab_id_date_category_key",
    "table_name": "daily_id_sequences",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (date)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61190_1_not_null",
    "table_name": "lab_tests",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61190_2_not_null",
    "table_name": "lab_tests",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61190_3_not_null",
    "table_name": "lab_tests",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61190_4_not_null",
    "table_name": "lab_tests",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61190_5_not_null",
    "table_name": "lab_tests",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_tests_test_code_key",
    "table_name": "lab_tests",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (test_code)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_55295_1_not_null",
    "table_name": "lab_users",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_55295_4_not_null",
    "table_name": "lab_users",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_role_check",
    "table_name": "lab_users",
    "constraint_type": "CHECK",
    "definition": "CHECK ((role = ANY (ARRAY['manager'::text, 'lab_admin'::text, 'lab_staff'::text, 'lab_viewer'::text])))"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_status_check",
    "table_name": "lab_users",
    "constraint_type": "CHECK",
    "definition": "CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_created_by_fkey",
    "table_name": "lab_users",
    "constraint_type": "FOREIGN KEY",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_lab_id_fkey",
    "table_name": "lab_users",
    "constraint_type": "FOREIGN KEY",
    "definition": "FOREIGN KEY (lab_id) REFERENCES labs(uuid)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_user_id_fkey",
    "table_name": "lab_users",
    "constraint_type": "FOREIGN KEY",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_lab_id_user_id_key",
    "table_name": "lab_users",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (user_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_lab_id_user_id_key",
    "table_name": "lab_users",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (user_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_lab_id_user_id_key",
    "table_name": "lab_users",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "lab_users_lab_id_user_id_key",
    "table_name": "lab_users",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (lab_id)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_55280_1_not_null",
    "table_name": "labs",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_55280_2_not_null",
    "table_name": "labs",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_55280_3_not_null",
    "table_name": "labs",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "labs_status_check",
    "table_name": "labs",
    "constraint_type": "CHECK",
    "definition": "CHECK ((status = ANY (ARRAY['active'::text, 'suspended'::text, 'inactive'::text])))"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "labs_slug_key",
    "table_name": "labs",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (slug)"
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61207_1_not_null",
    "table_name": "test_groups",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61207_2_not_null",
    "table_name": "test_groups",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61207_3_not_null",
    "table_name": "test_groups",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61207_4_not_null",
    "table_name": "test_groups",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "2200_61207_5_not_null",
    "table_name": "test_groups",
    "constraint_type": "CHECK",
    "definition": null
  },
  {
    "constraint_schema": "public",
    "constraint_name": "test_groups_group_code_key",
    "table_name": "test_groups",
    "constraint_type": "UNIQUE",
    "definition": "UNIQUE (group_code)"
  }
]
