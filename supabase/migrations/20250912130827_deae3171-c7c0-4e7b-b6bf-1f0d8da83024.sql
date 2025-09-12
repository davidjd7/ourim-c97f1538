-- Step 1: Create new debt_characteristics table (renamed from immobilier_debt_characteristics)
CREATE TABLE public.debt_characteristics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  asset_id uuid NOT NULL,
  asset_type text NOT NULL DEFAULT 'immobilier',
  montant_initial numeric DEFAULT 0,
  duree_mois integer DEFAULT 0,
  taux numeric DEFAULT 0,
  amortissement_annuel numeric,
  type text DEFAULT 'Amortissement constant',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Create new debt_flows table (renamed from immobilier_debt_flows)
CREATE TABLE public.debt_flows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  debt_characteristics_id uuid NOT NULL,
  date date NOT NULL,
  capital_debut numeric DEFAULT 0,
  rmbt_capital numeric DEFAULT 0,
  rmbt_interet numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 3: Add foreign key constraint
ALTER TABLE public.debt_flows 
ADD CONSTRAINT debt_flows_debt_characteristics_id_fkey 
FOREIGN KEY (debt_characteristics_id) REFERENCES public.debt_characteristics(id) ON DELETE CASCADE;

-- Step 4: Migrate data from old tables
INSERT INTO public.debt_characteristics (
  id, user_id, asset_id, asset_type, montant_initial, duree_mois, taux, 
  amortissement_annuel, type, created_at, updated_at
)
SELECT 
  id, user_id, immobilier_id as asset_id, 'immobilier' as asset_type,
  montant_initial, duree_mois, taux, amortissement_annuel, type, 
  created_at, updated_at
FROM public.immobilier_debt_characteristics;

INSERT INTO public.debt_flows (
  id, user_id, debt_characteristics_id, date, capital_debut, rmbt_capital, rmbt_interet, created_at, updated_at
)
SELECT 
  df.id, df.user_id, dc.id as debt_characteristics_id, df.date, 
  df.capital_debut, df.rmbt_capital, df.rmbt_interet, df.created_at, df.updated_at
FROM public.immobilier_debt_flows df
JOIN public.immobilier_debt_characteristics dc ON df.immobilier_id = dc.immobilier_id AND df.user_id = dc.user_id;

-- Step 5: Enable RLS on new tables
ALTER TABLE public.debt_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_flows ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for debt_characteristics
CREATE POLICY "Users can view their own debt characteristics" 
ON public.debt_characteristics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt characteristics" 
ON public.debt_characteristics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt characteristics" 
ON public.debt_characteristics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt characteristics" 
ON public.debt_characteristics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 7: Create RLS policies for debt_flows
CREATE POLICY "Users can view their own debt flows" 
ON public.debt_flows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt flows" 
ON public.debt_flows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt flows" 
ON public.debt_flows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt flows" 
ON public.debt_flows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 8: Create indexes for performance
CREATE INDEX idx_debt_characteristics_asset_id ON public.debt_characteristics(asset_id);
CREATE INDEX idx_debt_characteristics_user_id ON public.debt_characteristics(user_id);
CREATE INDEX idx_debt_flows_debt_characteristics_id ON public.debt_flows(debt_characteristics_id);
CREATE INDEX idx_debt_flows_user_id ON public.debt_flows(user_id);
CREATE INDEX idx_debt_flows_date ON public.debt_flows(date);

-- Step 9: Drop old tables (after confirming data migration is successful)
DROP TABLE public.immobilier_debt_flows;
DROP TABLE public.immobilier_debt_characteristics;