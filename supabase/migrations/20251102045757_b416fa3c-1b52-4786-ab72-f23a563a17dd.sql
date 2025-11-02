-- Add payment fields to orders table
ALTER TABLE public.orders
ADD COLUMN payment_method text DEFAULT 'cod',
ADD COLUMN payment_status text DEFAULT 'pending',
ADD COLUMN payment_id text,
ADD COLUMN upi_transaction_id text;