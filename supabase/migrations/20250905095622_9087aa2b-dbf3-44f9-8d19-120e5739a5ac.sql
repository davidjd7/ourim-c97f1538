-- Créer un bucket pour les documents d'investissement
INSERT INTO storage.buckets (id, name, public) 
VALUES ('investment-documents', 'investment-documents', false);

-- Créer la table pour les métadonnées des documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'financial', 'legal', 'other')),
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs puissent voir leurs propres documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent créer leurs propres documents
CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour mettre à jour updated_at sur la table documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Politiques de stockage pour les documents
-- Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view their own documents in storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'investment-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent uploader leurs propres documents
CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'investment-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent mettre à jour leurs propres documents
CREATE POLICY "Users can update their own documents in storage" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'investment-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Les utilisateurs peuvent supprimer leurs propres documents
CREATE POLICY "Users can delete their own documents in storage" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'investment-documents' AND auth.uid()::text = (storage.foldername(name))[1]);