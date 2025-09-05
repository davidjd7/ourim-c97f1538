import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/contexts/CompanyContext';

export interface Investment {
  id: string;
  name: string;
  type: 'IMMO' | 'PE';
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  dateInvestment?: string;
  lastValue: number;
  lastTRI: number;
  lastCashflow: number;
  lastVariation: {
    value: number;
    percentage: number;
  };
  companyId?: string;
  companyName?: string;
  // General tab fields
  address?: string;
  surface?: number;
  price?: number;
  description?: string;
  investmentAmount?: number;
  acquisitionDate?: string;
  dateAcquisition?: string;
  notaryFees?: number;
  renovationBudget?: number;
  // Bail fields
  locataire?: string;
  dateEntree?: string;
  typeBail?: string;
  dureeBail?: number;
  bailNextBreak?: string;
  bailGmapLink?: string;
  bailGmapNote?: string;
  bailLoyerHT?: number;
  bailCNR?: number;
  bailPriseEffet?: string;
  bailActivite?: string;
  bailAnciennete?: number;
  // Présentation Vente fields
  netVendeur?: number;
  agent?: number;
  honoNotaire?: number;
  // Kanban card fields
  rentAmount?: number;
  priceNV?: number;
  tri?: number;
  company?: string;
}

interface InvestmentContextType {
  investments: Investment[];
  filteredInvestments: Investment[];
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<Investment>;
  getInvestment: (id: string) => Investment | undefined;
  loading: boolean;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

const initialInvestments: Investment[] = [
  {
    id: '1',
    name: 'Faisanderie Paris',
    type: 'IMMO',
    status: 'DUE_DIL', // Changed to DUE_DIL to match the user's scenario
    dateInvestment: '2023-03-15',
    lastValue: 2170000,
    lastTRI: 6.8,
    lastCashflow: 98084,
    lastVariation: { value: 50000, percentage: 2.4 },
    // Additional fields with default values
    address: '12 rue de la Faisanderie, 75016 Paris',
    surface: 85,
    price: 2100000,
    description: 'Appartement haussmannien de standing dans le 16ème arrondissement de Paris',
    investmentAmount: 2100000,
    acquisitionDate: '2023-03-15',
    dateAcquisition: '2023-03-15',
    notaryFees: 168000,
    renovationBudget: 50000,
    locataire: 'SCI Faisanderie',
    dateEntree: '2023-04-01',
    typeBail: 'Commercial',
    dureeBail: 9,
    bailNextBreak: '2028-01-01',
    bailGmapLink: 'https://maps.google.com/?q=12+rue+de+la+Faisanderie+75016+Paris',
    bailGmapNote: 'Proche métro Trocadéro',
    bailLoyerHT: 12500,
    bailCNR: 500,
    bailPriseEffet: '2023-01-01',
    bailActivite: 'Bureau',
    bailAnciennete: 5,
    netVendeur: 2100000,
    agent: 0.03,
    honoNotaire: 0.08,
    // Mock data for Kanban cards
    rentAmount: 150000,
    priceNV: 2100000,
    tri: 6.8
  },
  {
    id: '2',
    name: 'Robespierre Bagnolet',
    type: 'IMMO',
    status: 'INVESTI',
    dateInvestment: '2023-01-20',
    lastValue: 1090000,
    lastTRI: 7.2,
    lastCashflow: 70443,
    lastVariation: { value: -15000, percentage: -1.4 },
    investmentAmount: 1090000,
    acquisitionDate: '2023-01-20',
    notaryFees: 87200,
    renovationBudget: 0,
    // Mock data for Kanban cards
    address: 'Avenue Robespierre, Bagnolet',
    surface: 231,
    rentAmount: 80000,
    priceNV: 1090000,
    tri: 7.2
  },
  {
    id: '3',
    name: 'Général Leclerc Rosny',
    type: 'IMMO',
    status: 'INVESTI',
    dateInvestment: '2022-11-10',
    lastValue: 1690000,
    lastTRI: 8.1,
    lastCashflow: 112692,
    lastVariation: { value: 80000, percentage: 5.0 },
    investmentAmount: 1690000,
    acquisitionDate: '2022-11-10',
    notaryFees: 135200,
    renovationBudget: 25000,
    // Mock data for Kanban cards
    address: 'Avenue du Général Leclerc, Rosny',
    surface: 626,
    rentAmount: 124000,
    priceNV: 1690000,
    tri: 8.1
  },
  {
    id: '4',
    name: 'Commercial Montreuil',
    type: 'IMMO',
    status: 'RECU',
    dateInvestment: '2024-01-15',
    lastValue: 1200000,
    lastTRI: 0,
    lastCashflow: 0,
    lastVariation: { value: 0, percentage: 0 },
    investmentAmount: 0,
    acquisitionDate: '',
    notaryFees: 0,
    renovationBudget: 0,
    // Mock data for Kanban cards
    address: 'Centre commercial, Montreuil',
    surface: 450,
    rentAmount: 95000,
    priceNV: 1200000
  },
  {
    id: '5',
    name: 'Bureaux La Défense',
    type: 'IMMO',
    status: 'DROP',
    dateInvestment: '',
    lastValue: 0,
    lastTRI: 0,
    lastCashflow: 0,
    lastVariation: { value: 0, percentage: 0 },
    investmentAmount: 0,
    acquisitionDate: '',
    notaryFees: 0,
    renovationBudget: 0,
    // Mock data for Kanban cards
    address: 'Tour CB21, La Défense',
    surface: 2100,
    rentAmount: 280000,
    priceNV: 4500000
  }
];

export function InvestmentProvider({ children }: { children: ReactNode }) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedCompanyIds } = useCompanies();
  
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
      status: dbRow.status,
      dateInvestment: dbRow.investment_date,
      lastValue: dbRow.last_value || 0,
      lastTRI: dbRow.tri || 0,
      lastCashflow: 0, // Calculate based on other fields if needed
      lastVariation: { value: 0, percentage: 0 }, // Calculate based on historical data if needed
      companyId: dbRow.company_id,
      companyName: '', // We'll populate this with a join later
      address: dbRow.address,
      surface: dbRow.surface,
      price: dbRow.price,
      description: dbRow.description,
      investmentAmount: dbRow.investment_amount,
      acquisitionDate: dbRow.date_acquisition,
      dateAcquisition: dbRow.date_acquisition,
      notaryFees: dbRow.notary_fees,
      locataire: dbRow.locataire,
      dateEntree: dbRow.date_entree,
      typeBail: dbRow.type_bail,
      dureeBail: dbRow.duree_bail,
      bailNextBreak: dbRow.bail_next_break,
      bailGmapLink: dbRow.bail_gmap_link,
      bailGmapNote: dbRow.bail_gmap_note,
      bailLoyerHT: dbRow.bail_loyer_ht,
      bailCNR: dbRow.bail_cnr,
      bailPriseEffet: dbRow.bail_prise_effet,
      bailActivite: dbRow.bail_activite,
      bailAnciennete: dbRow.bail_anciennete,
      netVendeur: dbRow.net_vendeur,
      agent: dbRow.agent,
      honoNotaire: dbRow.hono_notaire,
      company: dbRow.company,
      tri: dbRow.tri || 0,
      // Calculated fields for Kanban
      rentAmount: dbRow.bail_loyer_ht * 12 || 0,
      priceNV: dbRow.price || 0
    };
  };

  // Convert Investment to database format
  const convertInvestmentToDb = (investment: Partial<Investment>) => {
    return {
      name: investment.name,
      type: investment.type,
      status: investment.status,
      address: investment.address || null,
      surface: investment.surface,
      price: investment.price,
      description: investment.description || null,
      company_id: investment.companyId || null,
      date_acquisition: investment.dateAcquisition || null,
      locataire: investment.locataire || null,
      date_entree: investment.dateEntree || null,
      type_bail: investment.typeBail || null,
      duree_bail: investment.dureeBail,
      bail_next_break: investment.bailNextBreak || null,
      bail_gmap_link: investment.bailGmapLink || null,
      bail_gmap_note: investment.bailGmapNote || null,
      bail_loyer_ht: investment.bailLoyerHT,
      bail_cnr: investment.bailCNR,
      bail_prise_effet: investment.bailPriseEffet || null,
      bail_activite: investment.bailActivite || null,
      bail_anciennete: investment.bailAnciennete,
      net_vendeur: investment.netVendeur,
      agent: investment.agent,
      hono_notaire: investment.honoNotaire,
      last_value: investment.lastValue,
      tri: investment.tri,
      investment_date: investment.dateInvestment || null,
      investment_amount: investment.investmentAmount,
      notary_fees: investment.notaryFees,
      company: investment.company || null
    };
  };

  // Load investments from Supabase when user changes
  useEffect(() => {
    const loadInvestments = async () => {
      if (!user) {
        setInvestments([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          const convertedInvestments = data.map(convertDbToInvestment);
          setInvestments(convertedInvestments);
        } else {
          // If no investments found, create initial sample data for the user
          await createInitialInvestments();
        }
      } catch (error) {
        console.error('Error loading investments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvestments();
  }, [user]);

  // Create initial sample investments for new users
  const createInitialInvestments = async () => {
    if (!user) return;

    const sampleInvestments = initialInvestments.map(inv => ({
      ...convertInvestmentToDb(inv),
      user_id: user.id
    }));

    try {
      const { data, error } = await supabase
        .from('investments')
        .insert(sampleInvestments)
        .select('*');

      if (error) throw error;

      if (data) {
        const convertedInvestments = data.map(convertDbToInvestment);
        setInvestments(convertedInvestments);
      }
    } catch (error) {
      console.error('Error creating initial investments:', error);
    }
  };

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
      dateAcquisition: 'date_acquisition',
      dateEntree: 'date_entree',
      dureeBail: 'duree_bail',
      bailNextBreak: 'bail_next_break',
      bailGmapLink: 'bail_gmap_link',
      bailGmapNote: 'bail_gmap_note',
      bailLoyerHT: 'bail_loyer_ht',
      bailCNR: 'bail_cnr',
      bailPriseEffet: 'bail_prise_effet',
      bailActivite: 'bail_activite',
      bailAnciennete: 'bail_anciennete',
      typeBail: 'type_bail',
      netVendeur: 'net_vendeur',
      honoNotaire: 'hono_notaire',
      lastValue: 'last_value',
      investmentAmount: 'investment_amount',
      notaryFees: 'notary_fees',
      dateInvestment: 'investment_date'
    };
    return fieldMap[frontendField] || frontendField;
  };

  const getInvestment = (id: string): Investment | undefined => {
    return investments.find(inv => inv.id === id);
  };

  return (
    <InvestmentContext.Provider value={{
      investments,
      filteredInvestments,
      updateInvestment,
      addInvestment,
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