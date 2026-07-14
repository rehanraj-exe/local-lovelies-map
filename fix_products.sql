-- Delete all existing order data and products (which are randomly assigned and "fake")
-- TRUNCATE bypasses RLS and CASCADE handles foreign key dependencies automatically
TRUNCATE public.order_items, public.orders, public.cart_items, public.products RESTART IDENTITY CASCADE;

-- ============================================================================
-- STRATEGY: Use ROW_NUMBER() to number shops within each category, then assign
-- different product subsets based on rn%2 (odd/even) and rn%3 (thirds).
-- This ensures shops in the same category have overlapping but DIFFERENT products.
--
-- Legend:
--   ALL shops    = no WHERE filter on rn
--   ODD shops    = rn % 2 = 1
--   EVEN shops   = rn % 2 = 0
--   GROUP A      = rn % 3 = 0
--   GROUP B      = rn % 3 = 1
--   GROUP C      = rn % 3 = 2
-- ============================================================================

-- =====================
-- 1. BAKERY & CAFE
-- =====================

-- Common: ALL bakery/cafe shops get these
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Fresh Butter Croissant', 'Flaky, buttery, freshly baked every morning.', 4.99, true, s.category, 50,
  'https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1555507036-ab1f4038024a?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Artisan Sourdough Loaf', 'Crusty sourdough baked fresh daily with wild yeast.', 6.50, true, s.category, 20,
  'https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s;

-- ODD bakery shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Chocolate Fudge Cake Slice', 'Rich, moist chocolate cake with fudge icing.', 5.99, true, s.category, 30,
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Blueberry Streusel Muffin', 'Fluffy muffin bursting with wild blueberries and a buttery crumble topping.', 3.99, true, s.category, 40,
  'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Double Espresso', 'Bold, rich double shot of freshly ground espresso.', 3.50, true, s.category, 100,
  'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 1;

-- EVEN bakery shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Cinnamon Swirl Roll', 'Warm, gooey cinnamon roll drizzled with cream cheese frosting.', 4.50, true, s.category, 35,
  'https://images.unsplash.com/photo-1609127259862-f040a4f8e8b0?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1609127259862-f040a4f8e8b0?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Red Velvet Cupcake', 'Classic red velvet with tangy cream cheese frosting.', 4.25, true, s.category, 45,
  'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Masala Chai Latte', 'Spiced Indian tea with steamed milk and cardamom.', 4.00, true, s.category, 80,
  'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 2 = 0;

-- Thirds variation for bakeries
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Banana Walnut Bread', 'Moist banana bread loaded with crunchy walnuts.', 5.50, true, s.category, 25,
  'https://images.unsplash.com/photo-1605090930601-82ff58b11c10?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1605090930601-82ff58b11c10?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 3 != 2;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Almond Danish Pastry', 'Flaky puff pastry filled with almond cream and sliced almonds.', 4.75, true, s.category, 30,
  'https://images.unsplash.com/photo-1509365390695-33aee754301f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1509365390695-33aee754301f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 3 != 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Matcha Green Tea Cake', 'Light sponge cake infused with premium Japanese matcha.', 6.99, true, s.category, 15,
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%bakery%', '%cafe%'])) s WHERE s.rn % 3 = 2;

-- =====================
-- 2. FOOD & RESTAURANT
-- =====================

-- Common: ALL food/restaurant shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Signature Cheeseburger', 'Juicy beef patty with melted cheese, lettuce, and secret sauce.', 12.99, true, s.category, 100,
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Margherita Wood-Fired Pizza', 'Classic wood-fired pizza with San Marzano tomatoes and fresh mozzarella.', 16.00, true, s.category, 50,
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s;

-- ODD food shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Vegan Buddha Bowl', 'Quinoa, roasted sweet potato, avocado, and tahini dressing.', 13.99, true, s.category, 40,
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Butter Chicken Curry', 'Creamy, aromatic butter chicken served with fragrant basmati rice.', 14.99, true, s.category, 60,
  'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Crispy Garlic Bread', 'Toasted baguette with garlic butter and herbs.', 5.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 1;

-- EVEN food shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Grilled Atlantic Salmon', 'Pan-seared salmon fillet with lemon dill sauce and seasonal vegetables.', 18.99, true, s.category, 30,
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Pad Thai Noodles', 'Stir-fried rice noodles with shrimp, peanuts, and tamarind sauce.', 13.50, true, s.category, 45,
  'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Caesar Salad', 'Crisp romaine, parmesan, croutons, and house-made Caesar dressing.', 10.99, true, s.category, 55,
  'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 2 = 0;

-- Thirds variation for food
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Crispy Fish and Chips', 'Beer-battered cod with thick-cut chips and tartar sauce.', 15.50, true, s.category, 40,
  'https://images.unsplash.com/photo-1580217593608-61931cefc821?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1580217593608-61931cefc821?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 3 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Truffle Mushroom Risotto', 'Creamy Arborio rice with wild mushrooms and truffle oil.', 17.99, true, s.category, 25,
  'https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 3 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Spicy Chicken Biryani', 'Fragrant basmati rice layered with tender spiced chicken and saffron.', 15.99, true, s.category, 55,
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 3 = 2;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Classic French Fries', 'Crispy golden fries with a choice of dipping sauces.', 4.99, true, s.category, 150,
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%food%', '%restaurant%']) AND category NOT ILIKE '%pet%') s WHERE s.rn % 3 != 1;

-- =====================
-- 3. ELECTRONICS
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Wireless Bluetooth Earbuds', 'Active noise-cancelling wireless earbuds with 24h battery.', 89.99, true, s.category, 200,
  'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Smart Fitness Watch', 'Tracks heart rate, steps, sleep, and SpO2 levels.', 129.50, true, s.category, 150,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s;

-- ODD electronics shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Fast Charging Power Bank', '10000mAh portable charger with USB-C and fast charging.', 45.00, true, s.category, 300,
  'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Mechanical Gaming Keyboard', 'RGB backlit mechanical keyboard with Cherry MX switches.', 149.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'USB-C Multiport Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card, and PD charging.', 59.99, true, s.category, 120,
  'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 1;

-- EVEN electronics shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Noise Cancelling Headphones', 'Over-ear headphones with adaptive ANC and 30h battery.', 199.99, true, s.category, 90,
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, '4K Action Camera', 'Waterproof 4K/60fps action camera with image stabilization.', 249.99, true, s.category, 60,
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Portable Bluetooth Speaker', 'Waterproof 360° speaker with deep bass and 12h playtime.', 79.99, true, s.category, 110,
  'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 2 = 0;

-- Thirds variation for electronics
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Ergonomic Wireless Mouse', 'Vertical ergonomic mouse with adjustable DPI and silent clicks.', 34.99, true, s.category, 180,
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 3 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics.', 39.99, true, s.category, 100,
  'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 3 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Webcam HD 1080p', 'Full HD webcam with auto-focus and built-in mic for video calls.', 49.99, true, s.category, 130,
  'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%electronic%') s WHERE s.rn % 3 = 2;

-- =====================
-- 4. GROCERIES
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Organic Bananas (1 Bunch)', 'Fresh, locally sourced organic bananas.', 3.99, true, s.category, 500,
  'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Free-Range Brown Eggs (1 Dozen)', 'Farm-fresh free-range brown eggs.', 5.50, true, s.category, 200,
  'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s;

-- ODD grocery shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Whole Milk (1 Gallon)', 'Fresh pasteurized whole milk from local farms.', 4.25, true, s.category, 150,
  'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Extra Virgin Olive Oil (500ml)', 'Cold-pressed Italian extra virgin olive oil.', 12.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1474979266404-7eaacdc948b6?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1474979266404-7eaacdc948b6?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Greek Yogurt (500g)', 'Thick, creamy Greek yogurt with live cultures.', 4.99, true, s.category, 120,
  'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 1;

-- EVEN grocery shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Fresh Baby Spinach (200g)', 'Pre-washed organic baby spinach leaves.', 3.49, true, s.category, 180,
  'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Raw Organic Honey (350g)', 'Unfiltered raw honey from wild flower sources.', 8.99, true, s.category, 90,
  'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Unsweetened Almond Milk (1L)', 'Plant-based almond milk, no added sugar.', 4.75, true, s.category, 110,
  'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 2 = 0;

-- Thirds variation for groceries
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Organic White Quinoa (500g)', 'Premium Peruvian quinoa, pre-rinsed and ready to cook.', 7.99, true, s.category, 70,
  'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 3 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Hass Avocados (Pack of 4)', 'Ripe and ready-to-eat Hass avocados.', 6.49, true, s.category, 100,
  'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 3 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Basmati Rice (5kg)', 'Aged premium basmati rice with extra-long grains.', 9.99, true, s.category, 60,
  'https://images.unsplash.com/photo-1536304993881-460e99e6d980?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1536304993881-460e99e6d980?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE '%grocer%') s WHERE s.rn % 3 = 2;

-- =====================
-- 5. HEALTH & FITNESS
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Whey Protein Powder (2 lbs)', 'Premium chocolate whey protein isolate for muscle recovery.', 45.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1593095948071-474c5cc2c9cf?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1593095948071-474c5cc2c9cf?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Yoga Mat', 'Non-slip, eco-friendly yoga mat with alignment lines.', 29.99, true, s.category, 120,
  'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s;

-- ODD health shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Heavy Duty Resistance Bands (Set of 5)', 'Latex resistance bands from light to extra heavy resistance.', 24.99, true, s.category, 150,
  'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Foam Roller (18 inch)', 'High-density foam roller for deep tissue massage and recovery.', 19.99, true, s.category, 90,
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Speed Jump Rope', 'Adjustable steel cable jump rope for cardio and crossfit.', 14.99, true, s.category, 200,
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 1;

-- EVEN health shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Adjustable Dumbbells (Pair)', 'Space-saving adjustable dumbbells from 5-25 lbs each.', 89.99, true, s.category, 40,
  'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Insulated Water Bottle (750ml)', 'Double-wall vacuum insulated stainless steel bottle, keeps cold 24h.', 22.99, true, s.category, 160,
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Fitness Tracker Band', 'Slim fitness band with step counting, heart rate, and sleep tracking.', 39.99, true, s.category, 100,
  'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%health%', '%fitness%', '%sport%', '%wellness%'])) s WHERE s.rn % 2 = 0;

-- =====================
-- 6. CLOTHING
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Classic White T-Shirt', '100% organic cotton everyday crew neck tee.', 19.99, true, s.category, 300,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Slim Fit Denim Jeans', 'Comfortable stretch denim with modern slim fit.', 59.50, true, s.category, 150,
  'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s;

-- ODD clothing shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Summer Floral Sundress', 'Breezy A-line sundress with vibrant floral print.', 44.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Genuine Leather Jacket', 'Classic biker-style leather jacket with quilted lining.', 189.00, true, s.category, 25,
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Linen Button-Down Shirt', 'Breathable pure linen shirt perfect for warm weather.', 49.99, true, s.category, 70,
  'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 1;

-- EVEN clothing shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Pullover Hoodie', 'Cozy fleece-lined pullover hoodie with kangaroo pocket.', 39.99, true, s.category, 120,
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Athletic Running Shorts', 'Lightweight moisture-wicking shorts with built-in liner.', 29.99, true, s.category, 110,
  'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Cashmere Wool Scarf', 'Luxuriously soft cashmere blend scarf in classic plaid.', 64.99, true, s.category, 45,
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 2 = 0;

-- Thirds variation for clothing
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Chino Trousers', 'Tailored slim-fit chinos in versatile khaki.', 49.99, true, s.category, 90,
  'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 3 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Cotton Polo Shirt', 'Classic pique cotton polo with embroidered logo.', 34.99, true, s.category, 100,
  'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 3 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Waterproof Rain Jacket', 'Lightweight packable rain jacket with sealed seams.', 79.99, true, s.category, 60,
  'https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%cloth%', '%fashion%', '%apparel%'])) s WHERE s.rn % 3 = 2;

-- =====================
-- 7. JEWELRY & ACCESSORIES
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Sterling Silver Necklace', 'Elegant minimalist sterling silver pendant necklace.', 85.00, true, s.category, 50,
  'https://images.unsplash.com/photo-1599643478518-a456d4170ee3?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1599643478518-a456d4170ee3?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Classic Leather Watch', 'Timeless analog watch with genuine leather strap and sapphire crystal.', 120.00, true, s.category, 40,
  'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s;

-- ODD jewelry shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Pearl Drop Earrings', 'Freshwater pearl drop earrings with gold-plated hooks.', 65.00, true, s.category, 35,
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Designer Tote Handbag', 'Spacious structured tote bag in premium vegan leather.', 149.00, true, s.category, 30,
  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Handcrafted Wooden Bangle', 'Artisan hand-carved wooden bangle with brass inlay.', 35.00, true, s.category, 60,
  'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 1;

-- EVEN jewelry shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Rose Gold Charm Bracelet', 'Delicate rose gold bracelet with customizable charms.', 95.00, true, s.category, 45,
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Polarized Aviator Sunglasses', 'Classic aviator sunglasses with UV400 polarized lenses.', 79.99, true, s.category, 70,
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Genuine Leather Belt', 'Full-grain leather belt with brushed nickel buckle.', 45.00, true, s.category, 80,
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%jewel%', '%accessor%', '%handicraft%'])) s WHERE s.rn % 2 = 0;

-- =====================
-- 8. BOOKS & STATIONERY
-- =====================

-- Common
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Bestselling Mystery Novel', 'Gripping page-turner thriller that keeps you guessing until the end.', 18.99, true, s.category, 100,
  'https://images.unsplash.com/photo-1612969308146-066d55f37ccb?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1612969308146-066d55f37ccb?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Premium Leather Journal', 'Hand-bound leather journal with thick, acid-free paper.', 24.50, true, s.category, 150,
  'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s;

-- ODD book shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Daily Productivity Planner', '365-day undated planner with goal tracking and habit sections.', 22.99, true, s.category, 90,
  'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Gold Nib Fountain Pen', 'Premium fountain pen with 14K gold nib and converter.', 79.99, true, s.category, 30,
  'https://images.unsplash.com/photo-1583485088034-697b5a624f11?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1583485088034-697b5a624f11?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Watercolor Paint Set (24 Colors)', 'Professional-grade watercolor paints in a portable tin.', 34.99, true, s.category, 60,
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 1;

-- EVEN book shops
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Art Sketchbook (A4)', 'Hardcover sketchbook with 120 pages of heavyweight drawing paper.', 16.99, true, s.category, 110,
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Colored Pencils Set (48 Colors)', 'Artist-grade colored pencils with vibrant pigments and smooth laydown.', 29.99, true, s.category, 80,
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Self-Help Bestseller Collection', 'Curated set of 3 top-rated self-improvement books.', 42.99, true, s.category, 45,
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 2 = 0;

-- Thirds variation for books
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Washi Tape Set (12 Rolls)', 'Decorative Japanese washi tape in assorted patterns.', 12.99, true, s.category, 130,
  'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 3 = 0;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Wooden Desk Organizer', 'Handcrafted wooden desk caddy with pen holder and drawer.', 39.99, true, s.category, 50,
  'https://images.unsplash.com/photo-1520697830682-8982958f8b8a?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1520697830682-8982958f8b8a?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 3 = 1;

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT s.id, 'Calligraphy Starter Kit', 'Complete calligraphy set with nibs, ink, and practice sheets.', 27.99, true, s.category, 55,
  'https://images.unsplash.com/photo-1583524505974-6facd53f4597?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1583524505974-6facd53f4597?auto=format&fit=crop&w=500&q=80']
FROM (SELECT id, category, ROW_NUMBER() OVER (ORDER BY id) as rn FROM public.shops WHERE category ILIKE ANY (ARRAY['%book%', '%stationer%', '%craft%'])) s WHERE s.rn % 3 = 2;

-- =====================
-- 9. FALLBACK
-- =====================
-- Assign generic products to any shop that STILL has no products
INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT id, 'Premium Gift Card (₹500)', 'The perfect gift for any occasion. Redeemable at this store.', 500.00, true, category, 999,
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=500&q=80']
FROM public.shops WHERE id NOT IN (SELECT DISTINCT shop_id FROM public.products);

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT id, 'Reusable Eco-Tote Bag', 'Sturdy, environmentally friendly cotton tote bag with printed logo.', 5.99, true, category, 500,
  'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=500&q=80']
FROM public.shops WHERE id NOT IN (SELECT DISTINCT shop_id FROM public.products);

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT id, 'Custom Printed Mug', 'Ceramic mug with store branding, dishwasher and microwave safe.', 12.99, true, category, 200,
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=500&q=80']
FROM public.shops WHERE id NOT IN (SELECT DISTINCT shop_id FROM public.products);

INSERT INTO public.products (shop_id, name, description, price, in_stock, category, stock_quantity, image_url, images)
SELECT id, 'Stainless Steel Water Bottle', 'BPA-free insulated bottle that keeps drinks cold for 24 hours.', 19.99, true, category, 300,
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80',
  ARRAY['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=500&q=80']
FROM public.shops WHERE id NOT IN (SELECT DISTINCT shop_id FROM public.products);
