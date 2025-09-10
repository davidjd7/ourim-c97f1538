import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CashflowRow {
  id?: string;
  date: string;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
}

interface ValorisationRow {
  id?: string;
  date: string;
  valeur: number;
  note: string;
}

interface SyntheseRow {
  date: string;
  flux: number;
  valeur: number;
  crd: number;
  fp: number;
}

interface DebtFlowRow {
  id?: string;
  date: string;
  capitalDebut: number;
  rmbtCapital: number;
  rmbtInteret: number;
}

interface ImmobilisationRow {
  id?: string;
  date: string;
  montant: number;
  note: string;
}

export function usePerformanceKPIs(investmentId: string, bailLoyerHT?: number) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    fondPropre: 0,
    fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
    dernierEarning: 0,
    dernierEarningDetails: { flux: 0, varValeur: 0, varValeurPercentage: 0, year: 0 },
    dernierFlux: 0,
    dernierFluxDetails: { capRate: 0, coc: 0, yield: 0, fluxRate: 0, year: 0 },
    xirr: 0,
    xirrDetails: { totalEarning: 0, totalFlux: 0, totalGainValeur: 0, years: 0 }
  });

  // Helper functions (exact same as PerformanceTab)
  const calculateEBITDA = (cashflow: CashflowRow) => {
    return cashflow.rex + cashflow.retraitAmort + cashflow.retraitAutres;
  };

  const calculateCapitalFin = (flow: DebtFlowRow) => {
    return flow.capitalDebut - flow.rmbtCapital;
  };

  const calculateFlux = (flow: DebtFlowRow) => {
    return flow.rmbtCapital + flow.rmbtInteret;
  };

  // Calculate synthesis data by grouping all data by date (exact same as PerformanceTab)
  const getSyntheseData = (
    cashflows: CashflowRow[],
    immobilisations: ImmobilisationRow[],
    debtFlows: DebtFlowRow[],
    valorisations: ValorisationRow[]
  ): SyntheseRow[] => {
    const dateMap = new Map<string, SyntheseRow>();

    // Initialize all dates
    const allDates = new Set<string>();
    cashflows.forEach(cf => allDates.add(cf.date));
    immobilisations.forEach(immo => allDates.add(immo.date));
    debtFlows.forEach(df => allDates.add(df.date));
    valorisations.forEach(valo => allDates.add(valo.date));

    // Initialize all dates in map
    allDates.forEach(date => {
      dateMap.set(date, {
        date,
        flux: 0,
        valeur: 0,
        crd: 0,
        fp: 0
      });
    });

    // Add EBITDA from cashflows
    cashflows.forEach(cf => {
      const existing = dateMap.get(cf.date);
      if (existing) {
        existing.flux += calculateEBITDA(cf);
      }
    });

    // Add immobilisation amounts (subtract)
    immobilisations.forEach(immo => {
      const existing = dateMap.get(immo.date);
      if (existing) {
        existing.flux -= immo.montant;
      }
    });

    // Add debt flows and CRD (subtract debt flows)
    debtFlows.forEach(df => {
      const existing = dateMap.get(df.date);
      if (existing) {
        existing.flux -= calculateFlux(df);
        existing.crd = calculateCapitalFin(df);
      }
    });

    // Add valorisations
    valorisations.forEach(valo => {
      const existing = dateMap.get(valo.date);
      if (existing) {
        existing.valeur = valo.valeur;
      }
    });

    // Calculate FP = Valeur - CRD
    dateMap.forEach(row => {
      row.fp = row.valeur - row.crd;
    });

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // XIRR calculation function - Following Excel TRI.PAIEMENT structure (exact same as PerformanceTab)
  const calculateXIRR = (syntheseData: SyntheseRow[]) => {
    if (syntheseData.length < 2) return 0;

    // Sort by date to ensure chronological order
    const sortedData = [...syntheseData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build cash flows following Excel TRI.PAIEMENT structure:
    const cashFlows: Array<{
      date: Date;
      value: number;
    }> = [];
    
    for (let i = 0; i < sortedData.length; i++) {
      const row = sortedData[i];
      const date = new Date(row.date + 'T00:00:00');
      if (i === 0) {
        // Initial investment: -FP (negative because it's an outflow)
        cashFlows.push({
          date,
          value: -row.fp
        });
      } else if (i === sortedData.length - 1) {
        // Final period: flux + FP (cash flow + final value)
        cashFlows.push({
          date,
          value: row.flux + row.fp
        });
      } else {
        // Intermediate periods: just the flux
        cashFlows.push({
          date,
          value: row.flux
        });
      }
    }

    // Newton-Raphson method for IRR calculation
    let rate = 0.1; // Initial guess 10%
    const maxIterations = 100;
    const tolerance = 0.0001;
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      const baseDate = cashFlows[0].date;
      
      for (const flow of cashFlows) {
        const years = (flow.date.getTime() - baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const factor = Math.pow(1 + rate, years);
        npv += flow.value / factor;
        dnpv -= flow.value * years / (factor * (1 + rate));
      }
      
      if (Math.abs(npv) < tolerance) {
        return rate * 100; // Return as percentage
      }
      
      if (Math.abs(dnpv) < tolerance) {
        break; // Avoid division by zero
      }
      
      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate * 100;
      }
      rate = newRate;
    }
    return 0; // Return 0 if convergence fails
  };

  const loadKPIs = async () => {
    if (!user || !investmentId) return;

    try {
      setLoading(true);

      // Load all data in parallel
      const [cashflowsRes, valorisationsRes, debtFlowsRes, immobilisationsRes] = await Promise.all([
        supabase.from('investment_cashflows').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_valorisations').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_debt_flows').select('*').eq('investment_id', investmentId).eq('user_id', user.id),
        supabase.from('investment_immobilisations').select('*').eq('investment_id', investmentId).eq('user_id', user.id)
      ]);

      const cashflows: CashflowRow[] = (cashflowsRes.data || []).map(cf => ({
        id: cf.id,
        date: cf.date,
        rex: cf.rex || 0,
        retraitAmort: cf.retrait_amort || 0,
        retraitAutres: cf.retrait_autres || 0
      }));

      const valorisations: ValorisationRow[] = (valorisationsRes.data || []).map(valo => ({
        id: valo.id,
        date: valo.date,
        valeur: valo.valeur || 0,
        note: valo.note || ''
      }));

      const debtFlows: DebtFlowRow[] = (debtFlowsRes.data || []).map(debt => ({
        id: debt.id,
        date: debt.date,
        capitalDebut: debt.capital_debut || 0,
        rmbtCapital: debt.rmbt_capital || 0,
        rmbtInteret: debt.rmbt_interet || 0
      }));

      const immobilisations: ImmobilisationRow[] = (immobilisationsRes.data || []).map(immo => ({
        id: immo.id,
        date: immo.date,
        montant: immo.montant || 0,
        note: immo.note || ''
      }));

      // Calculate synthese data using exact same logic as PerformanceTab
      const syntheseData = getSyntheseData(cashflows, immobilisations, debtFlows, valorisations);

      if (syntheseData.length === 0) {
        setKpis({ 
          fondPropre: 0,
          fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
          dernierEarning: 0,
          dernierEarningDetails: { flux: 0, varValeur: 0, varValeurPercentage: 0, year: 0 },
          dernierFlux: 0,
          dernierFluxDetails: { capRate: 0, coc: 0, yield: 0, fluxRate: 0, year: 0 },
          xirr: 0,
          xirrDetails: { totalEarning: 0, totalFlux: 0, totalGainValeur: 0, years: 0 }
        });
        return;
      }

      const latestSynthese = syntheseData[syntheseData.length - 1];
      const oldestSynthese = syntheseData[0];

      // Get chart data grouped by year (same as PerformanceTab)
      const getChartData = () => {
        const yearMap = new Map<number, { year: number; flux: number; valeur: number; varValeur: number; gain: number }>();

        // First pass: Group data by year and calculate totals
        syntheseData.forEach((row) => {
          const year = new Date(row.date).getFullYear();
          if (!yearMap.has(year)) {
            yearMap.set(year, { year, flux: 0, valeur: 0, varValeur: 0, gain: 0 });
          }
          const yearData = yearMap.get(year)!;
          yearData.flux += row.flux;
          yearData.valeur = row.valeur; // Take the latest value for the year
        });

        // Convert to array and sort by year
        const yearArray = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

        // Exclude the oldest year (first year in the sorted array)
        const filteredYearArray = yearArray.length > 1 ? yearArray.slice(1) : yearArray;

        // Second pass: Calculate varValeur (difference from previous year) and gain
        filteredYearArray.forEach((yearData, index) => {
          if (index > 0) {
            yearData.varValeur = yearData.valeur - filteredYearArray[index - 1].valeur;
          } else if (yearArray.length > 1) {
            // For the first year in filtered array, compare with the excluded oldest year
            yearData.varValeur = yearData.valeur - yearArray[0].valeur;
          } else {
            yearData.varValeur = 0;
          }
          yearData.gain = yearData.flux + yearData.varValeur;
        });

        return filteredYearArray;
      };

      const chartData = getChartData();
      const latestChartData = chartData[chartData.length - 1];
      const previousChartData = chartData.length > 1 ? chartData[chartData.length - 2] : null;

      // KPI calculations
      const fondPropre = latestSynthese?.fp || 0;
      const xirr = syntheseData.length > 1 ? calculateXIRR(syntheseData) : 0;

      // Fond Propre details
      const fondPropreYear = latestSynthese ? new Date(latestSynthese.date).getFullYear() : 0;
      const ltv = latestSynthese?.valeur && latestSynthese.valeur > 0 ? (latestSynthese.crd / latestSynthese.valeur) * 100 : 0;
      const fondPropreDetails = {
        valeur: latestSynthese?.valeur || 0,
        crd: latestSynthese?.crd || 0,
        ltv,
        year: fondPropreYear
      };

      // Dernier Earning calculations
      const dernierFlux = latestSynthese?.flux || 0;
      const dernierVarValeur = previousChartData ? (latestChartData?.valeur || 0) - (previousChartData?.valeur || 0) : 0;
      const dernierEarning = dernierFlux + dernierVarValeur;
      const variationPercentage = previousChartData && previousChartData.valeur !== 0 
        ? (dernierVarValeur / previousChartData.valeur) * 100 
        : 0;
      const dernierEarningYear = latestChartData?.year || 0;
      const dernierEarningDetails = {
        flux: dernierFlux,
        varValeur: dernierVarValeur,
        varValeurPercentage: variationPercentage,
        year: dernierEarningYear
      };

      // Dernier Flux details
      const coc = latestSynthese?.fp && latestSynthese.fp > 0 ? latestSynthese.flux / latestSynthese.fp * 100 : 0;
      const capRate = latestSynthese?.valeur && latestSynthese.valeur > 0 ? latestSynthese.flux / latestSynthese.valeur * 100 : 0;
      
      // Calculate yield (flux/CRD) if we have debt data
      const yield_ = latestSynthese?.crd && latestSynthese.crd !== 0 ? latestSynthese.flux / latestSynthese.crd * 100 : 0;
      
      const dernierFluxDetails = {
        capRate,
        coc,
        yield: yield_,
        fluxRate: bailLoyerHT && bailLoyerHT > 0 ? (latestSynthese.flux / bailLoyerHT) * 100 : 0,
        year: dernierEarningYear
      };

      // XIRR details
      const totalGainValeur = (latestSynthese?.valeur || 0) - (oldestSynthese?.valeur || 0);
      const totalFlux = syntheseData.reduce((sum, item) => sum + (item.flux || 0), 0);
      const totalEarning = totalGainValeur + totalFlux;
      const years = syntheseData.length > 1 ? Math.round((new Date(latestSynthese.date).getTime() - new Date(oldestSynthese.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      
      const xirrDetails = {
        totalEarning,
        totalFlux,
        totalGainValeur,
        years
      };

      setKpis({
        fondPropre,
        fondPropreDetails,
        dernierEarning,
        dernierEarningDetails,
        dernierFlux,
        dernierFluxDetails,
        xirr,
        xirrDetails
      });

    } catch (error) {
      console.error('Error loading performance KPIs:', error);
      setKpis({ 
        fondPropre: 0,
        fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
        dernierEarning: 0,
        dernierEarningDetails: { flux: 0, varValeur: 0, varValeurPercentage: 0, year: 0 },
        dernierFlux: 0,
        dernierFluxDetails: { capRate: 0, coc: 0, yield: 0, fluxRate: 0, year: 0 },
        xirr: 0,
        xirrDetails: { totalEarning: 0, totalFlux: 0, totalGainValeur: 0, years: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
  }, [user, investmentId]);

  return { kpis, loading, refreshKPIs: loadKPIs };
}