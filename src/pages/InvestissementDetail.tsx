import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { InvestmentTags } from '@/components/investments/InvestmentTags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralTab } from '@/components/investments/tabs/GeneralTab';
import { PerformanceTab } from '@/components/investments/tabs/PerformanceTab';
import { DocumentsTab } from '@/components/investments/tabs/DocumentsTab';
import { HistoriqueTab } from '@/components/investments/tabs/HistoriqueTab';

import { useInvestments } from '@/contexts/InvestmentContext';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import { useCompanies } from '@/contexts/CompanyContext';

export default function InvestissementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { companies } = useCompanies();
  
  // Check if this is a new investment
  const isNewInvestment = id === 'nouveau';
  const investmentType = location.state?.type || 'IMMO';
  
  const [isEditMode, setIsEditMode] = useState(isNewInvestment);
  const { investments, updateInvestment, getInvestment, addInvestment } = useInvestments();

  // Get investment from global context (null for new investments)
  const investment = isNewInvestment ? null : getInvestment(id || '');
  
  // Load performance KPIs for invested status
  const { kpis, loading: kpisLoading } = usePerformanceKPIs(
    isNewInvestment ? '' : (id || ''), 
    investment?.bailLoyerHT
  );
  
  // Force re-render when investment data changes
  useEffect(() => {
    if (investment && !isEditMode) {
      // Update tempEditData with fresh investment data when not in edit mode
      setTempEditData({
        name: investment.name,
        type: investment.type,
        status: investment.status,
        address: investment.address || '',
        surface: investment.surface || 0,
        price: investment.price || 0,
        dateAcquisition: investment.dateAcquisition || '',
        description: investment.description || '',
        // Investment fields
        dateInvestment: investment.dateInvestment || '',
        investmentAmount: investment.investmentAmount || 0,
        notaryFees: investment.notaryFees || 0,
        companyId: investment.companyId || undefined,
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
  }, [investment, isEditMode]);

  // Initialize state before any conditional returns
  const [tempEditData, setTempEditData] = useState({
    name: investment?.name || (isNewInvestment ? '' : ''),
    type: investment?.type || investmentType,
    status: investment?.status || 'INVESTI',
    address: investment?.address || '',
    surface: investment?.surface || 0,
    price: investment?.price || 0,
    dateAcquisition: investment?.dateAcquisition || '',
    description: investment?.description || '',
    // Investment fields
    dateInvestment: investment?.dateInvestment || '',
    investmentAmount: investment?.investmentAmount || 0,
    notaryFees: investment?.notaryFees || 0,
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
    honoNotaire: investment?.honoNotaire || 0.08,
    // Company field
    companyId: investment?.companyId || undefined
  });

  // Update tempEditData when investment changes - must be before conditional return
  useEffect(() => {
    if (investment && !isNewInvestment) {
      setTempEditData({
        name: investment.name,
        type: investment.type,
        status: investment.status,
        address: investment.address || '',
        surface: investment.surface || 0,
        price: investment.price || 0,
        dateAcquisition: investment.dateAcquisition || '',
        description: investment.description || '',
        // Investment fields
        dateInvestment: investment.dateInvestment || '',
        investmentAmount: investment.investmentAmount || 0,
        notaryFees: investment.notaryFees || 0,
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
        honoNotaire: investment.honoNotaire || 0.08,
        // Company field
        companyId: investment.companyId || undefined
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
          status: tempEditData.status || 'INVESTI',
          address: tempEditData.address,
          surface: tempEditData.surface,
          price: tempEditData.price,
          dateAcquisition: tempEditData.dateAcquisition,
          description: tempEditData.description,
          // Investment fields
          dateInvestment: tempEditData.dateInvestment,
          investmentAmount: tempEditData.investmentAmount,
          notaryFees: tempEditData.notaryFees,
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
          // Company field
          companyId: tempEditData.companyId,
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
        console.log('Updating investment with companyId:', tempEditData.companyId);
        
        await updateInvestment(investment!.id, {
        name: tempEditData.name,
        type: tempEditData.type,
        status: tempEditData.status,
        address: tempEditData.address,
        surface: tempEditData.surface,
        price: tempEditData.price,
        dateAcquisition: tempEditData.dateAcquisition,
        description: tempEditData.description,
        // Investment fields
        dateInvestment: tempEditData.dateInvestment,
        investmentAmount: tempEditData.investmentAmount,
        notaryFees: tempEditData.notaryFees,
        // Company field - CRITICAL
        companyId: tempEditData.companyId,
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
        
        console.log('Investment updated successfully');
        
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
        honoNotaire: investment!.honoNotaire || 0.08,
        // Investment fields
        status: investment!.status,
        dateInvestment: investment!.dateInvestment || '',
        investmentAmount: investment!.investmentAmount || 0,
        notaryFees: investment!.notaryFees || 0,
        // Company field
        companyId: investment!.companyId || undefined
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
    
    // All assets go to investments page
    return '/investissements';
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
          
          <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        {isNewInvestment ? 'Nouvel Investissement' : investment!.name}
                      </h1>
                      <p className="text-lg text-muted-foreground">
                        {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                      </p>
                    </div>
                    {/* Tags et Société à droite du nom */}
                    {!isNewInvestment && (
                      <div className="flex items-center gap-4">
                        <InvestmentTags investmentId={investment!.id} />
                        <div className="text-sm">
                          <span className="text-muted-foreground">Société: </span>
                          <span className="font-medium">
                            {(() => {
                              const companyId = tempEditData?.companyId;
                              const foundCompany = companies.find(c => c.id === companyId);
                              return foundCompany?.name || 'Non défini';
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* Status Progress commenté pour v2 
            {!isNewInvestment && !isEditMode && (
              <div className="flex items-center gap-3">
                <MinimalStatusProgress 
                  currentStatus={investment!.status}
                  onStatusChange={handleStatusChange}
                  netVendeur={investment!.netVendeur}
                  agent={investment!.agent}
                  honoNotaire={investment!.honoNotaire}
                />
                <div className="h-4 w-px bg-border" />
                <InvestmentTags investmentId={investment!.id} />
              </div>
            )}
            */}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Actions commenté pour v2
          {!isNewInvestment && !isEditMode && (
            <StatusActions 
              currentStatus={investment!.status}
              onStatusChange={handleStatusChange}
              netVendeur={investment!.netVendeur}
              agent={investment!.agent}
              honoNotaire={investment!.honoNotaire}
            />
          )}
          */}
          
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

      {/* Performance KPI Cards - Uniform display for all assets */}
      {!isNewInvestment && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Fond Propre */}
          <div className="card-financial">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Fond Propre {kpisLoading ? '' : `(${kpis.fondPropreDetails?.year || 'N/A'})`}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold financial-value">
                      {kpisLoading ? '...' : formatCurrency(kpis.fondPropre || 0)}
                    </p>
                    {!kpisLoading && kpis.fondPropreDetails && (
                      <div className="text-xs text-muted-foreground text-left">
                        <div>Valeur: {formatCurrency(kpis.fondPropreDetails.valeur)}</div>
                        <div>CRD: {formatCurrency(kpis.fondPropreDetails.crd)}</div>
                        <div>LTV: {formatPercentage(kpis.fondPropreDetails.ltv)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rendement Net */}
          <div className="card-financial">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Rendement Net {kpisLoading ? '' : `(${kpis.rendementNetDetails?.year || 'N/A'})`}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold financial-value ${
                      !kpisLoading && (kpis.rendementNet || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {kpisLoading ? '...' : (
                        `${(kpis.rendementNet || 0) >= 0 ? '+' : ''}${(kpis.rendementNet || 0).toFixed(1)}%`
                      )}
                    </p>
                    {!kpisLoading && kpis.rendementNetDetails && (
                      <div className="text-xs text-muted-foreground text-left">
                        <div>EBITDA: {formatCurrency(kpis.rendementNetDetails.ebitda)}</div>
                        <div>Loyer: {formatCurrency(kpis.rendementNetDetails.loyer)}</div>
                        <div>{kpis.rendementNetDetails.ebitdaSurLoyer.toFixed(1)}% du loyer</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COC */}
          <div className="card-financial">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    COC {kpisLoading ? '' : `(${kpis.cocDetails?.year || 'N/A'})`}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold financial-value ${
                      !kpisLoading && (kpis.coc || 0) >= 0 ? 'text-success' : 'text-destructive'
                    }`}>
                      {kpisLoading ? '...' : (
                        `${(kpis.coc || 0) >= 0 ? '+' : ''}${(kpis.coc || 0).toFixed(1)}%`
                      )}
                    </p>
                    {!kpisLoading && kpis.cocDetails && (
                      <div className="text-xs text-muted-foreground text-left">
                        <div>CFNI: {formatCurrency(kpis.cocDetails.cfni)}</div>
                        <div>DSCR: {kpis.cocDetails.dscr.toFixed(2)}</div>
                        <div>ICR: {kpis.cocDetails.icr.toFixed(2)}</div>
                        <div>Yield Banque: {kpis.cocDetails.yieldBanque.toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XIRR */}
          <div className="card-financial">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    XIRR {kpisLoading ? '' : `(${kpis.xirrDetails?.years || 'N/A'}Y)`}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold financial-value text-primary">
                      {kpisLoading ? '...' : formatPercentage(kpis.xirr || 0)}
                    </p>
                    {!kpisLoading && kpis.xirrDetails && (
                      <div className="text-xs text-muted-foreground text-left">
                        <div>CFNI: {formatCurrency(kpis.xirrDetails.totalCfni)} ({formatCurrency(kpis.xirrDetails.cfniDerniereAnnee)})</div>
                        <div>Valeur: {formatCurrency(kpis.xirrDetails.deltaValeur)} ({kpis.xirrDetails.variationValeurDerniereAnnee >= 0 ? '+' : ''}{formatCurrency(kpis.xirrDetails.variationValeurDerniereAnnee)})</div>
                        <div>Total: {formatCurrency(kpis.xirrDetails.total)}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab 
            investmentId={isNewInvestment ? '' : investment!.id}
            isEditMode={isEditMode}
            investmentData={{
              ...(isNewInvestment ? {
                id: '',
                name: tempEditData.name,
                type: tempEditData.type,
                status: 'INVESTI',
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
              renovationBudget: (isNewInvestment ? 0 : investment?.renovationBudget) || 0,
              // Company field - CRITICAL for display - Utiliser tempEditData comme source de vérité
              companyId: tempEditData.companyId
            }}
            tempEditData={tempEditData}
            onDataChange={handleDataChange}
          />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab 
            investmentId={isNewInvestment ? '' : investment!.id} 
            isEditMode={isEditMode}
            bailLoyerHT={tempEditData.bailLoyerHT}
            bailCNR={tempEditData.bailCNR}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab investmentId={isNewInvestment ? '' : investment!.id} isEditMode={isEditMode} />
        </TabsContent>



        <TabsContent value="historique" className="mt-6">
          <HistoriqueTab investmentId={isNewInvestment ? '' : investment!.id} isEditMode={isEditMode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}