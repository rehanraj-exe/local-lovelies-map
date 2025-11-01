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