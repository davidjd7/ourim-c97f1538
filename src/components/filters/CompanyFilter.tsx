import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { useCompanies } from '@/contexts/CompanyContext';

export function CompanyFilter() {
  const { companies, selectedCompanyId, setSelectedCompanyId, loading } = useCompanies();

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
      <Select value={selectedCompanyId || 'all'} onValueChange={(value) => {
        setSelectedCompanyId(value === 'all' ? null : value);
      }}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue placeholder="Toutes les sociétés" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les sociétés</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}