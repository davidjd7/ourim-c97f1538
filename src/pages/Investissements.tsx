import React, { useState } from 'react';
import { InvestmentTable } from '@/components/dashboard/InvestmentTable';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { Button } from '@/components/ui/button';
import { BarChart3, Table, Printer } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { YearPicker } from '@/components/ui/year-picker';

type ViewMode = 'table' | 'kpi';

const EMPTY_SET = new Set<string>();

export default function Investissements() {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedInvestments, setSelectedInvestments] = useState<Set<string>>(EMPTY_SET);
  const [cutoffYear, setCutoffYear] = useState<number | null>(2024);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const {
    filteredInvestments
  } = useSearch();
  
  const handleSelectedRowsChange = (selectedRows: Set<string>) => {
    setSelectedInvestments(selectedRows);
  };

  const handleCutoffYearChange = (year: number) => {
    setCutoffYear(year);
  };

  const handleYearPickerChange = (dateString: string) => {
    const year = new Date(dateString).getFullYear();
    setCutoffYear(year);
  };

  const handleAvailableYearsChange = (years: number[]) => {
    setAvailableYears(years);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const totalCount = filteredInvestments.length;
  const selectedCount = selectedInvestments.size;
  return (
    <div className="space-y-6 investissements-print-root">
      {/* Page Header */}
      <div className="investments-header flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">Investissements</h1>
          </div>
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
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
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
            
            {/* Year picker - only visible in KPI view */}
            {viewMode === 'kpi' && availableYears.length > 0 && (
              <YearPicker
                value={cutoffYear ? `${cutoffYear}-12-31` : `${new Date().getFullYear()}-12-31`}
                onChange={handleYearPickerChange}
                availableYears={availableYears}
              />
            )}
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
        <ConsolidatedKPIView 
          selectedInvestments={selectedInvestments}
          cutoffYear={cutoffYear}
          onCutoffYearChange={handleCutoffYearChange}
          onAvailableYearsChange={handleAvailableYearsChange}
        />
      )}
    </div>
  );
}