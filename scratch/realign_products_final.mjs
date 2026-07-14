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
  
  // Group shops by category
  const shopsByCategory = {};
  shops.forEach(shop => {
    const cat = shop.category.toLowerCase();
    if (!shopsByCategory[cat]) shopsByCategory[cat] = [];
    shopsByCategory[cat].push(shop.id);
  });
  
  // Product derivations
  const deriveCategory = (name) => {
    const n = name.toLowerCase();
    // Food / Groceries / Bakery / Cafe
    if (n.includes('apple') || n.includes('avocado') || n.includes('spinach') || n.includes('quinoa') || n.includes('honey') || n.includes('yogurt') || n.includes('oil') || n.includes('egg') || n.includes('milk')) return ['groceries', 'grocery & supermarket'];
    if (n.includes('bread') || n.includes('cake') || n.includes('pastry') || n.includes('croissant') || n.includes('cookie')) return ['bakery'];
    if (n.includes('coffee') || n.includes('tea') || n.includes('latte') || n.includes('espresso')) return ['cafe'];
    if (n.includes('chicken') || n.includes('pizza') || n.includes('tacos') || n.includes('risotto') || n.includes('salmon') || n.includes('burger') || n.includes('noodles') || n.includes('curry') || n.includes('ribs') || n.includes('bowl')) return ['food', 'food & beverages', 'restaurant'];
    
    // Pets
    if (n.includes('dog') || n.includes('cat') || n.includes('pet') || n.includes('aquarium') || n.includes('bird')) return ['pet supplies'];
    
    // Tech
    if (n.includes('phone') || n.includes('laptop') || n.includes('camera') || n.includes('speaker') || n.includes('keyboard') || n.includes('tablet') || n.includes('mouse') || n.includes('power bank') || n.includes('console') || n.includes('monitor') || n.includes('headphones') || n.includes('smartwatch')) return ['electronics', 'electronics & gadgets'];
    
    // Clothing
    if (n.includes('shirt') || n.includes('dress') || n.includes('jacket') || n.includes('turtleneck') || n.includes('pants') || n.includes('tee') || n.includes('scarf') || n.includes('coat') || n.includes('shorts')) return ['clothing', 'clothing & fashion', 'apparel', 'boutique'];
    
    // Home & Decor
    if (n.includes('vase') || n.includes('basket') || n.includes('bowl') || n.includes('hanging') || n.includes('sculpture') || n.includes('box')) return ['home & decor', 'handicrafts', 'arts & crafts'];
    
    // Health & Beauty
    if (n.includes('cream') || n.includes('serum') || n.includes('lotion') || n.includes('shampoo') || n.includes('soap')) return ['beauty & wellness', 'health & fitness'];
    
    // Books & Stationery
    if (n.includes('book') || n.includes('pen') || n.includes('notebook') || n.includes('journal')) return ['books & stationery'];
    
    // Sports
    if (n.includes('bike') || n.includes('yoga') || n.includes('dumbbell') || n.includes('tennis')) return ['sports & fitness', 'sports & outdoors'];
    
    // Accessories
    if (n.includes('necklace') || n.includes('ring') || n.includes('bracelet') || n.includes('earring')) return ['jewelry & accessories'];

    return null; // fallback
  };

  let updates = [];
  
  for (const product of products) {
    const matchingCategories = deriveCategory(product.name);
    let targetShopId = null;
    
    if (matchingCategories) {
      for (const cat of matchingCategories) {
        if (shopsByCategory[cat]) {
          const availableShops = shopsByCategory[cat];
          targetShopId = availableShops[Math.floor(Math.random() * availableShops.length)];
          break;
        }
      }
    }
    
    // If we STILL couldn't find a category match, assign randomly to avoid having "null" shop_id
    if (!targetShopId) {
      targetShopId = shops[Math.floor(Math.random() * shops.length)].id;
    }
    
    if (targetShopId) {
      updates.push({ id: product.id, shop_id: targetShopId });
    }
  }
  
  console.log(`Updating ${updates.length} products...`);
  
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
