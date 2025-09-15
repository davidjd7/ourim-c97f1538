import React, { useState, useEffect, useRef } from 'react';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Table, Search, X, Building2, TrendingUp } from 'lucide-react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useNavigate } from 'react-router-dom';
import { useInvestmentSearch } from '@/hooks/useInvestmentSearch';

type ViewMode = 'table' | 'kpi';

export default function Investissements() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedInvestments, setSelectedInvestments] = useState<Set<string>>(new Set());
  const { investments } = useInvestments();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    searchResults,
    showResults,
    setSearchQuery,
    setShowResults,
    filteredInvestments
  } = useInvestmentSearch(investments);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setShowResults]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showResults) {
        setShowResults(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResults, setShowResults, setSearchQuery]);

  const handleSelectedRowsChange = (selectedRows: Set<string>) => {
    setSelectedInvestments(selectedRows);
  };

  const handleSearchResultClick = (investmentId: string) => {
    navigate(`/investissement/${investmentId}`);
    setSearchQuery('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium">
          {part}
        </mark>
      ) : part
    );
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 focus:ring-2 focus:ring-primary/20"
            aria-label="Rechercher un investissement"
            aria-expanded={showResults}
            aria-haspopup="listbox"
            role="combobox"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto backdrop-blur-sm"
            role="listbox"
            aria-label="Résultats de recherche"
          >
            {searchResults.map((investment, index) => (
              <div
                key={investment.id}
                onClick={() => handleSearchResultClick(investment.id)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-all duration-200 first:rounded-t-lg last:rounded-b-lg border-b border-border/50 last:border-b-0"
                role="option"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSearchResultClick(investment.id);
                  }
                }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {investment.type === 'IMMO' ? (
                    <Building2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-secondary shrink-0" />
                  )}
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-medium text-foreground truncate">
                      {highlightText(investment.name, searchQuery)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={investment.type === 'IMMO' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {investment.type === 'IMMO' ? 'Immobilier' : 'Private Equity'}
                      </Badge>
                      {investment.investmentAmount && (
                        <span className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0,
                          }).format(investment.investmentAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* No results message */}
        {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 px-4 py-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <span className="text-muted-foreground">Aucun investissement trouvé</span>
              <span className="text-xs text-muted-foreground/75">
                Essayez avec d'autres termes de recherche
              </span>
            </div>
          </div>
        )}
        
        {/* Minimum characters hint */}
        {showResults && searchQuery.length > 0 && searchQuery.length < 2 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Saisissez au moins 2 caractères pour rechercher
            </span>
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