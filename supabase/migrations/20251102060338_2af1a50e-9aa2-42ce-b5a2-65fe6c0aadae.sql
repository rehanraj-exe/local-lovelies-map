-- Make shop_id nullable in transactions table for wallet top-ups
ALTER TABLE transactions 
ALTER COLUMN shop_id DROP NOT NULL;