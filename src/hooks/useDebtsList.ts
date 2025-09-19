import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBatchPerformanceKPIs } from './useBatchPerformanceKPIs';

export interface DebtItem {
  id: string;
  asset_id: string;
  asset_name: string;
  banque: string | null;
  type_credit: string | null;
  montant_initial: number | null;
  capital_restant: number | null;
  ltv?: number;
}

export const useDebtsList = () => {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadDebts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('debt_characteristics')
        .select(`
          id,
          asset_id,
          banque,
          type_credit,
          montant_initial,
          montant_tirable
        `)
        .eq('asset_type', 'immobilier');

      if (error) throw error;

      // Get asset names for each debt
      const assetIds = data.map(debt => debt.asset_id);
      const { data: assetsData } = await supabase
        .from('immobilier_investments')
        .select('id, name')
        .in('id', assetIds);

      // Get debt flows for each debt to calculate remaining capital
      const debtsWithCapital = await Promise.all(
        data.map(async (debt) => {
          const asset = assetsData?.find(a => a.id === debt.asset_id);
          // Get latest debt flow for this debt
          const { data: flowData } = await supabase
            .from('debt_flows')
            .select('capital_debut, rmbt_capital')
            .eq('debt_characteristics_id', debt.id)
            .order('date', { ascending: false })
            .limit(1);

          let capital_restant = debt.montant_tirable || 0;
          
          if (flowData && flowData.length > 0) {
            const latestFlow = flowData[0];
            capital_restant = (latestFlow.capital_debut || 0) - (latestFlow.rmbt_capital || 0);
          }

          return {
            id: debt.id,
            asset_id: debt.asset_id,
            asset_name: asset?.name || 'N/A',
            banque: debt.banque,
            type_credit: debt.type_credit,
            montant_initial: debt.montant_initial,
            capital_restant
          };
        })
      );

      setDebts(debtsWithCapital);
    } catch (err) {
      console.error('Error loading debts:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des dettes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, [user]);

  return { debts, loading, error, refetch: loadDebts };
};