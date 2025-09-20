import React, { useState } from 'react';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { Button } from '@/components/ui/button';
import { BarChart3, Table } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { ColumnFiltersProvider } from '@/contexts/ColumnFiltersContext';

type ViewMode = 'table' | 'kpi';

export default function Investissements() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedInvestments, setSelectedInvestments] = useState<Set<string>>(new Set());
  const { filteredInvestments } = useSearch();

  const handleSelectedRowsChange = (selectedRows: Set<string>) => {
    setSelectedInvestments(selectedRows);
  };

  const totalCount = filteredInvestments.length;
  const selectedCount = selectedInvestments.size;

  return (
    <ColumnFiltersProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-foreground">Investissements</h1>
              {viewMode === 'kpi' && (
                <h2 className="text-2xl font-bold text-foreground">Vue KPI Consolidée</h2>
              )}
            </div>
            {viewMode === 'kpi' && selectedInvestments.size > 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedInvestments.size} investissement{selectedInvestments.size > 1 ? 's' : ''} sélectionné{selectedInvestments.size > 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground">
                Gestion de vos actifs investis
              </p>
            )}
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
    </ColumnFiltersProvider>
  );
}