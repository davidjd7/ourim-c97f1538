import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

interface InvestmentContextType {
  investments: Investment[];
  updateInvestment: (id: string, updates: Partial<Investment>) => void;
  getInvestment: (id: string) => Investment | undefined;
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
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);

  const updateInvestment = (id: string, updates: Partial<Investment>) => {
    setInvestments(prev => 
      prev.map(investment => 
        investment.id === id 
          ? { ...investment, ...updates }
          : investment
      )
    );
  };

  const getInvestment = (id: string): Investment | undefined => {
    return investments.find(inv => inv.id === id);
  };

  return (
    <InvestmentContext.Provider value={{
      investments,
      updateInvestment,
      getInvestment
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