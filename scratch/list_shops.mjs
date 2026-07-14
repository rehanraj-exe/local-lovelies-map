import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    let val = values.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envVars[key.trim()] = val;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

async function main() {
  let url = `${supabaseUrl}/rest/v1/shops?select=id,name,owner_id`;
  let response = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  const data = await response.json();
  const ownedShops = data.filter(s => s.owner_id);
  console.log("=== OWNED SHOPS ===");
  ownedShops.forEach(shop => {
    console.log(`ID: ${shop.id} | Name: ${shop.name} | Owner: ${shop.owner_id}`);
  });
}
main();
