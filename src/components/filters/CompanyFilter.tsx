import React from 'react';
import { Building2, Check } from 'lucide-react';
import { useCompanies } from '@/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

export function CompanyFilter() {
  const { companies, selectedCompanyIds, toggleCompanySelection, setSelectedCompanyIds, loading } = useCompanies();

  const selectedCount = selectedCompanyIds.length;
  const allSelected = selectedCount === companies.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(companies.map(c => c.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 min-w-[200px]">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[200px]">
            <span>
              {selectedCount === 0 
                ? 'Toutes les sociétés'
                : selectedCount === companies.length 
                  ? 'Toutes les sociétés'
                  : `${selectedCount} société${selectedCount > 1 ? 's' : ''}`
              }
            </span>
            <Building2 className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-4">
            <div className="font-semibold text-sm mb-3">Filtrer par société</div>
            
            {/* Select All option */}
            <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer flex-1"
              >
                Toutes les sociétés
              </label>
            </div>

            {/* Individual companies */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={company.id}
                    checked={selectedCompanyIds.includes(company.id)}
                    onCheckedChange={() => toggleCompanySelection(company.id)}
                  />
                  <label
                    htmlFor={company.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {company.name}
                  </label>
                </div>
              ))}
            </div>

            {companies.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Aucune société créée
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}