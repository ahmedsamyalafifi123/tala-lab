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
        AND table_name IN ('audit_log', 'categories', 'clients', 'daily_id_sequences', 'lab_users', 'labs')
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

    // Format output
    const output = `${JSON.stringify(schemaResult.rows, null, 2)}\n\n=========== RLS ============\n\n${JSON.stringify(rlsResult.rows, null, 2)}\n`;

    // Save to file
    const outputPath = join(process.cwd(), 'schema_rls.md');
    writeFileSync(outputPath, output, 'utf-8');
    
    console.log('💾 Schema and RLS policies exported successfully!');
    console.log(`📁 Saved to: ${outputPath}\n`);

    // Display summary
    const tables = [...new Set(schemaResult.rows.map(r => r.table_name))];
    console.log('📋 Summary:');
    console.log(`   Tables: ${tables.join(', ')}`);
    console.log(`   Total Columns: ${schemaResult.rows.length}`);
    console.log(`   Total RLS Policies: ${rlsResult.rows.length}`);

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
