import { createClient } from '@supabase/supabase-js';
import Fuse from 'fuse.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: shops } = await supabase.from('shops').select('*').eq('verified', true);
  const { data: products } = await supabase.from('products').select('*');

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

  const matchedShopIds = new Set(filteredShops.map(s => s.id));
  const resultIds = new Set();
  const combined = [];

  for (const product of validProducts) {
    if (matchedShopIds.has(product.shop_id) && !resultIds.has(product.id)) {
      resultIds.add(product.id);
      combined.push(product);
    }
  }

  const prodFuseResults = productFuse.search(searchQuery);
  for (const result of prodFuseResults) {
    if (!resultIds.has(result.item.id)) {
      if (result.score < 0.2) {
        resultIds.add(result.item.id);
        combined.push(result.item);
      }
    }
  }

  console.log('--- Shops Matched for "food":', filteredShops.map(s => ({name: s.name, category: s.category})));
  console.log('--- Products Returned:', combined.map(p => p.name));
}

run();
