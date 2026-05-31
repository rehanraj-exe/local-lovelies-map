
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
