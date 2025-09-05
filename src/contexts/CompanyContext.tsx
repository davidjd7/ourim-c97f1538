import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  addCompany: (name: string) => Promise<Company>;
  updateCompany: (id: string, name: string) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load companies from Supabase
  useEffect(() => {
    const loadCompanies = async () => {
      if (!user) {
        setCompanies([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;

        setCompanies(data || []);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, [user]);

  const addCompany = async (name: string): Promise<Company> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{ name, user_id: user.id }])
        .select('*')
        .single();

      if (error) throw error;

      const newCompany = data as Company;
      setCompanies(prev => [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name)));
      return newCompany;
    } catch (error) {
      console.error('Failed to add company:', error);
      throw error;
    }
  };

  const updateCompany = async (id: string, name: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ name })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? { ...company, name } : company
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  };

  const deleteCompany = async (id: string): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCompanies(prev => prev.filter(company => company.id !== id));
      
      // Clear selection if deleted company was selected
      if (selectedCompanyId === id) {
        setSelectedCompanyId(null);
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
      throw error;
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompanyId,
      setSelectedCompanyId,
      addCompany,
      updateCompany,
      deleteCompany,
      loading
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanies() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompanies must be used within a CompanyProvider');
  }
  return context;
}