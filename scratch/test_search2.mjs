import { createClient } from '@supabase/supabase-js';
import Fuse from 'fuse.js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const lines = env.split('\n');
const envVars = {};
for (const line of lines) {
  if (line.includes('=')) {
    const [key, val] = line.split('=');
    envVars[key.trim()] = val.trim().replace(/"/g, '');
  }
}

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: shops } = await supabase.from('shops').select('*').eq('verified', true);
  const { data: products } = await supabase.from('products').select('*');

  console.log(`Loaded ${shops.length} shops and ${products.length} products`);

  const shopFuse = new Fuse(shops, {
    keys: ['name', 'category', 'subcategory', 'address', 'description'],
    threshold: 0.4,
    includeScore: true,
  });

  const validProducts = products.filter(p => p.in_stock);
  const productFuse = new Fuse(validProducts, {
    keys: ['name', 'description', 'category'],
    threshold: 0.3,
    includeScore: true,
  });

  const searchQuery = 'food';

  const shopFuseResults = shopFuse.search(searchQuery);
  const filteredShops = shopFuseResults.map(r => r.item);

  console.log('--- Shops Matched for "food" (scores) ---');
  for (const r of shopFuseResults) {
    console.log(`[${r.score.toFixed(3)}] ${r.item.name} (${r.item.category}) - ${r.item.description?.slice(0, 30)}`);
  }

  const matchedShopIds = new Set(filteredShops.map(s => s.id));
  const resultIds = new Set();
  const combined = [];

  for (const product of validProducts) {
    if (matchedShopIds.has(product.shop_id) && !resultIds.has(product.id)) {
      resultIds.add(product.id);
      combined.push(product);
    }
  }

  console.log('\n--- Products matching shop matches ---');
  console.log(combined.map(p => p.name).join(', '));

  const prodFuseResults = productFuse.search(searchQuery);
  console.log('\n--- Direct product matches for "food" (scores < 0.2) ---');
  for (const result of prodFuseResults) {
    if (!resultIds.has(result.item.id)) {
      if (result.score < 0.2) {
        resultIds.add(result.item.id);
        combined.push(result.item);
        console.log(`[${result.score.toFixed(3)}] ${result.item.name} (${result.item.category})`);
      }
    }
  }
}

run();
