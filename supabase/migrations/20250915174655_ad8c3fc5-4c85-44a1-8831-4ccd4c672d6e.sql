-- Add comment column to immobilier_cashflows table
ALTER TABLE public.immobilier_cashflows 
ADD COLUMN note text;