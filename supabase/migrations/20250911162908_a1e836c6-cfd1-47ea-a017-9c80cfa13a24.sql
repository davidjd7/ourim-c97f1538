-- Remove unused company column from investments table
ALTER TABLE public.investments DROP COLUMN IF EXISTS company;