-- Update RLS policies for immobilier_investments to allow access via company permissions

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view their own investments" ON public.immobilier_investments;

-- Create new SELECT policy that includes company access
CREATE POLICY "Users can view accessible investments"
  ON public.immobilier_investments
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), company_id))
    OR
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Drop old UPDATE policy
DROP POLICY IF EXISTS "Users can update their own investments" ON public.immobilier_investments;

-- Create new UPDATE policy (owners and admins only)
CREATE POLICY "Owners and admins can update investments"
  ON public.immobilier_investments
  FOR UPDATE
  USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Drop old DELETE policy
DROP POLICY IF EXISTS "Users can delete their own investments" ON public.immobilier_investments;

-- Create new DELETE policy (owners and admins only)
CREATE POLICY "Owners and admins can delete investments"
  ON public.immobilier_investments
  FOR DELETE
  USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Update RLS policies for immobilier_cashflows
DROP POLICY IF EXISTS "Users can view their own investment cashflows" ON public.immobilier_cashflows;

CREATE POLICY "Users can view accessible investment cashflows"
  ON public.immobilier_cashflows
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.immobilier_investments
      WHERE id = immobilier_cashflows.immobilier_id
      AND (
        immobilier_investments.user_id = auth.uid()
        OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Update RLS policies for immobilier_valorisations
DROP POLICY IF EXISTS "Users can view their own investment valorisations" ON public.immobilier_valorisations;

CREATE POLICY "Users can view accessible investment valorisations"
  ON public.immobilier_valorisations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.immobilier_investments
      WHERE id = immobilier_valorisations.immobilier_id
      AND (
        immobilier_investments.user_id = auth.uid()
        OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Update RLS policies for immobilier_immobilisations
DROP POLICY IF EXISTS "Users can view their own investment immobilisations" ON public.immobilier_immobilisations;

CREATE POLICY "Users can view accessible investment immobilisations"
  ON public.immobilier_immobilisations
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.immobilier_investments
      WHERE id = immobilier_immobilisations.immobilier_id
      AND (
        immobilier_investments.user_id = auth.uid()
        OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

CREATE POLICY "Users can view accessible documents"
  ON public.documents
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.immobilier_investments
      WHERE id = documents.immobilier_id
      AND (
        immobilier_investments.user_id = auth.uid()
        OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
        OR public.has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );

-- Update RLS policies for notes
DROP POLICY IF EXISTS "Users can view their own notes and public notes" ON public.notes;

CREATE POLICY "Users can view accessible notes"
  ON public.notes
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (
      is_private = false
      AND EXISTS (
        SELECT 1 FROM public.immobilier_investments
        WHERE id = notes.immobilier_id
        AND (
          immobilier_investments.user_id = auth.uid()
          OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
      )
    )
  );

-- Update RLS policies for debt_characteristics
DROP POLICY IF EXISTS "Users can view their own debt characteristics" ON public.debt_characteristics;

CREATE POLICY "Users can view accessible debt characteristics"
  ON public.debt_characteristics
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (
      asset_type = 'immobilier'
      AND EXISTS (
        SELECT 1 FROM public.immobilier_investments
        WHERE id = debt_characteristics.asset_id
        AND (
          immobilier_investments.user_id = auth.uid()
          OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
      )
    )
  );

-- Update RLS policies for debt_flows
DROP POLICY IF EXISTS "Users can view their own debt flows" ON public.debt_flows;

CREATE POLICY "Users can view accessible debt flows"
  ON public.debt_flows
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM public.debt_characteristics
      WHERE id = debt_flows.debt_characteristics_id
      AND (
        debt_characteristics.user_id = auth.uid()
        OR (
          debt_characteristics.asset_type = 'immobilier'
          AND EXISTS (
            SELECT 1 FROM public.immobilier_investments
            WHERE id = debt_characteristics.asset_id
            AND (
              immobilier_investments.user_id = auth.uid()
              OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
              OR public.has_role(auth.uid(), 'admin'::app_role)
            )
          )
        )
      )
    )
  );

-- Update RLS policies for asset_tags
DROP POLICY IF EXISTS "Users can view their own investment tags" ON public.asset_tags;

CREATE POLICY "Users can view accessible asset tags"
  ON public.asset_tags
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    (
      asset_type = 'immobilier'
      AND EXISTS (
        SELECT 1 FROM public.immobilier_investments
        WHERE id = asset_tags.asset_id
        AND (
          immobilier_investments.user_id = auth.uid()
          OR (immobilier_investments.company_id IS NOT NULL AND public.user_has_company_access(auth.uid(), immobilier_investments.company_id))
          OR public.has_role(auth.uid(), 'admin'::app_role)
        )
      )
    )
  );