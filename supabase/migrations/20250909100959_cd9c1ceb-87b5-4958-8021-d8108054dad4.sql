-- Create table for debt characteristics
CREATE TABLE public.investment_debt_characteristics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  montant_initial NUMERIC DEFAULT 0,
  duree_mois INTEGER DEFAULT 0,
  taux NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'Amortissement constant',
  amortissement_annuel NUMERIC DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_debt_characteristics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own debt characteristics" 
ON public.investment_debt_characteristics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt characteristics" 
ON public.investment_debt_characteristics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt characteristics" 
ON public.investment_debt_characteristics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt characteristics" 
ON public.investment_debt_characteristics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for debt flows
CREATE TABLE public.investment_debt_flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  capital_debut NUMERIC DEFAULT 0,
  rmbt_capital NUMERIC DEFAULT 0,
  rmbt_interet NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_debt_flows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own debt flows" 
ON public.investment_debt_flows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt flows" 
ON public.investment_debt_flows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt flows" 
ON public.investment_debt_flows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt flows" 
ON public.investment_debt_flows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_debt_characteristics_updated_at
BEFORE UPDATE ON public.investment_debt_characteristics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_debt_flows_updated_at
BEFORE UPDATE ON public.investment_debt_flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();