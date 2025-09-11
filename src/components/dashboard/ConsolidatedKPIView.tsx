import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/InvestmentContext';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import { InvestmentChart } from './InvestmentChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
    fondPropre: number;
    noi: number;
    rendementNet: number;
    cfni: number;
    cocNet: number;
    cashFlow: number;
  }>;
}

function InvestmentKPIData({ investmentId, onDataLoaded }: { investmentId: string; onDataLoaded: (data: any) => void }) {
  const { kpis, loading } = usePerformanceKPIs(investmentId);
  const { investments } = useInvestments();
  
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
  
  return null;
}

export function ConsolidatedKPIView({ selectedInvestments }: ConsolidatedKPIViewProps) {
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
    const consolidatedRendementNet = totalFondPropre > 0 ? (totalNOI / totalFondPropre) * 100 : 0;
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

    // Données pour le tableau synthèse (années 2022-2024)
    const years = ['2022', '2023', '2024'];
    const chartData = years.map(year => ({
      date: `31/12/${year}`,
      fondPropre: totalFondPropre,
      noi: totalNOI,
      rendementNet: consolidatedRendementNet,
      cfni: totalCFNI,
      cocNet: consolidatedCOC,
      cashFlow: totalCFNI
    }));

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
                  {consolidatedData.rendementNet >= 0 ? '+' : ''}{formatPercentage(consolidatedData.rendementNet)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)}</div>
                <div>Loyer: {formatCurrency(consolidatedData.rendementNetDetails.loyer)}</div>
                <div>NOI sur loyer: {consolidatedData.rendementNetDetails.noiSurLoyer.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* COC (Cash on Cash) */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">COC (2024)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-2xl font-bold financial-value">
                  {consolidatedData.coc >= 0 ? '+' : ''}{formatPercentage(consolidatedData.coc)}
                </p>
                <div className="text-sm text-muted-foreground mt-1">
                  CFNI: {formatCurrency(consolidatedData.cocDetails.cfni)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  DSCR: {consolidatedData.cocDetails.dscr.toFixed(2)}
                </div>
                <div>Yield Banque: {consolidatedData.cocDetails.yieldBanque.toFixed(1)}%</div>
                <div className="text-xs">Dernier CF: {formatCurrency(consolidatedData.cocDetails.cfni)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* XIRR */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">XIRR ({consolidatedData.xirrDetails.years}Y)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-2xl font-bold financial-value">
                  {formatPercentage(consolidatedData.xirr)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)} ({consolidatedData.xirrDetails.cfniDerniereAnnee >= 0 ? '+' : ''}{formatCurrency(consolidatedData.xirrDetails.cfniDerniereAnnee)})
                </div>
                <div>
                  Valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)} ({consolidatedData.xirrDetails.variationValeurDerniereAnnee >= 0 ? '+' : ''}{formatCurrency(consolidatedData.xirrDetails.variationValeurDerniereAnnee)})
                </div>
                <div>Total: {formatCurrency(consolidatedData.xirrDetails.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Synthèse */}
      <div className="card-financial">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Synthèse Consolidée
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Graphique */}
          <div className="h-64">
            <InvestmentChart />
          </div>
          
          {/* Tableau synthèse */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">FP</TableHead>
                  <TableHead className="text-right">NOI ajusté</TableHead>
                  <TableHead className="text-right">Rendement net</TableHead>
                  <TableHead className="text-right">CFNI</TableHead>
                  <TableHead className="text-right">COC net</TableHead>
                  <TableHead className="text-right">CF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedData.chartData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.fondPropre)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.noi)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(row.rendementNet)}</TableCell>
                    <TableCell className="text-right financial-value">
                      {row.cfni >= 0 ? '+' : ''}{formatCurrency(row.cfni)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercentage(row.cocNet)}</TableCell>
                    <TableCell className="text-right financial-value">
                      {row.cashFlow >= 0 ? '+' : ''}{formatCurrency(row.cashFlow)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(consolidatedData.fondPropre)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right financial-value">
                    {consolidatedData.chartData.reduce((sum, row) => sum + row.cfni, 0) >= 0 ? '+' : ''}
                    {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cfni, 0))}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right financial-value">
                    {consolidatedData.chartData.reduce((sum, row) => sum + row.cashFlow, 0) >= 0 ? '+' : ''}
                    {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cashFlow, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}