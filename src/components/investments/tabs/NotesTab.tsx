import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

interface NotesTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

export function NotesTab({ investmentId }: NotesTabProps) {
  const { canEdit, userRole } = useUserRole();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', isPrivate: false });
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
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
        setIsAdding(false);
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
      setIsAdding(true);
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
        setIsAdding(false);
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
    setIsAdding(false);
    setEditingNote(null);
    setNewNote({ title: '', content: '', isPrivate: false });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              Chargement des notes...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        </CardContent>
      </Card>
    </div>
  );
}