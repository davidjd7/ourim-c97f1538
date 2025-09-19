import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInvestments } from '@/contexts/ImmobilierContext';

interface CashflowRow {
  id?: string;
  date: string;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
  loyer: number;
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

export function usePerformanceKPIs(investmentId: string) {
  const { user } = useAuth();
  const { lastDataChangeTimestamp } = useInvestments();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    fondPropre: 0,
    fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
    rendementNet: 0,
    rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, year: 0, yieldBanque: 0 },
    totalReturn: 0,
    totalReturnDetails: { cfni: 0, deltaValeur: 0, cocNet: 0, cfniPlusDeltaValeur: 0, year: 0 },
    xirr: 0,
    xirrDetails: { totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0, years: 0, gain1: 0, lastCfniYear: 0, lastVarValeurYear: 0, gain1Year: 0, latestCf: 0, latestCfYear: 0 }
  });

  // Helper functions (exact same as PerformanceTab)
  const calculateNOI = (cashflow: CashflowRow) => {
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

    // Add NOI from cashflows
    cashflows.forEach(cf => {
      const existing = dateMap.get(cf.date);
      if (existing) {
        existing.flux += calculateNOI(cf);
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

      // Load debt characteristics first, then debt flows
      const [cashflowsRes, valorisationsRes, debtCharacteristicsRes, immobilisationsRes] = await Promise.all([
        supabase.from('immobilier_cashflows').select('*').eq('immobilier_id', investmentId).eq('user_id', user.id),
        supabase.from('immobilier_valorisations').select('*').eq('immobilier_id', investmentId).eq('user_id', user.id),
        supabase.from('debt_characteristics').select('*').eq('asset_id', investmentId).eq('user_id', user.id),
        supabase.from('immobilier_immobilisations').select('*').eq('immobilier_id', investmentId).eq('user_id', user.id)
      ]);

      // Load debt flows based on debt characteristics
      let debtFlowsRes = { data: [] };
      if (debtCharacteristicsRes.data && debtCharacteristicsRes.data.length > 0) {
        const debtCharacteristicsIds = debtCharacteristicsRes.data.map(dc => dc.id);
        debtFlowsRes = await supabase.from('debt_flows').select('*').in('debt_characteristics_id', debtCharacteristicsIds).eq('user_id', user.id);
      }

      const cashflows: CashflowRow[] = (cashflowsRes.data || []).map(cf => ({
        id: cf.id,
        date: cf.date,
        rex: cf.rex || 0,
        retraitAmort: cf.retrait_amort || 0,
        retraitAutres: cf.retrait_autres || 0,
        loyer: cf.loyer || 0
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
        rendementNet: 0,
        rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, year: 0, yieldBanque: 0 },
        totalReturn: 0,
        totalReturnDetails: { cfni: 0, deltaValeur: 0, cocNet: 0, cfniPlusDeltaValeur: 0, year: 0 },
        xirr: 0,
        xirrDetails: { totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0, years: 0, gain1: 0, lastCfniYear: 0, lastVarValeurYear: 0, gain1Year: 0, latestCf: 0, latestCfYear: 0 }
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

      // Get the most recent NOI and loyer from cashflows
      const sortedCashflows = [...cashflows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestNOI = sortedCashflows.length > 0 ? calculateNOI(sortedCashflows[0]) : 0;
      const latestLoyer = sortedCashflows.length > 0 ? sortedCashflows[0].loyer : 0;

      // Dernier Earning calculations - Now renamed to Rendement Net
      const rendementNet = latestSynthese?.valeur && latestSynthese.valeur > 0 ? (latestNOI / latestSynthese.valeur) * 100 : 0;
      const rendementNetYear = latestChartData?.year || 0;
      const noiSurLoyer = latestLoyer > 0 ? (latestNOI / latestLoyer) * 100 : 0;
      
      // Get latest debt flow data for yield calculations
      const sortedDebtFlows = [...debtFlows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestDebtFlow = sortedDebtFlows[0];
      const rmbtInteret = latestDebtFlow?.rmbtInteret || 0;
      const rmbtCapital = latestDebtFlow?.rmbtCapital || 0;
      
      // Get latest immobilisation
      const latestImmobilisation = immobilisations.find(immo => 
        sortedCashflows.length > 0 ? immo.date === sortedCashflows[0].date : false
      );
      const noiAjuste = latestNOI - (latestImmobilisation?.montant || 0);
      
      // Yield Banque = NOI / Dette
      const yieldBanque = latestSynthese?.crd && latestSynthese.crd > 0 ? (noiAjuste / latestSynthese.crd) * 100 : 0;
      
      const rendementNetDetails = {
        noi: latestNOI,
        loyer: latestLoyer,
        noiSurLoyer: noiSurLoyer,
        year: rendementNetYear,
        yieldBanque: yieldBanque
      };

      // COC calculations with additional metrics - Moving this after rendementNetDetails
      const cfni = noiAjuste - rmbtInteret;
      const cocCalculated = latestSynthese?.fp && latestSynthese.fp > 0 ? (cfni / latestSynthese.fp) * 100 : 0;
      
      // DSCR = NOI / (Rmbt Interet + Rmbt Capital)
      const dscr = (rmbtInteret + rmbtCapital) > 0 ? noiAjuste / (rmbtInteret + rmbtCapital) : 0;
      
      // ICR = NOI / Rmbt Interet
      const icr = rmbtInteret > 0 ? noiAjuste / rmbtInteret : 0;
      
      const cocDetails = {
        cfni: cfni,
        dernierCF: latestSynthese?.flux || 0,
        dscr: dscr,
        icr: icr,
        yieldBanque: yieldBanque,
        year: rendementNetYear
      };

      // Calculate value variation between the 2 most recent valorisations (chronologically)
      const sortedValorisations = [...valorisations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const variationValeurDerniereAnnee = sortedValorisations.length >= 2 
        ? sortedValorisations[sortedValorisations.length - 1].valeur - sortedValorisations[sortedValorisations.length - 2].valeur
        : 0;

      // Total Return calculations = (CFNI + Δ Valeur) / FP
      // Delta valeur corresponds to the variation over the last year
      const totalReturnDeltaValeur = variationValeurDerniereAnnee;
      const totalReturn = latestSynthese?.fp && latestSynthese.fp > 0 ? ((cfni + totalReturnDeltaValeur) / latestSynthese.fp) * 100 : 0;
      
      // COC net (cash pur) = CFNI / FP
      const cocNet = latestSynthese?.fp && latestSynthese.fp > 0 ? (cfni / latestSynthese.fp) * 100 : 0;
      
      // Sum of CFNI + Delta valeur (absolute value)
      const cfniPlusDeltaValeur = cfni + totalReturnDeltaValeur;
      
      const totalReturnDetails = {
        cfni: cfni,
        deltaValeur: totalReturnDeltaValeur,
        cocNet: cocNet,
        cfniPlusDeltaValeur: cfniPlusDeltaValeur,
        year: rendementNetYear
      };

      // Dernier Flux details - Using most recent NOI instead of synthese flux
      const coc = latestSynthese?.fp && latestSynthese.fp > 0 ? latestNOI / latestSynthese.fp * 100 : 0;
      const capRate = latestSynthese?.valeur && latestSynthese.valeur > 0 ? latestNOI / latestSynthese.valeur * 100 : 0;
      
      // Calculate yield (NOI/CRD) if we have debt data
      const yield_ = latestSynthese?.crd && latestSynthese.crd !== 0 ? latestNOI / latestSynthese.crd * 100 : 0;
      
      const dernierFluxDetails = {
        capRate,
        coc,
        yield: yield_,
        year: rendementNetYear
      };

      // XIRR details - Updated with CFNI calculations
      // Calculate total CFNI across all periods
      const totalCfni = syntheseData.reduce((sum, row) => {
        const cashflowDate = cashflows.find(cf => cf.date === row.date);
        const noiDate = cashflowDate ? calculateNOI(cashflowDate) : 0;
        const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
        const noiAjusteDate = noiDate - (immobilisationDate?.montant || 0);
        const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
        const rmbtInteretDate = debtFlowDate?.rmbtInteret || 0;
        return sum + (noiAjusteDate - rmbtInteretDate);
      }, 0);

      // Calculate CFNI for the latest year only (not variation)
      const currentYear = rendementNetYear;
      const cfniDerniereAnnee = syntheseData
        .filter(row => new Date(row.date).getFullYear() === currentYear)
        .reduce((sum, row) => {
          const cashflowDate = cashflows.find(cf => cf.date === row.date);
          const noiDate = cashflowDate ? calculateNOI(cashflowDate) : 0;
          const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
          const noiAjusteDate = noiDate - (immobilisationDate?.montant || 0);
          const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
          const rmbtInteretDate = debtFlowDate?.rmbtInteret || 0;
          return sum + (noiAjusteDate - rmbtInteretDate);
        }, 0);

      // Calculate value difference between most recent and oldest date
      const deltaValeur = (latestSynthese?.valeur || 0) - (oldestSynthese?.valeur || 0);
      
      // Total = somme de totalCfni + deltaValeur
      const total = totalCfni + deltaValeur;
      
      const years = syntheseData.length > 1 ? Math.round((new Date(latestSynthese.date).getTime() - new Date(oldestSynthese.date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      
      // Calcul du Gain 1 (variation FP + CF)
      let gain1 = 0;
      let cf = latestSynthese?.flux || 0; // Default to synthese flux
      
      if (syntheseData.length >= 2) {
        const latestSynthese = syntheseData[syntheseData.length - 1];
        const secondLatestSynthese = syntheseData[syntheseData.length - 2];
        
        // Variation FP
        const variationFP = latestSynthese.fp - secondLatestSynthese.fp;
        
        // Calcul du CF pour la dernière date (CFNI - rmbt capital)
        const latestCashflow = cashflows.find(cf => cf.date === latestSynthese.date);
        const latestNOICalculated = latestCashflow ? calculateNOI(latestCashflow) : 0;
        const latestImmobilisationCalculated = immobilisations.find(immo => immo.date === latestSynthese.date);
        const noiAjusteCalculated = latestNOICalculated - (latestImmobilisationCalculated?.montant || 0);
        const latestDebtFlowCalculated = debtFlows.find(debt => debt.date === latestSynthese.date);
        const rmbtInteretCalculated = latestDebtFlowCalculated?.rmbtInteret || 0;
        const rmbtCapitalCalculated = latestDebtFlowCalculated?.rmbtCapital || 0;
        const cfniCalculated = noiAjusteCalculated - rmbtInteretCalculated;
        cf = cfniCalculated - rmbtCapitalCalculated;
        
        gain1 = variationFP + cf;
      }

      const xirrDetails = {
        totalCfni,
        cfniDerniereAnnee,
        deltaValeur,
        variationValeurDerniereAnnee,
        total,
        years,
        gain1,
        lastCfniYear: currentYear,
        lastVarValeurYear: sortedValorisations.length >= 2 ? new Date(sortedValorisations[sortedValorisations.length - 1].date).getFullYear() : 0,
        gain1Year: syntheseData.length >= 2 ? new Date(latestSynthese.date).getFullYear() : 0,
        // Add latest CF and its year
        latestCf: syntheseData.length >= 2 ? cf : (latestSynthese?.flux || 0),
        latestCfYear: latestSynthese ? new Date(latestSynthese.date).getFullYear() : 0
      };

      setKpis({
        fondPropre,
        fondPropreDetails,
        rendementNet,
        rendementNetDetails,
        totalReturn,
        totalReturnDetails,
        xirr,
        xirrDetails
      });

    } catch (error) {
      console.error('Error loading performance KPIs:', error);
      setKpis({ 
        fondPropre: 0,
        fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
        rendementNet: 0,
        rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, year: 0, yieldBanque: 0 },
        totalReturn: 0,
        totalReturnDetails: { cfni: 0, deltaValeur: 0, cocNet: 0, cfniPlusDeltaValeur: 0, year: 0 },
        xirr: 0,
        xirrDetails: { totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0, years: 0, gain1: 0, lastCfniYear: 0, lastVarValeurYear: 0, gain1Year: 0, latestCf: 0, latestCfYear: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
  }, [user, investmentId, lastDataChangeTimestamp]);

  return { kpis, loading, refreshKPIs: loadKPIs };
}