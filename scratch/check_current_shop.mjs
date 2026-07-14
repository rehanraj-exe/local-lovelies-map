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
  const shopId = "2d2cb3f4-31f3-4314-8b3d-45d24bcac1cf";
  
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}&select=name`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  let shop = await shopRes.json();
  console.log("Shop:", shop);

  const productsRes = await fetch(`${supabaseUrl}/rest/v1/products?shop_id=eq.${shopId}&select=name`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  let products = await productsRes.json();
  console.log("Products count:", products.length);
  console.log("Products:", products);
}

main();
