-- ==========================================
-- SEED DATA: Dummy User and Shops
-- ==========================================

-- 1. Insert a dummy admin user in auth.users to own the shops
-- This will trigger profile creation automatically.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  '$2a$10$x.U50xN75qE.YtZk0a8XjOu7W38j2.R1r.FwS.0.k1k.k1k.k1k1k', -- dummy password hash
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert verified shops owned by the admin user
INSERT INTO public.shops (
  id,
  owner_id,
  name,
  category,
  subcategory,
  description,
  address,
  latitude,
  longitude,
  phone,
  verified,
  featured,
  rating,
  review_count,
  delivery_enabled,
  delivery_radius,
  tags,
  photos,
  hours
) VALUES 
(
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  '00000000-0000-0000-0000-000000000000',
  'Royal Curry House',
  'Food',
  'Restaurant',
  'Authentic North and South Indian curries made with organic hand-ground spices.',
  'MG Road, Bangalore, Karnataka',
  12.9716,
  77.5946,
  '+91 98765 43210',
  true,
  true,
  4.8,
  142,
  true,
  5.0,
  ARRAY['curry', 'indian', 'biryani', 'dinner'],
  ARRAY['https://images.unsplash.com/photo-1585938338392-50a59970d8ee?w=800'],
  '{"monday": "11:00 AM - 11:00 PM", "tuesday": "11:00 AM - 11:00 PM", "wednesday": "11:00 AM - 11:00 PM", "thursday": "11:00 AM - 11:00 PM", "friday": "11:00 AM - 11:30 PM", "saturday": "11:00 AM - 11:30 PM", "sunday": "11:00 AM - 11:00 PM"}'
),
(
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  '00000000-0000-0000-0000-000000000000',
  'Fashion Hub & Boutique',
  'Clothing',
  'Boutique',
  'Contemporary and ethnic wear featuring local Indian fabrics and handlooms.',
  'Bandra West, Mumbai, Maharashtra',
  19.0178,
  72.8478,
  '+91 98765 43211',
  true,
  false,
  4.5,
  89,
  false,
  0.0,
  ARRAY['saree', 'kurti', 'menswear', 'boutique'],
  ARRAY['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800'],
  '{"monday": "10:00 AM - 9:00 PM", "tuesday": "10:00 AM - 9:00 PM", "wednesday": "10:00 AM - 9:00 PM", "thursday": "10:00 AM - 9:00 PM", "friday": "10:00 AM - 9:30 PM", "saturday": "10:00 AM - 9:30 PM", "sunday": "Closed"}'
),
(
  'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  '00000000-0000-0000-0000-000000000000',
  'Tech Solutions & Gadgets',
  'Electronics',
  'Repair & Retail',
  'Your local stop for smart devices, accessories, and expert smartphone repairs.',
  'HITEC City, Hyderabad, Telangana',
  17.4400,
  78.3489,
  '+91 98765 43212',
  true,
  true,
  4.2,
  56,
  true,
  8.0,
  ARRAY['mobile', 'laptop', 'repair', 'accessories'],
  ARRAY['https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800'],
  '{"monday": "9:30 AM - 8:30 PM", "tuesday": "9:30 AM - 8:30 PM", "wednesday": "9:30 AM - 8:30 PM", "thursday": "9:30 AM - 8:30 PM", "friday": "9:30 AM - 8:30 PM", "saturday": "9:30 AM - 8:30 PM", "sunday": "10:00 AM - 5:00 PM"}'
),
(
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  '00000000-0000-0000-0000-000000000000',
  'Organic Green Grocers',
  'Groceries',
  'Supermarket',
  'Farm-fresh organic vegetables, seasonal fruits, and direct trade dairy products.',
  'Connaught Place, New Delhi, Delhi',
  28.6139,
  77.2090,
  '+91 98765 43213',
  true,
  false,
  4.7,
  210,
  true,
  4.0,
  ARRAY['organic', 'vegetables', 'fruits', 'milk', 'grocery'],
  ARRAY['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800'],
  '{"monday": "7:00 AM - 10:00 PM", "tuesday": "7:00 AM - 10:00 PM", "wednesday": "7:00 AM - 10:00 PM", "thursday": "7:00 AM - 10:00 PM", "friday": "7:00 AM - 10:00 PM", "saturday": "7:00 AM - 10:00 PM", "sunday": "7:00 AM - 10:00 PM"}'
),
(
  'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
  '00000000-0000-0000-0000-000000000000',
  'Jaipur Blue Craft Corner',
  'Handicrafts',
  'Souvenir Shop',
  'Handmade blue pottery, local artisan crafts, and authentic block print items.',
  'Hawa Mahal, Jaipur, Rajasthan',
  26.9124,
  75.7873,
  '+91 98765 43214',
  true,
  true,
  4.9,
  73,
  false,
  0.0,
  ARRAY['pottery', 'crafts', 'handicrafts', 'souvenir'],
  ARRAY['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800'],
  '{"monday": "9:00 AM - 8:00 PM", "tuesday": "9:00 AM - 8:00 PM", "wednesday": "9:00 AM - 8:00 PM", "thursday": "9:00 AM - 8:00 PM", "friday": "9:00 AM - 8:00 PM", "saturday": "9:00 AM - 8:00 PM", "sunday": "9:00 AM - 8:00 PM"}'
);

-- 3. Insert some mock offers/deals for the shops
INSERT INTO public.offers (
  id,
  shop_id,
  title,
  description,
  discount_type,
  discount_value,
  active,
  start_at,
  end_at
) VALUES 
(
  'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Flat 20% Off on Dinners',
  'Enjoy a flat 20% discount on all main course dinner orders this week!',
  'percentage',
  '20%',
  true,
  now(),
  now() + interval '7 days'
),
(
  'd7d7d7d7-d7d7-d7d7-d7d7-d7d7d7d7d7d7',
  'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  'Fresh Veggie Tuesday Buy 1 Get 1',
  'Get one free bunch of fresh organic spinach for every purchase above Rs. 200.',
  'bogo',
  'BOGO',
  true,
  now(),
  now() + interval '7 days'
);
