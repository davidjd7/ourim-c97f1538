import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, MapPin, Calendar, FileText, Link, Calculator, Settings, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useSettings } from '@/hooks/useSettings';
import { useCompanies } from '@/contexts/CompanyContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Note {
  id: string;
  investment_id: string;
  user_id: string;
  title: string;
  content: string;
  is_private: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

interface GeneralData {
  name: string;
  type: 'IMMO' | 'PE';
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  dateInvestment: string;
  address: string;
  surface: number;
  description: string;
  investmentAmount: number;
  acquisitionDate: string;
  notaryFees: number;
  renovationBudget: number;
  companyId?: string;
  company?: string;
  // Bail fields
  bailPriseEffet: string;
  bailActivite: string;
  bailAnciennete: number;
  bailNextBreak: string;
  bailFinBail: string;
  bailGmapLink: string;
  bailGmapNote: string;
  bailLoyerHT: number;
  bailCNR: number;
  // Présentation Vente fields
  netVendeur: number;
  agent: number;
  honoNotaire: number; // Ce sera géré via les paramètres plus tard
}

interface GeneralTabProps {
  investmentId: string;
  isEditMode?: boolean;
  investmentData?: {
    id: string | undefined;
    name: string;
    type: 'IMMO' | 'PE';
    status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
    dateInvestment: string;
    address: string;
    surface: number;
    description?: string;
    investmentAmount: number;
    acquisitionDate: string;
    notaryFees: number;
    renovationBudget: number;
    companyId?: string;  // Added this field
    company?: string;
    // Bail fields
    bailPriseEffet?: string;
    bailActivite?: string;
    bailAnciennete?: number;
    bailNextBreak?: string;
    bailFinBail?: string;
    bailGmapLink?: string;
    bailGmapNote?: string;
    bailLoyerHT?: number;
    bailCNR?: number;
    // Présentation Vente fields
    netVendeur?: number;
    agent?: number;
    honoNotaire?: number;
  };
  tempEditData?: any;
  onDataChange?: (data: any) => void;
}

const mockGeneralData: GeneralData = {
  name: 'Faisanderie Paris',
  type: 'IMMO',
  status: 'DUE_DIL', // Changé de INVESTI à DUE_DIL pour refléter l'état actuel
  dateInvestment: '2023-03-15',
  address: '12 rue de la Faisanderie, 75016 Paris',
  surface: 250,
  description: 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris. Situé au 3ème étage avec ascenseur, vue dégagée sur jardins privatifs.',
  investmentAmount: 0, // Sera mis à jour quand le statut passe à INVESTI
  acquisitionDate: '2023-03-15',
  notaryFees: 168000,
  renovationBudget: 50000,
  // Bail mock data
  bailPriseEffet: '2023-01-01',
  bailActivite: 'Bureau',
  bailAnciennete: 5,
  bailNextBreak: '2028-01-01',
  bailFinBail: '2032-01-01',
  bailGmapLink: 'https://maps.google.com/?q=12+rue+de+la+Faisanderie+75016+Paris',
  bailGmapNote: 'Proche métro Trocadéro',
  bailLoyerHT: 12500,
  bailCNR: 500,
  // Présentation Vente mock data
  netVendeur: 2100000,
  agent: 0.03, // 3%
  honoNotaire: 0.08 // 8% - sera géré par les paramètres plus tard
};

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function GeneralTab({ investmentId, isEditMode = false, investmentData, tempEditData, onDataChange }: GeneralTabProps) {
  const { canEdit, userRole } = useUserRole();
  const settings = useSettings();
  const { companies } = useCompanies();
  const { user } = useAuth();
  
  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', isPrivate: false });
  const [notesLoading, setNotesLoading] = useState(true);
  // Load notes from Supabase
  useEffect(() => {
    const loadNotes = async () => {
      if (!user || !investmentId) return;

      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('investment_id', investmentId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setNotesLoading(false);
      }
    };

    loadNotes();
  }, [user, investmentId]);

  const filteredNotes = notes.filter(note => {
    if (note.is_private && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  const handleAddNote = async () => {
    if (!user || !newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const noteData = {
        investment_id: investmentId,
        user_id: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        is_private: newNote.isPrivate,
        author: userRole === 'admin' ? 'D. Dahan' : 'A. Dahan'
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setNotes([data, ...notes]);
        setNewNote({ title: '', content: '', isPrivate: false });
        setIsAddingNote(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = (noteId: string) => {
    const noteToEdit = notes.find(note => note.id === noteId);
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
    if (!user || !editingNote || !newNote.title.trim() || !newNote.content.trim()) return;

    try {
      const updateData = {
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        is_private: newNote.isPrivate
      };

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', editingNote)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setNotes(notes.map(note => 
          note.id === editingNote ? data : note
        ));
        setNewNote({ title: '', content: '', isPrivate: false });
        setEditingNote(null);
        setIsAddingNote(false);
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsAddingNote(false);
    setEditingNote(null);
    setNewNote({ title: '', content: '', isPrivate: false });
  };

  // Utiliser les données passées en prop ou les données mock par défaut
  const initialData = investmentData ? {
    name: investmentData.name,
    type: investmentData.type,
    status: investmentData.status,
    dateInvestment: investmentData.dateInvestment,
    address: investmentData.address,
    surface: investmentData.surface,
    description: investmentData.description || '',
    investmentAmount: investmentData.investmentAmount,
    acquisitionDate: investmentData.acquisitionDate,
    notaryFees: investmentData.notaryFees,
    renovationBudget: investmentData.renovationBudget,
    companyId: investmentData.companyId, // ← AJOUT CRUCIAL
    company: investmentData.company,
    // Bail fields avec valeurs par défaut
    bailPriseEffet: investmentData.bailPriseEffet || '',
    bailActivite: investmentData.bailActivite || '',
    bailAnciennete: investmentData.bailAnciennete || 0,
    bailNextBreak: investmentData.bailNextBreak || '',
    bailFinBail: investmentData.bailFinBail || '',
    bailGmapLink: investmentData.bailGmapLink || '',
    bailGmapNote: investmentData.bailGmapNote || '',
    bailLoyerHT: investmentData.bailLoyerHT || 0,
    bailCNR: investmentData.bailCNR || 0,
    // Présentation Vente fields avec valeurs par défaut - utiliser les paramètres pour honoNotaire
    netVendeur: investmentData.netVendeur || 0,
    agent: investmentData.agent || 0,
    honoNotaire: settings.notaryFees / 100 // Convertir en décimal depuis les paramètres
  } : {
    ...mockGeneralData,
    honoNotaire: settings.notaryFees / 100 // Utiliser la valeur des paramètres
  };
  
  const [data, setData] = useState<GeneralData>(initialData);
  
  // En mode édition, utiliser tempEditData du parent, sinon utiliser l'état local
  const editData = isEditMode && tempEditData ? tempEditData : data;
  
  const handleDataChange = (newData: any) => {
    if (isEditMode && onDataChange) {
      onDataChange(newData);
    }
  };

  // Synchroniser avec les données externes quand elles changent
  React.useEffect(() => {
    if (investmentData) {
      const newData = {
        name: investmentData.name,
        type: investmentData.type,
        status: investmentData.status,
        dateInvestment: investmentData.dateInvestment,
        address: investmentData.address,
        surface: investmentData.surface,
        description: investmentData.description || '',
        investmentAmount: investmentData.investmentAmount,
        acquisitionDate: investmentData.acquisitionDate,
        notaryFees: investmentData.notaryFees,
        renovationBudget: investmentData.renovationBudget,
        company: investmentData.company,
        // Bail fields avec valeurs par défaut
        bailPriseEffet: investmentData.bailPriseEffet || '',
        bailActivite: investmentData.bailActivite || '',
        bailAnciennete: investmentData.bailAnciennete || 0,
        bailNextBreak: investmentData.bailNextBreak || '',
        bailFinBail: investmentData.bailFinBail || '',
        bailGmapLink: investmentData.bailGmapLink || '',
        bailGmapNote: investmentData.bailGmapNote || '',
        bailLoyerHT: investmentData.bailLoyerHT || 0,
        bailCNR: investmentData.bailCNR || 0,
        // Présentation Vente fields avec valeurs par défaut - utiliser les paramètres pour honoNotaire
        netVendeur: investmentData.netVendeur || 0,
        agent: investmentData.agent || 0,
        honoNotaire: settings.notaryFees / 100 // Utiliser la valeur des paramètres
      };
      setData(newData);
    }
  }, [investmentData, settings.notaryFees]); // Ajouter settings.notaryFees comme dépendance

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

              <div>
                <Label htmlFor="notaryFees">Coût Investissement</Label>
                {isEditMode ? (
                  <Input
                    id="notaryFees"
                    type="number"
                    value={editData.notaryFees}
                    onChange={(e) => handleDataChange({ ...editData, notaryFees: Number(e.target.value) })}
                  />
                ) : (
                  <p className="font-medium financial-value">
                    {data.notaryFees ? formatCurrency(data.notaryFees) : 'Non défini'}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="investAllIn">Invest All in</Label>
                <p className="font-medium financial-value text-primary">
                  {formatCurrency((isEditMode ? editData.investmentAmount : data.investmentAmount) + (isEditMode ? editData.notaryFees : data.notaryFees))}
                </p>
              </div>

              <div>
                <Label htmlFor="company">Société</Label>
                {isEditMode ? (
                  <Select 
                    value={editData.companyId || undefined} 
                    onValueChange={(value) => handleDataChange({ ...editData, companyId: value === 'clear' ? undefined : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une société" />
                    </SelectTrigger>
                    <SelectContent>
                      {editData.companyId && (
                        <SelectItem value="clear">
                          <span className="text-muted-foreground">Aucune société</span>
                        </SelectItem>
                      )}
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                      {companies.length === 0 && (
                        <SelectItem value="no-company" disabled>
                          Aucune société disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">
                    {(() => {
                      // Utiliser tempEditData.companyId comme source de vérité
                      const companyId = tempEditData?.companyId;
                      const foundCompany = companies.find(c => c.id === companyId);
                      return foundCompany?.name || (companyId ? 'Société inconnue' : 'Non défini');
                    })()}
                  </p>
                )}
              </div>
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
          {canEdit && (
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
                   <Button onClick={editingNote ? handleUpdateNote : handleAddNote} size="sm">
                     {editingNote ? 'Modifier' : 'Enregistrer'}
                   </Button>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={handleCancelEdit}
                   >
                     Annuler
                   </Button>
                 </div>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{note.title}</h3>
                    {note.is_private && (
                      <Badge variant="secondary" className="text-xs">
                        Privée
                      </Badge>
                    )}
                  </div>
                   {canEdit && (
                     <div className="flex gap-1">
                       <Button variant="ghost" size="sm" onClick={() => handleEditNote(note.id)}>
                         <Edit2 className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-destructive hover:text-destructive"
                         onClick={() => handleDeleteNote(note.id)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   )}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                  {note.content}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Par {note.author}</span>
                  <span>
                    {new Date(note.updated_at).toLocaleDateString('fr-FR')} à {' '}
                    {new Date(note.updated_at).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
            {filteredNotes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune note disponible
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Description Section */}
          <div>
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
              <div className="mt-2 p-4 bg-muted/50 rounded-lg">
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

      {/* Section Présentation Vente - Supprimée */}
    </div>
  );
}