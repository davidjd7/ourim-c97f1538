-- Add new columns for credit and rate details on debts
ALTER TABLE public.debt_characteristics
  ADD COLUMN IF NOT EXISTS type_credit TEXT,
  ADD COLUMN IF NOT EXISTS type_taux TEXT,
  ADD COLUMN IF NOT EXISTS marge NUMERIC,
  ADD COLUMN IF NOT EXISTS indice_base TEXT;

-- Optional: set sensible defaults for new records
ALTER TABLE public.debt_characteristics
  ALTER COLUMN type_credit SET DEFAULT 'Hypothécaire',
  ALTER COLUMN type_taux SET DEFAULT 'Fixe';

-- Note: RLS policies already exist on this table and do not need changes
-- The app code handles nulls for these fields, so existing rows are safe.