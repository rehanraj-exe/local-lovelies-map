import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Old Supabase credentials
const oldUrl = "https://nkpwfarzmvxkjuheyfsx.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcHdmYXJ6bXZ4a2p1aGV5ZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzE3MTQsImV4cCI6MjA3NzU0NzcxNH0.wEwMgv61iDCunPcWtbQimdkp9PQxUF_XNPZAjdwlKpY";

const oldSupabase = createClient(oldUrl, oldKey);

async function migrate() {
  console.log("Fetching original shops from the old database...");
  const { data: shops, error: shopsError } = await oldSupabase
    .from('shops')
    .select('*');

  if (shopsError) {
    console.error("Error fetching old shops:", shopsError);
    process.exit(1);
  }

  console.log(`Successfully fetched ${shops.length} shops!`);

  console.log("Fetching original offers from the old database...");
  const { data: offers, error: offersError } = await oldSupabase
    .from('offers')
    .select('*');

  if (offersError) {
    console.error("Error fetching old offers:", offersError);
    process.exit(1);
  }

  console.log(`Successfully fetched ${offers.length} offers!`);

  // Generate SQL seed script
  let sql = `-- ==========================================\n`;
  sql += `-- ORIGINAL SEED DATA FROM OLD DATABASE\n`;
  sql += `-- ==========================================\n\n`;

  // 1. Create dummy user
  sql += `-- 1. Insert dummy admin user\n`;
  sql += `INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)\n`;
  sql += `VALUES (\n`;
  sql += `  '00000000-0000-0000-0000-000000000000',\n`;
  sql += `  'admin@example.com',\n`;
  sql += `  '$2a$10$x.U50xN75qE.YtZk0a8XjOu7W38j2.R1r.FwS.0.k1k.k1k.k1k1k',\n`;
  sql += `  now(),\n`;
  sql += `  '{"provider":"email","providers":["email"]}',\n`;
  sql += `  '{"full_name":"System Admin"}',\n`;
  sql += `  now(),\n`;
  sql += `  now(),\n`;
  sql += `  'authenticated',\n`;
  sql += `  'authenticated'\n`;
  sql += `) ON CONFLICT (id) DO NOTHING;\n\n`;

  // 2. Insert shops
  sql += `-- 2. Insert ${shops.length} shops\n`;
  if (shops.length > 0) {
    sql += `INSERT INTO public.shops (\n`;
    const shopColumns = Object.keys(shops[0]);
    sql += `  ${shopColumns.join(',\n  ')}\n`;
    sql += `) VALUES \n`;

    const shopRows = shops.map(shop => {
      const values = shopColumns.map(col => {
        const val = shop[col];
        if (col === 'owner_id') {
          // Point owner to the dummy user if we want them owned by one user
          return `'00000000-0000-0000-0000-000000000000'`;
        }
        if (val === null) return 'NULL';
        if (typeof val === 'string') {
          // Escape single quotes
          return `'${val.replace(/'/g, "''")}'`;
        }
        if (typeof val === 'object') {
          if (Array.isArray(val)) {
            const escapedArray = val.map(item => `"${item.replace(/"/g, '\\"')}"`).join(',');
            return `'` + `{${escapedArray}}` + `'`;
          }
          return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        }
        return val;
      });
      return `(\n  ${values.join(',\n  ')}\n)`;
    });

    sql += shopRows.join(',\n') + ';\n\n';
  }

  // 3. Insert offers
  sql += `-- 3. Insert ${offers.length} offers\n`;
  if (offers.length > 0) {
    sql += `INSERT INTO public.offers (\n`;
    const offerColumns = Object.keys(offers[0]);
    sql += `  ${offerColumns.join(',\n  ')}\n`;
    sql += `) VALUES \n`;

    const offerRows = offers.map(offer => {
      const values = offerColumns.map(col => {
        const val = offer[col];
        if (val === null) return 'NULL';
        if (typeof val === 'string') {
          return `'${val.replace(/'/g, "''")}'`;
        }
        if (typeof val === 'object') {
          return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        }
        return val;
      });
      return `(\n  ${values.join(',\n  ')}\n)`;
    });

    sql += offerRows.join(',\n') + ';\n\n';
  }

  const outputPath = path.resolve(process.cwd(), 'scratch/seed_all_original_shops.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`Original seed SQL file written successfully to: ${outputPath}`);
}

migrate();
