import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qmbarjeuypknukennyhv.supabase.co';
const supabaseKey = 'sb_publishable_iqaHeZAg7SUKvOjLnfFI4w_pG4bhRyW';
const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  "Baby Products",
  "Bags, Wallets and Luggage",
  "Beauty",
  "Books",
  "Clothing & Accessories",
  "Computers & Accessories",
  "Electronics",
  "Garden & Outdoors",
  "Health & Personal Care",
  "Home & Kitchen",
  "Home Improvement",
  "Jewellery",
  "Kindle Store",
  "Movies & TV Shows",
  "Music",
  "Musical Instruments",
  "Office Products",
  "Pet Supplies",
  "Shoes & Handbags",
  "Sports, Fitness & Outdoors",
  "Toys & Games",
  "Video Games",
  "Watches"
];

// Helper to generate some realistic products for a category
function getProductsForCategory(category) {
  const products = {
    "Baby Products": ["Organic Cotton Onesie", "Smart Baby Monitor", "Ergonomic Baby Carrier"],
    "Bags, Wallets and Luggage": ["Leather Weekend Duffel", "Anti-Theft Backpack", "Minimalist Card Holder Wallet"],
    "Beauty": ["Hydrating Face Serum", "Matte Liquid Lipstick", "Volumizing Mascara"],
    "Books": ["The Midnight Library", "Atomic Habits", "Gourmet Cooking Guide"],
    "Clothing & Accessories": ["Classic Denim Jacket", "Cashmere Winter Scarf", "Polarized Sunglasses"],
    "Computers & Accessories": ["Wireless Mechanical Keyboard", "Ultra-Wide Gaming Monitor", "USB-C Hub"],
    "Electronics": ["Noise-Cancelling Headphones", "4K Action Camera", "Portable Power Bank"],
    "Garden & Outdoors": ["Solar Garden Path Lights", "Heavy Duty Gardening Gloves", "Smart Sprinkler Controller"],
    "Health & Personal Care": ["Electric Toothbrush", "Whey Protein Powder", "Essential Oil Diffuser"],
    "Home & Kitchen": ["Stainless Steel Air Fryer", "Ceramic Non-Stick Pan Set", "French Press Coffee Maker"],
    "Home Improvement": ["Cordless Power Drill", "Smart WiFi Thermostat", "LED Strip Lights"],
    "Jewellery": ["Sterling Silver Pendant Necklace", "Minimalist Gold Hoop Earrings", "Classic Signet Ring"],
    "Kindle Store": ["Kindle Paperwhite", "Leather Kindle Cover", "Screen Protector for Kindle"],
    "Movies & TV Shows": ["The Lord of the Rings 4K Box Set", "Sci-Fi Anthology Series", "Classic Movies Collection"],
    "Music": ["Vintage Vinyl Record Player", "Greatest Hits Collection", "Studio Quality Audio Interface"],
    "Musical Instruments": ["Acoustic Guitar", "Digital Piano", "Condenser Microphone Kit"],
    "Office Products": ["Ergonomic Mesh Office Chair", "Premium Fountain Pen", "Leather Desk Pad"],
    "Pet Supplies": ["Orthopedic Dog Bed", "Interactive Cat Laser Toy", "Automatic Pet Feeder"],
    "Shoes & Handbags": ["Running Shoes", "Classic Leather Tote Bag", "Formal Oxford Shoes"],
    "Sports, Fitness & Outdoors": ["Yoga Mat", "Adjustable Dumbbells Set", "Insulated Water Bottle"],
    "Toys & Games": ["Educational Building Blocks", "Family Board Game Night Set", "Remote Control Drone"],
    "Video Games": ["Next-Gen Gaming Console", "Wireless Gaming Controller", "Epic RPG Adventure Game"],
    "Watches": ["Chronograph Men's Watch", "Smart Fitness Tracker Watch", "Elegant Rose Gold Watch"]
  };

  return products[category] || ["Sample Product 1", "Sample Product 2", "Sample Product 3"];
}

async function seed() {
  console.log("Starting Amazon categories seed...");
  
  for (const category of categories) {
    console.log(`\nProcessing category: ${category}`);
    
    // 1. Create a shop for this category
    const shopName = `${category} Store`;
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .insert([{
        name: shopName,
        category: category,
        latitude: 28.6139 + (Math.random() * 0.1 - 0.05), // Delhi area approx
        longitude: 77.2090 + (Math.random() * 0.1 - 0.05),
        rating: (4 + Math.random()).toFixed(1),
        review_count: Math.floor(Math.random() * 200) + 10,
        verified: true,
        open_now: true,
        phone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
        address: `123 ${category} Street, New Delhi`,
      }])
      .select()
      .single();

    if (shopError) {
      console.error(`Failed to create shop for ${category}:`, shopError.message);
      continue;
    }
    
    const shopId = shopData.id;
    console.log(`Created shop: ${shopName} (${shopId})`);

    // 2. Insert products for this shop
    const productNames = getProductsForCategory(category);
    for (const productName of productNames) {
      const price = Math.floor(Math.random() * 4500) + 499;
      const { error: productError } = await supabase
        .from('products')
        .insert([{
          shop_id: shopId,
          name: productName,
          price: price,
          image_url: 'https://placeholder.com', // Will be overridden by the frontend productImageMap
          in_stock: true,
          featured: true,
          description: `High-quality ${productName} available now.`
        }]);
        
      if (productError) {
        console.error(`  -> Failed to create product ${productName}:`, productError.message);
      } else {
        console.log(`  -> Created product: ${productName}`);
      }
    }
  }
  
  console.log("\nSeeding complete!");
}

seed().catch(console.error);
