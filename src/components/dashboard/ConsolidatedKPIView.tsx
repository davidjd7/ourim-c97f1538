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
        ltv: selectedKPIs.reduce((sum, kpi) => sum + kpi.fondPropreDetails.ltv, 0) / Math.max(selectedKPIs.length, 1),
      },
      rendementNet: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNet, 0) / Math.max(selectedKPIs.length, 1),
      rendementNetDetails: {
        noi: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.noi, 0),
        loyer: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.loyer, 0),
        noiSurLoyer: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.noiSurLoyer, 0) / Math.max(selectedKPIs.length, 1),
        yieldBanque: selectedKPIs.reduce((sum, kpi) => sum + kpi.rendementNetDetails.yieldBanque, 0) / Math.max(selectedKPIs.length, 1),
      },
      totalReturn: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturn, 0) / Math.max(selectedKPIs.length, 1),
      totalReturnDetails: {
        cocNet: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.cocNet, 0) / Math.max(selectedKPIs.length, 1),
        gain: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.cfniPlusDeltaValeur, 0),
        deltaValeur: selectedKPIs.reduce((sum, kpi) => sum + kpi.totalReturnDetails.deltaValeur, 0),
      },
      xirr: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirr, 0) / Math.max(selectedKPIs.length, 1),
      xirrDetails: {
        years: 3,
        totalCfni: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.totalCfni, 0),
        cfniDerniereAnnee: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.cfniDerniereAnnee, 0),
        deltaValeur: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.deltaValeur, 0),
        variationValeurDerniereAnnee: 0,
        total: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.total, 0),
        latestCf: selectedKPIs.reduce((sum, kpi) => sum + kpi.xirrDetails.latestCf, 0),
        latestCfYear: new Date().getFullYear()
      },
      chartData: [] // Simplified for now since we're using consolidated approach
    };
  }, [batchKPIs, loading, selectedInvestments, investmentIds]);
  
  // Rolling XIRR calculation using centralized function
  const calculateRollingXIRR = (dataUpToIndex: any[]) => {
    if (dataUpToIndex.length < 2) return 0;

    // Convert to proper format for XIRR calculation
    const xirrRows: ConsolidatedRow[] = dataUpToIndex.map(row => ({
      date: row.date,
      cashFlow: row.cashFlow,
      valeur: row.valeur,
      crd: row.crd || 0,
      fp: row.fondPropre
    }));

    return calculateXIRR(xirrRows);
  };
  const selectedInvestmentsList = useMemo(() => {
    return investments.filter(inv => selectedInvestments.has(inv.id));
  }, [investments, selectedInvestments]);
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
    return <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun investissement sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Veuillez sélectionner au moins un investissement dans la vue tableau pour voir les KPI consolidés.
          </p>
        </div>
      </div>;
  }
  
  if (loading) {
    return <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Chargement des KPI consolidés...
          </h3>
        </div>
      </div>;
  }
  return <div className="space-y-6">
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
                <div>CFNI: {formatCurrency(consolidatedData.chartData[consolidatedData.chartData.length - 1]?.cfni || 0)}</div>
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
                {consolidatedData.xirrDetails.latestCf !== 0 && consolidatedData.xirrDetails.latestCfYear !== 0 && <p className="text-sm text-muted-foreground mt-1">
                    CF ({consolidatedData.xirrDetails.latestCfYear}) : {formatCurrency(consolidatedData.xirrDetails.latestCf)}
                  </p>}
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
                        <TooltipTrigger className="cursor-help">Rendement net</TooltipTrigger>
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
                           <p>Cash Flow (CP)</p>
                         </TooltipContent>
                       </Tooltip>
                     </TableHead>
                    <TableHead className="text-xs text-center min-w-[70px]">Δ Valeur</TableHead>
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
                    <TableHead className="text-xs text-center min-w-[80px]">Total Return</TableHead>
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

                  // Total Return pour cette ligne (approximation)
                  const totalReturnRow = row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;

                  // XIRR glissant
                  const xirrGlissant = index > 0 ? calculateRollingXIRR(consolidatedData.chartData.slice(0, index + 1)) : 0;
                  return <TableRow key={index}>
                         <TableCell className="font-medium text-xs text-center">{row.dateLabel}</TableCell>
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
                        <TableCell className={`financial-value text-xs text-center ${variationValeur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(variationValeur)}
                        </TableCell>
                        <TableCell className={`financial-value text-xs text-center ${gain1 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gain1)}
                        </TableCell>
                        <TableCell className={`financial-value text-xs text-center ${gain2 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(gain2)}
                        </TableCell>
                        <TableCell className={`text-xs text-center ${totalReturnRow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(totalReturnRow)}
                        </TableCell>
                        <TableCell className={`text-xs text-center ${xirrGlissant >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(xirrGlissant)}
                        </TableCell>
                      </TableRow>;
                })}
                  
                  {/* Ligne Total */}
                  {consolidatedData.chartData.length > 0 && <TableRow className="border-t-2 border-primary/20 bg-muted/20 font-semibold">
                      <TableCell className="font-bold text-xs text-center">Total</TableCell>
                      <TableCell className="text-xs text-center">-</TableCell>
                      <TableCell className="text-xs text-center">-</TableCell>
                      <TableCell className="financial-value text-xs text-center">
                        {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.noi, 0))}
                      </TableCell>
                      <TableCell className={`text-xs text-center ${consolidatedData.rendementNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(consolidatedData.rendementNet)}
                      </TableCell>
                      <TableCell className="financial-value text-xs text-center">
                        {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cfni, 0))}
                      </TableCell>
                      <TableCell className={`text-xs text-center ${consolidatedData.totalReturnDetails.cocNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(consolidatedData.totalReturnDetails.cocNet)}
                      </TableCell>
                      <TableCell className="financial-value text-xs text-center">
                        {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cashFlow, 0))}
                      </TableCell>
                      <TableCell className={`financial-value text-xs text-center ${consolidatedData.totalReturnDetails.deltaValeur >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(consolidatedData.totalReturnDetails.deltaValeur)}
                      </TableCell>
                       <TableCell className={`financial-value text-xs text-center ${consolidatedData.chartData.reduce((sum, row, index) => {
                    const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                    const variationFP = previousRow ? row.fondPropre - previousRow.fondPropre : 0;
                    const gain1 = variationFP + row.cashFlow;
                    return sum + gain1;
                  }, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {formatCurrency(consolidatedData.chartData.reduce((sum, row, index) => {
                      const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                      const variationFP = previousRow ? row.fondPropre - previousRow.fondPropre : 0;
                      const gain1 = variationFP + row.cashFlow;
                      return sum + gain1;
                    }, 0))}
                       </TableCell>
                      <TableCell className="text-xs text-center">-</TableCell>
                      <TableCell className={`text-xs text-center ${(() => {
                    // Calculer la moyenne des Total Return en excluant les valeurs à 0
                    const totalReturns = consolidatedData.chartData.map((row, index) => {
                      const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                      const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                      return row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;
                    }).filter(value => value !== 0);
                    const moyenne = totalReturns.length > 0 ? totalReturns.reduce((sum, val) => sum + val, 0) / totalReturns.length : 0;
                    return moyenne >= 0 ? 'text-green-600' : 'text-red-600';
                  })()}`}>
                        {(() => {
                      // Calculer la moyenne des Total Return en excluant les valeurs à 0
                      const totalReturns = consolidatedData.chartData.map((row, index) => {
                        const previousRow = index > 0 ? consolidatedData.chartData[index - 1] : null;
                        const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                        return row.fondPropre > 0 ? (row.cfni + variationValeur) / row.fondPropre * 100 : 0;
                      }).filter(value => value !== 0);
                      const moyenne = totalReturns.length > 0 ? totalReturns.reduce((sum, val) => sum + val, 0) / totalReturns.length : 0;
                      return formatPercentage(moyenne);
                    })()}
                      </TableCell>
                       <TableCell className="text-xs text-center">-</TableCell>
                    </TableRow>}
                 </TableBody>
               </Table>
             </TooltipProvider>
           </div>
         </div>
        </div>
      </div>
    </div>
}