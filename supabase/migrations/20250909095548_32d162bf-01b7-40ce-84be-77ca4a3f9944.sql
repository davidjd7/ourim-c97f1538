-- Create table for investment immobilisations
CREATE TABLE public.investment_immobilisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  montant NUMERIC DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_immobilisations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own investment immobilisations" 
ON public.investment_immobilisations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment immobilisations" 
ON public.investment_immobilisations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment immobilisations" 
ON public.investment_immobilisations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment immobilisations" 
ON public.investment_immobilisations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_immobilisations_updated_at
BEFORE UPDATE ON public.investment_immobilisations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for investment valorisations
CREATE TABLE public.investment_valorisations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  valeur NUMERIC DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_valorisations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for valorisations
CREATE POLICY "Users can view their own investment valorisations" 
ON public.investment_valorisations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment valorisations" 
ON public.investment_valorisations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment valorisations" 
ON public.investment_valorisations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment valorisations" 
ON public.investment_valorisations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_valorisations_updated_at
BEFORE UPDATE ON public.investment_valorisations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();