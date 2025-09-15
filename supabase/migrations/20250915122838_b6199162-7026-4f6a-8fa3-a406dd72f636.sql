-- Add new fields for debt characteristics
ALTER TABLE public.debt_characteristics
  ADD COLUMN IF NOT EXISTS banque TEXT,
  ADD COLUMN IF NOT EXISTS echeance TEXT,
  ADD COLUMN IF NOT EXISTS base TEXT,
  ADD COLUMN IF NOT EXISTS couverture_ltv NUMERIC,
  ADD COLUMN IF NOT EXISTS clause_arrosage TEXT;

-- Update default values
ALTER TABLE public.debt_characteristics
  ALTER COLUMN type SET DEFAULT 'Annuité constante';

-- Add comments for clarity
COMMENT ON COLUMN public.debt_characteristics.banque IS 'Nom de la banque';
COMMENT ON COLUMN public.debt_characteristics.echeance IS 'Type d''échéance: Fixe ou Découvert';
COMMENT ON COLUMN public.debt_characteristics.base IS 'Base de calcul: OAT 10 ANS, EURIBOR 3M, EURIBOR 6M, Fixe (0%)';
COMMENT ON COLUMN public.debt_characteristics.couverture_ltv IS 'Couverture LTV en pourcentage';
COMMENT ON COLUMN public.debt_characteristics.clause_arrosage IS 'Clause d''arrosage: Oui ou Non';