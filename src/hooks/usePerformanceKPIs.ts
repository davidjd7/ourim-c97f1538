// Backward compatibility wrapper for usePerformanceKPIs
// Now uses the optimized batch system internally
import { useState, useEffect } from 'react';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';
import type { InvestmentKPIs } from '@/types/kpi';

export function usePerformanceKPIs(investmentId: string) {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<InvestmentKPIs>({
    fondPropre: 0,
    fondPropreDetails: { valeur: 0, crd: 0, ltv: 0, year: 0 },
    rendementNet: 0,
    rendementNetDetails: { noi: 0, loyer: 0, noiSurLoyer: 0, year: 0, yieldBanque: 0 },
    totalReturn: 0,
    totalReturnDetails: { cfni: 0, deltaValeur: 0, cocNet: 0, cfniPlusDeltaValeur: 0, year: 0 },
    xirr: 0,
    xirrDetails: { totalCfni: 0, cfniDerniereAnnee: 0, deltaValeur: 0, variationValeurDerniereAnnee: 0, total: 0, years: 0, gain1: 0, lastCfniYear: 0, lastVarValeurYear: 0, gain1Year: 0, latestCf: 0, latestCfYear: 0 }
  });

  // Use the new batch system internally for a single investment
  const { batchKPIs, loading: batchLoading, refreshBatchKPIs } = useBatchPerformanceKPIs(investmentId ? [investmentId] : []);

  useEffect(() => {
    if (!batchLoading) {
      if (investmentId && batchKPIs[investmentId]) {
        setKpis(batchKPIs[investmentId]);
      }
      setLoading(false);
    }
  }, [batchLoading, investmentId, batchKPIs]);

  const refreshKPIs = async () => {
    setLoading(true);
    await refreshBatchKPIs();
  };

  return {
    kpis,
    loading,
    refreshKPIs
  };
}