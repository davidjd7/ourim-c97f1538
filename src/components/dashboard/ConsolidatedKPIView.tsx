import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';
import { getSyntheseData, calculateXIRR, calculateNOI } from '@/lib/kpiCalculations';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConsolidatedCharts } from '@/components/dashboard/ConsolidatedCharts';
import type { ConsolidatedRow } from '@/types/kpi';

interface ConsolidatedKPIViewProps {
  selectedInvestments: Set<string>;
  cutoffYear: number | null;
  onCutoffYearChange: (year: number) => void;
}

export function ConsolidatedKPIView({
  selectedInvestments,
  cutoffYear,
  onCutoffYearChange
}: ConsolidatedKPIViewProps) {
  const { investments } = useInvestments();
  
  // Get investment IDs for batch KPI loading
  const investmentIds = Array.from(selectedInvestments);
  const { batchKPIs, rawByInvestment, loading } = useBatchPerformanceKPIs(investmentIds);
  
  // Calculate the default cutoff year (latest common year across all selected investments)
  const defaultCutoffYear = useMemo(() => {
    if (Object.keys(rawByInvestment).length === 0) {
      return new Date().getFullYear();
    }

    // Find the latest year where ALL investments have data
    const allDates: Date[] = [];
    Object.values(rawByInvestment).forEach(investmentData => {
      investmentData.cashflows.forEach(cf => allDates.push(new Date(cf.date)));
      investmentData.valorisations.forEach(v => allDates.push(new Date(v.date)));
      investmentData.immobilisations.forEach(i => allDates.push(new Date(i.date)));
      investmentData.debtFlows.forEach(df => allDates.push(new Date(df.date)));
    });

    if (allDates.length === 0) {
      return new Date().getFullYear();
    }

    // Get the minimum of the maximum years for each investment
    const maxYearsByInvestment = Object.values(rawByInvestment).map(investmentData => {
      const dates: Date[] = [];
      investmentData.cashflows.forEach(cf => dates.push(new Date(cf.date)));
      investmentData.valorisations.forEach(v => dates.push(new Date(v.date)));
      investmentData.immobilisations.forEach(i => dates.push(new Date(i.date)));
      investmentData.debtFlows.forEach(df => dates.push(new Date(df.date)));
      
      if (dates.length === 0) return 1900;
      return Math.max(...dates.map(d => d.getFullYear()));
    });

    return Math.min(...maxYearsByInvestment);
  }, [rawByInvestment]);

  // Use the provided cutoffYear or default to calculated value
  const effectiveCutoffYear = cutoffYear ?? defaultCutoffYear;

  // Update parent with default year if needed
  React.useEffect(() => {
    if (cutoffYear === null && defaultCutoffYear) {
      onCutoffYearChange(defaultCutoffYear);
    }
  }, [cutoffYear, defaultCutoffYear, onCutoffYearChange]);
  
  // Build consolidated synthesis data from raw investment data
  const consolidatedSynthesis = useMemo(() => {
    if (selectedInvestments.size === 0 || Object.keys(rawByInvestment).length === 0) {
      return [];
    }

    // Aggregate all raw data by date across all selected investments
    const dateMap = new Map<string, {
      cashflows: any[];
      immobilisations: any[];
      debtFlows: any[];
      valorisations: any[];
    }>();

    // Filter data by cutoff year and collect all dates
    const cutoffDate = new Date(`${effectiveCutoffYear}-12-31`);
    
    Object.values(rawByInvestment).forEach(investmentData => {
      // Group cashflows by date (filtered by cutoff)
      investmentData.cashflows
        .filter(cf => new Date(cf.date) <= cutoffDate)
        .forEach(cf => {
          if (!dateMap.has(cf.date)) {
            dateMap.set(cf.date, { cashflows: [], immobilisations: [], debtFlows: [], valorisations: [] });
          }
          dateMap.get(cf.date)!.cashflows.push(cf);
        });

      // Group immobilisations by date (filtered by cutoff)
      investmentData.immobilisations
        .filter(immo => new Date(immo.date) <= cutoffDate)
        .forEach(immo => {
          if (!dateMap.has(immo.date)) {
            dateMap.set(immo.date, { cashflows: [], immobilisations: [], debtFlows: [], valorisations: [] });
          }
          dateMap.get(immo.date)!.immobilisations.push(immo);
        });

      // Group debt flows by date (filtered by cutoff)
      investmentData.debtFlows
        .filter(df => new Date(df.date) <= cutoffDate)
        .forEach(df => {
          if (!dateMap.has(df.date)) {
            dateMap.set(df.date, { cashflows: [], immobilisations: [], debtFlows: [], valorisations: [] });
          }
          dateMap.get(df.date)!.debtFlows.push(df);
        });

      // Group valorisations by date (filtered by cutoff)
      investmentData.valorisations
        .filter(valo => new Date(valo.date) <= cutoffDate)
        .forEach(valo => {
          if (!dateMap.has(valo.date)) {
            dateMap.set(valo.date, { cashflows: [], immobilisations: [], debtFlows: [], valorisations: [] });
          }
          dateMap.get(valo.date)!.valorisations.push(valo);
        });
    });

    // Build consolidated synthesis data using getSyntheseData for aggregation
    const consolidatedData: ConsolidatedRow[] = [];
    
    Array.from(dateMap.keys())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .forEach(date => {
        const dateData = dateMap.get(date)!;
        
        // Aggregate data for this date
        const totalNOI = dateData.cashflows.reduce((sum, cf) => sum + calculateNOI(cf), 0);
        const totalLoyer = dateData.cashflows.reduce((sum, cf) => sum + (cf.loyer || 0), 0);
        const totalImmobilisations = dateData.immobilisations.reduce((sum, immo) => sum + (immo.montant || 0), 0);
        const totalValeur = dateData.valorisations.reduce((sum, valo) => sum + (valo.valeur || 0), 0);
        const totalCrd = dateData.debtFlows.reduce((sum, df) => sum + (df.capitalDebut - df.rmbtCapital), 0);
        const totalRmbtInteret = dateData.debtFlows.reduce((sum, df) => sum + (df.rmbtInteret || 0), 0);
        const totalRmbtCapital = dateData.debtFlows.reduce((sum, df) => sum + (df.rmbtCapital || 0), 0);
        
        // Calculate consolidated metrics
        const noiAjuste = totalNOI - totalImmobilisations;
        const cfni = noiAjuste - totalRmbtInteret;
        const cf = cfni - totalRmbtCapital;
        const fp = totalValeur - totalCrd;

        consolidatedData.push({
          date,
          cashFlow: cf,
          valeur: totalValeur,
          crd: totalCrd,
          fp,
          // Additional fields for table display
          noi: totalNOI,
          loyer: totalLoyer,
          immobilisations: totalImmobilisations,
          cfni,
          rmbtInteret: totalRmbtInteret,
          rmbtCapital: totalRmbtCapital
        } as ConsolidatedRow & { 
          noi: number; 
          loyer: number; 
          immobilisations: number; 
          cfni: number; 
          rmbtInteret: number; 
          rmbtCapital: number; 
        });
      });

    return consolidatedData;
  }, [selectedInvestments, rawByInvestment, effectiveCutoffYear]);

  // Calculate consolidated KPIs from synthesis data
  const consolidatedData = useMemo(() => {
    if (consolidatedSynthesis.length === 0) {
      return null;
    }

    const latestData = consolidatedSynthesis[consolidatedSynthesis.length - 1] as any;
    const latestYear = new Date(latestData.date).getFullYear();
    
    // Calculate consolidated metrics
    const fondPropre = latestData.fp;
    const rendementNet = latestData.valeur > 0 ? (latestData.noi / latestData.valeur) * 100 : 0;
    const cocNet = latestData.fp > 0 ? (latestData.cfni / latestData.fp) * 100 : 0;
    
    // Calculate delta valeur and total return
    const previousData = consolidatedSynthesis.length > 1 ? consolidatedSynthesis[consolidatedSynthesis.length - 2] as any : null;
    const deltaValeur = previousData ? latestData.valeur - previousData.valeur : 0;
    const gain1 = latestData.cfni + deltaValeur;
    const totalReturn = latestData.fp > 0 ? (gain1 / latestData.fp) * 100 : 0;
    
    // Calculate consolidated XIRR using the full series
    const xirr = calculateXIRR(consolidatedSynthesis);
    
    return {
      fondPropre,
      fondPropreDetails: {
        valeur: latestData.valeur,
        crd: latestData.crd,
        ltv: latestData.valeur > 0 ? (latestData.crd / latestData.valeur) * 100 : 0
      },
      rendementNet,
      rendementNetDetails: {
        noi: latestData.noi,
        loyer: latestData.loyer,
        noiSurLoyer: latestData.loyer > 0 ? (latestData.noi / latestData.loyer) * 100 : 0,
        yieldBanque: latestData.crd > 0 ? (latestData.noi / latestData.crd) * 100 : 0
      },
      totalReturn,
      totalReturnDetails: {
        cocNet,
        gain: gain1,
        deltaValeur,
        cfni: latestData.cfni
      },
      xirr,
      xirrDetails: {
        years: 3,
        totalCfni: consolidatedSynthesis.reduce((sum, row: any) => sum + row.cfni, 0),
        cfDerniereAnnee: latestData.cashFlow,
        cfDerniereAnneeYear: latestYear,
        deltaValeur,
        total: gain1
      }
    };
  }, [consolidatedSynthesis]);

  // Build synthetic table data with all columns
  const syntheticTableData = useMemo(() => {
    if (consolidatedSynthesis.length === 0) {
      return [];
    }

    return consolidatedSynthesis.map((row: any, index) => {
      const previousRow = index > 0 ? consolidatedSynthesis[index - 1] as any : null;
      
      // Calculate metrics for this row
      const rendementNet = row.valeur > 0 ? (row.noi / row.valeur) * 100 : 0;
      const cocNet = row.fp > 0 ? (row.cfni / row.fp) * 100 : 0;
      const deltaValeur = previousRow ? row.valeur - previousRow.valeur : 0;
      const deltaFP = previousRow ? row.fp - previousRow.fp : 0;
      const gain1 = deltaFP + row.cashFlow;
      const gain2 = deltaValeur + row.cfni;
      const totalReturn = row.fp > 0 ? (gain1 / row.fp) * 100 : 0;
      
      // Calculate rolling XIRR up to this point
      const rollingData = consolidatedSynthesis.slice(0, index + 1);
      const rollingXirr = rollingData.length >= 2 ? calculateXIRR(rollingData) : 0;

      return {
        date: row.date,
        valeur: row.valeur,
        fp: row.fp,
        noi: row.noi,
        rendementNet,
        cfni: row.cfni,
        cocNet,
        cf: row.cashFlow,
        deltaValeur,
        gain1,
        gain2,
        totalReturn,
        xirrGlissant: rollingXirr
      };
    });
  }, [consolidatedSynthesis]);

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

  const getValueClass = (value: number) => {
    return value >= 0 ? 'text-success' : 'text-destructive';
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
      {/* Performance KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4 kpi-grid">
        {/* Fond Propre */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">Fond Propre ({effectiveCutoffYear})</p>
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
            <p className="text-sm text-muted-foreground font-bold mb-3">Rendement Net ({effectiveCutoffYear})</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold ${getValueClass(consolidatedData.rendementNet)}`}>
                  {formatPercentage(consolidatedData.rendementNet)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>NOI: {formatCurrency(consolidatedData.rendementNetDetails.noi)} ({consolidatedData.rendementNetDetails.noiSurLoyer.toFixed(1)}% du loyer)</div>
                <div>Loyer: {formatCurrency(consolidatedData.rendementNetDetails.loyer)}</div>
                <div>Yield Banque: {consolidatedData.rendementNetDetails.yieldBanque.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Return */}
        <div className="card-financial">
          <div className="p-4">
            <p className="text-sm text-muted-foreground font-bold mb-3">Total Return ({effectiveCutoffYear})</p>
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className={`text-2xl font-bold ${getValueClass(consolidatedData.totalReturn)}`}>
                  {formatPercentage(consolidatedData.totalReturn)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gain : {formatCurrency(consolidatedData.totalReturnDetails.gain)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>COC net: {consolidatedData.totalReturnDetails.cocNet.toFixed(1)}%</div>
                <div>CFNI: {formatCurrency(consolidatedData.totalReturnDetails.cfni)}</div>
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
                <p className={`text-2xl font-bold ${getValueClass(consolidatedData.xirr)}`}>
                  {formatPercentage(consolidatedData.xirr)}
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Total CFNI: {formatCurrency(consolidatedData.xirrDetails.totalCfni)}</div>
                <div>CF ({consolidatedData.xirrDetails.cfDerniereAnneeYear}): {formatCurrency(consolidatedData.xirrDetails.cfDerniereAnnee)}</div>
                <div>Δ Valeur: {formatCurrency(consolidatedData.xirrDetails.deltaValeur)}</div>
                <div>Total: {formatCurrency(consolidatedData.xirrDetails.total)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <ConsolidatedCharts 
        selectedInvestments={selectedInvestments}
        batchKPIs={batchKPIs}
        rawByInvestment={rawByInvestment}
        syntheticTableData={syntheticTableData}
      />

      {/* Synthetic Table */}
      <div className="card-financial">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tableau de Synthèse Consolidé</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead className="text-left">Date</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">FP</TableHead>
                  <TableHead className="text-right">NOI</TableHead>
                  <TableHead className="text-right">Rendement net</TableHead>
                  <TableHead className="text-right">CFNI</TableHead>
                  <TableHead className="text-right">COC net</TableHead>
                  <TableHead className="text-right">CF</TableHead>
                  <TableHead className="text-right">Δ Valeur</TableHead>
                  <TableHead className="text-right">Gain 1</TableHead>
                  <TableHead className="text-right">Gain 2</TableHead>
                  <TableHead className="text-right">Total Return</TableHead>
                  <TableHead className="text-right">XIRR glissant</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {syntheticTableData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{new Date(row.date).getFullYear()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.valeur)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.fp)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.noi)}</TableCell>
                    <TableCell className={`text-right ${getValueClass(row.rendementNet)}`}>
                      {formatPercentage(row.rendementNet)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.cfni)}</TableCell>
                    <TableCell className={`text-right ${getValueClass(row.cocNet)}`}>
                      {formatPercentage(row.cocNet)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.cf)}</TableCell>
                    <TableCell className={`text-right ${getValueClass(row.deltaValeur)}`}>
                      {formatCurrency(row.deltaValeur)}
                    </TableCell>
                    <TableCell className={`text-right ${getValueClass(row.gain1)}`}>
                      {formatCurrency(row.gain1)}
                    </TableCell>
                    <TableCell className={`text-right ${getValueClass(row.gain2)}`}>
                      {formatCurrency(row.gain2)}
                    </TableCell>
                    <TableCell className={`text-right ${getValueClass(row.totalReturn)}`}>
                      {formatPercentage(row.totalReturn)}
                    </TableCell>
                    <TableCell className={`text-right ${getValueClass(row.xirrGlissant)}`}>
                      {formatPercentage(row.xirrGlissant)}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Total Row */}
                {syntheticTableData.length > 0 && (
                  <TableRow className="border-t-2 font-semibold bg-muted/20">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.noi, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(syntheticTableData.filter(row => row.rendementNet !== 0).reduce((sum, row) => sum + row.rendementNet, 0) / syntheticTableData.filter(row => row.rendementNet !== 0).length || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.cfni, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(syntheticTableData.filter(row => row.cocNet !== 0).reduce((sum, row) => sum + row.cocNet, 0) / syntheticTableData.filter(row => row.cocNet !== 0).length || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.cf, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.deltaValeur, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.gain1, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(syntheticTableData.reduce((sum, row) => sum + row.gain2, 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(syntheticTableData.filter(row => row.totalReturn !== 0).reduce((sum, row) => sum + row.totalReturn, 0) / syntheticTableData.filter(row => row.totalReturn !== 0).length || 0)}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                      <td className={`p-2 text-right ${getValueClass(kpi.rendementNet)}`}>
                        {formatPercentage(kpi.rendementNet)}
                      </td>
                      <td className={`p-2 text-right ${getValueClass(kpi.totalReturn)}`}>
                        {formatPercentage(kpi.totalReturn)}
                      </td>
                      <td className={`p-2 text-right ${getValueClass(kpi.xirr)}`}>
                        {formatPercentage(kpi.xirr)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 font-semibold bg-muted/20">
                  <td className="p-2">Total Consolidé</td>
                  <td className="p-2 text-right">{formatCurrency(consolidatedData.fondPropre)}</td>
                  <td className={`p-2 text-right ${getValueClass(consolidatedData.rendementNet)}`}>
                    {formatPercentage(consolidatedData.rendementNet)}
                  </td>
                  <td className={`p-2 text-right ${getValueClass(consolidatedData.totalReturn)}`}>
                    {formatPercentage(consolidatedData.totalReturn)}
                  </td>
                  <td className={`p-2 text-right ${getValueClass(consolidatedData.xirr)}`}>
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