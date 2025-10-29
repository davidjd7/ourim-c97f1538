import * as React from 'react';
const { createContext, useContext, useState, useEffect } = React;
type ReactNode = React.ReactNode;
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
  selectedCompanyIds: string[];
  setSelectedCompanyIds: (ids: string[]) => void;
  toggleCompanySelection: (id: string) => void;
  addCompany: (name: string) => Promise<Company>;
  updateCompany: (id: string, name: string) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  loading: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const toggleCompanySelection = (id: string) => {
    setSelectedCompanyIds(prev => 
      prev.includes(id) 
        ? prev.filter(companyId => companyId !== id)
        : [...prev, id]
    );
  };

  // Load companies from Supabase
  useEffect(() => {
    let mounted = true;
    
    const loadCompanies = async () => {
      if (!user) {
        if (mounted) {
          setCompanies([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (error) throw error;

        if (mounted) {
          setCompanies(data || []);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        if (mounted) {
          setCompanies([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCompanies();
    
    return () => {
      mounted = false;
    };
  }, [user]);

  // Auto-select all companies when they are loaded
  useEffect(() => {
    if (companies.length > 0 && selectedCompanyIds.length === 0) {
      const allCompanyIds = companies.map(company => company.id);
      setSelectedCompanyIds(allCompanyIds);
    }
  }, [companies, selectedCompanyIds.length]);

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
        .eq('id', id);

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
        .eq('id', id);

      if (error) throw error;

      setCompanies(prev => prev.filter(company => company.id !== id));
      
      // Remove from selection if deleted company was selected
      setSelectedCompanyIds(prev => prev.filter(companyId => companyId !== id));
    } catch (error) {
      console.error('Failed to delete company:', error);
      throw error;
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompanyIds,
      setSelectedCompanyIds,
      toggleCompanySelection,
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