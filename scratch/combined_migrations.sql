-- ==========================================
-- MIGRATION: 20251101100302_4bc6dce8-d1c1-4b47-9118-6c4be2912d6a.sql
-- ==========================================

-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  photo_url text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create app roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'shop_owner', 'delivery_partner', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Shops table
CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  address text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  phone text NOT NULL,
  hours jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  menu_items jsonb DEFAULT '[]',
  verified boolean DEFAULT false,
  featured boolean DEFAULT false,
  rating numeric(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  delivery_enabled boolean DEFAULT false,
  delivery_radius numeric(5,2),
  social_links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified shops"
  ON public.shops FOR SELECT
  USING (verified = true OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Shop owners can insert own shop"
  ON public.shops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Shop owners can update own shop"
  ON public.shops FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'bogo', 'flash')),
  discount_value text NOT NULL,
  terms text,
  start_at timestamptz DEFAULT now() NOT NULL,
  end_at timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (active = true AND end_at > now());

CREATE POLICY "Shop owners can manage own offers"
  ON public.offers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = offers.shop_id AND shops.owner_id = auth.uid()
    )
  );

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  job_type text NOT NULL CHECK (job_type IN ('part-time', 'full-time', 'temporary', 'gig')),
  wage text NOT NULL,
  shift_hours text,
  requirements text,
  active boolean DEFAULT true,
  apply_by timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (active = true);

CREATE POLICY "Shop owners can manage own jobs"
  ON public.jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = jobs.shop_id AND shops.owner_id = auth.uid()
    )
  );

-- Job applications table
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message text,
  cv_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (job_id, user_id)
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop owners can view applications for their jobs"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.shops ON shops.id = jobs.shop_id
      WHERE jobs.id = job_applications.job_id AND shops.owner_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can update application status"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      JOIN public.shops ON shops.id = jobs.shop_id
      WHERE jobs.id = job_applications.job_id AND shops.owner_id = auth.uid()
    )
  );

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  verified_purchase boolean DEFAULT false,
  owner_response text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (shop_id, user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Shop owners can respond to reviews"
  ON public.reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops
      WHERE shops.id = reviews.shop_id AND shops.owner_id = auth.uid()
    )
  );

-- Favorites table
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (user_id, shop_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251101100331_20723873-4f97-4343-940b-f49c1337a916.sql
-- ==========================================

-- Fix security warning: Set search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ==========================================
-- MIGRATION: 20251101134014_aaa26f59-29ca-4b74-a748-df64ef5bc39c.sql
-- ==========================================

-- Add products table for shop items
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add subcategory to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS open_now BOOLEAN DEFAULT true;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can view products of verified shops
CREATE POLICY "Anyone can view products of verified shops"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = products.shop_id 
    AND shops.verified = true
  )
);

-- Shop owners can manage their products
CREATE POLICY "Shop owners can manage own products"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = products.shop_id 
    AND shops.owner_id = auth.uid()
  )
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_shops_subcategory ON public.shops(subcategory);
CREATE INDEX IF NOT EXISTS idx_shops_open_now ON public.shops(open_now) WHERE open_now = true;

-- Add trigger for products updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251101135210_2865f163-ac95-4514-a6c7-183a5d6a0220.sql
-- ==========================================

-- Temporarily make owner_id nullable to allow seed data
ALTER TABLE public.shops ALTER COLUMN owner_id DROP NOT NULL;

-- Update RLS policy to handle null owner_id (unclaimed shops)
DROP POLICY IF EXISTS "Shop owners can update own shop" ON public.shops;
CREATE POLICY "Shop owners can update own shop"
ON public.shops
FOR UPDATE
USING (
  (owner_id IS NOT NULL AND auth.uid() = owner_id) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Shop owners can insert own shop" ON public.shops;
CREATE POLICY "Shop owners can insert own shop"
ON public.shops
FOR INSERT
WITH CHECK (
  owner_id IS NULL OR  -- Allow unclaimed shops
  auth.uid() = owner_id
);

-- ==========================================
-- MIGRATION: 20251101181422_8f323fc3-8bb4-4113-b7cb-c4e8eabbb04c.sql
-- ==========================================

-- Create cart_items table for shopping cart
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id UUID NOT NULL REFERENCES public.shops(id),
  total_amount NUMERIC NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_phone TEXT NOT NULL,
  delivery_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart_items
CREATE POLICY "Users can manage own cart"
ON public.cart_items
FOR ALL
USING (auth.uid() = user_id);

-- RLS Policies for orders
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shop owners can view their orders"
ON public.orders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM shops
  WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()
));

CREATE POLICY "Shop owners can update order status"
ON public.orders
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM shops
  WHERE shops.id = orders.shop_id AND shops.owner_id = auth.uid()
));

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));

CREATE POLICY "Users can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
));

CREATE POLICY "Shop owners can view their order items"
ON public.order_items
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders
  JOIN shops ON shops.id = orders.shop_id
  WHERE orders.id = order_items.order_id AND shops.owner_id = auth.uid()
));

-- Create trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for orders updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251102045757_b416fa3c-1b52-4786-ab72-f23a563a17dd.sql
-- ==========================================

-- Add payment fields to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method text DEFAULT 'cod',
ADD COLUMN payment_status text DEFAULT 'pending',
ADD COLUMN payment_id text,
ADD COLUMN upi_transaction_id text;

-- ==========================================
-- MIGRATION: 20251102050328_27b58f7b-1fdd-4edc-ad06-beec5593cf44.sql
-- ==========================================

-- Add UPI ID field to shops table
ALTER TABLE public.shops
ADD COLUMN upi_id text;

-- ==========================================
-- MIGRATION: 20251102053632_75320704-d205-433d-9df9-7d9eb357d95e.sql
-- ==========================================

-- Create transactions table for UPI payment tracking
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  shop_id uuid NOT NULL REFERENCES public.shops(id),
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL,
  payment_method text NOT NULL DEFAULT 'upi',
  status text NOT NULL DEFAULT 'pending',
  upi_transaction_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Shop owners can view transactions for their shops
CREATE POLICY "Shop owners can view shop transactions"
ON public.transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = transactions.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_shop_id ON public.transactions(shop_id);
CREATE INDEX idx_transactions_order_id ON public.transactions(order_id);

-- Add trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251102054823_17841ba3-f02d-49fa-9f4d-5ee1c3b67b9e.sql
-- ==========================================

-- Create wallets table for storing user wallet balances
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
ON public.wallets
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own wallet balance (for adding money)
CREATE POLICY "Users can update own wallet"
ON public.wallets
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can create their own wallet
CREATE POLICY "Users can create own wallet"
ON public.wallets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

-- Trigger to create wallet when user signs up
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_wallet();

-- ==========================================
-- MIGRATION: 20251102060338_2af1a50e-9aa2-42ce-b5a2-65fe6c0aadae.sql
-- ==========================================

-- Make shop_id nullable in transactions table for wallet top-ups
ALTER TABLE transactions 
ALTER COLUMN shop_id DROP NOT NULL;

-- ==========================================
-- MIGRATION: 20251102061202_4426fe94-c6e7-4999-9b11-65fa5c619f71.sql
-- ==========================================

-- Create shop_analytics table for tracking views and clicks
CREATE TABLE public.shop_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  offer_redemptions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(shop_id, date)
);

-- Enable RLS
ALTER TABLE public.shop_analytics ENABLE ROW LEVEL SECURITY;

-- Shop owners can view their own analytics
CREATE POLICY "Shop owners can view own analytics"
ON public.shop_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = shop_analytics.shop_id
    AND shops.owner_id = auth.uid()
  )
);

-- Anyone can increment analytics (for tracking)
CREATE POLICY "Anyone can update analytics"
ON public.shop_analytics
FOR UPDATE
USING (true);

-- System can insert analytics
CREATE POLICY "Anyone can insert analytics"
ON public.shop_analytics
FOR INSERT
WITH CHECK (true);

-- Create function to track shop view
CREATE OR REPLACE FUNCTION public.track_shop_view(shop_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO shop_analytics (shop_id, date, views)
  VALUES (shop_uuid, CURRENT_DATE, 1)
  ON CONFLICT (shop_id, date)
  DO UPDATE SET
    views = shop_analytics.views + 1,
    updated_at = now();
END;
$$;

-- Create function to track shop click
CREATE OR REPLACE FUNCTION public.track_shop_click(shop_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO shop_analytics (shop_id, date, clicks)
  VALUES (shop_uuid, CURRENT_DATE, 1)
  ON CONFLICT (shop_id, date)
  DO UPDATE SET
    clicks = shop_analytics.clicks + 1,
    updated_at = now();
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_shop_analytics_updated_at
BEFORE UPDATE ON public.shop_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20251102061613_6b4a856f-516b-4d89-bd60-624966783fb9.sql
-- ==========================================

-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'customer_premium', 'shop_premium');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own subscription
CREATE POLICY "Users can create own subscription"
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has premium subscription
CREATE OR REPLACE FUNCTION public.has_premium_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
    AND plan != 'free'
    AND status = 'active'
    AND expires_at > now()
  )
$$;

-- Create function to get user subscription plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan::text FROM public.subscriptions
     WHERE user_id = _user_id
     AND status = 'active'
     AND expires_at > now()
     LIMIT 1),
    'free'
  )
$$;

-- ==========================================
-- MIGRATION: 20251102064437_fcfbc0f8-871b-43fd-ba63-b478cbda05af.sql
-- ==========================================

-- Create delivery_addresses table
CREATE TABLE public.delivery_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Home',
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own addresses"
  ON public.delivery_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON public.delivery_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON public.delivery_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON public.delivery_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_delivery_addresses_updated_at
  BEFORE UPDATE ON public.delivery_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- MIGRATION: 20260531145323_17397c60-9f3d-41d5-82c3-eb05eedf55e6.sql
-- ==========================================


-- 1. Profiles: restrict SELECT to own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 2. Shops INSERT: require owner_id = auth.uid()
DROP POLICY IF EXISTS "Shop owners can insert own shop" ON public.shops;
CREATE POLICY "Shop owners can insert own shop"
  ON public.shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- 3. Shop analytics: remove public write policies; rely on SECURITY DEFINER funcs
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.shop_analytics;
DROP POLICY IF EXISTS "Anyone can update analytics" ON public.shop_analytics;
CREATE POLICY "Shop owners can insert own analytics"
  ON public.shop_analytics FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_analytics.shop_id AND shops.owner_id = auth.uid()));
CREATE POLICY "Shop owners can update own analytics"
  ON public.shop_analytics FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_analytics.shop_id AND shops.owner_id = auth.uid()));

-- 4. Wallets: remove user-controlled UPDATE policy
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
-- Wallet balance can only be updated via service_role / SECURITY DEFINER functions

-- 5. Reviews: restrict shop owner UPDATE to only owner_response column via trigger
CREATE OR REPLACE FUNCTION public.enforce_review_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If updater is the original reviewer, allow anything (user editing their review)
  IF auth.uid() = OLD.user_id THEN
    RETURN NEW;
  END IF;
  -- Otherwise (shop owner or anyone else), only owner_response may change
  IF NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.comment IS DISTINCT FROM OLD.comment
     OR NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.shop_id IS DISTINCT FROM OLD.shop_id
     OR NEW.verified_purchase IS DISTINCT FROM OLD.verified_purchase
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Shop owners may only modify owner_response on reviews';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reviews_update_restrictions ON public.reviews;
CREATE TRIGGER reviews_update_restrictions
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_update_restrictions();

-- 6. Move shop UPI IDs to a separate, restricted table
CREATE TABLE IF NOT EXISTS public.shop_payment_info (
  shop_id uuid PRIMARY KEY,
  upi_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_payment_info TO authenticated;
GRANT ALL ON public.shop_payment_info TO service_role;
ALTER TABLE public.shop_payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payment info"
  ON public.shop_payment_info FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Shop owners can manage own payment info"
  ON public.shop_payment_info FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_payment_info.shop_id AND shops.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops WHERE shops.id = shop_payment_info.shop_id AND shops.owner_id = auth.uid()));

-- Migrate existing UPI data
INSERT INTO public.shop_payment_info (shop_id, upi_id)
  SELECT id, upi_id FROM public.shops WHERE upi_id IS NOT NULL
  ON CONFLICT (shop_id) DO NOTHING;

-- Drop the public column from shops
ALTER TABLE public.shops DROP COLUMN IF EXISTS upi_id;

-- 7. Create private storage bucket for CVs with strict access
INSERT INTO storage.buckets (id, name, public)
  VALUES ('cvs', 'cvs', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Applicants can upload own CV"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Applicants can read own CV"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Shop owners can read CVs for their jobs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cvs' AND EXISTS (
      SELECT 1 FROM public.job_applications ja
      JOIN public.jobs j ON j.id = ja.job_id
      JOIN public.shops s ON s.id = j.shop_id
      WHERE ja.cv_url = name AND s.owner_id = auth.uid()
    )
  );


-- ==========================================
-- MIGRATION: 20260706160000_spread_shops_across_india.sql
-- ==========================================

-- Spread shops across major Indian cities
-- This migration assigns unique, realistic coordinates to each shop
-- so they don't all stack on top of each other on the map.

-- Get all shop IDs ordered by created_at and assign different coordinates
-- using a CTE with row numbers to distribute shops across India.

WITH numbered_shops AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn,
         COUNT(*) OVER () AS total_count
  FROM public.shops
),
-- Major Indian city coordinates with realistic offsets for variety
city_coords AS (
  SELECT * FROM (VALUES
    -- Delhi NCR area
    (1,  28.6139, 77.2090, 'Connaught Place, New Delhi'),
    (2,  28.6353, 77.2250, 'Chandni Chowk, Delhi'),
    (3,  28.5672, 77.2100, 'Saket, New Delhi'),
    (4,  28.6280, 77.2195, 'Karol Bagh, Delhi'),
    (5,  28.5741, 77.3270, 'Noida Sector 18'),
    -- Mumbai area
    (6,  19.0760, 72.8777, 'Mumbai Central'),
    (7,  19.0178, 72.8478, 'Bandra West, Mumbai'),
    (8,  19.1136, 72.8697, 'Andheri, Mumbai'),
    (9,  18.9220, 72.8347, 'Colaba, Mumbai'),
    (10, 19.0596, 72.8295, 'Juhu, Mumbai'),
    -- Bangalore area
    (11, 12.9716, 77.5946, 'MG Road, Bangalore'),
    (12, 12.9352, 77.6245, 'Koramangala, Bangalore'),
    (13, 12.9770, 77.5720, 'Malleshwaram, Bangalore'),
    (14, 13.0200, 77.6536, 'Whitefield, Bangalore'),
    (15, 12.9568, 77.7011, 'Marathahalli, Bangalore'),
    -- Hyderabad area
    (16, 17.3850, 78.4867, 'Charminar, Hyderabad'),
    (17, 17.4400, 78.3489, 'HITEC City, Hyderabad'),
    (18, 17.4260, 78.4482, 'Banjara Hills, Hyderabad'),
    (19, 17.4156, 78.4347, 'Jubilee Hills, Hyderabad'),
    (20, 17.4485, 78.3908, 'Madhapur, Hyderabad'),
    -- Chennai area
    (21, 13.0827, 80.2707, 'T Nagar, Chennai'),
    (22, 13.0569, 80.2425, 'Mylapore, Chennai'),
    (23, 13.0674, 80.2376, 'Adyar, Chennai'),
    (24, 13.1067, 80.2206, 'Egmore, Chennai'),
    (25, 12.9941, 80.2554, 'Velachery, Chennai'),
    -- Kolkata area
    (26, 22.5726, 88.3639, 'Park Street, Kolkata'),
    (27, 22.5448, 88.3426, 'New Market, Kolkata'),
    (28, 22.5958, 88.3696, 'Salt Lake, Kolkata'),
    (29, 22.5181, 88.3961, 'Jadavpur, Kolkata'),
    (30, 22.5412, 88.3506, 'Gariahat, Kolkata'),
    -- Pune area
    (31, 18.5204, 73.8567, 'FC Road, Pune'),
    (32, 18.5362, 73.8925, 'Koregaon Park, Pune'),
    (33, 18.5074, 73.8077, 'Kothrud, Pune'),
    (34, 18.5590, 73.7868, 'Hinjewadi, Pune'),
    (35, 18.5314, 73.8446, 'Shivajinagar, Pune'),
    -- Jaipur area
    (36, 26.9124, 75.7873, 'Hawa Mahal, Jaipur'),
    (37, 26.8882, 75.8016, 'Johari Bazaar, Jaipur'),
    (38, 26.9260, 75.8235, 'C-Scheme, Jaipur'),
    (39, 26.8508, 75.8040, 'Malviya Nagar, Jaipur'),
    (40, 26.9047, 75.7586, 'Raja Park, Jaipur'),
    -- Ahmedabad area
    (41, 23.0225, 72.5714, 'Manek Chowk, Ahmedabad'),
    (42, 23.0396, 72.5661, 'CG Road, Ahmedabad'),
    (43, 23.0469, 72.5299, 'SG Highway, Ahmedabad'),
    (44, 23.0130, 72.5263, 'Satellite, Ahmedabad'),
    (45, 22.9946, 72.5997, 'Kankaria, Ahmedabad'),
    -- Lucknow area
    (46, 26.8467, 80.9462, 'Hazratganj, Lucknow'),
    (47, 26.8572, 80.9199, 'Aminabad, Lucknow'),
    (48, 26.8684, 80.9488, 'Gomti Nagar, Lucknow'),
    (49, 26.8380, 80.9346, 'Chowk, Lucknow'),
    (50, 26.8753, 80.9916, 'Indira Nagar, Lucknow'),
    -- Kochi area
    (51, 9.9312, 76.2673, 'Fort Kochi'),
    (52, 9.9816, 76.2999, 'Ernakulam, Kochi'),
    (53, 10.0159, 76.3419, 'Edappally, Kochi'),
    (54, 9.9689, 76.2854, 'MG Road, Kochi'),
    (55, 9.9391, 76.2601, 'Mattancherry, Kochi'),
    -- Chandigarh area
    (56, 30.7333, 76.7794, 'Sector 17, Chandigarh'),
    (57, 30.7413, 76.7679, 'Sector 22, Chandigarh'),
    (58, 30.7046, 76.7179, 'IT Park, Chandigarh'),
    (59, 30.7526, 76.7862, 'Sector 35, Chandigarh'),
    (60, 30.7116, 76.6985, 'Elante Mall area, Chandigarh')
  ) AS t(idx, lat, lng, area_name)
)
UPDATE public.shops s
SET 
  latitude = cc.lat + (RANDOM() * 0.008 - 0.004),  -- Add small random offset (~400m)
  longitude = cc.lng + (RANDOM() * 0.008 - 0.004),
  updated_at = now()
FROM numbered_shops ns
JOIN city_coords cc ON cc.idx = ((ns.rn - 1) % 60) + 1
WHERE s.id = ns.id;


