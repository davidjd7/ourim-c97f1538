import React, { useState, useEffect, useRef } from 'react';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BarChart3, Table, Search, X } from 'lucide-react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'table' | 'kpi';

export default function Investissements() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedInvestments, setSelectedInvestments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { investments } = useInvestments();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectedRowsChange = (selectedRows: Set<string>) => {
    setSelectedInvestments(selectedRows);
  };

  // Filter investments based on search query
  const filteredInvestments = investments.filter(investment =>
    investment.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const searchResults = searchQuery.length > 0 ? filteredInvestments.slice(0, 5) : [];

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchResults(value.length > 0);
  };

  const handleSearchResultClick = (investmentId: string) => {
    navigate(`/investissement/${investmentId}`);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const totalCount = filteredInvestments.length;
  const selectedCount = selectedInvestments.size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investissements</h1>
          <p className="text-lg text-muted-foreground">
            Gestion de vos actifs investis
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Counter */}
          <div className="text-sm text-muted-foreground font-medium">
            {selectedCount > 0 ? (
              <span className="text-primary font-semibold">
                {selectedCount} / {totalCount}
              </span>
            ) : (
              <span>{totalCount} élément{totalCount > 1 ? 's' : ''}</span>
            )}
          </div>
          
          {/* View buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'table' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <Table className="h-4 w-4 mr-2" />
              Vue Table
            </Button>
            <Button 
              variant={viewMode === 'kpi' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('kpi')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Vue KPI
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div ref={searchRef} className="relative max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher un investissement..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map((investment) => (
              <div
                key={investment.id}
                onClick={() => handleSearchResultClick(investment.id)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  {investment.type === 'IMMO' ? (
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                  ) : (
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                  )}
                  <span className="font-medium">{investment.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {investment.type === 'IMMO' ? 'Immobilier' : 'Private Equity'}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {showSearchResults && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 px-4 py-2">
            <span className="text-muted-foreground">Aucun investissement trouvé</span>
          </div>
        )}
      </div>

      {/* Content based on view mode */}
      {viewMode === 'table' ? (
        <InvestmentTable 
          selectedRows={selectedInvestments} 
          onSelectedRowsChange={handleSelectedRowsChange}
          filteredInvestments={filteredInvestments}
        />
      ) : (
        <ConsolidatedKPIView selectedInvestments={selectedInvestments} />
      )}
    </div>
  );
}