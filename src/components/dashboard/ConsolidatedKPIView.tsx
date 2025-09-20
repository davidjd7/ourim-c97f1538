import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import type { ConsolidatedRow } from '@/types/kpi';
import { calculateXIRR } from '@/lib/kpiCalculations';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';
import { logError } from '@/lib/errorHandler';

interface ConsolidatedKPIViewProps {
  selectedInvestments: Set<string>;
}

export function ConsolidatedKPIView({
  selectedInvestments
}: ConsolidatedKPIViewProps) {
  const { investments } = useInvestments();
  
  // Use the optimized batch hook instead of custom data loading
  const investmentIds = Array.from(selectedInvestments);
  const { batchKPIs, loading } = useBatchPerformanceKPIs(investmentIds);
  
  // Calculate consolidated data from individual investment KPIs
  const consolidatedData = useMemo(() => {
    if (loading || Object.keys(batchKPIs).length === 0) {
      return {
        fondPropre: 0,
        fondPropreDetails: { valeur: 0, crd: 0, ltv: 0 },
        rendementNet: 0,
        rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, yieldBanque: 0 },
        totalReturn: 0,
        totalReturnDetails: { cocNet: 0, gain: 0, deltaValeur: 0 },
        xirr: 0,
        xirrDetails: {
          years: 3, totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0,
          variationValeurDerniereAnnee: 0, total: 0, latestCf: 0, latestCfYear: 0
        },
        chartData: []
      };
    }
    
    // Aggregate KPIs from individual investments
    const selectedKPIs = Object.values(batchKPIs).filter((_, index) => 
      selectedInvestments.has(investmentIds[index])
    );
    
    return {
      fondPropre: selectedKPIs.reduce((sum, kpi) => sum + kpi.fondPropre, 0),
      fondPropreDetails: {
        valeur: selectedKPIs.reduce((sum, kpi) => sum + kpi.fondPropreDetails.valeur, 0),
        crd: selectedKPIs.reduce((sum, kpi) => sum + kpi.fondPropreDetails.crd, 0),
        ltv: selectedKPIs.length > 0 ? 
          selectedKPIs.reduce((sum, kpi) => sum + kpi.fondPropreDetails.ltv, 0) / selectedKPIs.length : 0
      },
      rendementNet: selectedKPIs.length > 0 ? 
        selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNet, 0) / selectedKPIs.length : 0,
      rendementNetDetails: {
        noi: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.noi, 0),
        loyer: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.loyer, 0),
        noiSurLoyer: selectedKPIs.length > 0 ? 
          selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.noiSurLoyer, 0) / selectedKPIs.length : 0,
        yieldBanque: selectedKPIs.length > 0 ? 
          selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.yieldBanque, 0) / selectedKPIs.length : 0
      },
      totalReturn: selectedKPIs.length > 0 ? 
        selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturn, 0) / selectedKPIs.length : 0,
      totalReturnDetails: {
        cocNet: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.cocNet, 0),
        gain: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.gain, 0),
        deltaValeur: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.deltaValeur, 0)
      },
      xirr: selectedKPIs.length > 0 ? 
        selectedKPIs.reduce((sum, kpi) => sum + kpi.xirr, 0) / selectedKPIs.length : 0,
      xirrDetails: {
        years: selectedKPIs.length > 0 ? Math.max(...selectedKPIs.map(kpi => kpi.xirrDetails.years)) : 3,
        totalCfni: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.totalCfni, 0),
        cfniDerniereAnnee: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.cfniDerniereAnnee, 0),
        deltaValeur: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.deltaValeur, 0),
        variationValeurDerniereAnnee: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.variationValeurDerniereAnnee, 0),
        total: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.total, 0),
        latestCf: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.latestCf, 0),
        latestCfYear: selectedKPIs.length > 0 ? Math.max(...selectedKPIs.map(kpi => kpi.xirrDetails.latestCfYear)) : 0
      },
      chartData: selectedKPIs.length > 0 ? selectedKPIs[0].chartData : []
    };
  }, [batchKPIs, selectedInvestments, investmentIds, loading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value).toFixed(2)}%`;
  };

  // Show message if no investments selected
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
  
  if (loading) {
    return (
      <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Chargement des KPI consolidés...
          </h3>
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
                <p className="text-2xl font-bold financial-value">
                  {formatPercentage(consolidatedData.rendementNet)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)}</div>
                <div>Loyer: {formatCurrency(consolidatedData.rendementNetDetails.loyer)}</div>
                <div>NOI/Loyer: {formatPercentage(consolidatedData.rendementNetDetails.noiSurLoyer)}</div>
                <div>Yield Banque: {formatPercentage(consolidatedData.rendementNetDetails.yieldBanque)}</div>
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
                <p className="text-2xl font-bold financial-value">
                  {formatPercentage(consolidatedData.totalReturn)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>CoC Net: {formatPercentage(consolidatedData.totalReturnDetails.cocNet)}</div>
                <div>Gain: {formatCurrency(consolidatedData.totalReturnDetails.gain)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.totalReturnDetails.deltaValeur)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* XIRR */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">XIRR ({consolidatedData.xirrDetails.years} ans)</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-2xl font-bold financial-value">
                  {formatPercentage(consolidatedData.xirr)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>CFNI {consolidatedData.xirrDetails.latestCfYear}: {formatCurrency(consolidatedData.xirrDetails.latestCf)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)}</div>
                <div>Total: {formatCurrency(consolidatedData.xirrDetails.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="card-financial">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold text-center w-20">Année</TableHead>
                <TableHead className="text-xs font-semibold text-center">Fond Propre</TableHead>
                <TableHead className="text-xs font-semibold text-center">Valeur</TableHead>
                <TableHead className="text-xs font-semibold text-center">CRD</TableHead>
                <TableHead className="text-xs font-semibold text-center">NOI</TableHead>
                <TableHead className="text-xs font-semibold text-center">CFNI</TableHead>
                <TableHead className="text-xs font-semibold text-center">Rendement Net</TableHead>
                <TableHead className="text-xs font-semibold text-center">CoC</TableHead>
                <TableHead className="text-xs font-semibold text-center">Total Return</TableHead>
                <TableHead className="text-xs font-semibold text-center">Cumul</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidatedData.chartData.map((row: ConsolidatedRow, index) => (
                <TableRow key={row.annee} className="text-xs">
                  <TableCell className="text-xs text-center font-medium">{row.annee}</TableCell>
                  <TableCell className="text-xs text-center">{formatCurrency(row.fondPropre)}</TableCell>
                  <TableCell className="text-xs text-center">{formatCurrency(row.valeur)}</TableCell>
                  <TableCell className="text-xs text-center">{formatCurrency(row.crd)}</TableCell>
                  <TableCell className="text-xs text-center">{formatCurrency(row.noi)}</TableCell>
                  <TableCell className="text-xs text-center">{formatCurrency(row.cfni)}</TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${row.fondPropre > 0 && row.noi / row.fondPropre >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(row.fondPropre > 0 ? (row.noi / row.fondPropre) * 100 : 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${row.fondPropre > 0 && row.cfni / row.fondPropre >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(row.fondPropre > 0 ? (row.cfni / row.fondPropre) * 100 : 0)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${(() => {
                      const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                      const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                      const totalReturn = row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;
                      return totalReturn >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                        const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                        return formatPercentage(row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0);
                      })()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                </TableRow>
              ))}
              {consolidatedData.chartData.length > 0 && (
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell className="text-xs text-center font-bold">Moyenne</TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${(() => {
                      const rendements = consolidatedData.chartData.map(row => 
                        row.fondPropre > 0 ? (row.noi / row.fondPropre) * 100 : 0
                      ).filter(value => value !== 0);
                      const moyenne = rendements.length > 0 ? rendements.reduce((sum, val) => sum + val, 0) / rendements.length : 0;
                      return moyenne >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const rendements = consolidatedData.chartData.map(row => 
                          row.fondPropre > 0 ? (row.noi / row.fondPropre) * 100 : 0
                        ).filter(value => value !== 0);
                        const moyenne = rendements.length > 0 ? rendements.reduce((sum, val) => sum + val, 0) / rendements.length : 0;
                        return formatPercentage(moyenne);
                      })()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${(() => {
                      const cocs = consolidatedData.chartData.map(row => 
                        row.fondPropre > 0 ? (row.cfni / row.fondPropre) * 100 : 0
                      ).filter(value => value !== 0);
                      const moyenne = cocs.length > 0 ? cocs.reduce((sum, val) => sum + val, 0) / cocs.length : 0;
                      return moyenne >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const cocs = consolidatedData.chartData.map(row => 
                          row.fondPropre > 0 ? (row.cfni / row.fondPropre) * 100 : 0
                        ).filter(value => value !== 0);
                        const moyenne = cocs.length > 0 ? cocs.reduce((sum, val) => sum + val, 0) / cocs.length : 0;
                        return formatPercentage(moyenne);
                      })()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <span className={`${(() => {
                      const totalReturns = consolidatedData.chartData.map((row, index) => {
                        const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                        const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                        return row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;
                      }).filter(value => value !== 0);
                      const moyenne = totalReturns.length > 0 ? totalReturns.reduce((sum, val) => sum + val, 0) / totalReturns.length : 0;
                      return moyenne >= 0 ? 'text-green-600' : 'text-red-600';
                    })()}`}>
                      {(() => {
                        const totalReturns = consolidatedData.chartData.map((row, index) => {
                          const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                          const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                          return row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;
                        }).filter(value => value !== 0);
                        const moyenne = totalReturns.length > 0 ? totalReturns.reduce((sum, val) => sum + val, 0) / totalReturns.length : 0;
                        return formatPercentage(moyenne);
                      })()}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-center">-</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>
    </div>
  );
}