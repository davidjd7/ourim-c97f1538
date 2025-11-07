import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';
import { useTags, Tag } from '@/hooks/useTags';
import { useUserRole } from '@/hooks/useUserRole';
import { tagSchema } from '@/lib/validationSchemas';
import { toast } from 'sonner';

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange  
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#059669', // Emerald
];

export function TagsManagement() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { tags, loading, createTag, updateTag, deleteTag } = useTags();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);

  const handleCreateTag = async () => {
    // Validate input
    try {
      tagSchema.parse({ name: newTagName, color: newTagColor });
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || 'Données invalides');
      return;
    }
    
    try {
      await createTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setNewTagColor(DEFAULT_COLORS[0]);
      setCreateDialogOpen(false);
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleEditTag = async () => {
    if (!editingTag) return;
    
    // Validate input
    try {
      tagSchema.parse({ name: newTagName, color: newTagColor });
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || 'Données invalides');
      return;
    }
    
    try {
      await updateTag(editingTag.id, newTagName.trim(), newTagColor);
      setEditingTag(null);
      setNewTagName('');
      setNewTagColor(DEFAULT_COLORS[0]);
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
    } catch (error) {
      // Error handled by the hook
    }
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setNewTagColor(tag.color);
  };

  const closeEditDialog = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor(DEFAULT_COLORS[0]);
  };

  if (roleLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Gestion des Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            Gestion des Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Accès réservé aux administrateurs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            <CardTitle>Gestion des Tags</CardTitle>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouveau tag</DialogTitle>
                <DialogDescription>
                  Ajoutez un tag pour organiser vos investissements.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tag-name">Nom du tag</Label>
                  <Input
                    id="tag-name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Ex: Priorité haute"
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label>Couleur</Label>
                  <div className="flex gap-2 mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTagColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          newTagColor === color ? 'border-foreground' : 'border-muted'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
                    Créer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-muted animate-pulse rounded-full" />
                  <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                  <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TagIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun tag créé pour le moment</p>
            <p className="text-sm">Créez votre premier tag pour organiser vos investissements</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <Badge 
                    variant="secondary"
                    style={{ 
                      backgroundColor: tag.color + '20',
                      color: tag.color,
                      borderColor: tag.color + '40'
                    }}
                    className="border"
                  >
                    {tag.name}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(tag)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer le tag "{tag.name}" ?
                          Cette action supprimera aussi toutes les associations avec les investissements.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTag(tag.id)}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le tag</DialogTitle>
              <DialogDescription>
                Modifiez le nom et la couleur du tag.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tag-name">Nom du tag</Label>
                <Input
                  id="edit-tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Priorité haute"
                  maxLength={50}
                />
              </div>
              <div>
                <Label>Couleur</Label>
                <div className="flex gap-2 mt-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color ? 'border-foreground' : 'border-muted'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeEditDialog}>
                  Annuler
                </Button>
                <Button onClick={handleEditTag} disabled={!newTagName.trim()}>
                  Modifier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}