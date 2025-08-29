import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  isPrivate: boolean;
}

interface NotesTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Due Diligence - Points d\'attention',
    content: 'Points importants relevés lors de la due diligence:\n- Vérifier les permis de construire\n- Analyser les charges de copropriété\n- Confirmer la rentabilité locative',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    author: 'A. Dahan',
    isPrivate: false
  },
  {
    id: '2',
    title: 'Note privée - Négociation',
    content: 'Stratégie de négociation confidentielle...',
    createdAt: '2024-01-10T14:20:00Z',
    updatedAt: '2024-01-12T09:15:00Z',
    author: 'D. Dahan',
    isPrivate: true
  }
];

export function NotesTab({ investmentId }: NotesTabProps) {
  const { canEdit, userRole } = useUserRole();
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', isPrivate: false });

  const filteredNotes = notes.filter(note => {
    if (note.isPrivate && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  const handleAddNote = () => {
    if (newNote.title.trim() && newNote.content.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        ...newNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: userRole === 'admin' ? 'D. Dahan' : 'A. Dahan'
      };
      setNotes([note, ...notes]);
      setNewNote({ title: '', content: '', isPrivate: false });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            Notes
          </CardTitle>
          {canEdit && (
            <Button 
              size="sm" 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Add Note Form */}
          {isAdding && (
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
                  <Button onClick={handleAddNote} size="sm">
                    Enregistrer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setIsAdding(false);
                      setNewNote({ title: '', content: '', isPrivate: false });
                    }}
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
                    {note.isPrivate && (
                      <Badge variant="secondary" className="text-xs">
                        Privée
                      </Badge>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
                    {new Date(note.updatedAt).toLocaleDateString('fr-FR')} à {' '}
                    {new Date(note.updatedAt).toLocaleTimeString('fr-FR', { 
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
        </CardContent>
      </Card>
    </div>
  );
}