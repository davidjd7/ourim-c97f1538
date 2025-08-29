import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Building, TrendingUp, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusProgress } from '@/components/investments/StatusProgress';
import { DocumentsTab } from '@/components/investments/tabs/DocumentsTab';
import { NotesTab } from '@/components/investments/tabs/NotesTab';
import { GeneralTab } from '@/components/investments/tabs/GeneralTab';
import { PerformanceTab } from '@/components/investments/tabs/PerformanceTab';
import { DetteTab } from '@/components/investments/tabs/DetteTab';
import { HistoriqueTab } from '@/components/investments/tabs/HistoriqueTab';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

export default function InvestissementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, isLoading } = useUserRole();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isEditMode, setIsEditMode] = useState(false);

  // Mock data - en attendant la vraie intégration
  const [investment, setInvestment] = useState<{
    id: string | undefined;
    name: string;
    type: 'IMMO' | 'PE';
    status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
    dateInvestment: string;
    lastValue: number;
    lastTRI: number;
    lastCashflow: number;
    lastVariation: { value: number; percentage: number };
    address: string;
    surface: number;
    investmentAmount: number;
    acquisitionDate: string;
    notaryFees: number;
    renovationBudget: number;
  }>({
    id: id,
    name: 'Faisanderie Paris',
    type: 'IMMO',
    status: 'DUE_DIL',
    dateInvestment: '2023-03-15',
    lastValue: 2170000,
    lastTRI: 6.8,
    lastCashflow: 98084,
    lastVariation: { value: 50000, percentage: 2.4 },
    address: '12 rue de la Faisanderie, 75016 Paris',
    surface: 250,
    investmentAmount: 0,
    acquisitionDate: '2023-03-15',
    notaryFees: 168000,
    renovationBudget: 50000
  });

  const [tempEditData, setTempEditData] = useState({
    name: investment.name,
    type: investment.type
  });

  const handleStatusChange = (newStatus: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP', data?: any) => {
    setInvestment(prev => {
      const updated = { ...prev, status: newStatus };
      
      // Si on passe au statut INVESTI, mettre à jour les données financières
      if (newStatus === 'INVESTI' && data) {
        updated.investmentAmount = data.amount;
        // Corriger le décalage de date en utilisant le fuseau horaire local
        const localDateString = `${data.date.getFullYear()}-${String(data.date.getMonth() + 1).padStart(2, '0')}-${String(data.date.getDate()).padStart(2, '0')}`;
        updated.dateInvestment = localDateString;
        updated.acquisitionDate = localDateString;
        updated.notaryFees = data.cost;
      }
      
      return updated;
    });
  };

  const handleSaveChanges = () => {
    setInvestment(prev => ({
      ...prev,
      name: tempEditData.name,
      type: tempEditData.type
    }));
    setIsEditMode(false);
    toast({
      title: "Modifications sauvegardées",
      description: "Les informations ont été mises à jour avec succès.",
    });
  };

  const handleCancelEdit = () => {
    setTempEditData({
      name: investment.name,
      type: investment.type
    });
    setIsEditMode(false);
  };

  const statusConfig = {
    RECU: { label: 'Reçu', className: 'status-recu' },
    DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
    INVESTI: { label: 'Investi', className: 'status-investi' },
    VENDU: { label: 'Vendu', className: 'status-vendu' },
    DROP: { label: 'Drop', className: 'status-drop' }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
            <div className="flex items-center gap-3">
              {!isEditMode ? (
                <>
                  {investment.type === 'IMMO' ? (
                    <Building className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-3">
                    <div>
                      <h1 className="text-2xl font-bold">{investment.name}</h1>
                      <p className="text-muted-foreground">
                        {investment.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                      </p>
                    </div>
                    {canEdit && (
                      <Button 
                        onClick={() => setIsEditMode(true)}
                        className="btn-financial gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Modifier
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {tempEditData.type === 'IMMO' ? (
                    <Building className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-3">
                    <div className="space-y-2">
                      <Input
                        value={tempEditData.name}
                        onChange={(e) => setTempEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="text-2xl font-bold border-0 p-0 h-auto"
                      />
                      <Select
                        value={tempEditData.type}
                        onValueChange={(value: 'IMMO' | 'PE') => setTempEditData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="w-auto border-0 p-0 h-auto text-muted-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMMO">Investissement Immobilier</SelectItem>
                          <SelectItem value="PE">Private Equity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveChanges}
                        className="btn-financial gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Sauvegarder
                      </Button>
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="gap-2"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
        </div>
      </div>

      {/* Status Progress */}
      <StatusProgress 
        currentStatus={investment.status} 
        className="mb-6" 
        onStatusChange={handleStatusChange}
      />

      {/* Performance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">Dernière valeur</label>
            <p className="font-medium financial-value text-xl">
              {formatCurrency(investment.lastValue)}
            </p>
          </div>
        </div>
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">TRI</label>
            <p className="font-medium financial-value text-xl">
              {formatPercentage(investment.lastTRI)}
            </p>
          </div>
        </div>
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">Variation</label>
            <p className={`font-medium financial-value text-xl ${
              investment.lastVariation.percentage >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {investment.lastVariation.percentage >= 0 ? '+' : ''}
              {formatPercentage(investment.lastVariation.percentage)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents & IA</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="dette">Dette</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab 
            investmentId={id || ''} 
            isEditMode={isEditMode}
            investmentData={investment}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab investmentId={id || ''} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab investmentId={id || ''} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab investmentId={id || ''} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="dette" className="mt-6">
          <DetteTab investmentId={id || ''} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <HistoriqueTab investmentId={id || ''} isEditMode={isEditMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}