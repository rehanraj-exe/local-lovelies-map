import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort(); // Sort sequentially by timestamp

let combinedSql = '';

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  combinedSql += `-- ==========================================\n`;
  combinedSql += `-- MIGRATION: ${file}\n`;
  combinedSql += `-- ==========================================\n\n`;
  combinedSql += content;
  combinedSql += `\n\n`;
}

const outputPath = path.resolve(process.cwd(), 'scratch/combined_migrations.sql');
fs.writeFileSync(outputPath, combinedSql, 'utf8');
console.log("Combined SQL migration successfully written to:", outputPath);
