import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Trash2, MessageSquare } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'financial' | 'legal' | 'other';
  uploadedAt: string;
  size: string;
  url: string;
}

interface DocumentsTabProps {
  investmentId: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Contrat d\'investissement.pdf',
    type: 'contract',
    uploadedAt: '2024-01-15',
    size: '2.3 MB',
    url: '#'
  },
  {
    id: '2',
    name: 'Rapport_financier_Q4.xlsx',
    type: 'financial',
    uploadedAt: '2024-01-10',
    size: '1.8 MB',
    url: '#'
  }
];

const documentTypeConfig = {
  contract: { label: 'Contrat', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  financial: { label: 'Financier', className: 'bg-green-50 text-green-700 border-green-200' },
  legal: { label: 'Juridique', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  other: { label: 'Autre', className: 'bg-gray-50 text-gray-700 border-gray-200' }
};

export function DocumentsTab({ investmentId }: DocumentsTabProps) {
  const { canEdit } = useUserRole();
  const [documents] = useState<Document[]>(mockDocuments);

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
            <Button size="sm" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
                      {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')} • {doc.size}
                    </p>
                  </div>
                  <Badge variant="outline" className={documentTypeConfig[doc.type].className}>
                    {documentTypeConfig[doc.type].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun document disponible
              </div>
            )}
          </div>
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