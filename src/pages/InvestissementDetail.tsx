import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Save, X, Trash2, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { InvestmentTags } from '@/components/investments/InvestmentTags';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralTab } from '@/components/investments/tabs/GeneralTab';
import { PerformanceTab } from '@/components/investments/tabs/PerformanceTab';
import { DocumentsTab } from '@/components/investments/tabs/DocumentsTab';
import { HistoriqueTab } from '@/components/investments/tabs/HistoriqueTab';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';
import { useCompanies } from '@/contexts/CompanyContext';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
export default function InvestissementDetail() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const {
    companies
  } = useCompanies();

  // Check if this is a new investment
  const isNewInvestment = id === 'nouveau';
  const investmentType = location.state?.type || 'IMMO';
  const [isEditMode, setIsEditMode] = useState(isNewInvestment);
  const {
    investments,
    updateInvestment,
    getInvestment,
    addInvestment,
    deleteInvestment
  } = useInvestments();

  // Get investment from global context (null for new investments)
  const investment = isNewInvestment ? null : getInvestment(id || '');

  // Load performance KPIs for invested status
  const {
    batchKPIs,
    loading: kpisLoading
  } = useBatchPerformanceKPIs(isNewInvestment ? [] : [id || '']);
  const kpis = isNewInvestment ? {
    fondPropre: 0,
    fondPropreDetails: {
      valeur: 0,
      crd: 0,
      ltv: 0,
      year: 0
    },
    rendementNet: 0,
    rendementNetDetails: {
      noi: 0,
      loyer: 0,
      noiSurLoyer: 0,
      year: 0,
      yieldBanque: 0
    },
    totalReturn: 0,
    totalReturnDetails: {
      cfni: 0,
      deltaValeur: 0,
      cocNet: 0,
      cfniPlusDeltaValeur: 0,
      totalEarning: 0,
      year: 0
    },
    xirr: 0,
    xirrDetails: {
      totalCfni: 0,
      cfniDerniereAnnee: 0,
      deltaValeur: 0,
      variationValeurDerniereAnnee: 0,
      total: 0,
      years: 0,
      gain1: 0,
      lastCfniYear: 0,
      lastVarValeurYear: 0,
      gain1Year: 0,
      latestCf: 0,
      latestCfYear: 0
    }
  } : batchKPIs[id || ''] || {
    fondPropre: 0,
    fondPropreDetails: {
      valeur: 0,
      crd: 0,
      ltv: 0,
      year: 0
    },
    rendementNet: 0,
    rendementNetDetails: {
      noi: 0,
      loyer: 0,
      noiSurLoyer: 0,
      year: 0,
      yieldBanque: 0
    },
    totalReturn: 0,
    totalReturnDetails: {
      cfni: 0,
      deltaValeur: 0,
      cocNet: 0,
      cfniPlusDeltaValeur: 0,
      totalEarning: 0,
      year: 0
    },
    xirr: 0,
    xirrDetails: {
      totalCfni: 0,
      cfniDerniereAnnee: 0,
      deltaValeur: 0,
      variationValeurDerniereAnnee: 0,
      total: 0,
      years: 0,
      gain1: 0,
      lastCfniYear: 0,
      lastVarValeurYear: 0,
      gain1Year: 0,
      latestCf: 0,
      latestCfYear: 0
    }
  };
  const [tempEditData, setTempEditData] = useState({
    name: '',
    type: 'IMMO' as 'IMMO' | 'PE',
    dateInvestment: '',
    investmentAmount: 0,
    description: '',
    companyId: ''
  });

  // Update tempEditData when investment changes
  useEffect(() => {
    if (investment && !isNewInvestment) {
      setTempEditData({
        name: investment.name,
        type: investment.type,
        dateInvestment: investment.dateInvestment || '',
        investmentAmount: investment.investmentAmount || 0,
        description: investment.description || '',
        companyId: investment.companyId || ''
      });
    }
  }, [investment, isNewInvestment]);
  if (!isNewInvestment && !investment) {
    return <div className="flex items-center justify-center h-64">
        <p>Investissement introuvable</p>
      </div>;
  }
  const handleDataChange = (updates: any) => {
    setTempEditData(prev => ({
      ...prev,
      ...updates
    }));
  };
  const handleSaveChanges = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving changes:', tempEditData);
    }
    try {
      // Prevent duplicate saves
      setIsEditMode(false);
      if (isNewInvestment) {
        // Create new investment
        const newInvestmentData = {
          name: tempEditData.name,
          type: tempEditData.type,
          dateInvestment: tempEditData.dateInvestment,
          investmentAmount: tempEditData.investmentAmount,
          description: tempEditData.description,
          companyId: tempEditData.companyId,
          lastCashflow: 0,
          lastVariation: {
            value: 0,
            percentage: 0
          }
        };
        const newInvestment = await addInvestment(newInvestmentData);
        toast({
          title: "Investissement créé",
          description: "Le nouvel investissement a été créé avec succès."
        });

        // Navigate to the created investment
        navigate(`/investissement/${newInvestment.id}`);
      } else {
        // Update existing investment
        if (process.env.NODE_ENV === 'development') {
          console.log('Updating investment with companyId:', tempEditData.companyId);
        }

        // Save changes with only supported fields
        await updateInvestment(id!, {
          name: tempEditData.name,
          type: tempEditData.type,
          dateInvestment: tempEditData.dateInvestment,
          investmentAmount: tempEditData.investmentAmount,
          description: tempEditData.description,
          companyId: tempEditData.companyId
        });
        if (process.env.NODE_ENV === 'development') {
          console.log('Investment updated successfully');
        }
        toast({
          title: "Modifications sauvegardées",
          description: "Les informations ont été mises à jour avec succès."
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
  const handleDeleteInvestment = async () => {
    if (!investment) return;
    try {
      await deleteInvestment(investment.id);
      toast({
        title: "Investissement supprimé",
        description: "L'investissement a été supprimé avec succès."
      });

      // Navigate back to investments page
      navigate('/investissements');
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'investissement.",
        variant: "destructive"
      });
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const handleCancelEdit = () => {
    if (isNewInvestment) {
      // Go back to previous page
      navigate(-1);
    } else {
      setTempEditData({
        name: investment!.name,
        type: investment!.type,
        dateInvestment: investment!.dateInvestment || '',
        investmentAmount: investment!.investmentAmount || 0,
        description: investment!.description || '',
        companyId: investment!.companyId || ''
      });
      setIsEditMode(false);
    }
  };
  const getBackPath = () => {
    if (isNewInvestment) {
      return '/'; // Go to dashboard for new investments
    }

    // All assets go to investments page
    return '/investissements';
  };
  const handleBackClick = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Back button clicked, navigating to:', getBackPath());
    }
    navigate(getBackPath());
  };

  // Navigation between investments
  const getCurrentInvestmentIndex = () => {
    if (!investment) return -1;
    return investments.findIndex(inv => inv.id === investment.id);
  };
  const getPreviousInvestment = () => {
    const currentIndex = getCurrentInvestmentIndex();
    if (currentIndex <= 0) return null;
    return investments[currentIndex - 1];
  };
  const getNextInvestment = () => {
    const currentIndex = getCurrentInvestmentIndex();
    if (currentIndex === -1 || currentIndex >= investments.length - 1) return null;
    return investments[currentIndex + 1];
  };
  const navigateToPreviousInvestment = () => {
    const prev = getPreviousInvestment();
    if (prev) {
      navigate(`/investissement/${prev.id}`);
    }
  };
  const navigateToNextInvestment = () => {
    const next = getNextInvestment();
    if (next) {
      navigate(`/investissement/${next.id}`);
    }
  };
  return <div className="space-y-6">
      {/* Header with back button and investment title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBackClick} className="flex items-center justify-center cursor-pointer hover:bg-accent transition-colors" title="Retour">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-4">
            <div>
              {isEditMode ? <div className="space-y-2">
                  <input type="text" value={tempEditData.name} onChange={e => handleDataChange({
                name: e.target.value
              })} className="text-3xl font-bold bg-transparent border-b border-border focus:border-primary outline-none text-foreground" />
                  {/* Type non modifiable, même place */}
                  <p className="text-lg text-muted-foreground">
                    {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                  </p>
                </div> : <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {isNewInvestment ? 'Nouvel Investissement' : investment!.name}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                  </p>
                </div>}
            </div>

            {/* Tags et Société à droite du nom - visibles en édition aussi */}
            {!isNewInvestment && <div className="flex items-center gap-4">
                <InvestmentTags investmentId={investment!.id} />
                <div className="text-sm">
                  <span className="text-muted-foreground">Société: </span>
                  {isEditMode ? <Select value={tempEditData?.companyId || ''} onValueChange={value => handleDataChange({
                companyId: value === 'none' ? '' : value
              })}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sélectionner une société" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune société</SelectItem>
                        {companies?.map(company => <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select> : <span className="font-medium">
                      {(() => {
                  const companyId = tempEditData?.companyId;
                  const foundCompany = companies?.find(c => c.id === companyId);
                  return foundCompany?.name || 'Non défini';
                })()}
                    </span>}
                </div>
              </div>}
          </div>
        </div>
        
        <div className="flex items-center gap-2 no-print">
          {/* Navigation arrows - only show for existing investments */}
          {!isNewInvestment && !isEditMode && <>
              <Button variant="outline" size="icon" onClick={navigateToPreviousInvestment} disabled={!getPreviousInvestment()} className="h-8 w-8" title="Investissement précédent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={navigateToNextInvestment} disabled={!getNextInvestment()} className="h-8 w-8" title="Investissement suivant">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
            </>}

          {isEditMode ? <>
              <Button onClick={handleSaveChanges} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={handleCancelEdit} size="sm">
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </> : <>
                <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {isNewInvestment ? 'Créer' : 'Modifier'}
                </Button>
                {!isNewInvestment && <>
                    <Button onClick={handlePrint} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      </AlertDialogTrigger>
                   <AlertDialogContent>
                     <AlertDialogHeader>
                       <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                       <AlertDialogDescription>
                         Êtes-vous sûr de vouloir supprimer l'investissement "{investment?.name}" ?
                         Cette action est irréversible et supprimera toutes les données associées.
                       </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                       <AlertDialogCancel>Annuler</AlertDialogCancel>
                       <AlertDialogAction onClick={handleDeleteInvestment} className="bg-destructive hover:bg-destructive/90">
                         Supprimer définitivement
                       </AlertDialogAction>
                     </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>}
             </>}
        </div>
      </div>

      {/* Performance KPI Cards - Left-aligned layout */}
      {!isNewInvestment && <div className="grid gap-4 md:grid-cols-4">
          {/* Fond Propre */}
          <div className="card-financial">
            <div className="p-4">
              <p className="text-sm text-muted-foreground font-bold mb-3">Fond Propre (2024)</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className="text-2xl font-bold financial-value">
                    {formatCurrency(kpis.fondPropre)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Valeur: {formatCurrency(kpis.fondPropreDetails.valeur)}</div>
                  <div>CRD: {formatCurrency(kpis.fondPropreDetails.crd)}</div>
                  <div>LTV: {kpis.fondPropreDetails.ltv.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rendement Net */}
          <div className="card-financial">
            <div className="p-4">
              <p className="text-sm text-muted-foreground font-bold mb-3">Rendement Net (2024)</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold financial-value ${kpis.rendementNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {kpis.rendementNet >= 0 ? '+' : ''}{formatPercentage(kpis.rendementNet)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>NOI: {formatCurrency(kpis.rendementNetDetails.noi)} ({kpis.rendementNetDetails.noiSurLoyer?.toFixed(1) || '0.0'}% du loyer)</div>
                  <div>Loyer: {formatCurrency(kpis.rendementNetDetails.loyer || 0)}</div>
                  <div>Yield Banque: {kpis.rendementNetDetails.yieldBanque?.toFixed(1) || '0.0'}%</div>
                </div>
              </div>
            </div>
          </div>

           {/* Total Return */}
           <div className="card-financial">
             <div className="p-4">
               <p className="text-sm text-muted-foreground font-bold mb-3">Total Return (2024)</p>
               <div className="flex justify-between items-start">
                 <div className="flex flex-col">
                   <p className={`text-2xl font-bold ${kpis.xirrDetails.gain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                     {kpis.xirrDetails.gain1 >= 0 ? '+' : ''}{formatPercentage(kpis.fondPropre > 0 ? (kpis.xirrDetails.gain1 / kpis.fondPropre) * 100 : 0)}
                   </p>
                     <p className="text-sm text-muted-foreground mt-1">
                       Gain : {formatCurrency(Math.abs(kpis.xirrDetails.gain1 || 0))}
                     </p>
                 </div>
                 <div className="text-xs text-muted-foreground space-y-1">
                   <div>COC net: {kpis.totalReturnDetails.cocNet?.toFixed(1) || '0.0'}%</div>
                   <div>CFNI: {formatCurrency(kpis.totalReturnDetails.cfni)}</div>
                   <div>Δ Valeur: {formatCurrency(kpis.totalReturnDetails.deltaValeur)}</div>
                 </div>
               </div>
             </div>
           </div>

           {/* XIRR */}
           <div className="card-financial">
             <div className="p-4">
               <p className="text-sm text-muted-foreground font-bold mb-3">XIRR ({kpis.xirrDetails.years}Y)</p>
               <div className="flex justify-between items-start">
                 <div className="flex flex-col">
                   <p className={`text-2xl font-bold ${kpis.xirr >= 0 ? 'text-success' : 'text-destructive'}`}>
                     {formatPercentage(kpis.xirr)}
                   </p>
                   {kpis.xirrDetails.latestCf !== 0 && kpis.xirrDetails.latestCfYear !== 0}
                 </div>
                 <div className="text-xs text-muted-foreground space-y-1">
                   <div>
                     CFNI: {formatCurrency(kpis.xirrDetails.totalCfni)}
                   </div>
                   <div>
                     Valeur: {formatCurrency(kpis.xirrDetails.deltaValeur)}
                   </div>
                   <div>Total: {formatCurrency(kpis.xirrDetails.total)}</div>
                 </div>
               </div>
            </div>
          </div>
        </div>}

      {/* Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 no-print">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-4 no-print">
          <PerformanceTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
        
        <TabsContent value="general" className="space-y-4 no-break">
          {!isNewInvestment ? <GeneralTab investmentId={investment.id} isEditMode={isEditMode} investmentData={{
          id: investment.id,
          name: investment.name,
          type: investment.type,
          dateInvestment: investment.dateInvestment || '',
          investmentAmount: investment.investmentAmount || 0,
          description: investment.description || '',
          companyId: investment.companyId
        }} tempEditData={tempEditData} onDataChange={newData => setTempEditData({
          ...tempEditData,
          ...newData
        })} /> : <GeneralTab investmentId="nouveau" isEditMode={true} tempEditData={tempEditData} onDataChange={newData => setTempEditData({
          ...tempEditData,
          ...newData
        })} />}
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4 no-print">
          <DocumentsTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
        
        <TabsContent value="historique" className="space-y-4 no-print">
          <HistoriqueTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
      </Tabs>
    </div>;
}