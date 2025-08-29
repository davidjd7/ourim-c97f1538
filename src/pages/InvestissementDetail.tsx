import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { StatusProgress } from '@/components/investments/StatusProgress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralTab } from '@/components/investments/tabs/GeneralTab';
import { PerformanceTab } from '@/components/investments/tabs/PerformanceTab';
import { DocumentsTab } from '@/components/investments/tabs/DocumentsTab';
import { NotesTab } from '@/components/investments/tabs/NotesTab';
import { HistoriqueTab } from '@/components/investments/tabs/HistoriqueTab';
import { DetteTab } from '@/components/investments/tabs/DetteTab';
import { useInvestments } from '@/contexts/InvestmentContext';

export default function InvestissementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const { investments, updateInvestment, getInvestment } = useInvestments();

  // Get investment from global context
  const investment = getInvestment(id || '');

  if (!investment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Investissement introuvable</p>
      </div>
    );
  }

  const [tempEditData, setTempEditData] = useState({
    name: investment.name,
    type: investment.type,
    address: investment.address || '',
    surface: investment.surface || 0,
    price: investment.price || 0,
    dateAcquisition: investment.dateAcquisition || '',
    // Bail fields
    locataire: investment.locataire || '',
    dateEntree: investment.dateEntree || '',
    typeBail: investment.typeBail || '',
    dureeBail: investment.dureeBail || 0,
    bailNextBreak: investment.bailNextBreak || '',
    bailGmapLink: investment.bailGmapLink || '',
    bailGmapNote: investment.bailGmapNote || '',
    bailLoyerHT: investment.bailLoyerHT || 0,
    bailCNR: investment.bailCNR || 0,
    // Présentation Vente fields
    netVendeur: investment.netVendeur || 0,
    agent: investment.agent || 0,
    honoNotaire: investment.honoNotaire || 0.08
  });

  // Update tempEditData when investment changes
  useEffect(() => {
    setTempEditData({
      name: investment.name,
      type: investment.type,
      address: investment.address || '',
      surface: investment.surface || 0,
      price: investment.price || 0,
      dateAcquisition: investment.dateAcquisition || '',
      // Bail fields
      locataire: investment.locataire || '',
      dateEntree: investment.dateEntree || '',
      typeBail: investment.typeBail || '',
      dureeBail: investment.dureeBail || 0,
      bailNextBreak: investment.bailNextBreak || '',
      bailGmapLink: investment.bailGmapLink || '',
      bailGmapNote: investment.bailGmapNote || '',
      bailLoyerHT: investment.bailLoyerHT || 0,
      bailCNR: investment.bailCNR || 0,
      // Présentation Vente fields
      netVendeur: investment.netVendeur || 0,
      agent: investment.agent || 0,
      honoNotaire: investment.honoNotaire || 0.08
    });
  }, [investment]);

  const handleStatusChange = (newStatus: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP', data?: any) => {
    const updates: any = { status: newStatus };
    
    // Si on passe au statut INVESTI, mettre à jour les données financières
    if (newStatus === 'INVESTI' && data) {
      updates.price = data.amount;
      updates.dateInvestment = data.date;
      updates.dateAcquisition = data.date;
    }
    
    updateInvestment(investment.id, updates);
  };

  const handleDataChange = (updates: any) => {
    setTempEditData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveChanges = () => {
    console.log('Saving changes:', tempEditData);
    
    // Update the investment in global context
    updateInvestment(investment.id, {
      name: tempEditData.name,
      type: tempEditData.type,
      address: tempEditData.address,
      surface: tempEditData.surface,
      price: tempEditData.price,
      dateAcquisition: tempEditData.dateAcquisition,
      // Bail fields
      locataire: tempEditData.locataire,
      dateEntree: tempEditData.dateEntree,
      typeBail: tempEditData.typeBail,
      dureeBail: tempEditData.dureeBail,
      bailNextBreak: tempEditData.bailNextBreak,
      bailGmapLink: tempEditData.bailGmapLink,
      bailGmapNote: tempEditData.bailGmapNote,
      bailLoyerHT: tempEditData.bailLoyerHT,
      bailCNR: tempEditData.bailCNR,
      // Présentation Vente fields
      netVendeur: tempEditData.netVendeur,
      agent: tempEditData.agent,
      honoNotaire: tempEditData.honoNotaire
    });
    setIsEditMode(false);
    toast({
      title: "Modifications sauvegardées",
      description: "Les informations ont été mises à jour avec succès.",
    });
  };

  const handleCancelEdit = () => {
    setTempEditData({
      name: investment.name,
      type: investment.type,
      address: investment.address || '',
      surface: investment.surface || 0,
      price: investment.price || 0,
      dateAcquisition: investment.dateAcquisition || '',
      // Bail fields
      locataire: investment.locataire || '',
      dateEntree: investment.dateEntree || '',
      typeBail: investment.typeBail || '',
      dureeBail: investment.dureeBail || 0,
      bailNextBreak: investment.bailNextBreak || '',
      bailGmapLink: investment.bailGmapLink || '',
      bailGmapNote: investment.bailGmapNote || '',
      bailLoyerHT: investment.bailLoyerHT || 0,
      bailCNR: investment.bailCNR || 0,
      // Présentation Vente fields
      netVendeur: investment.netVendeur || 0,
      agent: investment.agent || 0,
      honoNotaire: investment.honoNotaire || 0.08
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

  return (
    <div className="space-y-6">
      {/* Header with back button and investment title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              console.log('Back button clicked');
              navigate('/');
            }}
            className="flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            title="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div>
            {isEditMode ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={tempEditData.name}
                  onChange={(e) => handleDataChange({ name: e.target.value })}
                  className="text-3xl font-bold bg-transparent border-b border-border focus:border-primary outline-none text-foreground"
                />
                <select
                  value={tempEditData.type}
                  onChange={(e) => handleDataChange({ type: e.target.value as 'IMMO' | 'PE' })}
                  className="text-lg bg-transparent border-b border-border focus:border-primary outline-none text-muted-foreground"
                >
                  <option value="IMMO">Investissement Immobilier</option>
                  <option value="PE">Private Equity</option>
                </select>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground">{investment.name}</h1>
                <p className="text-lg text-muted-foreground">
                  {investment.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button onClick={handleSaveChanges} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} size="sm">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <StatusProgress 
        currentStatus={investment.status}
        onStatusChange={handleStatusChange}
      />

      {/* Performance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="dette">Dette</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab 
            investmentId={investment.id}
            isEditMode={isEditMode}
            investmentData={{
              ...investment,
              dateInvestment: investment.dateInvestment || '',
              address: investment.address || '',
              surface: investment.surface || 0,
              description: investment.description || '',
              investmentAmount: investment.investmentAmount || 0,
              acquisitionDate: investment.acquisitionDate || '',
              notaryFees: investment.notaryFees || 0,
              renovationBudget: investment.renovationBudget || 0
            }}
            tempEditData={tempEditData}
            onDataChange={handleDataChange}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab investmentId={investment.id} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab investmentId={investment.id} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab investmentId={investment.id} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="dette" className="mt-6">
          <DetteTab investmentId={investment.id} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <HistoriqueTab investmentId={investment.id} isEditMode={isEditMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}