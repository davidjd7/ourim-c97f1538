import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useCompanies } from '@/contexts/CompanyContext';
import { useToast } from '@/hooks/use-toast';

export function CompanyManagement() {
  const { companies, addCompany, updateCompany, deleteCompany, loading } = useCompanies();
  const { toast } = useToast();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;

    try {
      await addCompany(newCompanyName.trim());
      setNewCompanyName('');
      setIsAdding(false);
      toast({
        title: "Société ajoutée",
        description: "La société a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la société.",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      await updateCompany(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      toast({
        title: "Société modifiée",
        description: "La société a été mise à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de la société.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteCompany(id);
      toast({
        title: "Société supprimée",
        description: "La société a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de la société.",
        variant: "destructive"
      });
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des Sociétés</CardTitle>
        <CardDescription>
          Gérez vos sociétés pour organiser vos investissements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new company */}
        <div className="flex gap-2">
          {isAdding ? (
            <>
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Nom de la société"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
              />
              <Button onClick={handleAddCompany} size="sm">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => {
                setIsAdding(false);
                setNewCompanyName('');
              }} size="sm">
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une société
            </Button>
          )}
        </div>

        {/* Companies list */}
        <div className="space-y-2">
          {companies.map((company) => (
            <div key={company.id} className="flex items-center gap-2 p-3 border rounded-lg">
              {editingId === company.id ? (
                <>
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleEditCompany(company.id)}
                  />
                  <Button onClick={() => handleEditCompany(company.id)} size="sm">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{company.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(company.id, company.name)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCompany(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {companies.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Aucune société créée pour le moment
          </div>
        )}
      </CardContent>
    </Card>
  );
}