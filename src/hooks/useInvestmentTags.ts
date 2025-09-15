import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

        // Group tags by investment ID
        const tagsMap: Record<string, string[]> = {};
        data?.forEach(item => {
          if (!tagsMap[item.asset_id]) {
            tagsMap[item.asset_id] = [];
          }
          tagsMap[item.asset_id].push(item.tag_id);
        });

        setInvestmentTags(tagsMap);
      } catch (error) {
        console.error('Error fetching investment tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestmentTags();
  }, [user]);

  return { investmentTags, loading };
}