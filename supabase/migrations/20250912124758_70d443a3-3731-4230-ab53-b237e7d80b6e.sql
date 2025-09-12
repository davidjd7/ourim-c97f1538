-- Renommer seulement les contraintes (les index seront gérés séparément)
ALTER TABLE immobilier_investments RENAME CONSTRAINT investments_type_check TO immobilier_investments_type_check;
ALTER TABLE immobilier_investments RENAME CONSTRAINT investments_pkey TO immobilier_investments_pkey;
ALTER TABLE immobilier_investments RENAME CONSTRAINT investments_company_id_fkey TO immobilier_investments_company_id_fkey;

ALTER TABLE immobilier_history RENAME CONSTRAINT investment_history_action_type_check TO immobilier_history_action_type_check;
ALTER TABLE immobilier_history RENAME CONSTRAINT investment_history_pkey TO immobilier_history_pkey;

ALTER TABLE immobilier_cashflows RENAME CONSTRAINT investment_cashflows_pkey TO immobilier_cashflows_pkey;
ALTER TABLE immobilier_valorisations RENAME CONSTRAINT investment_valorisations_pkey TO immobilier_valorisations_pkey;
ALTER TABLE immobilier_immobilisations RENAME CONSTRAINT investment_immobilisations_pkey TO immobilier_immobilisations_pkey;
ALTER TABLE immobilier_debt_characteristics RENAME CONSTRAINT investment_debt_characteristics_pkey TO immobilier_debt_characteristics_pkey;
ALTER TABLE immobilier_debt_flows RENAME CONSTRAINT investment_debt_flows_pkey TO immobilier_debt_flows_pkey;

ALTER TABLE asset_tags RENAME CONSTRAINT investment_tags_pkey TO asset_tags_pkey;
ALTER TABLE asset_tags RENAME CONSTRAINT investment_tags_investment_id_tag_id_key TO asset_tags_asset_id_tag_id_key;

-- Renommer les index en les supprimant et recréant avec les bons noms (seulement pour les custom index)
DROP INDEX IF EXISTS idx_notes_investment_id;
DROP INDEX IF EXISTS idx_investment_history_investment_id;
DROP INDEX IF EXISTS idx_investment_history_created_at;

CREATE INDEX idx_notes_immobilier_id ON notes USING btree (immobilier_id);
CREATE INDEX idx_immobilier_history_immobilier_id ON immobilier_history USING btree (immobilier_id);
CREATE INDEX idx_immobilier_history_created_at ON immobilier_history USING btree (created_at);