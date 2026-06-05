import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'aws-1-eu-north-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.zibfhrlcwftxewwsmekj',
  password: '123ewqAa@Supa',
  // Supabase's connection pooler presents a self-signed cert in its chain.
  // rejectUnauthorized: false is required here and is the documented Supabase workaround.
  // This script only runs locally against our own Supabase project — not a MITM risk.
  ssl: { rejectUnauthorized: false },
});

const categories = [
  { value: 'Hematology',       label_ar: 'أمراض الدم',         label_en: 'Hematology',       display_order: 1  },
  { value: 'Diabetes',         label_ar: 'السكري',              label_en: 'Diabetes',         display_order: 2  },
  { value: 'Lipid Profile',    label_ar: 'الدهون',              label_en: 'Lipid Profile',    display_order: 3  },
  { value: 'Liver Function',   label_ar: 'وظائف الكبد',         label_en: 'Liver Function',   display_order: 4  },
  { value: 'Kidney Function',  label_ar: 'وظائف الكلى',         label_en: 'Kidney Function',  display_order: 5  },
  { value: 'Thyroid Function', label_ar: 'الغدة الدرقية',       label_en: 'Thyroid Function', display_order: 6  },
  { value: 'Electrolytes',     label_ar: 'الأملاح والمعادن',    label_en: 'Electrolytes',     display_order: 7  },
  { value: 'Immunology',       label_ar: 'المناعة',             label_en: 'Immunology',       display_order: 8  },
  { value: 'Hormones',         label_ar: 'الهرمونات',           label_en: 'Hormones',         display_order: 9  },
  { value: 'Vitamins',         label_ar: 'الفيتامينات',         label_en: 'Vitamins',         display_order: 10 },
  { value: 'Tumor Markers',    label_ar: 'دلالات الأورام',      label_en: 'Tumor Markers',    display_order: 11 },
  { value: 'Serology',         label_ar: 'الأمصال',             label_en: 'Serology',         display_order: 12 },
  { value: 'Urine Analysis',   label_ar: 'تحليل البول',         label_en: 'Urine Analysis',   display_order: 13 },
  { value: 'Stool Analysis',   label_ar: 'تحليل البراز',        label_en: 'Stool Analysis',   display_order: 14 },
  { value: 'Other',            label_ar: 'أخرى',               label_en: 'Other',            display_order: 15 },
];

async function main() {
  await client.connect();
  console.log('Connected to database.');

  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS lab_test_categories (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      value TEXT UNIQUE NOT NULL,
      label_ar TEXT NOT NULL,
      label_en TEXT NOT NULL,
      display_order INT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('Table lab_test_categories ensured.');

  // Upsert all categories
  for (const cat of categories) {
    await client.query(
      `INSERT INTO lab_test_categories (value, label_ar, label_en, display_order, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (value) DO UPDATE SET
         label_ar = EXCLUDED.label_ar,
         label_en = EXCLUDED.label_en,
         display_order = EXCLUDED.display_order,
         updated_at = NOW()`,
      [cat.value, cat.label_ar, cat.label_en, cat.display_order]
    );
  }

  console.log('Seeded 15 categories ✓');
  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
