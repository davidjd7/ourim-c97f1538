import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useCompanies } from '@/contexts/CompanyContext';
import { useNotes } from '@/hooks/useNotes';


interface GeneralData {
  name: string;
  type: 'IMMO' | 'PE';
  dateInvestment: string;
  description: string;
  investmentAmount: number;
  companyId?: string;
  company?: string;
}

interface GeneralTabProps {
  investmentId: string;
  isEditMode?: boolean;
  investmentData?: {
    id: string | undefined;
    name: string;
    type: 'IMMO' | 'PE';
    dateInvestment: string;
    description?: string;
    investmentAmount: number;
    companyId?: string;
    company?: string;
  };
  tempEditData?: any;
  onDataChange?: (data: any) => void;
}

export function GeneralTab({ investmentId, isEditMode = false, investmentData, tempEditData, onDataChange }: GeneralTabProps) {
  const { canEdit, userRole } = useUserRole();
  const { companies } = useCompanies();
  
  // Notes management using custom hook
  const { notes: filteredNotes, loading: notesLoading, addNote, updateNote, deleteNote } = useNotes(investmentId);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', isPrivate: false });

  const handleAddNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const success = await addNote({
      title: newNote.title,
      content: newNote.content,
      isPrivate: newNote.isPrivate
    });

    if (success) {
      setNewNote({ title: '', content: '', isPrivate: false });
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (noteId: string) => {
    const noteToEdit = filteredNotes.find(note => note.id === noteId);
    if (noteToEdit) {
      setNewNote({
        title: noteToEdit.title,
        content: noteToEdit.content,
        isPrivate: noteToEdit.is_private
      });
      setEditingNote(noteId);
      setIsAddingNote(true);
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return;

    const success = await updateNote(editingNote, {
      title: newNote.title,
      content: newNote.content,
      isPrivate: newNote.isPrivate
    });

    if (success) {
      setNewNote({ title: '', content: '', isPrivate: false });
      setEditingNote(null);
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
  };

  const handleCancelEdit = () => {
    setIsAddingNote(false);
    setEditingNote(null);
    setNewNote({ title: '', content: '', isPrivate: false });
  };

  // Use passed data or default values
  const initialData = investmentData ? {
    name: investmentData.name,
    type: investmentData.type,
    dateInvestment: investmentData.dateInvestment,
    description: investmentData.description || '',
    investmentAmount: investmentData.investmentAmount,
    companyId: investmentData.companyId,
    company: investmentData.company,
  } : {
    name: '',
    type: 'IMMO' as 'IMMO' | 'PE',
    dateInvestment: '',
    description: '',
    investmentAmount: 0,
    companyId: '',
    company: '',
  };
  
  const [data, setData] = useState<GeneralData>(initialData);
  
  // In edit mode, use tempEditData from parent, otherwise use local state
  const editData = isEditMode && tempEditData ? tempEditData : data;
  
  const handleDataChange = (newData: any) => {
    if (isEditMode && onDataChange) {
      onDataChange(newData);
    }
  };

  // Sync with external data when it changes
  React.useEffect(() => {
    if (investmentData) {
      const newData = {
        name: investmentData.name,
        type: investmentData.type,
        dateInvestment: investmentData.dateInvestment,
        description: investmentData.description || '',
        investmentAmount: investmentData.investmentAmount,
        companyId: investmentData.companyId,
        company: investmentData.company,
      };
      setData(newData);
    }
  }, [investmentData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Section Informations d'Investissement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Informations d'Investissement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="dateInvestment">Date investissement</Label>
              {isEditMode ? (
                <Input
                  id="dateInvestment"
                  type="date"
                  value={editData.dateInvestment}
                  onChange={(e) => handleDataChange({ ...editData, dateInvestment: e.target.value })}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {data.dateInvestment ? new Date(data.dateInvestment).toLocaleDateString('fr-FR') : 'Non défini'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="investmentAmount">Montant Investi</Label>
              {isEditMode ? (
                <Input
                  id="investmentAmount"
                  type="number"
                  value={editData.investmentAmount}
                  onChange={(e) => handleDataChange({ ...editData, investmentAmount: Number(e.target.value) })}
                />
              ) : (
                <p className="font-medium financial-value">
                  {data.investmentAmount ? formatCurrency(data.investmentAmount) : 'Non défini'}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="description">Description générale</Label>
            {isEditMode ? (
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => handleDataChange({ ...editData, description: e.target.value })}
                placeholder="Description générale de l'investissement"
                rows={4}
              />
            ) : (
              <div className="mt-2">
                {data.description ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">Aucune description ajoutée</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </CardTitle>
          {canEdit && investmentId !== 'nouveau' && (
            <Button 
              size="sm" 
              onClick={() => setIsAddingNote(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Add Note Form */}
          {isAddingNote && (
            <div className="mb-6 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-3">
                <Input
                  placeholder="Titre de la note..."
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
                <Textarea
                  placeholder="Contenu de la note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                />
                {userRole === 'admin' && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newNote.isPrivate}
                      onChange={(e) => setNewNote({ ...newNote, isPrivate: e.target.checked })}
                      className="rounded border-border"
                    />
                    Note privée (visible uniquement par les admins)
                  </label>
                )}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={editingNote ? handleUpdateNote : handleAddNote}
                    disabled={!newNote.title.trim() || !newNote.content.trim()}
                  >
                    {editingNote ? 'Modifier' : 'Ajouter'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notesLoading ? (
              <p className="text-muted-foreground">Chargement des notes...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-muted-foreground italic">Aucune note ajoutée</p>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{note.title}</h4>
                      {note.is_private && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Privé
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditNote(note.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap mb-2">{note.content}</p>
                  <div className="text-xs text-muted-foreground">
                    Par {note.author} • {new Date(note.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}