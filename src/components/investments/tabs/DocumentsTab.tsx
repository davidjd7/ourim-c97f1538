import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Trash2, MessageSquare } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'financial' | 'legal' | 'other';
  created_at: string;
  file_size: number;
  file_path: string;
  mime_type?: string;
}

interface DocumentsTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

const documentTypeConfig = {
  contract: { label: 'Contrat', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  financial: { label: 'Financier', className: 'bg-green-50 text-green-700 border-green-200' },
  legal: { label: 'Juridique', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: 'Autre', className: 'bg-gray-50 text-gray-700 border-gray-200' }
};

export function DocumentsTab({ investmentId }: DocumentsTabProps) {
  const { canEdit } = useUserRole();
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les documents depuis la base de données
  const loadDocuments = async () => {
    if (!user || !investmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('investment_id', investmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []).map(doc => ({
        ...doc,
        type: doc.type as 'contract' | 'financial' | 'legal' | 'other'
      })));
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des documents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user, investmentId]);

  const getFileType = (filename: string): 'contract' | 'financial' | 'legal' | 'other' => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('contrat') || lowerName.includes('contract')) return 'contract';
    if (lowerName.includes('financier') || lowerName.includes('financial')) return 'financial';
    if (lowerName.includes('juridique') || lowerName.includes('legal') || lowerName.includes('notaire')) return 'legal';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAddDocument = () => {
    if (!user || !canEdit) return;

    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setLoading(true);
      const uploadedFiles = [];

      try {
        for (const file of Array.from(files)) {
          // Générer un nom de fichier unique
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
          const filePath = `${user.id}/${investmentId}/${fileName}`;

          // Upload vers Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('investment-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // Sauvegarder les métadonnées en base
          const documentType = getFileType(file.name);
          const { data: document, error: dbError } = await supabase
            .from('documents')
            .insert({
              user_id: user.id,
              investment_id: investmentId,
              name: file.name,
              type: documentType,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type
            })
            .select()
            .single();

          if (dbError) throw dbError;
          uploadedFiles.push(document);
        }

        // Recharger les documents
        await loadDocuments();
        
        toast({
          title: "Documents ajoutés",
          description: `${uploadedFiles.length} document(s) ajouté(s) avec succès.`,
        });
      } catch (error) {
        console.error('Error uploading documents:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de l'ajout des documents.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    input.click();
  };

  const handleDownloadDocument = async (doc: Document) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.storage
        .from('investment-documents')
        .download(doc.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Téléchargement",
        description: `${doc.name} téléchargé avec succès.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement du document.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!user || !canEdit) return;

    try {
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('investment-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Supprimer les métadonnées de la base
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      // Recharger les documents
      await loadDocuments();
      
      toast({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression du document.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Documents Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
          {canEdit && (
            <Button 
              size="sm" 
              className="flex items-center gap-2" 
              onClick={handleAddDocument}
              disabled={loading}
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Ajout...' : 'Ajouter'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading && documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des documents...
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                   <div className="flex items-center gap-3">
                     <FileText className="h-4 w-4 text-muted-foreground" />
                     <div>
                       <p className="font-medium">{doc.name}</p>
                       <p className="text-sm text-muted-foreground">
                         {new Date(doc.created_at).toLocaleDateString('fr-FR')} • {formatFileSize(doc.file_size)}
                       </p>
                     </div>
                   </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {documents.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun document disponible
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Assistant IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary-lighter/50 border border-primary-lighter rounded-lg p-4">
            <p className="text-sm text-primary mb-3">
              L'assistant IA peut analyser vos documents et répondre à vos questions sur cet investissement.
            </p>
            <Button variant="outline" size="sm" disabled>
              Lancer l'analyse (Bientôt disponible)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}