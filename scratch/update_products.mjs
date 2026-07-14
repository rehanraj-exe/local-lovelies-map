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
const TARGET_SHOP_ID = '80f33d7d-b353-4dc9-98a2-2fbab820bdf4'; // Meoww shop

async function main() {
  console.log("Moving all products to shop ID:", TARGET_SHOP_ID);
  
  // 1. Update the shop name to "Meoww Bakery" to make it stand out
  let shopUpdateUrl = `${supabaseUrl}/rest/v1/shops?id=eq.${TARGET_SHOP_ID}`;
  let shopResponse = await fetch(shopUpdateUrl, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ name: 'Meoww Bakery' })
  });
  console.log("Shop update status:", shopResponse.status);

  // 2. Update all products to belong to this shop
  let productsUpdateUrl = `${supabaseUrl}/rest/v1/products?shop_id=neq.${TARGET_SHOP_ID}`;
  let productsResponse = await fetch(productsUpdateUrl, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ shop_id: TARGET_SHOP_ID, in_stock: true })
  });
  
  console.log("Products update status:", productsResponse.status);
  
  // Check the text if error
  if (!productsResponse.ok) {
    console.error(await productsResponse.text());
  } else {
    console.log("Successfully moved all products!");
  }
}

main();
