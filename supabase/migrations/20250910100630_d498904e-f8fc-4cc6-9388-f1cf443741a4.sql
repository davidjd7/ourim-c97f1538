-- Create tags table for managing available tags
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security for tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Create policies for tags
CREATE POLICY "Users can view their own tags" 
ON public.tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
ON public.tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
ON public.tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
ON public.tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create junction table for investment-tag relationships
CREATE TABLE public.investment_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(investment_id, tag_id)
);

-- Enable Row Level Security for investment_tags
ALTER TABLE public.investment_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for investment_tags
CREATE POLICY "Users can view their own investment tags" 
ON public.investment_tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investment tags" 
ON public.investment_tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investment tags" 
ON public.investment_tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create some default tags for new users
INSERT INTO public.tags (user_id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Priorité haute', '#EF4444'),
  ('00000000-0000-0000-0000-000000000000', 'Opportunité', '#10B981'),
  ('00000000-0000-0000-0000-000000000000', 'À surveiller', '#F59E0B'),
  ('00000000-0000-0000-0000-000000000000', 'Recommandé', '#8B5CF6')
ON CONFLICT (user_id, name) DO NOTHING;