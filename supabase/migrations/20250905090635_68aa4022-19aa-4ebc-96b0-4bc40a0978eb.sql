-- Create a table for investments
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IMMO', 'PE')),
  status TEXT NOT NULL CHECK (status IN ('RECU', 'DUE_DIL', 'INVESTI', 'VENDU', 'DROP')),
  address TEXT,
  surface NUMERIC,
  price NUMERIC,
  date_acquisition DATE,
  locataire TEXT,
  date_entree DATE,
  type_bail TEXT,
  duree_bail INTEGER,
  bail_next_break DATE,
  bail_gmap_link TEXT,
  bail_gmap_note TEXT,
  bail_loyer_ht NUMERIC,
  bail_cnr NUMERIC,
  bail_prise_effet DATE,
  bail_activite TEXT,
  bail_anciennete INTEGER,
  net_vendeur NUMERIC,
  agent NUMERIC,
  hono_notaire NUMERIC,
  last_value NUMERIC,
  tri NUMERIC,
  investment_date DATE,
  investment_amount NUMERIC,
  notary_fees NUMERIC,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own investments" 
ON public.investments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" 
ON public.investments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" 
ON public.investments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" 
ON public.investments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investments_updated_at
  BEFORE UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();