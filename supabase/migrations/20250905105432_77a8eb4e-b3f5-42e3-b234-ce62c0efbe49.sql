-- Add currency field to investments table
ALTER TABLE public.investments 
ADD COLUMN currency text DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD'));