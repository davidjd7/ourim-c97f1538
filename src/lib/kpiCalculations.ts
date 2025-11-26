import type { CashflowRow, ValorisationRow, DebtFlowRow, ImmobilisationRow, SyntheseRow, InvestmentRawData, InvestmentKPIs, ConsolidatedRow } from '@/types/kpi';
import { logError } from './errorHandler';

// Helper functions for KPI calculations
export const calculateNOI = (cashflow: CashflowRow): number => {
  return (cashflow.rex || 0) + (cashflow.retraitAmort || 0) + (cashflow.retraitAutres || 0);
};

export const calculateCapitalFin = (flow: DebtFlowRow): number => {
  return (flow.capitalDebut || 0) - (flow.rmbtCapital || 0);
};

export const calculateFlux = (flow: DebtFlowRow): number => {
  return (flow.rmbtCapital || 0) + (flow.rmbtInteret || 0);
};

// Aggregate all data types by date to create synthesis data
export const getSyntheseData = (
  cashflows: CashflowRow[],
  immobilisations: ImmobilisationRow[],
  debtFlows: DebtFlowRow[],
  valorisations: ValorisationRow[]
): SyntheseRow[] => {
  try {
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

    // Subtract immobilisation amounts
    immobilisations.forEach(immo => {
      const existing = dateMap.get(immo.date);
      if (existing) {
        existing.flux -= (immo.montant || 0);
      }
    });

    // Subtract debt flows and set CRD
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
        existing.valeur = valo.valeur || 0;
      }
    });

    // Calculate FP = Valeur - CRD
    dateMap.forEach(row => {
      row.fp = row.valeur - row.crd;
    });

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    logError(error, { function: 'getSyntheseData' });
    return [];
  }
};

// XIRR calculation function - Following Excel TRI.PAIEMENT structure
export const calculateXIRR = (syntheseData: SyntheseRow[] | ConsolidatedRow[]): number => {
  if (syntheseData.length < 2) return 0;

  try {
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
        const fp = 'fp' in row ? row.fp : (row as SyntheseRow).valeur - (row as SyntheseRow).crd;
        cashFlows.push({ date, value: -fp });
      } else if (i === sortedData.length - 1) {
        // Final period: cashFlow + FP (cash flow + final value)
        const fp = 'fp' in row ? row.fp : (row as SyntheseRow).valeur - (row as SyntheseRow).crd;
        const cashFlow = 'cashFlow' in row ? row.cashFlow : (row as SyntheseRow).flux;
        cashFlows.push({ date, value: cashFlow + fp });
      } else {
        // Intermediate periods: just the cashFlow/flux
        const cashFlow = 'cashFlow' in row ? row.cashFlow : (row as SyntheseRow).flux;
        cashFlows.push({ date, value: cashFlow });
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
  } catch (error) {
    logError(error, { function: 'calculateXIRR' });
    return 0;
  }
};

// Main KPI calculation function
export const calculateKPIs = (data: InvestmentRawData): InvestmentKPIs => {
  try {
    const { cashflows, valorisations, debtFlows, immobilisations } = data;
    
    // Get synthesis data
    const syntheseData = getSyntheseData(cashflows, immobilisations, debtFlows, valorisations);
    
    if (syntheseData.length === 0) {
      return getDefaultKPIs();
    }

    // Get latest data point
    const latestData = syntheseData[syntheseData.length - 1];
    const latestYear = new Date(latestData.date).getFullYear();
    
    // Calculate Fond Propre
    const fondPropre = latestData.fp;
    const fondPropreDetails = {
      valeur: latestData.valeur,
      crd: latestData.crd,
      ltv: latestData.valeur > 0 ? (latestData.crd / latestData.valeur) * 100 : 0,
      year: latestYear
    };

    // Calculate Rendement Net
    const latestNOI = cashflows
      .filter(cf => cf.date === latestData.date)
      .reduce((sum, cf) => sum + calculateNOI(cf), 0);
    
    const latestLoyer = cashflows
      .filter(cf => cf.date === latestData.date)
      .reduce((sum, cf) => sum + (cf.loyer || 0), 0);

    const rendementNet = latestData.valeur > 0 ? (latestNOI / latestData.valeur) * 100 : 0;
    const rendementNetDetails = {
      noi: latestNOI,
      loyer: latestLoyer,
      noiSurLoyer: latestLoyer > 0 ? (latestNOI / latestLoyer) * 100 : 0,
      year: latestYear,
      yieldBanque: latestData.crd > 0 ? (latestNOI / latestData.crd) * 100 : 0
    };

    // Calculate Total Return
    const firstData = syntheseData.length > 0 ? syntheseData[0] : null;
    const deltaValeur = firstData ? latestData.valeur - firstData.valeur : 0;
    
    // Calculate CFNI for latest period
    const latestImmobilisations = immobilisations
      .filter(immo => immo.date === latestData.date)
      .reduce((sum, immo) => sum + (immo.montant || 0), 0);
    
    const noiAjuste = latestNOI - latestImmobilisations;
    const latestInteret = debtFlows
      .filter(df => df.date === latestData.date)
      .reduce((sum, df) => sum + (df.rmbtInteret || 0), 0);
    
    const cfni = noiAjuste - latestInteret;
    const cfniPlusDeltaValeur = cfni + deltaValeur;
    
    // Calculate total earning (total flux + total gain valeur)
    const totalFlux = syntheseData.reduce((sum, row) => sum + (row.flux || 0), 0);
    const totalEarning = deltaValeur + totalFlux;
    
    const totalReturn = latestData.fp > 0 ? (cfniPlusDeltaValeur / latestData.fp) * 100 : 0;
    const cocNet = latestData.fp > 0 ? (cfni / latestData.fp) * 100 : 0;
    
    const totalReturnDetails = {
      cfni,
      deltaValeur,
      cocNet,
      cfniPlusDeltaValeur,
      totalEarning,
      year: latestYear
    };

    // Calculate XIRR
    const xirr = calculateXIRR(syntheseData);
    
    // Calculate XIRR Unleveraged
    let xirrUnleveraged = 0;
    if (syntheseData.length >= 2) {
      const firstRow = syntheseData[0];
      const unleveragedFlows: SyntheseRow[] = [];
      
      // Premier flux: -valeur de la première année
      unleveragedFlows.push({
        date: firstRow.date,
        flux: 0,
        valeur: firstRow.valeur,
        crd: 0,
        fp: firstRow.valeur
      });
      
      // Flux intermédiaires: NOI ajusté de chaque année
      for (let i = 1; i < syntheseData.length - 1; i++) {
        const currentRow = syntheseData[i];
        
        // Calculer le NOI ajusté pour cette ligne
        const cashflowRow = cashflows.filter(cf => cf.date === currentRow.date);
        const ebitdaRow = cashflowRow.reduce((sum, cf) => sum + calculateNOI(cf), 0);
        const immobilisationRow = immobilisations.filter(immo => immo.date === currentRow.date);
        const immobilisationAmountRow = immobilisationRow.reduce((sum, immo) => sum + (immo.montant || 0), 0);
        const noiAjusteRow = ebitdaRow - immobilisationAmountRow;
        
        unleveragedFlows.push({
          date: currentRow.date,
          flux: noiAjusteRow,
          valeur: 0,
          crd: 0,
          fp: 0
        });
      }
      
      // Dernier flux: valeur courante + NOI ajusté courant
      const lastRow = syntheseData[syntheseData.length - 1];
      const lastCashflows = cashflows.filter(cf => cf.date === lastRow.date);
      const lastEbitda = lastCashflows.reduce((sum, cf) => sum + calculateNOI(cf), 0);
      const lastImmobilisations = immobilisations.filter(immo => immo.date === lastRow.date);
      const lastImmobilisationAmount = lastImmobilisations.reduce((sum, immo) => sum + (immo.montant || 0), 0);
      const lastNoiAjuste = lastEbitda - lastImmobilisationAmount;
      
      unleveragedFlows.push({
        date: lastRow.date,
        flux: lastNoiAjuste,
        valeur: lastRow.valeur,
        crd: 0,
        fp: lastRow.valeur
      });
      
      xirrUnleveraged = calculateXIRR(unleveragedFlows);
    }
    
    // Calculate additional XIRR details
    const totalCfni = syntheseData.reduce((sum, row) => {
      const rowCashflows = cashflows.filter(cf => cf.date === row.date);
      const rowImmobilisations = immobilisations.filter(immo => immo.date === row.date);
      const rowDebtFlows = debtFlows.filter(df => df.date === row.date);
      
      const rowNOI = rowCashflows.reduce((s, cf) => s + calculateNOI(cf), 0);
      const rowImmoAmount = rowImmobilisations.reduce((s, immo) => s + (immo.montant || 0), 0);
      const rowInteret = rowDebtFlows.reduce((s, df) => s + (df.rmbtInteret || 0), 0);
      
      return sum + (rowNOI - rowImmoAmount - rowInteret);
    }, 0);

    const prevData = syntheseData.length > 1 ? syntheseData[syntheseData.length - 2] : null;
    const variationValeurDerniereAnnee = prevData ? (latestData.valeur - prevData.valeur) : 0;
    const variationFpDerniereAnnee = prevData ? (latestData.fp - prevData.fp) : 0;
    const latestRmbtCapital = debtFlows
      .filter(df => df.date === latestData.date)
      .reduce((sum, df) => sum + (df.rmbtCapital || 0), 0);
    const latestCf = cfni - latestRmbtCapital;
    const gain1Latest = variationFpDerniereAnnee + latestCf; // Gain 1 = Delta FP + CF (période la plus récente)

    const xirrDetails = {
      totalCfni,
      cfniDerniereAnnee: cfni,
      deltaValeur,
      variationValeurDerniereAnnee,
      gain: totalCfni + deltaValeur,
      years: syntheseData.length > 0 
        ? new Date(syntheseData[syntheseData.length - 1].date).getFullYear() - new Date(syntheseData[0].date).getFullYear()
        : 0,
      gain1: gain1Latest,
      lastCfniYear: latestYear,
      lastVarValeurYear: latestYear,
      gain1Year: latestYear,
      latestCf,
      latestCfYear: latestYear
    };

    return {
      fondPropre,
      fondPropreDetails,
      rendementNet,
      rendementNetDetails,
      totalReturn,
      totalReturnDetails,
      xirr,
      xirrDetails,
      xirrUnleveraged
    };
  } catch (error) {
    logError(error, { function: 'calculateKPIs' });
    return getDefaultKPIs();
  }
};

// Default KPI values
export const getDefaultKPIs = (): InvestmentKPIs => ({
  fondPropre: 0,
  fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: new Date().getFullYear() },
  rendementNet: 0,
  rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, year: new Date().getFullYear(), yieldBanque: 0 },
  totalReturn: 0,
  totalReturnDetails: { cfni: 0, deltaValeur: 0, cocNet: 0, cfniPlusDeltaValeur: 0, totalEarning: 0, year: new Date().getFullYear() },
  xirr: 0,
  xirrDetails: { 
    totalCfni: 0, 
    cfniDerniereAnnee: 0, 
    deltaValeur: 0, 
    variationValeurDerniereAnnee: 0, 
    gain: 0, 
    years: 0, 
    gain1: 0, 
    lastCfniYear: new Date().getFullYear(), 
    lastVarValeurYear: new Date().getFullYear(),
    gain1Year: new Date().getFullYear(), 
    latestCf: 0, 
    latestCfYear: new Date().getFullYear() 
  },
  xirrUnleveraged: 0
});