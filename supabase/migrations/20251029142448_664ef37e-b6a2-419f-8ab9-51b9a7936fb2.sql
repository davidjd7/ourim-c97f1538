-- Supprimer les policies RLS existantes sur tags
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

-- Supprimer les policies RLS existantes sur asset_tags
DROP POLICY IF EXISTS "Users can view accessible asset tags" ON public.asset_tags;
DROP POLICY IF EXISTS "Users can create their own investment tags" ON public.asset_tags;
DROP POLICY IF EXISTS "Users can delete their own investment tags" ON public.asset_tags;

-- Modifier la table tags : supprimer user_id
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_user_id_name_key;
ALTER TABLE public.tags DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.tags ADD CONSTRAINT tags_name_key UNIQUE (name);

-- Modifier la table asset_tags : supprimer user_id
ALTER TABLE public.asset_tags DROP COLUMN IF EXISTS user_id;

-- ========================================
-- TAGS TABLE : Admin uniquement pour CRUD
-- ========================================

-- Tous peuvent voir tous les tags
CREATE POLICY "All users can view all tags"
  ON public.tags
  FOR SELECT
  TO authenticated
  USING (true);

-- Seuls les admins peuvent créer des tags
CREATE POLICY "Only admins can create tags"
  ON public.tags
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent modifier des tags
CREATE POLICY "Only admins can update tags"
  ON public.tags
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent supprimer des tags
CREATE POLICY "Only admins can delete tags"
  ON public.tags
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- ASSET_TAGS TABLE : Admin et Analyste
-- ========================================

-- Tous peuvent voir toutes les associations
CREATE POLICY "All users can view all asset tags"
  ON public.asset_tags
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin et Analyste peuvent ajouter des tags aux investissements accessibles
CREATE POLICY "Admins and analysts can add tags to accessible investments"
  ON public.asset_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyste'))
    AND
    (
      asset_type = 'immobilier' 
      AND EXISTS (
        SELECT 1 FROM public.immobilier_investments
        WHERE id = asset_id
          AND (
            user_id = auth.uid()
            OR (company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), company_id))
            OR public.has_role(auth.uid(), 'admin')
          )
      )
    )
  );

-- Admin et Analyste peuvent retirer des tags des investissements accessibles
CREATE POLICY "Admins and analysts can remove tags from accessible investments"
  ON public.asset_tags
  FOR DELETE
  TO authenticated
  USING (
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyste'))
    AND
    (
      asset_type = 'immobilier' 
      AND EXISTS (
        SELECT 1 FROM public.immobilier_investments
        WHERE id = asset_id
          AND (
            user_id = auth.uid()
            OR (company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), company_id))
            OR public.has_role(auth.uid(), 'admin')
          )
      )
    )
  );