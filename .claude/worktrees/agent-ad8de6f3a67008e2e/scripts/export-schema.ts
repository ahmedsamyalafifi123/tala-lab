import { Client } from 'pg';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface ColumnInfo {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface RLSPolicy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string;
  cmd: string;
  qual: string | null;
  with_check: string | null;
}

interface FunctionInfo {
  schema: string;
  name: string;
  result_type: string;
  argument_types: string;
  type: string;
  language: string;
  source_code: string;
  is_security_definer: boolean;
}

interface TriggerInfo {
  trigger_schema: string;
  trigger_name: string;
  event_manipulation: string;
  event_object_table: string;
  action_statement: string;
  action_timing: string;
}

interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface ConstraintInfo {
  constraint_schema: string;
  constraint_name: string;
  table_name: string;
  constraint_type: string;
  definition: string;
}

async function exportSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Query 1: Get table schemas
    console.log('📊 Fetching table schemas...');
    const schemaQuery = `
      SELECT 
        table_schema,
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const schemaResult = await client.query<ColumnInfo>(schemaQuery);
    console.log(`✅ Found ${schemaResult.rows.length} columns across tables\n`);

    // Query 2: Get RLS policies
    console.log('🔒 Fetching RLS policies...');
    const rlsQuery = `
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles::text,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    const rlsResult = await client.query<RLSPolicy>(rlsQuery);
    console.log(`✅ Found ${rlsResult.rows.length} RLS policies\n`);

    // Query 3: Get functions
    console.log('⚙️  Fetching functions...');
    const functionsQuery = `
      SELECT 
        n.nspname as schema,
        p.proname as name,
        pg_catalog.pg_get_function_result(p.oid) as result_type,
        pg_catalog.pg_get_function_arguments(p.oid) as argument_types,
        CASE p.prokind
          WHEN 'f' THEN 'function'
          WHEN 'p' THEN 'procedure'
          WHEN 'a' THEN 'aggregate'
          WHEN 'w' THEN 'window'
        END as type,
        l.lanname as language,
        p.prosrc as source_code,
        p.prosecdef as is_security_definer
      FROM pg_catalog.pg_proc p
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      LEFT JOIN pg_catalog.pg_language l ON l.oid = p.prolang
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `;
    
    const functionsResult = await client.query<FunctionInfo>(functionsQuery);
    console.log(`✅ Found ${functionsResult.rows.length} functions\n`);

    // Query 4: Get triggers
    console.log('🎯 Fetching triggers...');
    const triggersQuery = `
      SELECT 
        trigger_schema,
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `;
    
    const triggersResult = await client.query<TriggerInfo>(triggersQuery);
    console.log(`✅ Found ${triggersResult.rows.length} triggers\n`);

    // Query 5: Get indexes
    console.log('📇 Fetching indexes...');
    const indexesQuery = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    const indexesResult = await client.query<IndexInfo>(indexesQuery);
    console.log(`✅ Found ${indexesResult.rows.length} indexes\n`);

    // Query 6: Get constraints (foreign keys, unique, check)
    console.log('🔗 Fetching constraints...');
    const constraintsQuery = `
      SELECT 
        tc.constraint_schema,
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        CASE 
          WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            'FOREIGN KEY (' || kcu.column_name || ') REFERENCES ' || 
            ccu.table_name || '(' || ccu.column_name || ')'
          WHEN tc.constraint_type = 'UNIQUE' THEN
            'UNIQUE (' || kcu.column_name || ')'
          WHEN tc.constraint_type = 'CHECK' THEN
            pg_get_constraintdef(pgc.oid)
          ELSE tc.constraint_type
        END as definition
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      LEFT JOIN pg_constraint pgc
        ON pgc.conname = tc.constraint_name
      WHERE tc.constraint_schema = 'public'
        AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'CHECK')
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
    `;
    
    const constraintsResult = await client.query<ConstraintInfo>(constraintsQuery);
    console.log(`✅ Found ${constraintsResult.rows.length} constraints\n`);

    // Format output with all sections
    const output = `# Database Schema Export
Generated: ${new Date().toISOString()}

## Table Schemas
${JSON.stringify(schemaResult.rows, null, 2)}

## RLS Policies
${JSON.stringify(rlsResult.rows, null, 2)}

## Functions
${JSON.stringify(functionsResult.rows, null, 2)}

## Triggers
${JSON.stringify(triggersResult.rows, null, 2)}

## Indexes
${JSON.stringify(indexesResult.rows, null, 2)}

## Constraints
${JSON.stringify(constraintsResult.rows, null, 2)}
`;

    // Save to file
    const outputPath = join(process.cwd(), 'schema_rls.md');
    writeFileSync(outputPath, output, 'utf-8');
    
    console.log('💾 Complete database schema exported successfully!');
    console.log(`📁 Saved to: ${outputPath}\n`);

    // Display summary
    const tables = [...new Set(schemaResult.rows.map(r => r.table_name))];
    console.log('📋 Summary:');
    console.log(`   Tables: ${tables.join(', ')}`);
    console.log(`   Total Columns: ${schemaResult.rows.length}`);
    console.log(`   Total RLS Policies: ${rlsResult.rows.length}`);
    console.log(`   Total Functions: ${functionsResult.rows.length}`);
    console.log(`   Total Triggers: ${triggersResult.rows.length}`);
    console.log(`   Total Indexes: ${indexesResult.rows.length}`);
    console.log(`   Total Constraints: ${constraintsResult.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the export
exportSchema()
  .then(() => {
    console.log('\n✨ Export completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Export failed:', error.message);
    process.exit(1);
  });
