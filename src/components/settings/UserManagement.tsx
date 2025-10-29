import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Trash2, Key, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const SUPABASE_URL = 'https://vpkkuxicbtvbwloetyly.supabase.co';

type UserRole = 'admin' | 'analyste' | 'lecteur';

interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
}

export function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('lecteur');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userToUpdatePassword, setUserToUpdatePassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch all users with their roles via edge function
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'list' })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }

      const { users } = await response.json();
      return users as UserWithRole[];
    }
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'update_role', userId, role })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle de l'utilisateur.",
        variant: "destructive",
      });
      console.error('Error updating role:', error);
    }
  });

  // Mutation to delete user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update_password',
          userId,
          password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Le mot de passe a été modifié avec succès.",
      });
      setPasswordDialogOpen(false);
      setUserToUpdatePassword(null);
      setNewPassword('');
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
      });
    },
  });

  const handleAddUser = async () => {
    if (!newUserEmail) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez saisir une adresse email.",
      });
      return;
    }

    if (newUserPassword && newUserPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No session');

      const body: any = {
        action: 'create',
        email: newUserEmail,
        role: newUserRole,
      };

      if (newUserPassword) {
        body.password = newUserPassword;
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/manage-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      
      toast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${newUserEmail} a été créé avec le rôle ${newUserRole}.`,
      });

      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('lecteur');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive",
      });
      console.error('Error creating user:', error);
    }
  };

  const handleUpdatePassword = () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    if (userToUpdatePassword) {
      updatePasswordMutation.mutate({ userId: userToUpdatePassword, password: newPassword });
    }
  };

  if (isLoading) {
    return (
      <Card className="card-financial">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestion des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-financial">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Gestion des Utilisateurs
        </CardTitle>
        <CardDescription>
          Gérer les utilisateurs et leurs rôles d'accès
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New User Section */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un Utilisateur
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="utilisateur@exemple.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe (optionnel)</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 caractères"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="analyste">Analyste</SelectItem>
                  <SelectItem value="lecteur">Lecteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddUser} className="w-full">
                Ajouter
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Si aucun mot de passe n'est fourni, l'utilisateur recevra un email pour définir son mot de passe.
          </p>
        </div>

        {/* Users List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Utilisateurs Existants</h3>
          <div className="space-y-2">
            {users?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      updateRoleMutation.mutate({ userId: user.id, role: value as UserRole })
                    }
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="analyste">Analyste</SelectItem>
                      <SelectItem value="lecteur">Lecteur</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setUserToUpdatePassword(user.id);
                      setPasswordDialogOpen(true);
                    }}
                    title="Modifier le mot de passe"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setUserToDelete(user.id);
                      setDeleteDialogOpen(true);
                    }}
                    title="Supprimer l'utilisateur"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le mot de passe</DialogTitle>
            <DialogDescription>
              Saisissez le nouveau mot de passe pour cet utilisateur. Le mot de passe doit contenir au moins 6 caractères.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPasswordDialogOpen(false);
              setNewPassword('');
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdatePassword}
              disabled={updatePasswordMutation.isPending}
            >
              {updatePasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
