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
  try {
    const investmentsContext = useInvestments();
    
    // Wait for the investments context to be ready
    if (!investmentsContext || investmentsContext.loading) {
      // Provide a loading state context
      const loadingData = {
        searchQuery: '',
        debouncedQuery: '',
        searchResults: [],
        showResults: false,
        filteredInvestments: [],
        setSearchQuery: () => {},
        setShowResults: () => {}
      };
      
      return (
        <SearchContext.Provider value={loadingData}>
          {children}
        </SearchContext.Provider>
      );
    }

    const searchData = useInvestmentSearch(investmentsContext.filteredInvestments);

    return (
      <SearchContext.Provider value={searchData}>
        {children}
      </SearchContext.Provider>
    );
  } catch (error) {
    console.error('Error in SearchProvider:', error);
    // Provide a fallback context value
    const fallbackData = {
      searchQuery: '',
      debouncedQuery: '',
      searchResults: [],
      showResults: false,
      filteredInvestments: [],
      setSearchQuery: () => {},
      setShowResults: () => {}
    };
    
    return (
      <SearchContext.Provider value={fallbackData}>
        {children}
      </SearchContext.Provider>
    );
  }
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}