import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';

interface ConsolidatedKPIViewProps {
  selectedInvestments: Set<string>;
}

export function ConsolidatedKPIView({
  selectedInvestments
}: ConsolidatedKPIViewProps) {
  const { investments } = useInvestments();
  
  // Get investment IDs for batch KPI loading
  const investmentIds = Array.from(selectedInvestments);
  const { batchKPIs, loading } = useBatchPerformanceKPIs(investmentIds);
  
  // Calculate consolidated KPIs from batch data
  const consolidatedData = useMemo(() => {
    if (selectedInvestments.size === 0 || Object.keys(batchKPIs).length === 0) {
      return null;
    }

    // Aggregate all KPIs from selected investments
    let totalFondPropre = 0;
    let totalValeur = 0;
    let totalCrd = 0;
    let totalNoi = 0;
    let totalLoyer = 0;
    let totalCfni = 0;
    let totalGain1 = 0;
    let totalDeltaValeur = 0;
    
    // Aggregate data from all selected investments
    investmentIds.forEach(id => {
      const kpi = batchKPIs[id];
      if (kpi) {
        totalFondPropre += kpi.fondPropre;
        totalValeur += kpi.fondPropreDetails.valeur;
        totalCrd += kpi.fondPropreDetails.crd;
        totalNoi += kpi.rendementNetDetails.noi;
        totalLoyer += kpi.rendementNetDetails.loyer;
        totalCfni += kpi.xirrDetails.totalCfni;
        totalGain1 += kpi.xirrDetails.gain1;
        totalDeltaValeur += kpi.xirrDetails.deltaValeur;
      }
    });

    // Calculate consolidated metrics
    const consolidatedRendementNet = totalValeur > 0 ? (totalNoi / totalValeur) * 100 : 0;
    const consolidatedTotalReturn = totalFondPropre > 0 ? (totalGain1 / totalFondPropre) * 100 : 0;
    const consolidatedLtv = totalValeur > 0 ? (totalCrd / totalValeur) * 100 : 0;
    const consolidatedCocNet = totalFondPropre > 0 ? (totalCfni / totalFondPropre) * 100 : 0;
    
    // For XIRR, we'll use a weighted average approach
    let totalXirr = 0;
    let validXirrCount = 0;
    investmentIds.forEach(id => {
      const kpi = batchKPIs[id];
      if (kpi && kpi.xirr > 0) {
        totalXirr += kpi.xirr;
        validXirrCount++;
      }
    });
    const consolidatedXirr = validXirrCount > 0 ? totalXirr / validXirrCount : 0;

    return {
      fondPropre: totalFondPropre,
      fondPropreDetails: {
        valeur: totalValeur,
        crd: totalCrd,
        ltv: consolidatedLtv
      },
      rendementNet: consolidatedRendementNet,
      rendementNetDetails: {
        noi: totalNoi,
        loyer: totalLoyer,
        noiSurLoyer: totalLoyer > 0 ? (totalNoi / totalLoyer) * 100 : 0,
        yieldBanque: totalCrd > 0 ? (totalNoi / totalCrd) * 100 : 0
      },
      totalReturn: consolidatedTotalReturn,
      totalReturnDetails: {
        cocNet: consolidatedCocNet,
        gain: totalGain1,
        deltaValeur: totalDeltaValeur
      },
      xirr: consolidatedXirr,
      xirrDetails: {
        years: 3,
        totalCfni: totalCfni,
        cfniDerniereAnnee: totalCfni, // Approximation
        deltaValeur: totalDeltaValeur,
        variationValeurDerniereAnnee: 0,
        total: totalGain1,
        latestCf: 0, // Would need more detailed calculation
        latestCfYear: new Date().getFullYear()
      }
    };
  }, [selectedInvestments, batchKPIs, investmentIds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Chargement des données consolidées...
          </h3>
        </div>
      </div>
    );
  }

  if (!consolidatedData) {
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
      {/* En-tête avec informations consolidées */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vue KPI Consolidée</h2>
          <p className="text-sm text-muted-foreground">
            {selectedInvestments.size} investissement{selectedInvestments.size > 1 ? 's' : ''} sélectionné{selectedInvestments.size > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Performance KPI Cards */}
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
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)} ({consolidatedData.rendementNetDetails.loyer > 0 ? (consolidatedData.rendementNetDetails.noi / consolidatedData.rendementNetDetails.loyer * 100).toFixed(1) : '0'}% du loyer)</div>
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
                <div>CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.totalReturnDetails.deltaValeur)}</div>
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
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>CFNI 2024: {formatCurrency(consolidatedData.xirrDetails.cfniDerniereAnnee)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary table showing individual investments */}
      <div className="card-financial">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Détail par investissement</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Investissement</th>
                  <th className="text-right p-2">Fond Propre</th>
                  <th className="text-right p-2">Rendement Net</th>
                  <th className="text-right p-2">Total Return</th>
                  <th className="text-right p-2">XIRR</th>
                </tr>
              </thead>
              <tbody>
                {investmentIds.map(id => {
                  const investment = investments.find(inv => inv.id === id);
                  const kpi = batchKPIs[id];
                  if (!investment || !kpi) return null;
                  
                  return (
                    <tr key={id} className="border-b">
                      <td className="p-2 font-medium">{investment.name}</td>
                      <td className="p-2 text-right">{formatCurrency(kpi.fondPropre)}</td>
                      <td className={`p-2 text-right ${kpi.rendementNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(kpi.rendementNet)}
                      </td>
                      <td className={`p-2 text-right ${kpi.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(kpi.totalReturn)}
                      </td>
                      <td className={`p-2 text-right ${kpi.xirr >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatPercentage(kpi.xirr)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 font-semibold bg-muted/20">
                  <td className="p-2">Total Consolidé</td>
                  <td className="p-2 text-right">{formatCurrency(consolidatedData.fondPropre)}</td>
                  <td className={`p-2 text-right ${consolidatedData.rendementNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(consolidatedData.rendementNet)}
                  </td>
                  <td className={`p-2 text-right ${consolidatedData.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(consolidatedData.totalReturn)}
                  </td>
                  <td className={`p-2 text-right ${consolidatedData.xirr >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercentage(consolidatedData.xirr)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}