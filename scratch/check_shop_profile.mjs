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
  const id = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'; // Royal Curry House
  
  const { data: productsData, error } = await fetch(`${supabaseUrl}/rest/v1/products?shop_id=eq.${id}&in_stock=eq.true&order=created_at.desc`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  }).then(async r => ({ data: await r.json(), error: r.ok ? null : await r.text() }));

  console.log("Error:", error);
  console.log("Products in shop:", productsData?.length);
  if (productsData && productsData.length > 0) {
    console.log("First product:", productsData[0].name);
  }
}

main();
