-- 1. Add new columns to shops table
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text,
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS cover_url text;

-- 2. Add new columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS discount_price numeric(10, 2),
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS brand text,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 3. Update products RLS policies to allow admins to bypass ownership checks
DROP POLICY IF EXISTS "Shop owners can manage own products" ON public.products;
CREATE POLICY "Shop owners and admins can manage products"
ON public.products
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.shops 
    WHERE shops.id = products.shop_id 
    AND shops.owner_id = auth.uid()
  )
);

-- 4. Create platform_assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('platform_assets', 'platform_assets', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Storage policies for platform_assets bucket
-- Public can view assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'platform_assets');

-- Admins can insert/update/delete assets
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'platform_assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'platform_assets' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'platform_assets' AND
  public.has_role(auth.uid(), 'admin')
);

-- Note: We also need a policy for Shop Owners to upload their own images, 
-- but they might upload them to platform_assets too. Let's allow authenticated users to upload for now, 
-- but restrict to their own folders if we needed stricter rules. 
-- To support the immediate requirement, let's also allow shop owners.
CREATE POLICY "Authenticated users can upload to platform_assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'platform_assets' AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'platform_assets' AND auth.uid() = owner
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'platform_assets' AND auth.uid() = owner
);
