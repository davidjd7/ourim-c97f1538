import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to fetch tags for multiple investments at once
 * Returns a map of investment IDs to their tag IDs
 */
export function useAllInvestmentTags(investmentIds: string[]) {
  const { user } = useAuth();
  const [investmentTags, setInvestmentTags] = useState<{ [investmentId: string]: string[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || investmentIds.length === 0) {
      setInvestmentTags({});
      setLoading(false);
      return;
    }

    loadAllInvestmentTags();
  }, [user, investmentIds.join(',')]); // Join IDs to avoid re-running on array reference changes

  const loadAllInvestmentTags = async () => {
    try {
      setLoading(true);

      // Fetch all asset_tags for the given investment IDs in one query
      const { data: assetTagsData, error: assetTagsError } = await supabase
        .from('asset_tags')
        .select('asset_id, tag_id')
        .eq('asset_type', 'immobilier')
        .in('asset_id', investmentIds);

      if (assetTagsError) {
        console.error('Error loading investment tags:', assetTagsError);
        setInvestmentTags({});
        return;
      }

      // Group tags by investment ID
      const tagsByInvestment: { [investmentId: string]: string[] } = {};
      assetTagsData?.forEach(assetTag => {
        if (!tagsByInvestment[assetTag.asset_id]) {
          tagsByInvestment[assetTag.asset_id] = [];
        }
        tagsByInvestment[assetTag.asset_id].push(assetTag.tag_id);
      });

      setInvestmentTags(tagsByInvestment);
    } catch (error) {
      console.error('Error in loadAllInvestmentTags:', error);
      setInvestmentTags({});
    } finally {
      setLoading(false);
    }
  };

  return { investmentTags, loading };
}
