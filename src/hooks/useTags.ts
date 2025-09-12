import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface AssetTag {
  id: string;
  asset_id: string;
  tag_id: string;
  asset_type: string;
  tag: Tag;
}

export function useTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTags = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Erreur lors du chargement des tags');
    } finally {
      setLoading(false);
    }
  };

  const createTag = async (name: string, color: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{
          name,
          color,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadTags();
      toast.success('Tag créé avec succès');
      return data;
    } catch (error: any) {
      console.error('Error creating tag:', error);
      if (error.code === '23505') {
        toast.error('Un tag avec ce nom existe déjà');
      } else {
        toast.error('Erreur lors de la création du tag');
      }
      throw error;
    }
  };

  const updateTag = async (id: string, name: string, color: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tags')
        .update({ name, color })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadTags();
      toast.success('Tag modifié avec succès');
    } catch (error: any) {
      console.error('Error updating tag:', error);
      if (error.code === '23505') {
        toast.error('Un tag avec ce nom existe déjà');
      } else {
        toast.error('Erreur lors de la modification du tag');
      }
      throw error;
    }
  };

  const deleteTag = async (id: string) => {
    if (!user) return;

    try {
      // First delete all asset_tags relationships
      await supabase
        .from('asset_tags')
        .delete()
        .eq('tag_id', id)
        .eq('user_id', user.id);

      // Then delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadTags();
      toast.success('Tag supprimé avec succès');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Erreur lors de la suppression du tag');
      throw error;
    }
  };

  useEffect(() => {
    loadTags();
  }, [user]);

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    refreshTags: loadTags
  };
}

export function useInvestmentTags(investmentId: string) {
  const { user } = useAuth();
  const [investmentTags, setInvestmentTags] = useState<AssetTag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvestmentTags = async () => {
    if (!user || !investmentId) return;

    try {
      // First get asset_tags for immobilier
      const { data: assetTagsData, error: assetTagsError } = await supabase
        .from('asset_tags')
        .select('*')
        .eq('asset_id', investmentId)
        .eq('asset_type', 'immobilier')
        .eq('user_id', user.id);

      if (assetTagsError) throw assetTagsError;

      if (!assetTagsData || assetTagsData.length === 0) {
        setInvestmentTags([]);
        return;
      }

      // Get tag IDs
      const tagIds = assetTagsData.map(item => item.tag_id);

      // Then get the actual tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds)
        .eq('user_id', user.id);

      if (tagsError) throw tagsError;

      // Combine the data
      const combinedData = assetTagsData.map(assetTag => {
        const tag = tagsData?.find(tag => tag.id === assetTag.tag_id);
        return {
          id: assetTag.id,
          asset_id: assetTag.asset_id,
          tag_id: assetTag.tag_id,
          asset_type: assetTag.asset_type,
          tag: tag!
        };
      }).filter(item => item.tag); // Filter out items where tag wasn't found

      setInvestmentTags(combinedData);
    } catch (error) {
      console.error('Error loading investment tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTagToInvestment = async (tagId: string) => {
    if (!user || !investmentId) return;

    try {
      const { error } = await supabase
        .from('asset_tags')
        .insert([{
          asset_id: investmentId,
          tag_id: tagId,
          asset_type: 'immobilier',
          user_id: user.id
        }]);

      if (error) throw error;
      
      await loadInvestmentTags();
      toast.success('Tag ajouté à l\'investissement');
    } catch (error: any) {
      console.error('Error adding tag to investment:', error);
      if (error.code === '23505') {
        toast.error('Ce tag est déjà associé à cet investissement');
      } else {
        toast.error('Erreur lors de l\'ajout du tag');
      }
    }
  };

  const removeTagFromInvestment = async (tagId: string) => {
    if (!user || !investmentId) return;

    try {
      const { error } = await supabase
        .from('asset_tags')
        .delete()
        .eq('asset_id', investmentId)
        .eq('tag_id', tagId)
        .eq('asset_type', 'immobilier')
        .eq('user_id', user.id);

      if (error) throw error;
      
      await loadInvestmentTags();
      toast.success('Tag retiré de l\'investissement');
    } catch (error) {
      console.error('Error removing tag from investment:', error);
      toast.error('Erreur lors du retrait du tag');
    }
  };

  useEffect(() => {
    loadInvestmentTags();
  }, [user, investmentId]);

  return {
    investmentTags,
    loading,
    addTagToInvestment,
    removeTagFromInvestment,
    refreshInvestmentTags: loadInvestmentTags
  };
}