-- Create table for investment performance cashflows
CREATE TABLE public.investment_cashflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  rex NUMERIC DEFAULT 0,
  retrait_amort NUMERIC DEFAULT 0,
  retrait_autres NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_cashflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own investment cashflows" 
ON public.investment_cashflows 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment cashflows" 
ON public.investment_cashflows 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment cashflows" 
ON public.investment_cashflows 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment cashflows" 
ON public.investment_cashflows 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_cashflows_updated_at
BEFORE UPDATE ON public.investment_cashflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create performance data table for storing current values, tri, etc.
CREATE TABLE public.investment_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  current_value NUMERIC DEFAULT 0,
  initial_value NUMERIC DEFAULT 0,
  total_return NUMERIC DEFAULT 0,
  return_percentage NUMERIC DEFAULT 0,
  tri NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for performance table
CREATE POLICY "Users can view their own investment performance" 
ON public.investment_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment performance" 
ON public.investment_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investment performance" 
ON public.investment_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment performance" 
ON public.investment_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_performance_updated_at
BEFORE UPDATE ON public.investment_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();