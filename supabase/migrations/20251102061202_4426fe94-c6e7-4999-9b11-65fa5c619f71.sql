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