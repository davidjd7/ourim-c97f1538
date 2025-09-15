-- Supprimer les dettes avec montant_initial = 0 (dettes vides créées par erreur)
DELETE FROM public.debt_characteristics 
WHERE montant_initial = 0 OR montant_initial IS NULL;