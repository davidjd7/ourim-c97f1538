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
    0 // No longer using bailLoyerHT, but hook still expects it
  );

  const [tempEditData, setTempEditData] = useState({
    name: '',
    type: 'IMMO' as 'IMMO' | 'PE',
    dateInvestment: '',
    investmentAmount: 0,
    description: '',
    companyId: '',
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
        companyId: investment.companyId || '',
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
        const newInvestmentData = {
          name: tempEditData.name,
          type: tempEditData.type,
          dateInvestment: tempEditData.dateInvestment,
          investmentAmount: tempEditData.investmentAmount,
          description: tempEditData.description,
          companyId: tempEditData.companyId,
          lastCashflow: 0,
          lastVariation: { value: 0, percentage: 0 },
        };
        
        const newInvestment = await addInvestment(newInvestmentData);
        
        toast({
          title: "Investissement créé",
          description: "Le nouvel investissement a été créé avec succès.",
        });
        
        // Navigate to the created investment
        navigate(`/investissement/${newInvestment.id}`);
      } else {
        // Update existing investment
        console.log('Updating investment with companyId:', tempEditData.companyId);
        
        // Save changes with only supported fields
        await updateInvestment(id!, {
          name: tempEditData.name,
          type: tempEditData.type,
          dateInvestment: tempEditData.dateInvestment,
          investmentAmount: tempEditData.investmentAmount,
          description: tempEditData.description,
          companyId: tempEditData.companyId,
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
        dateInvestment: investment!.dateInvestment || '',
        investmentAmount: investment!.investmentAmount || 0,
        description: investment!.description || '',
        companyId: investment!.companyId || '',
      });
      setIsEditMode(false);
    }
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
                  {/* Type non modifiable, même place */}
                  <p className="text-lg text-muted-foreground">
                    {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {isNewInvestment ? 'Nouvel Investissement' : investment!.name}
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    {tempEditData.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
                  </p>
                </div>
              )}
            </div>

            {/* Tags et Société à droite du nom - visibles en édition aussi */}
            {!isNewInvestment && (
              <div className="flex items-center gap-4">
                <InvestmentTags investmentId={investment!.id} />
                <div className="text-sm">
                  <span className="text-muted-foreground">Société: </span>
                  <span className="font-medium">
                    {(() => {
                      const companyId = tempEditData?.companyId;
                      const foundCompany = companies?.find(c => c.id === companyId);
                      return foundCompany?.name || 'Non défini';
                    })()}
                  </span>
                </div>
              </div>
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

      {/* Performance KPI Cards - Left-aligned layout */}
      {!isNewInvestment && (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Fond Propre */}
          <div className="card-financial">
            <div className="p-4">
              <p className="text-sm text-muted-foreground font-bold mb-3">Fond Propre</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold financial-value ${kpis.fondPropre >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(kpis.fondPropre)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 text-right">
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
              <p className="text-sm text-muted-foreground font-bold mb-3">Rendement Net ({kpis.rendementNetDetails.year})</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold financial-value ${kpis.rendementNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(kpis.rendementNet)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 text-right">
                  <div>EBITDA: {formatCurrency(kpis.rendementNetDetails.ebitda)}</div>
                  <div>Année: {kpis.rendementNetDetails.year}</div>
                  {kpis.rendementNetDetails.ebitdaSurLoyer > 0 && (
                    <div className={kpis.rendementNetDetails.ebitdaSurLoyer >= 100 ? 'text-green-600' : 'text-red-600'}>
                      Ratio: {kpis.rendementNetDetails.ebitdaSurLoyer.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COC (Cash on Cash) */}
          <div className="card-financial">
            <div className="p-4">
              <p className="text-sm text-muted-foreground font-bold mb-3">COC</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold financial-value ${kpis.coc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(kpis.coc)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 text-right">
                  <div>CFNI: {formatCurrency(kpis.cocDetails.cfni)}</div>
                  <div className={kpis.cocDetails.dscr >= 1.2 ? 'text-green-600' : 'text-red-600'}>
                    DSCR: {kpis.cocDetails.dscr.toFixed(2)}
                  </div>
                  <div className={kpis.cocDetails.icr >= 2 ? 'text-green-600' : 'text-red-600'}>
                    ICR: {kpis.cocDetails.icr.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XIRR */}
          <div className="card-financial">
            <div className="p-4">
              <p className="text-sm text-muted-foreground font-bold mb-3">XIRR</p>
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold financial-value ${kpis.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(kpis.xirr)}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 text-right">
                  <div className={kpis.xirrDetails.totalCfni >= 0 ? 'text-green-600' : 'text-red-600'}>
                    CFNI: {formatCurrency(kpis.xirrDetails.totalCfni)}
                  </div>
                  <div className={kpis.xirrDetails.deltaValeur >= 0 ? 'text-green-600' : 'text-red-600'}>
                    Δ Valeur: {formatCurrency(kpis.xirrDetails.deltaValeur)}
                  </div>
                  <div>Durée: {kpis.xirrDetails.years} ans</div>
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
        
        <TabsContent value="general" className="space-y-4">
          {!isNewInvestment ? (
            <GeneralTab 
              investmentId={investment.id} 
              isEditMode={isEditMode}
              investmentData={{
                id: investment.id,
                name: investment.name,
                type: investment.type,
                dateInvestment: investment.dateInvestment || '',
                investmentAmount: investment.investmentAmount || 0,
                description: investment.description || '',
                companyId: investment.companyId,
                company: investment.company
              }}
              tempEditData={tempEditData}
              onDataChange={(newData) => setTempEditData({ ...tempEditData, ...newData })}
            />
          ) : (
            <GeneralTab 
              investmentId="nouveau"
              isEditMode={true}
              tempEditData={tempEditData}
              onDataChange={(newData) => setTempEditData({ ...tempEditData, ...newData })}
            />
          )}
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <DocumentsTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
        
        <TabsContent value="historique" className="space-y-4">
          <HistoriqueTab investmentId={isNewInvestment ? '' : id!} />
        </TabsContent>
      </Tabs>
    </div>
  );
}