-- Renommer les tables principales
ALTER TABLE public.investments RENAME TO immobilier_investments;
ALTER TABLE public.investment_cashflows RENAME TO immobilier_cashflows;
ALTER TABLE public.investment_valorisations RENAME TO immobilier_valorisations;
ALTER TABLE public.investment_debt_characteristics RENAME TO immobilier_debt_characteristics;
ALTER TABLE public.investment_debt_flows RENAME TO immobilier_debt_flows;
ALTER TABLE public.investment_immobilisations RENAME TO immobilier_immobilisations;
ALTER TABLE public.investment_history RENAME TO immobilier_history;

-- Adapter la table investment_tags vers asset_tags
ALTER TABLE public.investment_tags RENAME TO asset_tags;
ALTER TABLE public.asset_tags RENAME COLUMN investment_id TO asset_id;
ALTER TABLE public.asset_tags ADD COLUMN asset_type TEXT NOT NULL DEFAULT 'immobilier';

-- Mettre à jour les références dans documents et notes
ALTER TABLE public.documents RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.notes RENAME COLUMN investment_id TO immobilier_id;

-- Mettre à jour les colonnes investment_id vers immobilier_id dans les autres tables
ALTER TABLE public.immobilier_cashflows RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.immobilier_valorisations RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.immobilier_debt_characteristics RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.immobilier_debt_flows RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.immobilier_immobilisations RENAME COLUMN investment_id TO immobilier_id;
ALTER TABLE public.immobilier_history RENAME COLUMN investment_id TO immobilier_id;