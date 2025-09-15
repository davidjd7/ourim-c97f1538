import { useState, useMemo, useCallback, useEffect } from 'react';

interface Investment {
  id: string;
  name: string;
  type: string;
  investmentAmount?: number;
  [key: string]: any;
}

export function useInvestmentSearch(investments: Investment[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update search query and show results
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setShowResults(query.length > 0);
  }, []);

  // Enhanced search function
  const searchInvestments = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      return [];
    }

    const query = debouncedQuery.toLowerCase();
    
    return investments
      .filter(investment => {
        // Search in name
        const nameMatch = investment.name.toLowerCase().includes(query);
        
        // Search in type
        const typeMatch = investment.type.toLowerCase().includes(query) ||
          (investment.type === 'IMMO' && 'immobilier'.includes(query)) ||
          (investment.type === 'PE' && ('private equity'.includes(query) || 'pe'.includes(query)));
        
        return nameMatch || typeMatch;
      })
      .slice(0, 8); // Limit results
  }, [investments, debouncedQuery]);

  // Filter all investments for table display
  const filteredInvestments = useMemo(() => {
    if (!searchQuery) {
      return investments;
    }

    const query = searchQuery.toLowerCase();
    
    return investments.filter(investment => {
      const nameMatch = investment.name.toLowerCase().includes(query);
      const typeMatch = investment.type.toLowerCase().includes(query) ||
        (investment.type === 'IMMO' && 'immobilier'.includes(query)) ||
        (investment.type === 'PE' && ('private equity'.includes(query) || 'pe'.includes(query)));
      
      return nameMatch || typeMatch;
    });
  }, [investments, searchQuery]);

  return {
    searchQuery,
    debouncedQuery,
    searchResults: searchInvestments,
    showResults: showResults && debouncedQuery.length >= 2,
    filteredInvestments,
    setSearchQuery: updateSearchQuery,
    setShowResults,
  };
}