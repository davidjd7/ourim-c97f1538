import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logError } from '@/lib/errorHandler';

export function useInvestmentTags() {
  const [investmentTags, setInvestmentTags] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchInvestmentTags = async () => {
      try {
        const { data, error } = await supabase
          .from('asset_tags')
          .select('asset_id, tag_id')
          .eq('user_id', user.id)
          .eq('asset_type', 'immobilier');

        if (error) throw error;

        // Group tags by investment ID using useMemo logic
        const tagsMap: Record<string, string[]> = {};
        data?.forEach(item => {
          if (!tagsMap[item.asset_id]) {
            tagsMap[item.asset_id] = [];
          }
          tagsMap[item.asset_id].push(item.tag_id);
        });

        setInvestmentTags(tagsMap);
      } catch (error) {
        logError(error, { component: 'useInvestmentTags', function: 'fetchInvestmentTags' });
      } finally {
        setLoading(false);
      }
    };

    fetchInvestmentTags();
  }, [user]);

  return { investmentTags, loading };
}