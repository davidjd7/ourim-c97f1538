-- Create investment history table
CREATE TABLE public.investment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own investment history"
ON public.investment_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create investment history entries"
ON public.investment_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_investment_history_investment_id ON public.investment_history(investment_id);
CREATE INDEX idx_investment_history_created_at ON public.investment_history(created_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investment_history_updated_at
  BEFORE UPDATE ON public.investment_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();