import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/contexts/CompanyContext';

export interface Immobilier {
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
  latestValue?: number; // Latest valorisation value
}

interface ImmobilierContextType {
  investments: Immobilier[];
  filteredInvestments: Immobilier[];
  updateInvestment: (id: string, updates: Partial<Immobilier>) => Promise<void>;
  addInvestment: (investment: Omit<Immobilier, 'id'>) => Promise<Immobilier>;
  deleteInvestment: (id: string) => Promise<void>;
  getInvestment: (id: string) => Immobilier | undefined;
  loading: boolean;
  // New method to trigger KPI refresh
  notifyInvestmentDataChanged: (investmentId: string) => void;
  // Event to listen for data changes
  lastDataChangeTimestamp: number;
}

const ImmobilierContext = createContext<ImmobilierContextType | undefined>(undefined);


export function ImmobilierProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Immobilier[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDataChangeTimestamp, setLastDataChangeTimestamp] = useState(Date.now());
  const { user, loading: authLoading } = useAuth();
  const companiesContext = useCompanies();
  const { selectedCompanyIds } = companiesContext || { selectedCompanyIds: [] };
  
  // Filter investments based on selected companies
  const filteredInvestments = React.useMemo(() => {
    if (selectedCompanyIds.length === 0) {
      return [];
    }
    return investments.filter(inv => 
      // Include investments with selected companies OR investments without any company assigned
      (inv.companyId && selectedCompanyIds.includes(inv.companyId)) || 
      (!inv.companyId)
    );
  }, [investments, selectedCompanyIds]);

  // Convert database row to Immobilier interface
  const convertDbToInvestment = (dbRow: any, latestValorisation?: number): Immobilier => {
    return {
      id: dbRow.id,
      name: dbRow.name,
      type: dbRow.type,
      dateInvestment: dbRow.investment_date,
      lastCashflow: 0,
      lastVariation: { value: 0, percentage: 0 },
      companyId: dbRow.company_id,
      description: dbRow.description,
      investmentAmount: dbRow.investment_amount,
      latestValue: latestValorisation || 0,
    };
  };

  // Convert Immobilier to database format
  const convertInvestmentToDb = (investment: Partial<Immobilier>) => {
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
          .from('immobilier_investments')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (!mounted) return;

        if (data && data.length > 0) {
          // Get latest valorisations for each investment (optimized single query)
          const investmentIds = data.map(inv => inv.id);
          const { data: valorisationsData } = await supabase
            .from('immobilier_valorisations')
            .select('immobilier_id, valeur, date')
            .in('immobilier_id', investmentIds)
            .order('immobilier_id, date', { ascending: false });

          // Create optimized map using reduce
          const latestValorisationMap = valorisationsData?.reduce((acc, valo) => {
            if (!acc.has(valo.immobilier_id)) {
              acc.set(valo.immobilier_id, valo.valeur || 0);
            }
            return acc;
          }, new Map<string, number>()) || new Map();

          const convertedInvestments = data.map(dbRow => 
            convertDbToInvestment(dbRow, latestValorisationMap.get(dbRow.id))
          );
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


  const addInvestment = async (investmentData: Omit<Immobilier, 'id'>): Promise<Immobilier> => {
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
        .from('immobilier_investments')
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
            .from('immobilier_history')
            .insert({
              immobilier_id: data.id,
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

  const updateInvestment = async (id: string, updates: Partial<Immobilier>) => {
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
        .from('immobilier_investments')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating investment:', error);
        // Reload data from database to revert optimistic updates
        const { data: freshData } = await supabase
          .from('immobilier_investments')
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
    currentInvestment: Immobilier, 
    updates: Partial<Immobilier>
  ) => {
    if (!user) return;

    const historyEntries = [];

    // Check each field for changes
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = currentInvestment[key as keyof Immobilier];
      
      // Skip if values are the same or both are empty/null/undefined
      if (oldValue === newValue || 
          ((!oldValue || oldValue === '') && (!newValue || newValue === ''))) {
        continue;
      }

      // Convert field name to database column name
      const dbFieldName = getDbFieldName(key);
      
      historyEntries.push({
        immobilier_id: investmentId,
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
          .from('immobilier_history')
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
      
      // First, get all debt characteristics for this asset
      const { data: debtCharacteristics } = await supabase
        .from('debt_characteristics')
        .select('id')
        .eq('asset_id', id)
        .eq('user_id', user.id);

      // Delete debt flows for each debt characteristic
      if (debtCharacteristics && debtCharacteristics.length > 0) {
        const debtIds = debtCharacteristics.map(debt => debt.id);
        
        const { error: flowsError } = await supabase
          .from('debt_flows')
          .delete()
          .in('debt_characteristics_id', debtIds)
          .eq('user_id', user.id);

        if (flowsError) {
          console.error('Error deleting debt flows:', flowsError);
        }
      }

      // Delete debt characteristics for this asset
      const { error: debtError } = await supabase
        .from('debt_characteristics')
        .delete()
        .eq('asset_id', id)
        .eq('user_id', user.id);

      if (debtError) {
        console.error('Error deleting debt characteristics:', debtError);
      }

      // Delete from Supabase
      const { error } = await supabase
        .from('immobilier_investments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setInvestments(prev => prev.filter(inv => inv.id !== id));

      // Record deletion in history
      try {
        await supabase
          .from('immobilier_history')
          .insert({
            immobilier_id: id,
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

  const getInvestment = (id: string): Immobilier | undefined => {
    return investments.find(inv => inv.id === id);
  };

  const notifyInvestmentDataChanged = (investmentId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Investment data changed for:', investmentId);
    }
    setLastDataChangeTimestamp(Date.now());
  };

  return (
    <ImmobilierContext.Provider value={{
      investments,
      filteredInvestments,
      updateInvestment,
      addInvestment,
      deleteInvestment,
      getInvestment,
      loading,
      notifyInvestmentDataChanged,
      lastDataChangeTimestamp
    }}>
      {children}
    </ImmobilierContext.Provider>
  );
}

export function useInvestments() {
  const context = useContext(ImmobilierContext);
  if (context === undefined) {
    throw new Error('useInvestments must be used within an ImmobilierProvider');
  }
  return context;
}