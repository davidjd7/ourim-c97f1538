import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/InvestmentContext';
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
  };
  coc: number;
  cocDetails: {
    cfni: number;
    dscr: number;
    yieldBanque: number;
  };
  xirr: number;
  xirrDetails: {
    years: number;
    totalCfni: number;
    cfniDerniereAnnee: number;
    deltaValeur: number;
    variationValeurDerniereAnnee: number;
    total: number;
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

function InvestmentKPIData({ investmentId, onDataLoaded }: { investmentId: string; onDataLoaded: (data: any) => void }) {
  const { kpis, loading } = usePerformanceKPIs(investmentId);
  const { investments } = useInvestments();
  const { user } = useAuth();
  
  const investment = investments.find(inv => inv.id === investmentId);
  
  React.useEffect(() => {
    if (!loading && kpis && investment) {
      onDataLoaded({
        fondPropre: Number(kpis.fondPropre ?? 0),
        fondPropreDetails: kpis.fondPropreDetails || { valeur: 0, crd: 0, ltv: 0 },
        rendementNet: Number(kpis.rendementNet ?? 0),
        rendementNetDetails: kpis.rendementNetDetails || { noi: 0, loyer: 0, noiSurLoyer: 0 },
        coc: Number(kpis.coc ?? 0),
        cocDetails: kpis.cocDetails || { cfni: 0, dscr: 0, yieldBanque: 0 },
        xirr: Number(kpis.xirr ?? 0),
        xirrDetails: kpis.xirrDetails || { years: 3, totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0 },
        investmentAmount: Number(investment.investmentAmount ?? 0),
      });
    }
  }, [loading, kpis, investment, onDataLoaded]);

  // Fonctions utilitaires identiques au hook
  const calculateNOI = (cashflow?: CashflowRow) => {
    if (!cashflow) return 0;
    return (cashflow.rex || 0) + (cashflow.retraitAmort || 0) + (cashflow.retraitAutres || 0);
  };
  const calculateCapitalFin = (flow?: DebtFlowRow) => {
    if (!flow) return 0;
    return (flow.capitalDebut || 0) - (flow.rmbtCapital || 0);
  };
  const calculateFlux = (flow?: DebtFlowRow) => {
    if (!flow) return 0;
    return (flow.rmbtCapital || 0) + (flow.rmbtInteret || 0);
  };
  const getSyntheseData = (
    cashflows: CashflowRow[],
    immobilisations: ImmobilisationRow[],
    debtFlows: DebtFlowRow[],
    valorisations: ValorisationRow[]
  ): SyntheseRow[] => {
    const dateMap = new Map<string, SyntheseRow>();
    const allDates = new Set<string>();
    cashflows.forEach(cf => allDates.add(cf.date));
    immobilisations.forEach(immo => allDates.add(immo.date));
    debtFlows.forEach(df => allDates.add(df.date));
    valorisations.forEach(valo => allDates.add(valo.date));
    allDates.forEach(date => {
      dateMap.set(date, { date, flux: 0, valeur: 0, crd: 0, fp: 0 });
    });
    cashflows.forEach(cf => {
      const row = dateMap.get(cf.date)!; row.flux += calculateNOI(cf);
    });
    immobilisations.forEach(immo => {
      const row = dateMap.get(immo.date)!; row.flux -= (immo.montant || 0);
    });
    debtFlows.forEach(df => {
      const row = dateMap.get(df.date)!; row.flux -= calculateFlux(df); row.crd = calculateCapitalFin(df);
    });
    valorisations.forEach(valo => {
      const row = dateMap.get(valo.date)!; row.valeur = valo.valeur || 0;
    });
    dateMap.forEach(row => { row.fp = row.valeur - row.crd; });
    return Array.from(dateMap.values()).sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  React.useEffect(() => {
    if (!user || !investment) return;
    const loadYearly = async () => {
      const [cashflowsRes, valorisationsRes, debtFlowsRes, immobilisationsRes] = await Promise.all([
        supabase.from('investment_cashflows').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_valorisations').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_debt_flows').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_immobilisations').select('*').eq('investment_id', investmentId).eq('user_id', user.id)
      ]);
      const cashflows: CashflowRow[] = (cashflowsRes.data || []).map(cf => ({ date: cf.date, rex: cf.rex || 0, retraitAmort: cf.retrait_amort || 0, retraitAutres: cf.retrait_autres || 0, loyer: cf.loyer || 0 }));
      const valorisations: ValorisationRow[] = (valorisationsRes.data || []).map(v => ({ date: v.date, valeur: v.valeur || 0 }));
      const debtFlows: DebtFlowRow[] = (debtFlowsRes.data || []).map(d => ({ date: d.date, capitalDebut: d.capital_debut || 0, rmbtCapital: d.rmbt_capital || 0, rmbtInteret: d.rmbt_interet || 0 }));
      const immobilisations: ImmobilisationRow[] = (immobilisationsRes.data || []).map(m => ({ date: m.date, montant: m.montant || 0 }));

      const synthese = getSyntheseData(cashflows, immobilisations, debtFlows, valorisations);

      // Process yearly data exactly like PerformanceTab
      const yearMap = new Map<number, { valeur: number; fp: number; noi: number; cfni: number; cashFlow: number }>();
      synthese.forEach(row => {
        const year = new Date(row.date).getFullYear();
        const cf = cashflows.find(c => c.date === row.date);
        const noi = calculateNOI(cf);
        const immo = immobilisations.find(i => i.date === row.date);
        const noiAjuste = noi - (immo?.montant || 0);
        const debt = debtFlows.find(d => d.date === row.date);
        const interet = debt?.rmbtInteret || 0;
        const capital = debt?.rmbtCapital || 0;
        const cfni = noiAjuste - interet;
        const cashFlow = cfni - capital;
        
        if (!yearMap.has(year)) yearMap.set(year, { valeur: 0, fp: 0, noi: 0, cfni: 0, cashFlow: 0 });
        const entry = yearMap.get(year)!;
        entry.noi += noi; // Keep actual NOI (EBITDA), not adjusted
        entry.cfni += cfni;
        entry.cashFlow += cashFlow;
        // Take latest values for the year
        entry.valeur = row.valeur;
        entry.fp = row.fp;
      });

      const yearly: Record<string, { valeur: number; fp: number; noi: number; cfni: number; cashFlow: number }> = {};
      Array.from(yearMap.entries()).forEach(([y, v]) => { yearly[String(y)] = v; });

      // Envoyer l'objet complété (incluant les KPI simples et yearly data)
      onDataLoaded({
        fondPropre: Number(kpis.fondPropre ?? 0),
        fondPropreDetails: kpis.fondPropreDetails || { valeur: 0, crd: 0, ltv: 0 },
        rendementNet: Number(kpis.rendementNet ?? 0),
        rendementNetDetails: kpis.rendementNetDetails || { noi: 0, loyer: 0, noiSurLoyer: 0 },
        coc: Number(kpis.coc ?? 0),
        cocDetails: kpis.cocDetails || { cfni: 0, dscr: 0, yieldBanque: 0 },
        xirr: Number(kpis.xirr ?? 0),
        xirrDetails: kpis.xirrDetails || { years: 3, totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0 },
        investmentAmount: Number(investment?.investmentAmount ?? 0),
        yearly,
      });
    };
    loadYearly();
  }, [user, investmentId, investment, kpis]);
  
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
  const [kpiData, setKpiData] = React.useState<Record<string, any>>({});
  
  const selectedInvestmentsList = useMemo(() => {
    return investments.filter(inv => selectedInvestments.has(inv.id));
  }, [investments, selectedInvestments]);

  const handleKPIDataLoaded = React.useCallback((investmentId: string, data: any) => {
    setKpiData(prev => ({ ...prev, [investmentId]: data }));
  }, []);

  const consolidatedData = useMemo((): ConsolidatedData => {
    const selectedKPIs = Array.from(selectedInvestments).map(id => kpiData[id]).filter(Boolean);
    
    if (selectedKPIs.length === 0) {
      return {
        fondPropre: 0,
        fondPropreDetails: { valeur: 0, crd: 0, ltv: 0 },
        rendementNet: 0,
        rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0 },
        coc: 0,
        cocDetails: { cfni: 0, dscr: 0, yieldBanque: 0 },
        xirr: 0,
        xirrDetails: { years: 3, totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0 },
        chartData: []
      };
    }

    // Sommer toutes les données en €
    const totalFondPropre = selectedKPIs.reduce((sum, kpi) => sum + (kpi.fondPropre || 0), 0);
    const totalValeur = selectedKPIs.reduce((sum, kpi) => sum + (kpi.fondPropreDetails?.valeur || 0), 0);
    const totalCrd = selectedKPIs.reduce((sum, kpi) => sum + (kpi.fondPropreDetails?.crd || 0), 0);
    const totalNOI = selectedKPIs.reduce((sum, kpi) => sum + (kpi.rendementNetDetails?.noi || 0), 0);
    const totalLoyer = selectedKPIs.reduce((sum, kpi) => sum + (kpi.rendementNetDetails?.loyer || 0), 0);
    const totalCFNI = selectedKPIs.reduce((sum, kpi) => sum + (kpi.cocDetails?.cfni || 0), 0);
    const totalInvestmentAmount = selectedKPIs.reduce((sum, kpi) => sum + (kpi.investmentAmount || 0), 0);
    const totalCfniDerniereAnnee = selectedKPIs.reduce((sum, kpi) => sum + (kpi.xirrDetails?.cfniDerniereAnnee || 0), 0);
    const totalDeltaValeur = selectedKPIs.reduce((sum, kpi) => sum + (kpi.xirrDetails?.deltaValeur || 0), 0);
    const totalVariationValeurDerniereAnnee = selectedKPIs.reduce((sum, kpi) => sum + (kpi.xirrDetails?.variationValeurDerniereAnnee || 0), 0);
    const totalXirrTotal = selectedKPIs.reduce((sum, kpi) => sum + (kpi.xirrDetails?.total || 0), 0);
    
    // Recalculer les pourcentages à partir des totaux (numérateur/dénominateur)
    const consolidatedLTV = totalValeur > 0 ? (totalCrd / totalValeur) * 100 : 0;
    const consolidatedRendementNet = totalValeur > 0 ? (totalNOI / totalValeur) * 100 : 0;
    const consolidatedNoiSurLoyer = totalLoyer > 0 ? (totalNOI / totalLoyer) * 100 : 0;
    const consolidatedCOC = totalInvestmentAmount > 0 ? (totalCFNI / totalInvestmentAmount) * 100 : 0;
    
    // DSCR et Yield Banque - moyennes pondérées par montant investi
    const totalWeightedDSCR = selectedKPIs.reduce((sum, kpi) => {
      const weight = (kpi.investmentAmount || 0);
      return sum + (kpi.cocDetails?.dscr || 0) * weight;
    }, 0);
    const consolidatedDSCR = totalInvestmentAmount > 0 ? totalWeightedDSCR / totalInvestmentAmount : 0;
    
    const totalWeightedYieldBanque = selectedKPIs.reduce((sum, kpi) => {
      const weight = (kpi.investmentAmount || 0);
      return sum + (kpi.cocDetails?.yieldBanque || 0) * weight;
    }, 0);
    const consolidatedYieldBanque = totalInvestmentAmount > 0 ? totalWeightedYieldBanque / totalInvestmentAmount : 0;
    
    // Pour XIRR, moyenne pondérée par le montant investi
    const totalWeightedXIRR = selectedKPIs.reduce((sum, kpi) => {
      const weight = (kpi.investmentAmount || 0);
      return sum + (kpi.xirr || 0) * weight;
    }, 0);
    const consolidatedXIRR = totalInvestmentAmount > 0 ? totalWeightedXIRR / totalInvestmentAmount : 0;

    // Données pour le tableau synthèse consolidées année par année
    const yearSet = new Set<number>();
    selectedKPIs.forEach(kpi => {
      const yearly = kpi.yearly || {};
      Object.keys(yearly).forEach(y => yearSet.add(Number(y)));
    });
    const years = Array.from(yearSet).sort((a, b) => a - b);

    const chartData = years.map((year) => {
      const sums = selectedKPIs.reduce((acc: { valeur: number; fp: number; noi: number; cfni: number; cashFlow: number }, kpi: any) => {
        const y = kpi.yearly?.[String(year)];
        if (y) {
          acc.valeur += y.valeur || 0;
          acc.fp += y.fp || 0;
          acc.noi += y.noi || 0; // Use actual NOI, not noiAjuste
          acc.cfni += y.cfni || 0;
          acc.cashFlow += y.cashFlow || 0;
        }
        return acc;
      }, { valeur: 0, fp: 0, noi: 0, cfni: 0, cashFlow: 0 });

      const rendementNetY = sums.valeur > 0 ? (sums.noi / sums.valeur) * 100 : 0;
      const cocNetY = sums.fp > 0 ? (sums.cfni / sums.fp) * 100 : 0;

      return {
        date: `31/12/${year}`,
        valeur: sums.valeur,
        fondPropre: sums.fp,
        noi: sums.noi,
        rendementNet: rendementNetY,
        cfni: sums.cfni,
        cocNet: cocNetY,
        cashFlow: sums.cashFlow,
      };
    });

    return {
      fondPropre: totalFondPropre,
      fondPropreDetails: {
        valeur: totalValeur,
        crd: totalCrd,
        ltv: consolidatedLTV
      },
      rendementNet: consolidatedRendementNet,
      rendementNetDetails: {
        noi: totalNOI,
        loyer: totalLoyer,
        noiSurLoyer: consolidatedNoiSurLoyer
      },
      coc: consolidatedCOC,
      cocDetails: {
        cfni: totalCFNI,
        dscr: consolidatedDSCR,
        yieldBanque: consolidatedYieldBanque
      },
      xirr: consolidatedXIRR,
      xirrDetails: {
        years: 3,
        totalCfni: totalCFNI,
        cfniDerniereAnnee: totalCfniDerniereAnnee,
        deltaValeur: totalDeltaValeur,
        variationValeurDerniereAnnee: totalVariationValeurDerniereAnnee,
        total: totalXirrTotal
      },
      chartData
    };
  }, [selectedInvestments, kpiData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
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
      {/* Charger les données KPI pour chaque investissement sélectionné */}
      {Array.from(selectedInvestments).map(investmentId => (
        <InvestmentKPIData
          key={investmentId}
          investmentId={investmentId}
          onDataLoaded={(data) => handleKPIDataLoaded(investmentId, data)}
        />
      ))}

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
                <p className={`text-2xl font-bold financial-value ${consolidatedData.rendementNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(consolidatedData.rendementNet)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)}</div>
                <div>Loyer: {formatCurrency(consolidatedData.rendementNetDetails.loyer)}</div>
                <div>NOI/Loyer: {consolidatedData.rendementNetDetails.noiSurLoyer.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* COC */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">COC (2024)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold financial-value ${consolidatedData.coc >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(consolidatedData.coc)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>CFNI: {formatCurrency(consolidatedData.cocDetails.cfni)}</div>
                <div>DSCR: {consolidatedData.cocDetails.dscr.toFixed(2)}</div>
                <div>Yield Banque: {consolidatedData.cocDetails.yieldBanque.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* XIRR */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">XIRR (Glissant 3 ans)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold financial-value ${consolidatedData.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(consolidatedData.xirr)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>Delta valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)}</div>
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