import React, { createContext, useContext, ReactNode } from 'react';
import { useInvestmentSearch } from '@/hooks/useInvestmentSearch';
import { useInvestments } from '@/contexts/ImmobilierContext';

interface SearchContextType {
  searchQuery: string;
  debouncedQuery: string;
  searchResults: any[];
  showResults: boolean;
  filteredInvestments: any[];
  setSearchQuery: (query: string) => void;
  setShowResults: (show: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const { investments } = useInvestments();
  const searchData = useInvestmentSearch(investments);

  return (
    <SearchContext.Provider value={searchData}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}