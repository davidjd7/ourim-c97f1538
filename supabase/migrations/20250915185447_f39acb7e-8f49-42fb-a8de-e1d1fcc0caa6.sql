-- Update the documents table to allow 'debt' type
ALTER TABLE public.documents 
DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE public.documents 
ADD CONSTRAINT documents_type_check 
CHECK (type IN ('general', 'contract', 'invoice', 'report', 'other', 'debt'));