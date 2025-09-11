import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/contexts/CompanyContext';

export interface Investment {
  id: string;
  name: string;
  type: 'IMMO' | 'PE';
  dateInvestment?: string;
  lastCashflow: number;
  lastVariation: {
    value: number;
    percentage: number;
  };
  companyId?: string;
  description?: string;
  investmentAmount?: number;
}

interface InvestmentContextType {
  investments: Investment[];
  filteredInvestments: Investment[];
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<Investment>;
  deleteInvestment: (id: string) => Promise<void>;
  getInvestment: (id: string) => Investment | undefined;
  loading: boolean;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);


export function InvestmentProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const companiesContext = useCompanies();
  const { selectedCompanyIds } = companiesContext || { selectedCompanyIds: [] };
  
  // Filter investments based on selected companies
  const filteredInvestments = React.useMemo(() => {
    if (selectedCompanyIds.length === 0) {
      return investments;
    }
    return investments.filter(inv => inv.companyId && selectedCompanyIds.includes(inv.companyId));
  }, [investments, selectedCompanyIds]);

  // Convert database row to Investment interface
  const convertDbToInvestment = (dbRow: any): Investment => {
    return {
      id: dbRow.id,
      name: dbRow.name,
      type: dbRow.type,
      dateInvestment: dbRow.investment_date,
      lastCashflow: 0, // TODO: Calculate dynamically from investment_cashflows
      lastVariation: { value: 0, percentage: 0 }, // TODO: Calculate from valorisations
      companyId: dbRow.company_id,
      description: dbRow.description,
      investmentAmount: dbRow.investment_amount,
    };
  };

  // Convert Investment to database format
  const convertInvestmentToDb = (investment: Partial<Investment>) => {
    return {
      name: investment.name,
      type: investment.type,
      description: investment.description || null,
      company_id: investment.companyId || null,
      investment_date: investment.dateInvestment || null,
      investment_amount: investment.investmentAmount !== undefined ? investment.investmentAmount : null,
    };
  };

  // Load investments from Supabase when user changes
  useEffect(() => {
    let mounted = true;
    
    const loadInvestments = async () => {
      if (!user) {
        if (mounted) {
          setInvestments([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }
      
      try {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (!mounted) return;

        if (data && data.length > 0) {
          const convertedInvestments = data.map(convertDbToInvestment);
          setInvestments(convertedInvestments);
        } else {
          setInvestments([]);
        }
      } catch (error) {
        console.error('Error loading investments:', error);
        if (mounted) {
          setInvestments([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadInvestments();

    return () => {
      mounted = false;
    };
  }, [user]);


  const addInvestment = async (investmentData: Omit<Investment, 'id'>): Promise<Investment> => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.info('Adding new investment:', investmentData);
      
      // Convert to database format
      const dbData = {
        ...convertInvestmentToDb(investmentData),
        user_id: user.id
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('investments')
        .insert([dbData])
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const newInvestment = convertDbToInvestment(data);
        
        // Update local state
        setInvestments(prev => [...prev, newInvestment]);
        
        // Record creation in history
        try {
          await supabase
            .from('investment_history')
            .insert({
              investment_id: data.id,
              user_id: user.id,
              field_name: 'creation',
              old_value: null,
              new_value: investmentData.name,
              action_type: 'create'
            });
        } catch (historyError) {
          console.error('Error recording investment creation history:', historyError);
        }
        
        return newInvestment;
      }
      
      throw new Error('No data returned from insert');
    } catch (error) {
      console.error('Failed to add investment:', error);
      throw error;
    }
  };

  const updateInvestment = async (id: string, updates: Partial<Investment>) => {
    if (!user) return;

    try {
      console.info('Saving changes:', updates);
      
      // Get current investment to compare changes
      const currentInvestment = investments.find(inv => inv.id === id);
      if (!currentInvestment) {
        throw new Error('Investment not found');
      }
      
      // Update local state immediately for responsive UI
      setInvestments(prev => 
        prev.map(investment => 
          investment.id === id 
            ? { ...investment, ...updates }
            : investment
        )
      );

      // Convert updates to database format
      const dbUpdates = convertInvestmentToDb(updates);
      
      // Update in Supabase
      const { error } = await supabase
        .from('investments')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating investment:', error);
        // Reload data from database to revert optimistic updates
        const { data: freshData } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id);
        
        if (freshData) {
          const convertedInvestments = freshData.map(convertDbToInvestment);
          setInvestments(convertedInvestments);
        }
        throw error;
      }

      // Record history for each changed field
      await recordInvestmentChanges(id, currentInvestment, updates);
    } catch (error) {
      console.error('Failed to update investment:', error);
      throw error;
    }
  };

  // Helper function to record changes in history
  const recordInvestmentChanges = async (
    investmentId: string, 
    currentInvestment: Investment, 
    updates: Partial<Investment>
  ) => {
    if (!user) return;

    const historyEntries = [];

    // Check each field for changes
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = currentInvestment[key as keyof Investment];
      
      // Skip if values are the same or both are empty/null/undefined
      if (oldValue === newValue || 
          ((!oldValue || oldValue === '') && (!newValue || newValue === ''))) {
        continue;
      }

      // Convert field name to database column name
      const dbFieldName = getDbFieldName(key);
      
      historyEntries.push({
        investment_id: investmentId,
        user_id: user.id,
        field_name: dbFieldName,
        old_value: oldValue ? String(oldValue) : null,
        new_value: newValue ? String(newValue) : null,
        action_type: 'update'
      });
    }

    // Insert history entries if there are any changes
    if (historyEntries.length > 0) {
      try {
        const { error } = await supabase
          .from('investment_history')
          .insert(historyEntries);

        if (error) {
          console.error('Error recording investment history:', error);
        }
      } catch (error) {
        console.error('Failed to record investment history:', error);
      }
    }
  };

  // Helper function to convert frontend field names to database field names
  const getDbFieldName = (frontendField: string): string => {
    const fieldMap: { [key: string]: string } = {
      investmentAmount: 'investment_amount',
      dateInvestment: 'investment_date',
      companyId: 'company_id'
    };
    return fieldMap[frontendField] || frontendField;
  };

  async function deleteInvestment(id: string): Promise<void> {
    if (!user) throw new Error('User not authenticated');

    try {
      console.info('Deleting investment:', id);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setInvestments(prev => prev.filter(inv => inv.id !== id));

      // Record deletion in history
      try {
        await supabase
          .from('investment_history')
          .insert({
            investment_id: id,
            user_id: user.id,
            field_name: 'deletion',
            old_value: null,
            new_value: null,
            action_type: 'delete'
          });
      } catch (historyError) {
        console.error('Error recording investment deletion history:', historyError);
      }
    } catch (error) {
      console.error('Failed to delete investment:', error);
      throw error;
    }
  }

  const getInvestment = (id: string): Investment | undefined => {
    return investments.find(inv => inv.id === id);
  };

  return (
    <InvestmentContext.Provider value={{
      investments,
      filteredInvestments,
      updateInvestment,
      addInvestment,
      deleteInvestment,
      getInvestment,
      loading
    }}>
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestments() {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestments must be used within an InvestmentProvider');
  }
  return context;
}