-- Clean up old offers first
DELETE FROM public.offers;

-- Insert fresh hot deals for existing shops
INSERT INTO public.offers (shop_id, title, description, discount_type, discount_value, end_at, active)
VALUES
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'Summer Clearance Sale', 'Get huge discounts on all clothing items and fashion accessories.', 'percentage', '50% OFF', NOW() + INTERVAL '30 days', true),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', 'Weekend Tech Upgrade Deal', 'Save on latest smartphones, laptops, and smart home appliances.', 'fixed', 'Flat ₹2000 OFF', NOW() + INTERVAL '7 days', true),
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', 'Fresh Organic Vegetable Bundle Deal', 'Buy one organic vegetable crate and get the second crate absolutely free.', 'bogo', 'Buy 1 Get 1 Free', NOW() + INTERVAL '14 days', true),
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', 'Handmade Jaipur Blue Pottery Sale', 'Flat discount on exquisite hand-painted ceramic vases and dinner sets.', 'percentage', '20% OFF', NOW() + INTERVAL '15 days', true);
