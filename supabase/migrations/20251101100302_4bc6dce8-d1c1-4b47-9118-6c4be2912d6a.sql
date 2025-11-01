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