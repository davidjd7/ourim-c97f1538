import React, { useState, useMemo } from 'react';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { YearPicker } from '@/components/ui/year-picker';

export default function Dashboard() {
  const { investments, loading } = useInvestments();
  const [cutoffYear, setCutoffYear] = useState<number | null>(2024);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Create a Set with all investment IDs
  const allInvestmentIds = useMemo(() => {
    return new Set(investments.map(inv => inv.id));
  }, [investments]);

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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Vue d'ensemble consolidée de votre portefeuille
          </p>
        </div>
        <div className="card-financial p-8 text-center">
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Vue d'ensemble consolidée de votre portefeuille
          </p>
        </div>
        
        {/* Year picker */}
        {availableYears.length > 0 && (
          <YearPicker
            value={cutoffYear ? `${cutoffYear}-12-31` : `${new Date().getFullYear()}-12-31`}
            onChange={handleYearPickerChange}
            availableYears={availableYears}
          />
        )}
      </div>

      {/* Consolidated KPI View with all investments */}
      <ConsolidatedKPIView 
        selectedInvestments={allInvestmentIds}
        cutoffYear={cutoffYear}
        onCutoffYearChange={handleCutoffYearChange}
        onAvailableYearsChange={handleAvailableYearsChange}
      />
    </div>
  );
}