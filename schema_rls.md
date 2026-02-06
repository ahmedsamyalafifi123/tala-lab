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
}
]

=========== RLS ============

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
}
]
