-- Créer des indices optimisés pour les requêtes de KPIs

-- Index pour immobilier_cashflows (utilisé pour calculer NOI)
CREATE INDEX IF NOT EXISTS idx_immobilier_cashflows_user_investment_date 
ON public.immobilier_cashflows (user_id, immobilier_id, date DESC);

-- Index pour immobilier_valorisations (utilisé pour calculer les variations de valeur)
CREATE INDEX IF NOT EXISTS idx_immobilier_valorisations_user_investment_date 
ON public.immobilier_valorisations (user_id, immobilier_id, date DESC);

-- Index pour debt_characteristics (utilisé pour calculer les flux de dette)
CREATE INDEX IF NOT EXISTS idx_debt_characteristics_user_asset 
ON public.debt_characteristics (user_id, asset_id, asset_type);

-- Index pour debt_flows (utilisé pour calculer les remboursements)
CREATE INDEX IF NOT EXISTS idx_debt_flows_user_debt_date 
ON public.debt_flows (user_id, debt_characteristics_id, date DESC);

-- Index pour immobilier_immobilisations (utilisé pour calculer le capital investi)
CREATE INDEX IF NOT EXISTS idx_immobilier_immobilisations_user_investment_date 
ON public.immobilier_immobilisations (user_id, immobilier_id, date DESC);

-- Index pour immobilier_investments (table principale)
CREATE INDEX IF NOT EXISTS idx_immobilier_investments_user_company 
ON public.immobilier_investments (user_id, company_id);

-- Index composite pour les requêtes de filtrage sur les investissements
CREATE INDEX IF NOT EXISTS idx_immobilier_investments_user_date_type 
ON public.immobilier_investments (user_id, investment_date DESC, type);