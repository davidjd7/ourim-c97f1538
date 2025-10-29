import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Users, Building2, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CompanyManagement } from '@/components/companies/CompanyManagement';
import { TagsManagement } from '@/components/settings/TagsManagement';
import { UserManagement } from '@/components/settings/UserManagement';
import { useUserRole } from '@/hooks/useUserRole';

export default function Parametres() {
  const { toast } = useToast();
  const { userRole, isLoading: roleLoading } = useUserRole();
  
  // État pour les paramètres
  const [settings, setSettings] = useState({
    currency: 'EUR'
  });

  const handleSettingChange = (key: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Ici on sauvegarderait normalement dans une base de données ou localStorage
    localStorage.setItem('familyOfficeSettings', JSON.stringify(settings));
    
    // Déclencher un événement pour notifier les autres composants
    window.dispatchEvent(new CustomEvent('settingsUpdated'));
    
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres ont été sauvegardés avec succès.",
    });
  };

  // Charger les paramètres au démarrage
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('familyOfficeSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);
  // Bloquer l'accès si l'utilisateur n'est pas admin
  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-lg text-muted-foreground">
            Configuration de l'application Family Office
          </p>
        </div>
        <Card className="card-financial">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
          <p className="text-lg text-muted-foreground">
            Configuration de l'application Family Office
          </p>
        </div>
        <Card className="card-financial">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Accès Refusé
            </CardTitle>
            <CardDescription>
              Cette page est réservée aux administrateurs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Accès non autorisé</p>
              <p className="text-sm">Seuls les administrateurs peuvent accéder à cette page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-lg text-muted-foreground">
          Configuration de l'application Family Office
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="societes">Sociétés</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Paramètres Généraux
              </CardTitle>
              <CardDescription>
                Configuration générale de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise de Reporting</Label>
                  <Input 
                    id="currency" 
                    value={settings.currency} 
                    disabled 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <TagsManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="societes" className="space-y-6">
          <CompanyManagement />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button className="btn-financial" onClick={handleSave}>
          Sauvegarder les Paramètres
        </Button>
      </div>
    </div>
  );
}