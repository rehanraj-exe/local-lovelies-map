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
  console.log("Deleting SWEET BAKERY...");
  
  // 1. Get the shop ID
  const shopRes = await fetch(`${supabaseUrl}/rest/v1/shops?name=eq.SWEET%20BAKERY&select=id`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const shops = await shopRes.json();
  
  if (shops.length === 0) {
    console.log("SWEET BAKERY not found!");
    return;
  }
  
  const shopId = shops[0].id;
  console.log(`Found SWEET BAKERY ID: ${shopId}. Deleting...`);
  
  // 2. Delete products
  const delProductsRes = await fetch(`${supabaseUrl}/rest/v1/products?shop_id=eq.${shopId}`, {
    method: 'DELETE',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  console.log(`Deleted products for SWEET BAKERY. Status: ${delProductsRes.status}`);
  
  // 3. Delete shop
  const delShopRes = await fetch(`${supabaseUrl}/rest/v1/shops?id=eq.${shopId}`, {
    method: 'DELETE',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  console.log(`Deleted SWEET BAKERY. Status: ${delShopRes.status}`);
}

main();
