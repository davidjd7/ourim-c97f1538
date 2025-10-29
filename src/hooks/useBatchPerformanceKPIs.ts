import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useInvestments } from '@/contexts/ImmobilierContext';
import type { BatchKPIData, InvestmentRawData, CashflowRow, ValorisationRow, DebtFlowRow, ImmobilisationRow } from '@/types/kpi';
import { calculateKPIs } from '@/lib/kpiCalculations';
import { logError } from '@/lib/errorHandler';

interface UseBatchPerformanceKPIsResult {
  batchKPIs: BatchKPIData;
  rawByInvestment: Record<string, InvestmentRawData>;
  loading: boolean;
  refreshBatchKPIs: () => Promise<void>;
}

export function useBatchPerformanceKPIs(investmentIds: string[]): UseBatchPerformanceKPIsResult {
  const { user } = useAuth();
  const { lastDataChangeTimestamp } = useInvestments();
  const [loading, setLoading] = useState(true);
  const [batchKPIs, setBatchKPIs] = useState<BatchKPIData>({});
  const [rawByInvestment, setRawByInvestment] = useState<Record<string, InvestmentRawData>>({});

  const loadBatchKPIs = async () => {
    if (!user || investmentIds.length === 0) {
      setBatchKPIs({});
      setRawByInvestment({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Batch load all data in parallel with IN queries
      const [cashflowsRes, valorisationsRes, debtCharacteristicsRes, immobilisationsRes] = await Promise.all([
        supabase.from('immobilier_cashflows').select('*').in('immobilier_id', investmentIds),
        supabase.from('immobilier_valorisations').select('*').in('immobilier_id', investmentIds),
        supabase.from('debt_characteristics').select('*').in('asset_id', investmentIds),
        supabase.from('immobilier_immobilisations').select('*').in('immobilier_id', investmentIds)
      ]);

      // Load debt flows based on debt characteristics
      let debtFlowsRes = { data: [] };
      if (debtCharacteristicsRes.data && debtCharacteristicsRes.data.length > 0) {
        const debtCharacteristicsIds = debtCharacteristicsRes.data.map(dc => dc.id);
        debtFlowsRes = await supabase.from('debt_flows').select('*').in('debt_characteristics_id', debtCharacteristicsIds);
      }

      // Group data by investment ID
      const investmentDataMap = new Map<string, InvestmentRawData>();
      
      // Initialize each investment with empty arrays
      investmentIds.forEach(id => {
        investmentDataMap.set(id, {
          cashflows: [],
          valorisations: [],
          debtFlows: [],
          immobilisations: []
        });
      });

      // Group cashflows by investment ID
      (cashflowsRes.data || []).forEach(cf => {
        const data = investmentDataMap.get(cf.immobilier_id);
        if (data) {
          data.cashflows.push({
            id: cf.id,
            date: cf.date,
            rex: cf.rex || 0,
            retraitAmort: cf.retrait_amort || 0,
            retraitAutres: cf.retrait_autres || 0,
            loyer: cf.loyer || 0
          });
        }
      });

      // Group valorisations by investment ID
      (valorisationsRes.data || []).forEach(valo => {
        const data = investmentDataMap.get(valo.immobilier_id);
        if (data) {
          data.valorisations.push({
            id: valo.id,
            date: valo.date,
            valeur: valo.valeur || 0,
            note: valo.note || ''
          });
        }
      });

      // Group immobilisations by investment ID
      (immobilisationsRes.data || []).forEach(immo => {
        const data = investmentDataMap.get(immo.immobilier_id);
        if (data) {
          data.immobilisations.push({
            id: immo.id,
            date: immo.date,
            montant: immo.montant || 0,
            note: immo.note || ''
          });
        }
      });

      // Create debt characteristics map for asset mapping
      const debtCharacteristicsMap = new Map<string, string>(); // debt_characteristics_id -> asset_id
      (debtCharacteristicsRes.data || []).forEach(dc => {
        debtCharacteristicsMap.set(dc.id, dc.asset_id);
      });

      // Group debt flows by investment ID
      (debtFlowsRes.data || []).forEach(debt => {
        const assetId = debtCharacteristicsMap.get(debt.debt_characteristics_id);
        if (assetId) {
          const data = investmentDataMap.get(assetId);
          if (data) {
            data.debtFlows.push({
              id: debt.id,
              date: debt.date,
              capitalDebut: debt.capital_debut || 0,
              rmbtCapital: debt.rmbt_capital || 0,
              rmbtInteret: debt.rmbt_interet || 0
            });
          }
        }
      });

      // Calculate KPIs for each investment
      const kpiResults: BatchKPIData = {};
      const rawResults: Record<string, InvestmentRawData> = {};
      
      investmentDataMap.forEach((rawData, investmentId) => {
        kpiResults[investmentId] = calculateKPIs(rawData);
        rawResults[investmentId] = rawData;
      });

      setBatchKPIs(kpiResults);
      setRawByInvestment(rawResults);
    } catch (error) {
      logError(error, { component: 'useBatchPerformanceKPIs', function: 'loadBatchKPIs' });
      setBatchKPIs({});
      setRawByInvestment({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchKPIs();
  }, [user?.id, investmentIds.join(','), lastDataChangeTimestamp]);

  return {
    batchKPIs,
    rawByInvestment,
    loading,
    refreshBatchKPIs: loadBatchKPIs
  };
}