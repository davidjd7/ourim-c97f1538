import React, { useState, useMemo } from 'react';
import { ConsolidatedKPIView } from '@/components/dashboard/ConsolidatedKPIView';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { YearPicker } from '@/components/ui/year-picker';
import { useTags } from '@/hooks/useTags';
import { useAllInvestmentTags } from '@/hooks/useAllInvestmentTags';

export default function Dashboard() {
  const { investments, loading } = useInvestments();
  const { tags } = useTags();
  const [cutoffYear, setCutoffYear] = useState<number | null>(2024);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Get all investment IDs to load their tags
  const allInvestmentIds = investments.map(inv => inv.id);
  const { investmentTags, loading: tagsLoading } = useAllInvestmentTags(allInvestmentIds);
  
  // Find the "Done" tag
  const doneTag = useMemo(() => {
    return tags.find(tag => tag.name === 'Done');
  }, [tags]);
  
  // Filter investments that have the "Done" tag
  const doneInvestments = useMemo(() => {
    if (!doneTag) return [];
    
    return investments.filter(inv => {
      const invTags = investmentTags[inv.id] || [];
      return invTags.includes(doneTag.id);
    });
  }, [investments, investmentTags, doneTag]);
  
  // Create a Set with filtered investment IDs
  const filteredInvestmentIds = useMemo(() => {
    return new Set(doneInvestments.map(inv => inv.id));
  }, [doneInvestments]);

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

  if (loading || tagsLoading) {
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
        
        {/* Year picker and investment count */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {doneInvestments.length} investissement{doneInvestments.length > 1 ? 's' : ''}
          </div>
          {availableYears.length > 0 && (
            <YearPicker
              value={cutoffYear ? `${cutoffYear}-12-31` : `${new Date().getFullYear()}-12-31`}
              onChange={handleYearPickerChange}
              availableYears={availableYears}
            />
          )}
        </div>
      </div>

      {/* Consolidated KPI View with Done investments only */}
      <ConsolidatedKPIView 
        selectedInvestments={filteredInvestmentIds}
        cutoffYear={cutoffYear}
        onCutoffYearChange={handleCutoffYearChange}
        onAvailableYearsChange={handleAvailableYearsChange}
      />
    </div>
  );
}