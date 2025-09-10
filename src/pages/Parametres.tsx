import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings, Users, Building2, Tags, Bot, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CompanyManagement } from '@/components/companies/CompanyManagement';
import { TagsManagement } from '@/components/settings/TagsManagement';

export default function Parametres() {
  const { toast } = useToast();
  
  // État pour les paramètres
  const [settings, setSettings] = useState({
    currency: 'EUR',
    fxRate: '',
    notaryFees: 8.00,
    anthropicModel: '',
    anthropicKey: '',
    gmapsKey: '',
    promptImmo: '',
    promptPE: ''
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="ia">IA & Prompts</TabsTrigger>
          <TabsTrigger value="api">Clés API</TabsTrigger>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Devise de Reporting</Label>
                  <Input 
                    id="currency" 
                    value={settings.currency} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fx-rate">Taux EUR/USD Manuel</Label>
                  <Input 
                    id="fx-rate" 
                    type="number" 
                    step="0.0001" 
                    placeholder="1.0500"
                    value={settings.fxRate}
                    onChange={(e) => handleSettingChange('fxRate', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notary-fees">Honoraires Notaire (%)</Label>
                  <Input 
                    id="notary-fees" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100"
                    value={settings.notaryFees}
                    onChange={(e) => handleSettingChange('notaryFees', Number(e.target.value))}
                    placeholder="8.00" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Application</Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Utilisé pour tous les calculs All In des investissements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Configuration IA
              </CardTitle>
              <CardDescription>
                Paramètres pour l'intégration Claude/Anthropic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-model">Modèle Anthropic</Label>
                <Input 
                  id="anthropic-model" 
                  placeholder="claude-3-sonnet-20240229"
                  value={settings.anthropicModel}
                  onChange={(e) => handleSettingChange('anthropicModel', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prompt-immo">Prompt Immobilier</Label>
                  <Textarea 
                    id="prompt-immo" 
                    rows={6}
                    placeholder="Prompt pour l'analyse des documents immobiliers..."
                    value={settings.promptImmo}
                    onChange={(e) => handleSettingChange('promptImmo', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-pe">Prompt Private Equity</Label>
                  <Textarea 
                    id="prompt-pe" 
                    rows={6}
                    placeholder="Prompt pour l'analyse des documents PE..."
                    value={settings.promptPE}
                    onChange={(e) => handleSettingChange('promptPE', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" />
                Clés API
              </CardTitle>
              <CardDescription>
                Configuration des services externes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Clé API Anthropic</Label>
                <Input 
                  id="anthropic-key" 
                  type="password" 
                  placeholder="sk-..."
                  value={settings.anthropicKey}
                  onChange={(e) => handleSettingChange('anthropicKey', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gmaps-key">Clé API Google Maps</Label>
                <Input 
                  id="gmaps-key" 
                  type="password" 
                  placeholder="AIza..."
                  value={settings.gmapsKey}
                  onChange={(e) => handleSettingChange('gmapsKey', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <TagsManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="card-financial">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Gestion des Utilisateurs
              </CardTitle>
              <CardDescription>
                Administration des comptes et accès (ADMIN uniquement)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité réservée aux administrateurs</p>
              </div>
            </CardContent>
          </Card>
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