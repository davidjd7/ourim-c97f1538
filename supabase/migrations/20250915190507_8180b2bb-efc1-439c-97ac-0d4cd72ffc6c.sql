-- Add debt_document_id column to debt_characteristics table
ALTER TABLE public.debt_characteristics 
ADD COLUMN debt_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;