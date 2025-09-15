-- Add montant_tirable column to debt_characteristics table
ALTER TABLE public.debt_characteristics 
ADD COLUMN montant_tirable numeric DEFAULT NULL;