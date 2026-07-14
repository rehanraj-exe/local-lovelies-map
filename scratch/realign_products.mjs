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
  console.log("Fetching all shops and products...");
  
  const shopsRes = await fetch(`${supabaseUrl}/rest/v1/shops?select=id,name,category`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const shops = await shopsRes.json();

  const productsRes = await fetch(`${supabaseUrl}/rest/v1/products?select=id,name,category,shop_id`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  let products = await productsRes.json();
  
  if (products.error) {
    console.log("Error fetching products:", products);
    return;
  }

  const shopCats = new Set();
  shops.forEach(s => shopCats.add(s.category));
  
  const prodCats = new Set();
  products.forEach(p => prodCats.add(p.category));

  console.log("Shop Categories:", Array.from(shopCats));
  console.log("Product Categories:", Array.from(prodCats));
  
  // We need to map the product category to a shop ID.
  const shopsByCategory = {};
  shops.forEach(shop => {
    const cat = shop.category;
    if (!shopsByCategory[cat]) shopsByCategory[cat] = [];
    shopsByCategory[cat].push(shop.id);
  });
  
  // Custom mapping from product category -> shop category
  const catMapping = {
    'Food': ['Food', 'Bakery', 'Groceries', 'Restaurant', 'Cafe'],
    'Clothing': ['Clothing', 'Fashion', 'Apparel', 'Boutique'],
    'Electronics': ['Electronics', 'Gadgets', 'Tech', 'Mobile', 'Computer'],
    'Groceries': ['Groceries', 'Supermarket', 'Market'],
    'Pet Supplies': ['Pet Supplies', 'Pet Store', 'Pets', 'Veterinary'],
    'Health & Beauty': ['Health & Fitness', 'Beauty', 'Pharmacy', 'Spa', 'Salon'],
    'Home & Garden': ['Home & Decor', 'Furniture', 'Hardware', 'Decor', 'Garden', 'Florist'],
    'Books & Stationery': ['Books & Stationery', 'Bookstore'],
    'Automotive': ['Automotive', 'Auto Services'],
    'Handicrafts': ['Handicrafts', 'Art Gallery'],
    'Jewelry & Accessories': ['Jewelry & Accessories', 'Jeweler'],
    'Sports & Outdoors': ['Sports & Outdoors', 'Fitness', 'Gym']
  };

  const getShopIdsForProdCategory = (prodCat) => {
    if (!prodCat) return [];
    const mapped = catMapping[prodCat];
    if (mapped) {
      for (const m of mapped) {
        if (shopsByCategory[m]) return shopsByCategory[m];
      }
    }
    // direct match
    if (shopsByCategory[prodCat]) return shopsByCategory[prodCat];
    
    // Fallback: search substring
    for (const shopCat of Object.keys(shopsByCategory)) {
      if (shopCat.toLowerCase().includes(prodCat.toLowerCase()) || prodCat.toLowerCase().includes(shopCat.toLowerCase())) {
        return shopsByCategory[shopCat];
      }
    }
    return [];
  };

  let updates = [];
  
  for (const product of products) {
    const availableShops = getShopIdsForProdCategory(product.category);
    let targetShopId = null;
    
    if (availableShops.length > 0) {
      targetShopId = availableShops[Math.floor(Math.random() * availableShops.length)];
    } else {
      targetShopId = shops[Math.floor(Math.random() * shops.length)].id;
    }
    
    if (targetShopId) {
      updates.push({ id: product.id, shop_id: targetShopId });
    }
  }
  
  console.log(`Updating ${updates.length} products...`);
  
  // We can write a SQL query via REST using rpc, but let's just use Promise.all with chunks for speed
  const chunks = [];
  const chunkSize = 50;
  for (let i = 0; i < updates.length; i += chunkSize) {
    chunks.push(updates.slice(i, i + chunkSize));
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    await Promise.all(chunk.map(update => 
      fetch(`${supabaseUrl}/rest/v1/products?id=eq.${update.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ shop_id: update.shop_id })
      })
    ));
    console.log(`Processed chunk ${i+1}/${chunks.length}`);
  }
  
  console.log("Finished realigning all products!");
}

main();
