-- Add UPI ID field to shops table
ALTER TABLE public.shops
ADD COLUMN upi_id text;