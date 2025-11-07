import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { logError } from '@/lib/errorHandler';
import { noteSchema } from '@/lib/validationSchemas';
import { toast } from 'sonner';

interface Note {
  id: string;
  immobilier_id: string;
  user_id: string;
  title: string;
  content: string;
  is_private: boolean;
  author: string;
  created_at: string;
  updated_at: string;
}

export function useNotes(investmentId: string) {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notes from Supabase
  useEffect(() => {
    const loadNotes = async () => {
      if (!user || !investmentId || investmentId === 'nouveau') return;

      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('immobilier_id', investmentId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotes(data || []);
      } catch (error) {
        logError(error, { 
          component: 'useNotes',
          function: 'loadNotes',
          investmentId,
          userId: user?.id 
        });
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

  const addNote = async (noteData: { title: string; content: string; isPrivate: boolean }) => {
    if (!user) return false;

    // Validate input
    try {
      noteSchema.parse(noteData);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || 'Données invalides');
      return false;
    }

    try {
      const data = {
        immobilier_id: investmentId,
        user_id: user.id,
        title: noteData.title.trim(),
        content: noteData.content.trim(),
        is_private: noteData.isPrivate,
        author: userRole === 'admin' ? 'D. Dahan' : 'A. Dahan'
      };

      const { data: insertedNote, error } = await supabase
        .from('notes')
        .insert([data])
        .select('*')
        .single();

      if (error) throw error;

      if (insertedNote) {
        setNotes([insertedNote, ...notes]);
        return true;
      }
    } catch (error) {
      logError(error, {
        component: 'useNotes',
        function: 'addNote',
        investmentId,
        userId: user?.id
      });
    }
    return false;
  };

  const updateNote = async (noteId: string, noteData: { title: string; content: string; isPrivate: boolean }) => {
    if (!user) return false;

    // Validate input
    try {
      noteSchema.parse(noteData);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || 'Données invalides');
      return false;
    }

    try {
      const updateData = {
        title: noteData.title.trim(),
        content: noteData.content.trim(),
        is_private: noteData.isPrivate
      };

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setNotes(notes.map(note => note.id === noteId ? data : note));
        return true;
      }
    } catch (error) {
      logError(error, {
        component: 'useNotes',
        function: 'updateNote',
        investmentId,
        userId: user?.id,
        additionalData: { noteId }
      });
    }
    return false;
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotes(notes.filter(note => note.id !== noteId));
      return true;
    } catch (error) {
      logError(error, {
        component: 'useNotes',
        function: 'deleteNote',
        investmentId,
        userId: user?.id,
        additionalData: { noteId }
      });
    }
    return false;
  };

  return {
    notes: filteredNotes,
    loading,
    addNote,
    updateNote,
    deleteNote
  };
}