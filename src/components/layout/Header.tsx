import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2, User, LogOut, X, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/contexts/SearchContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CompanyFilter } from '@/components/filters/CompanyFilter';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const {
    searchQuery,
    searchResults,
    showResults,
    setSearchQuery,
    setShowResults
  } = useSearch();

  const handleAddInvestment = (type: 'IMMO' | 'PE') => {
    navigate('/investissement/nouveau', { state: { type } });
  };

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left section - Sidebar Toggle + CTA Actions */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="hover-scale" />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="btn-financial gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Nouvel investissement</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddInvestment('IMMO')}>
                <Building2 className="mr-2 h-4 w-4" />
                Actif Immobilier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddInvestment('PE')}>
                <Building2 className="mr-2 h-4 w-4" />
                Actif Private Equity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Center section - Search and Filters */}
        <div className="flex-1 flex items-center justify-center px-6 gap-4">
          <div ref={searchRef} className="w-full max-w-lg relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un investissement..."
              className="pl-10 pr-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            
            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto backdrop-blur-sm"
                role="listbox"
                aria-label="Résultats de recherche"
              >
                {searchResults.map((investment) => (
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
                           {investment.latestValue && (
                             <span className="text-xs text-muted-foreground">
                               {new Intl.NumberFormat('fr-FR', {
                                 style: 'currency',
                                 currency: 'EUR',
                                 minimumFractionDigits: 0,
                               }).format(investment.latestValue)}
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
          <CompanyFilter />
        </div>

        {/* Right section - Profile */}
        <div className="flex items-center gap-4">
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                {user?.email || 'Utilisateur'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profil</DropdownMenuItem>
              <DropdownMenuItem>Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}