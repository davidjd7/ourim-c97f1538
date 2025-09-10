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

export function usePerformanceKPIs(investmentId: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    fondPropre: 0,
    coc: 0,
    totalEarning: 0,
    xirr: 0
  });

  // XIRR calculation function - Following Excel TRI.PAIEMENT structure
  const calculateXIRR = (syntheseData: SyntheseRow[]) => {
    if (syntheseData.length < 2) return 0;

    // Sort by date to ensure chronological order
    const sortedData = [...syntheseData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let guess = 0.1; // Initial guess at 10%
    let maxIterations = 100;
    let tolerance = 0.00001;

    for (let i = 0; i < maxIterations; i++) {
      let sum = 0;
      let dsum = 0;
      const baseDate = new Date(sortedData[0].date);
      
      for (const row of sortedData) {
        const currentDate = new Date(row.date);
        const yearFraction = (currentDate.getTime() - baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        
        if (yearFraction === 0) {
          sum += -row.fp;
          dsum += 0;
        } else {
          const discountFactor = Math.pow(1 + guess, -yearFraction);
          sum += row.flux * discountFactor;
          dsum += row.flux * discountFactor * (-yearFraction) / (1 + guess);
        }
      }

      // Add the final value (current asset value minus remaining debt)
      const lastRow = sortedData[sortedData.length - 1];
      const lastYearFraction = (new Date(lastRow.date).getTime() - baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const finalValue = lastRow.valeur - lastRow.crd;
      const discountFactor = Math.pow(1 + guess, -lastYearFraction);
      sum += finalValue * discountFactor;
      dsum += finalValue * discountFactor * (-lastYearFraction) / (1 + guess);
      
      if (Math.abs(sum) < tolerance) {
        return guess * 100; // Convert to percentage
      }
      
      if (Math.abs(dsum) < tolerance) {
        break;
      }
      
      guess = guess - sum / dsum;
      
      if (guess < -0.99) guess = -0.99;
      if (guess > 5) guess = 5;
    }

    return guess * 100; // Convert to percentage
  };

  const calculateSynthese = (
    cashflows: CashflowRow[],
    valorisations: ValorisationRow[],
    debtFlows: DebtFlowRow[],
    immobilisations: ImmobilisationRow[]
  ): SyntheseRow[] => {
    // Group all data by year
    const dataByYear: { [year: string]: any } = {};

    // Process cashflows
    cashflows.forEach(cf => {
      const year = cf.date.substring(0, 4);
      if (!dataByYear[year]) dataByYear[year] = { year, flux: 0, valeur: 0, crd: 0, fp: 0 };
      dataByYear[year].flux += cf.rex - cf.retraitAmort - cf.retraitAutres;
    });

    // Process immobilisations
    immobilisations.forEach(immo => {
      const year = immo.date.substring(0, 4);
      if (!dataByYear[year]) dataByYear[year] = { year, flux: 0, valeur: 0, crd: 0, fp: 0 };
      dataByYear[year].flux -= immo.montant;
    });

    // Process valorisations (latest in year)
    valorisations.forEach(valo => {
      const year = valo.date.substring(0, 4);
      if (!dataByYear[year]) dataByYear[year] = { year, flux: 0, valeur: 0, crd: 0, fp: 0 };
      dataByYear[year].valeur = Math.max(dataByYear[year].valeur, valo.valeur);
    });

    // Process debt flows (latest CRD in year)
    debtFlows.forEach(debt => {
      const year = debt.date.substring(0, 4);
      if (!dataByYear[year]) dataByYear[year] = { year, flux: 0, valeur: 0, crd: 0, fp: 0 };
      const crdFin = debt.capitalDebut - debt.rmbtCapital;
      dataByYear[year].crd = crdFin;
    });

    // Calculate FP (Fond Propre) = Valeur - CRD
    Object.values(dataByYear).forEach((yearData: any) => {
      yearData.fp = yearData.valeur - yearData.crd;
    });

    // Convert to array and sort
    const syntheseArray = Object.values(dataByYear).map((yearData: any) => ({
      date: `${yearData.year}-12-31`,
      flux: yearData.flux,
      valeur: yearData.valeur,
      crd: yearData.crd,
      fp: yearData.fp
    }));

    return syntheseArray.sort((a, b) => a.date.localeCompare(b.date));
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

      // Calculate synthese data
      const syntheseData = calculateSynthese(cashflows, valorisations, debtFlows, immobilisations);

      if (syntheseData.length === 0) {
        setKpis({ fondPropre: 0, coc: 0, totalEarning: 0, xirr: 0 });
        return;
      }

      const latestSynthese = syntheseData[syntheseData.length - 1];
      const oldestSynthese = syntheseData[0];

      // KPI calculations
      const fondPropre = latestSynthese?.fp || 0;
      const coc = latestSynthese?.fp && latestSynthese.fp > 0 ? latestSynthese.flux / latestSynthese.fp * 100 : 0;
      const xirr = syntheseData.length > 1 ? calculateXIRR(syntheseData) : 0;

      // Calculate Total Earning
      const totalGainValeur = (latestSynthese?.valeur || 0) - (oldestSynthese?.valeur || 0);
      const totalFlux = syntheseData.reduce((sum, item) => sum + (item.flux || 0), 0);
      const totalEarning = totalGainValeur + totalFlux;

      setKpis({
        fondPropre,
        coc,
        totalEarning,
        xirr
      });

    } catch (error) {
      console.error('Error loading performance KPIs:', error);
      setKpis({ fondPropre: 0, coc: 0, totalEarning: 0, xirr: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
  }, [user, investmentId]);

  return { kpis, loading, refreshKPIs: loadKPIs };
}