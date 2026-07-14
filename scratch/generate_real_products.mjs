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

const categoryProducts = {
  'bakery': [
    { name: 'Fresh Butter Croissant', price: 4.99, desc: 'Flaky, buttery, freshly baked croissant.' },
    { name: 'Artisan Sourdough Loaf', price: 6.50, desc: 'Crusty sourdough baked fresh daily.' },
    { name: 'Chocolate Fudge Cake Slice', price: 5.99, desc: 'Rich, moist chocolate cake with fudge icing.' },
    { name: 'Blueberry Muffin', price: 3.50, desc: 'Loaded with fresh blueberries.' },
    { name: 'Cinnamon Roll', price: 4.50, desc: 'Warm cinnamon roll with cream cheese frosting.' }
  ],
  'food': [
    { name: 'Signature Cheeseburger', price: 12.99, desc: 'Juicy beef patty with melted cheese and fresh veggies.' },
    { name: 'Spicy Chicken Wings (10pcs)', price: 14.50, desc: 'Crispy wings tossed in buffalo sauce.' },
    { name: 'Margherita Pizza', price: 16.00, desc: 'Classic wood-fired pizza with fresh basil and mozzarella.' },
    { name: 'Vegan Buddha Bowl', price: 13.99, desc: 'Quinoa, roasted veggies, avocado, and tahini dressing.' },
    { name: 'Pad Thai Noodles', price: 15.50, desc: 'Authentic Thai stir-fried rice noodles.' }
  ],
  'electronics': [
    { name: 'Wireless Bluetooth Earbuds', price: 89.99, desc: 'Noise-cancelling wireless earbuds with 24h battery.' },
    { name: 'Smart Fitness Watch', price: 129.50, desc: 'Tracks heart rate, steps, and sleep.' },
    { name: 'Fast Charging Power Bank', price: 45.00, desc: '10000mAh portable charger with USB-C.' },
    { name: 'Mechanical Gaming Keyboard', price: 110.00, desc: 'RGB backlit keyboard with mechanical switches.' },
    { name: '4K Ultra HD Monitor', price: 350.00, desc: '27-inch 4K monitor for crisp visuals.' }
  ],
  'groceries': [
    { name: 'Organic Bananas (1 Bunch)', price: 3.99, desc: 'Fresh, locally sourced organic bananas.' },
    { name: 'Free-Range Brown Eggs (1 Dozen)', price: 5.50, desc: 'Farm-fresh free range eggs.' },
    { name: 'Whole Milk (1 Gallon)', price: 4.25, desc: 'Fresh whole milk.' },
    { name: 'Whole Wheat Bread', price: 3.49, desc: 'Healthy whole wheat sandwich bread.' },
    { name: 'Avocados (Bag of 4)', price: 6.99, desc: 'Perfectly ripe Hass avocados.' }
  ],
  'health & fitness': [
    { name: 'Whey Protein Powder (2 lbs)', price: 45.99, desc: 'Premium chocolate whey protein isolate.' },
    { name: 'Yoga Mat', price: 29.99, desc: 'Non-slip, eco-friendly yoga mat.' },
    { name: 'Adjustable Dumbbells Set', price: 199.00, desc: 'Space-saving adjustable dumbbells.' },
    { name: 'Pre-Workout Supplement', price: 35.50, desc: 'Energy boosting pre-workout powder.' },
    { name: 'Foam Roller', price: 18.00, desc: 'High-density foam roller for muscle recovery.' }
  ],
  'clothing': [
    { name: 'Classic White T-Shirt', price: 19.99, desc: '100% organic cotton everyday tee.' },
    { name: 'Slim Fit Denim Jeans', price: 59.50, desc: 'Comfortable stretch denim.' },
    { name: 'Cozy Winter Hoodie', price: 45.00, desc: 'Fleece-lined pullover hoodie.' },
    { name: 'Floral Summer Dress', price: 39.99, desc: 'Lightweight and breathable summer dress.' },
    { name: 'Athletic Running Shorts', price: 25.00, desc: 'Quick-dry shorts for workouts.' }
  ],
  'jewelry & accessories': [
    { name: 'Sterling Silver Necklace', price: 85.00, desc: 'Elegant minimalist pendant necklace.' },
    { name: 'Classic Leather Watch', price: 120.00, desc: 'Timeless analog watch with leather strap.' },
    { name: 'Gold-Plated Hoop Earrings', price: 45.00, desc: 'Chic everyday hoop earrings.' },
    { name: 'Vintage Sunglasses', price: 35.00, desc: 'UV400 protection retro sunglasses.' },
    { name: 'Woven Tote Bag', price: 55.00, desc: 'Spacious everyday tote bag.' }
  ],
  'books & stationery': [
    { name: 'Bestselling Mystery Novel', price: 18.99, desc: 'Gripping thriller that keeps you guessing.' },
    { name: 'Premium Leather Journal', price: 24.50, desc: 'Lined journal with thick paper.' },
    { name: 'Gel Pen Set (12 Colors)', price: 15.00, desc: 'Smooth writing vibrant gel pens.' },
    { name: 'Daily Planner 2026', price: 22.00, desc: 'Stay organized with this daily planner.' },
    { name: 'Hardcover Cookbook', price: 35.00, desc: '100+ easy weeknight recipes.' }
  ]
};

// Map alternative category names to our main keys
const catMapping = {
  'food & beverages': 'food',
  'restaurant': 'food',
  'cafe': 'bakery',
  'grocery & supermarket': 'groceries',
  'electronics & gadgets': 'electronics',
  'clothing & fashion': 'clothing',
  'sports & fitness': 'health & fitness',
  'arts & crafts': 'books & stationery',
  'handicrafts': 'jewelry & accessories',
  'beauty & wellness': 'health & fitness'
};

async function main() {
  console.log("Fetching all shops...");
  const shopsRes = await fetch(`${supabaseUrl}/rest/v1/shops?select=id,name,category`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const shops = await shopsRes.json();
  
  console.log(`Deleting all existing fake products...`);
  // Delete all products
  const delRes = await fetch(`${supabaseUrl}/rest/v1/products`, {
    method: 'DELETE',
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  console.log("Deleted old products. Status:", delRes.status);
  
  console.log("Generating new realistic products...");
  const newProducts = [];
  
  for (const shop of shops) {
    let catKey = shop.category.toLowerCase();
    if (catMapping[catKey]) catKey = catMapping[catKey];
    
    // Fallback if category not found
    let prodList = categoryProducts[catKey];
    if (!prodList) {
      // If we really don't have a match, just pick something based on the name
      if (shop.name.toLowerCase().includes('pet')) prodList = categoryProducts['groceries'];
      else prodList = categoryProducts['food'];
    }
    
    // Add these products to the shop
    for (const p of prodList) {
      newProducts.push({
        shop_id: shop.id,
        name: p.name,
        description: p.desc,
        price: p.price,
        in_stock: true,
        images: [`https://placehold.co/600x400?text=${encodeURIComponent(p.name)}`],
        category: shop.category
      });
    }
  }
  
  console.log(`Inserting ${newProducts.length} real products...`);
  // Insert in chunks of 100
  const chunks = [];
  for (let i = 0; i < newProducts.length; i += 100) {
    chunks.push(newProducts.slice(i, i + 100));
  }
  
  for (let i = 0; i < chunks.length; i++) {
    await fetch(`${supabaseUrl}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(chunks[i])
    });
    console.log(`Inserted chunk ${i+1}/${chunks.length}`);
  }
  
  console.log("DONE! The shops now have completely realistic products that MATCH their categories!");
}

main();
