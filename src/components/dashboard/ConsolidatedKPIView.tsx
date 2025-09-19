import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ConsolidatedKPIViewProps {
  selectedInvestments: Set<string>;
}

interface ConsolidatedData {
  fondPropre: number;
  fondPropreDetails: {
    valeur: number;
    crd: number;
    ltv: number;
  };
  rendementNet: number;
  rendementNetDetails: {
    noi: number;
    loyer: number;
    noiSurLoyer: number;
    yieldBanque: number;
  };
  totalReturn: number;
  totalReturnDetails: {
    cocNet: number;
    gain: number;
    deltaValeur: number;
  };
  xirr: number;
  xirrDetails: {
    years: number;
    totalCfni: number;
    cfniDerniereAnnee: number;
    deltaValeur: number;
    variationValeurDerniereAnnee: number;
    total: number;
    latestCf: number;
    latestCfYear: number;
  };
  chartData: Array<{
    date: string;
    valeur: number;
    fondPropre: number;
    noi: number;
    rendementNet: number;
    cfni: number;
    cocNet: number;
    cashFlow: number;
  }>;
}

// Types utilisés pour le calcul annuel
interface CashflowRow { date: string; rex: number; retraitAmort: number; retraitAutres: number; loyer: number; }
interface ValorisationRow { date: string; valeur: number; }
interface DebtFlowRow { date: string; capitalDebut: number; rmbtCapital: number; rmbtInteret: number; }
interface ImmobilisationRow { date: string; montant: number; }
interface SyntheseRow { date: string; flux: number; valeur: number; crd: number; fp: number; }

function ConsolidatedDataLoader({ selectedInvestments, onDataLoaded }: { selectedInvestments: Set<string>; onDataLoaded: (data: any) => void }) {
  const { user } = useAuth();
  const { investments } = useInvestments();
  
  React.useEffect(() => {
    if (!user || selectedInvestments.size === 0) return;
    
    const loadConsolidatedData = async () => {
      const investmentIds = Array.from(selectedInvestments);
      
      // Charger toutes les données pour tous les investissements sélectionnés
      const [cashflowsRes, valorisationsRes, debtCharacteristicsRes, immobilisationsRes] = await Promise.all([
        supabase.from('immobilier_cashflows').select('*').in('immobilier_id', investmentIds).eq('user_id', user.id),
        supabase.from('immobilier_valorisations').select('*').in('immobilier_id', investmentIds).eq('user_id', user.id),
        supabase.from('debt_characteristics').select('*').in('asset_id', investmentIds).eq('user_id', user.id),
        supabase.from('immobilier_immobilisations').select('*').in('immobilier_id', investmentIds).eq('user_id', user.id)
      ]);

      // Load debt flows based on debt characteristics
      let debtFlowsRes = { data: [] };
      if (debtCharacteristicsRes.data && debtCharacteristicsRes.data.length > 0) {
        const debtCharacteristicsIds = debtCharacteristicsRes.data.map(dc => dc.id);
        debtFlowsRes = await supabase.from('debt_flows').select('*').in('debt_characteristics_id', debtCharacteristicsIds).eq('user_id', user.id);
      }

      // Formatter les données
      const allCashflows: (CashflowRow & { investmentId: string })[] = (cashflowsRes.data || []).map(cf => ({ 
        investmentId: cf.immobilier_id,
        date: cf.date, 
        rex: cf.rex || 0, 
        retraitAmort: cf.retrait_amort || 0, 
        retraitAutres: cf.retrait_autres || 0, 
        loyer: cf.loyer || 0 
      }));
      
      const allValorisations: (ValorisationRow & { investmentId: string })[] = (valorisationsRes.data || []).map(v => ({ 
        investmentId: v.immobilier_id,
        date: v.date, 
        valeur: v.valeur || 0 
      }));
      
      const allDebtFlows: (DebtFlowRow & { investmentId: string })[] = (debtFlowsRes.data || []).map(d => ({ 
        investmentId: d.immobilier_id,
        date: d.date, 
        capitalDebut: d.capital_debut || 0, 
        rmbtCapital: d.rmbt_capital || 0, 
        rmbtInteret: d.rmbt_interet || 0 
      }));
      
      const allImmobilisations: (ImmobilisationRow & { investmentId: string })[] = (immobilisationsRes.data || []).map(m => ({ 
        investmentId: m.immobilier_id,
        date: m.date, 
        montant: m.montant || 0 
      }));

      // Regrouper par date et consolider
      const dateMap = new Map<string, {
        date: string;
        valeur: number;
        fp: number;
        noi: number;
        cfni: number;
        cashFlow: number;
        crd: number;
      }>();

      // Récupérer toutes les dates uniques
      const allDates = new Set<string>();
      allCashflows.forEach(cf => allDates.add(cf.date));
      allValorisations.forEach(v => allDates.add(v.date));
      allDebtFlows.forEach(d => allDates.add(d.date));
      allImmobilisations.forEach(i => allDates.add(i.date));

      // Initialiser toutes les dates
      allDates.forEach(date => {
        dateMap.set(date, {
          date,
          valeur: 0,
          fp: 0,
          noi: 0,
          cfni: 0,
          cashFlow: 0,
          crd: 0
        });
      });

      // Consolider les données par date
      allDates.forEach(date => {
        const consolidated = dateMap.get(date)!;
        
        // NOI consolidé pour cette date
        let totalNOI = 0;
        allCashflows.filter(cf => cf.date === date).forEach(cf => {
          totalNOI += (cf.rex || 0) + (cf.retraitAmort || 0) + (cf.retraitAutres || 0);
        });
        
        // Immobilisations consolidées pour cette date
        let totalImmobilisations = 0;
        allImmobilisations.filter(i => i.date === date).forEach(i => {
          totalImmobilisations += i.montant || 0;
        });
        
        // NOI ajusté
        const noiAjuste = totalNOI - totalImmobilisations;
        
        // Dette consolidée pour cette date
        let totalInteret = 0;
        let totalCapital = 0;
        let totalCRD = 0;
        allDebtFlows.filter(d => d.date === date).forEach(d => {
          totalInteret += d.rmbtInteret || 0;
          totalCapital += d.rmbtCapital || 0;
          totalCRD += (d.capitalDebut || 0) - (d.rmbtCapital || 0);
        });
        
        // Valorisations consolidées pour cette date
        let totalValeur = 0;
        allValorisations.filter(v => v.date === date).forEach(v => {
          totalValeur += v.valeur || 0;
        });
        
        // Calculs finaux
        const cfni = noiAjuste - totalInteret;
        const cashFlow = cfni - totalCapital;
        const fp = totalValeur - totalCRD;
        
        consolidated.valeur = totalValeur;
        consolidated.fp = fp;
        consolidated.noi = totalNOI;
        consolidated.cfni = cfni;
        consolidated.cashFlow = cashFlow;
        consolidated.crd = totalCRD;
      });

      // Trier par date et convertir en tableau
      const consolidatedArray = Array.from(dateMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculer les données KPI consolidées (dernières valeurs)
      const latestData = consolidatedArray[consolidatedArray.length - 1];
      const totalInvestmentAmount = investments
        .filter(inv => selectedInvestments.has(inv.id))
        .reduce((sum, inv) => sum + (Number(inv.investmentAmount) || 0), 0);

      const firstData = consolidatedArray[0];
      const deltaValeur = consolidatedArray.length > 1 ? (latestData?.valeur || 0) - (firstData?.valeur || 0) : 0;
      const totalCfni = consolidatedArray.reduce((sum, row) => sum + row.cfni, 0);
      const cocNet = totalInvestmentAmount > 0 ? ((latestData?.cfni || 0) / totalInvestmentAmount) * 100 : 0;
      const gain = totalCfni + deltaValeur;
      const totalReturn = totalInvestmentAmount > 0 ? (gain / totalInvestmentAmount) * 100 : 0;
      
      // Calculate simple XIRR approximation
      const years = consolidatedArray.length > 0 ? Math.max(1, consolidatedArray.length / 12) : 1;
      const xirr = totalInvestmentAmount > 0 ? ((gain / totalInvestmentAmount) / years) * 100 : 0;

      const consolidatedKPIs = {
        fondPropre: latestData?.fp || 0,
        fondPropreDetails: {
          valeur: latestData?.valeur || 0,
          crd: latestData?.crd || 0,
          ltv: latestData?.valeur > 0 ? (latestData.crd / latestData.valeur) * 100 : 0
        },
        rendementNet: latestData?.valeur > 0 ? (latestData.noi / latestData.valeur) * 100 : 0,
        rendementNetDetails: {
          noi: latestData?.noi || 0,
          loyer: allCashflows.filter(cf => cf.date === latestData?.date).reduce((sum, cf) => sum + (cf.loyer || 0), 0),
          noiSurLoyer: 0, // À calculer après avoir le loyer total
          yieldBanque: latestData?.crd > 0 ? ((latestData?.noi || 0) / latestData.crd) * 100 : 0
        },
        totalReturn: totalReturn,
        totalReturnDetails: {
          cocNet: cocNet,
          gain: gain,
          deltaValeur: deltaValeur
        },
        xirr: xirr,
        xirrDetails: {
          years: 3,
          totalCfni: totalCfni,
          cfniDerniereAnnee: latestData?.cfni || 0,
          deltaValeur: deltaValeur,
          variationValeurDerniereAnnee: 0,
          total: gain,
          latestCf: latestData?.cashFlow || 0,
          latestCfYear: latestData ? new Date(latestData.date).getFullYear() : 0
        },
        chartData: consolidatedArray.map(row => {
          const rendementNet = row.valeur > 0 ? (row.noi / row.valeur) * 100 : 0;
          const cocNet = row.fp > 0 ? (row.cfni / row.fp) * 100 : 0;
          
          return {
            date: new Date(row.date).toLocaleDateString('fr-FR'),
            valeur: row.valeur,
            fondPropre: row.fp,
            noi: row.noi,
            rendementNet,
            cfni: row.cfni,
            cocNet,
            cashFlow: row.cashFlow
          };
        })
      };

      // Calculer noiSurLoyer
      if (consolidatedKPIs.rendementNetDetails.loyer > 0) {
        consolidatedKPIs.rendementNetDetails.noiSurLoyer = 
          (consolidatedKPIs.rendementNetDetails.noi / consolidatedKPIs.rendementNetDetails.loyer) * 100;
      }

      onDataLoaded(consolidatedKPIs);
    };
    
    loadConsolidatedData();
  }, [user, selectedInvestments, investments, onDataLoaded]);
  
  return null;
}

export function ConsolidatedKPIView({ selectedInvestments }: ConsolidatedKPIViewProps) {
  // XIRR calculation function pour le tableau consolidé
  const calculateConsolidatedXIRR = (dataUpToIndex: any[]) => {
    if (dataUpToIndex.length < 2) return 0;
    
    // Pour le moment, on retourne une valeur simple basée sur la progression
    // Dans une implémentation complète, on ferait un calcul XIRR réel
    const firstYear = dataUpToIndex[0];
    const lastYear = dataUpToIndex[dataUpToIndex.length - 1];
    const totalCfni = dataUpToIndex.reduce((sum, row) => sum + row.cfni, 0);
    const years = dataUpToIndex.length;
    
    // Approximation simple du XIRR
    if (years > 1 && firstYear.fondPropre > 0) {
      return (totalCfni / firstYear.fondPropre / years) * 100;
    }
    return 0;
  };
  const { investments } = useInvestments();
  const [consolidatedData, setConsolidatedData] = React.useState<ConsolidatedData>({
    fondPropre: 0,
    fondPropreDetails: { valeur: 0, crd: 0, ltv: 0 },
    rendementNet: 0,
    rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, yieldBanque: 0 },
    totalReturn: 0,
    totalReturnDetails: { cocNet: 0, gain: 0, deltaValeur: 0 },
    xirr: 0,
    xirrDetails: { years: 3, totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0, latestCf: 0, latestCfYear: 0 },
    chartData: []
  });
  
  const selectedInvestmentsList = useMemo(() => {
    return investments.filter(inv => selectedInvestments.has(inv.id));
  }, [investments, selectedInvestments]);

  const handleConsolidatedDataLoaded = React.useCallback((data: ConsolidatedData) => {
    setConsolidatedData(data);
  }, []);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (selectedInvestments.size === 0) {
    return (
      <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun investissement sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Veuillez sélectionner au moins un investissement dans la vue tableau pour voir les KPI consolidés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charger les données consolidées */}
      <ConsolidatedDataLoader
        selectedInvestments={selectedInvestments}
        onDataLoaded={handleConsolidatedDataLoaded}
      />

      {/* En-tête avec informations consolidées */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vue KPI Consolidée</h2>
          <p className="text-sm text-muted-foreground">
            {selectedInvestments.size} investissement{selectedInvestments.size > 1 ? 's' : ''} sélectionné{selectedInvestments.size > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Performance KPI Cards - Exact same layout as individual investment */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Fond Propre */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">Fond Propre (2024)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-2xl font-bold financial-value">
                  {formatCurrency(consolidatedData.fondPropre)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Valeur: {formatCurrency(consolidatedData.fondPropreDetails.valeur)}</div>
                <div>CRD: {formatCurrency(consolidatedData.fondPropreDetails.crd)}</div>
                <div>LTV: {consolidatedData.fondPropreDetails.ltv.toFixed(1)}%</div>
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
                <p className={`text-2xl font-bold ${consolidatedData.rendementNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercentage(consolidatedData.rendementNet)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)} ({consolidatedData.rendementNetDetails.loyer > 0 ? ((consolidatedData.rendementNetDetails.noi / consolidatedData.rendementNetDetails.loyer) * 100).toFixed(1) : '0'}% du loyer)</div>
                <div>Loyer: {formatCurrency(consolidatedData.rendementNetDetails.loyer)}</div>
                <div>Yield Banque: {consolidatedData.rendementNetDetails.yieldBanque.toFixed(1)}%</div>
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
                <p className={`text-2xl font-bold ${consolidatedData.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercentage(consolidatedData.totalReturn)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gain : {formatCurrency(consolidatedData.totalReturnDetails.gain)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>COC net: {consolidatedData.totalReturnDetails.cocNet.toFixed(1)}%</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.totalReturnDetails.deltaValeur)}</div>
                <div>Total: {formatCurrency(consolidatedData.totalReturnDetails.gain)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* XIRR */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">XIRR (3Y)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold ${consolidatedData.xirr >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatPercentage(consolidatedData.xirr)}
                </p>
                {consolidatedData.xirrDetails.latestCf !== 0 && consolidatedData.xirrDetails.latestCfYear !== 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    CF ({consolidatedData.xirrDetails.latestCfYear}) : {formatCurrency(consolidatedData.xirrDetails.latestCf)}
                  </p>
                )}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)}</div>
                <div>Total: {formatCurrency(consolidatedData.xirrDetails.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <div className="p-6 space-y-6">
        {/* Tableau synthèse */}
        <div className="w-full">
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table className="min-w-full text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs text-center min-w-[80px]">Date</TableHead>
                    <TableHead className="text-xs text-center min-w-[80px]">Valeur</TableHead>
                    <TableHead className="text-xs text-center min-w-[70px]">FP</TableHead>
                    <TableHead className="text-xs text-center min-w-[90px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">NOI</TooltipTrigger>
                        <TooltipContent>
                          <p>Net Operating Income</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[90px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Rend. net</TooltipTrigger>
                        <TooltipContent>
                          <p>NOI / valeur</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[70px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">CFNI</TooltipTrigger>
                        <TooltipContent>
                          <p>NOI ajusté après intérêt</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[80px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">COC net</TooltipTrigger>
                        <TooltipContent>
                          <p>CFNI / FP</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[60px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">CF</TooltipTrigger>
                        <TooltipContent>
                          <p>Cashflow</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[70px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Gain 1</TooltipTrigger>
                        <TooltipContent>
                          <p>Delta FP + CF</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[70px]">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">Gain 2</TooltipTrigger>
                        <TooltipContent>
                          <p>Delta valeur + CFNI</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="text-xs text-center min-w-[80px]">XIRR glissant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consolidatedData.chartData.map((row, index) => {
                    const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                    
                    // Calculs des gains
                    const variationFP = previousRow ? row.fondPropre - previousRow.fondPropre : 0;
                    const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                    const gain1 = variationFP + row.cashFlow; // Delta FP + CF
                    const gain2 = variationValeur + row.cfni; // Delta valeur + CFNI
                    
                    // XIRR glissant
                    const xirrGlissant = index > 0 ? calculateConsolidatedXIRR(consolidatedData.chartData.slice(0, index + 1)) : 0;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-xs text-center">{row.date}</TableCell>
                        <TableCell className="financial-value text-xs text-center">
                          {formatCurrency(row.valeur)}
                        </TableCell>
                        <TableCell className="financial-value text-xs text-center">
                          {formatCurrency(row.fondPropre)}
                        </TableCell>
                        <TableCell className="financial-value text-xs text-center">
                          {formatCurrency(row.noi)}
                        </TableCell>
                        <TableCell className={`text-xs text-center ${row.rendementNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(row.rendementNet)}
                        </TableCell>
                        <TableCell className="financial-value text-xs text-center">
                          {formatCurrency(row.cfni)}
                        </TableCell>
                        <TableCell className={`text-xs text-center ${row.cocNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(row.cocNet)}
                        </TableCell>
                        <TableCell className="financial-value text-xs text-center">
                          {formatCurrency(row.cashFlow)}
                        </TableCell>
                        <TableCell className={`financial-value text-xs text-center ${gain1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gain1)}
                        </TableCell>
                        <TableCell className={`financial-value text-xs text-center ${gain2 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gain2)}
                        </TableCell>
                        <TableCell className={`text-xs text-center ${xirrGlissant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(xirrGlissant)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}