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