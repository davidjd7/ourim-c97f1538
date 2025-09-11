-- Remove fields from investments table as requested
ALTER TABLE public.investments 
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS surface,
DROP COLUMN IF EXISTS price,
DROP COLUMN IF EXISTS date_acquisition,
DROP COLUMN IF EXISTS locataire,
DROP COLUMN IF EXISTS date_entree,
DROP COLUMN IF EXISTS type_bail,
DROP COLUMN IF EXISTS duree_bail,
DROP COLUMN IF EXISTS bail_next_break,
DROP COLUMN IF EXISTS bail_gmap_link,
DROP COLUMN IF EXISTS bail_gmap_note,
DROP COLUMN IF EXISTS bail_loyer_ht,
DROP COLUMN IF EXISTS bail_cnr,
DROP COLUMN IF EXISTS bail_prise_effet,
DROP COLUMN IF EXISTS bail_activite,
DROP COLUMN IF EXISTS bail_anciennete,
DROP COLUMN IF EXISTS net_vendeur,
DROP COLUMN IF EXISTS agent,
DROP COLUMN IF EXISTS hono_notaire,
DROP COLUMN IF EXISTS last_value,
DROP COLUMN IF EXISTS tri,
DROP COLUMN IF EXISTS notary_fees,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS bail_fin_bail;

-- Clear all data from investment_history table
DELETE FROM public.investment_history;