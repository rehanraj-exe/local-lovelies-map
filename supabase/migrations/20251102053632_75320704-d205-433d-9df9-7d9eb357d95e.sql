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