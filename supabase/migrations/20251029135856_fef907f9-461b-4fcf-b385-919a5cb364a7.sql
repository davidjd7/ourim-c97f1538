-- Create user_company_access junction table
CREATE TABLE public.user_company_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_company_access_user_id ON public.user_company_access(user_id);
CREATE INDEX idx_user_company_access_company_id ON public.user_company_access(company_id);

-- Enable RLS
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can manage all company access
CREATE POLICY "Admins can manage all company access"
  ON public.user_company_access
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Users can view their own company access
CREATE POLICY "Users can view their own company access"
  ON public.user_company_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to check if user has access to a company
CREATE OR REPLACE FUNCTION public.user_has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Admins have access to everything
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
  OR
  -- Or user is the owner of the company
  EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND user_id = _user_id
  )
  OR
  -- Or user has explicit access
  EXISTS (
    SELECT 1
    FROM public.user_company_access
    WHERE user_id = _user_id
      AND company_id = _company_id
  )
$$;

-- Drop old policies on companies table
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can create their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;

-- New policy for SELECT - users can view companies they have access to
CREATE POLICY "Users can view accessible companies"
  ON public.companies
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR user_id = auth.uid()
    OR public.user_has_company_access(auth.uid(), id)
  );

-- Policies for modification (only owner or admin)
CREATE POLICY "Admins and owners can create companies"
  ON public.companies
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id
  );

CREATE POLICY "Admins and owners can update companies"
  ON public.companies
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );

CREATE POLICY "Admins and owners can delete companies"
  ON public.companies
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR user_id = auth.uid()
  );