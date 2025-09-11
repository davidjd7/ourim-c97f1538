-- Ajouter une colonne loyer à la table investment_cashflows
ALTER TABLE public.investment_cashflows 
ADD COLUMN loyer numeric DEFAULT 0;