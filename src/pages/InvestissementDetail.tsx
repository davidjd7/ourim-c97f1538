import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if this is a new investment
  const isNewInvestment = id === 'nouveau';
  const investmentType = location.state?.type || 'IMMO';
  
  const [isEditMode, setIsEditMode] = useState(isNewInvestment);
  const { investments, updateInvestment, getInvestment, addInvestment } = useInvestments();

  // Get investment from global context (null for new investments)
  const investment = isNewInvestment ? null : getInvestment(id || '');

  // Initialize state before any conditional returns
  const [tempEditData, setTempEditData] = useState({
    name: investment?.name || (isNewInvestment ? '' : ''),
    type: investment?.type || investmentType,
    address: investment?.address || '',
    surface: investment?.surface || 0,
    price: investment?.price || 0,
    dateAcquisition: investment?.dateAcquisition || '',
    description: investment?.description || '',
    // Bail fields
    locataire: investment?.locataire || '',
    dateEntree: investment?.dateEntree || '',
    typeBail: investment?.typeBail || '',
    dureeBail: investment?.dureeBail || 0,
    bailNextBreak: investment?.bailNextBreak || '',
    bailGmapLink: investment?.bailGmapLink || '',
    bailGmapNote: investment?.bailGmapNote || '',
    bailLoyerHT: investment?.bailLoyerHT || 0,
    bailCNR: investment?.bailCNR || 0,
    bailPriseEffet: investment?.bailPriseEffet || '',
    bailActivite: investment?.bailActivite || '',
    bailAnciennete: investment?.bailAnciennete || 0,
    // Présentation Vente fields
    netVendeur: investment?.netVendeur || 0,
    agent: investment?.agent || 0,
    honoNotaire: investment?.honoNotaire || 0.08
  });

  // Update tempEditData when investment changes - must be before conditional return
  useEffect(() => {
    if (investment && !isNewInvestment) {
      setTempEditData({
        name: investment.name,
        type: investment.type,
        address: investment.address || '',
        surface: investment.surface || 0,
        price: investment.price || 0,
        dateAcquisition: investment.dateAcquisition || '',
        description: investment.description || '',
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
        bailPriseEffet: investment.bailPriseEffet || '',
        bailActivite: investment.bailActivite || '',
        bailAnciennete: investment.bailAnciennete || 0,
        // Présentation Vente fields
        netVendeur: investment.netVendeur || 0,
        agent: investment.agent || 0,
        honoNotaire: investment.honoNotaire || 0.08
      });
    }
  }, [investment, isNewInvestment]);

  if (!isNewInvestment && !investment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Investissement introuvable</p>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP', data?: any) => {
    // Préserver toutes les données existantes
    const currentData = tempEditData || investment;
    const updates: any = { 
      ...currentData,
      status: newStatus 
    };
    
    // Si on passe au statut INVESTI, mettre à jour les données financières
    if (newStatus === 'INVESTI' && data) {
      updates.investmentAmount = data.amount;
      updates.notaryFees = data.cost;
      updates.dateInvestment = data.date?.toISOString()?.split('T')[0];
      updates.company = data.company;
    }
    
    try {
      await updateInvestment(investment.id, updates);
      // Mettre à jour tempEditData pour refléter les changements
      setTempEditData(updates);
      toast({
        title: "Statut mis à jour",
        description: "Le statut a été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut.",
        variant: "destructive"
      });
    }
  };

  const handleDataChange = (updates: any) => {
    setTempEditData(prev => ({ ...prev, ...updates }));
  };

  const handleSaveChanges = async () => {
    console.log('Saving changes:', tempEditData);
    
    try {
      // Prevent duplicate saves
      setIsEditMode(false);
      
      if (isNewInvestment) {
        // Create new investment
        const newInvestment = await addInvestment({
          name: tempEditData.name,
          type: tempEditData.type,
          status: 'RECU',
          address: tempEditData.address,
          surface: tempEditData.surface,
          price: tempEditData.price,
          dateAcquisition: tempEditData.dateAcquisition,
          description: tempEditData.description,
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
          bailPriseEffet: tempEditData.bailPriseEffet,
          bailActivite: tempEditData.bailActivite,
          bailAnciennete: tempEditData.bailAnciennete,
          // Présentation Vente fields
          netVendeur: tempEditData.netVendeur,
          agent: tempEditData.agent,
          honoNotaire: tempEditData.honoNotaire,
          // Default values
          lastValue: 0,
          lastTRI: 0,
          lastCashflow: 0,
          lastVariation: { value: 0, percentage: 0 }
        });
        
        toast({
          title: "Investissement créé",
          description: "Le nouvel investissement a été créé avec succès.",
        });
        
        // Navigate to the created investment
        navigate(`/investissement/${newInvestment.id}`);
      } else {
        // Update existing investment
        await updateInvestment(investment!.id, {
        name: tempEditData.name,
        type: tempEditData.type,
        address: tempEditData.address,
        surface: tempEditData.surface,
        price: tempEditData.price,
        dateAcquisition: tempEditData.dateAcquisition,
        description: tempEditData.description,
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
        bailPriseEffet: tempEditData.bailPriseEffet,
        bailActivite: tempEditData.bailActivite,
        bailAnciennete: tempEditData.bailAnciennete,
        // Présentation Vente fields
        netVendeur: tempEditData.netVendeur,
        agent: tempEditData.agent,
          honoNotaire: tempEditData.honoNotaire
        });
        
        toast({
          title: "Modifications sauvegardées",
          description: "Les informations ont été mises à jour avec succès.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des modifications.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    if (isNewInvestment) {
      // Go back to previous page
      navigate(-1);
    } else {
      setTempEditData({
        name: investment!.name,
        type: investment!.type,
        address: investment!.address || '',
        surface: investment!.surface || 0,
        price: investment!.price || 0,
        dateAcquisition: investment!.dateAcquisition || '',
        description: investment!.description || '',
        // Bail fields
        locataire: investment!.locataire || '',
        dateEntree: investment!.dateEntree || '',
        typeBail: investment!.typeBail || '',
        dureeBail: investment!.dureeBail || 0,
        bailNextBreak: investment!.bailNextBreak || '',
        bailGmapLink: investment!.bailGmapLink || '',
        bailGmapNote: investment!.bailGmapNote || '',
        bailLoyerHT: investment!.bailLoyerHT || 0,
        bailCNR: investment!.bailCNR || 0,
        bailPriseEffet: investment!.bailPriseEffet || '',
        bailActivite: investment!.bailActivite || '',
        bailAnciennete: investment!.bailAnciennete || 0,
        // Présentation Vente fields
        netVendeur: investment!.netVendeur || 0,
        agent: investment!.agent || 0,
        honoNotaire: investment!.honoNotaire || 0.08
      });
      setIsEditMode(false);
    }
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

  const getBackPath = () => {
    if (isNewInvestment) {
      return '/'; // Go to dashboard for new investments
    }
    
    if (investment!.status === 'RECU' || investment!.status === 'DUE_DIL') {
      return investment!.type === 'IMMO' ? '/pipeline-immo' : '/pipeline-pe';
    } else if (investment!.status === 'INVESTI') {
      return '/investissements';
    }
    // Pour les autres statuts (VENDU, DROP), retour à la page d'accueil
    return '/';
  };

  const handleBackClick = () => {
    console.log('Back button clicked, navigating to:', getBackPath());
    navigate(getBackPath());
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and investment title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleBackClick}
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
                <h1 className="text-3xl font-bold text-foreground">
                  {isNewInvestment ? 'Nouvel Investissement' : investment!.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
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
               {isNewInvestment ? 'Créer' : 'Modifier'}
             </Button>
           )}
        </div>
      </div>

      {/* Status Progress */}
      {!isNewInvestment && (
        <StatusProgress 
          currentStatus={investment!.status}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Performance Summary Cards */}
      {!isNewInvestment && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card-financial">
            <div className="p-4">
              <label className="text-sm text-muted-foreground">Dernière valeur</label>
              <p className="font-medium financial-value text-xl">
                {formatCurrency(investment!.lastValue)}
              </p>
            </div>
          </div>
          <div className="card-financial">
            <div className="p-4">
              <label className="text-sm text-muted-foreground">TRI</label>
              <p className="font-medium financial-value text-xl">
                {formatPercentage(investment!.lastTRI)}
              </p>
            </div>
          </div>
          <div className="card-financial">
            <div className="p-4">
              <label className="text-sm text-muted-foreground">Variation</label>
              <p className={`font-medium financial-value text-xl ${
                investment!.lastVariation.percentage >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {investment!.lastVariation.percentage >= 0 ? '+' : ''}
                {formatPercentage(investment!.lastVariation.percentage)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        {(() => {
          // Determine if Performance and Dette tabs should be shown
          const showAdvancedTabs = !isNewInvestment && investment!.status !== 'RECU' && investment!.status !== 'DUE_DIL';
          
          return (
            <TabsList className={`grid w-full ${showAdvancedTabs ? 'grid-cols-6' : 'grid-cols-4'}`}>
              <TabsTrigger value="general">Général</TabsTrigger>
              {showAdvancedTabs && <TabsTrigger value="performance">Performance</TabsTrigger>}
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              {showAdvancedTabs && <TabsTrigger value="dette">Dette</TabsTrigger>}
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>
          );
        })()}

        <TabsContent value="general" className="mt-6">
          <GeneralTab 
            investmentId={isNewInvestment ? '' : investment!.id}
            isEditMode={isEditMode}
            investmentData={{
              ...(isNewInvestment ? {
                id: '',
                name: tempEditData.name,
                type: tempEditData.type,
                status: 'RECU',
                lastValue: 0,
                lastTRI: 0,
                lastCashflow: 0,
                lastVariation: { value: 0, percentage: 0 }
              } : investment!),
              dateInvestment: (isNewInvestment ? '' : investment?.dateInvestment) || '',
              address: tempEditData.address || '',
              surface: tempEditData.surface || 0,
              description: (isNewInvestment ? '' : investment?.description) || '',
              investmentAmount: (isNewInvestment ? 0 : investment?.investmentAmount) || 0,
              acquisitionDate: (isNewInvestment ? '' : investment?.acquisitionDate) || '',
              notaryFees: (isNewInvestment ? 0 : investment?.notaryFees) || 0,
              renovationBudget: (isNewInvestment ? 0 : investment?.renovationBudget) || 0
            }}
            tempEditData={tempEditData}
            onDataChange={handleDataChange}
          />
        </TabsContent>

        {!isNewInvestment && investment!.status !== 'RECU' && investment!.status !== 'DUE_DIL' && (
          <TabsContent value="performance" className="mt-6">
            <PerformanceTab investmentId={investment!.id} isEditMode={isEditMode} />
          </TabsContent>
        )}

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab investmentId={isNewInvestment ? '' : investment!.id} isEditMode={isEditMode} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab investmentId={isNewInvestment ? '' : investment!.id} isEditMode={isEditMode} />
        </TabsContent>

        {!isNewInvestment && investment!.status !== 'RECU' && investment!.status !== 'DUE_DIL' && (
          <TabsContent value="dette" className="mt-6">
            <DetteTab investmentId={investment!.id} isEditMode={isEditMode} />
          </TabsContent>
        )}

        <TabsContent value="historique" className="mt-6">
          <HistoriqueTab investmentId={isNewInvestment ? '' : investment!.id} isEditMode={isEditMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}