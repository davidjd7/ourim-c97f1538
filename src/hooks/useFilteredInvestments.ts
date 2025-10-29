import { useMemo, useCallback } from 'react';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { useTags } from '@/hooks/useTags';

export interface Investment {
  id: string;
  name: string;
  type: string;
  dateInvestment?: string;
  [key: string]: any;
}

export interface KPIData {
  [investmentId: string]: {
    [key: string]: number;
  };
}

export function useFilteredInvestments(
  investments: Investment[],
  kpiData: KPIData,
  tags: { [investmentId: string]: string[] } = {}
) {
  const { filters } = useColumnFilters();
  const { tags: allTags } = useTags();

  // Memoize active filters to avoid recalculating
  const activeFilters = useMemo(() => 
    Object.entries(filters).filter(([, filter]) => filter.active),
    [filters]
  );

  // Memoize date parsing to avoid recreating dates
  const parseDate = useCallback((dateString: string) => new Date(dateString), []);

  return useMemo(() => {
    if (activeFilters.length === 0) {
      return investments; // No filters active, return all
    }

    return investments.filter(investment => {
      // Apply each active filter
      for (const [columnKey, filter] of activeFilters) {
        const { value } = filter;

        switch (columnKey) {
          case 'name':
            if (value.text && !investment.name.toLowerCase().includes(value.text.toLowerCase())) {
              return false;
            }
            break;

          case 'type':
            if (value.select && value.select.length > 0) {
              if (!value.select.includes(investment.type)) {
                return false;
              }
            }
            break;

          case 'dateInvestment':
            if (value.dateRange && investment.dateInvestment) {
              const investmentDate = parseDate(investment.dateInvestment);
              if (value.dateRange.from && investmentDate < value.dateRange.from) {
                return false;
              }
              if (value.dateRange.to && investmentDate > value.dateRange.to) {
                return false;
              }
            }
            break;

          case 'tags':
            if (value.tags && value.tags.length > 0) {
              const investmentTags = tags[investment.id] || [];
              const hasAllTags = value.tags.every(tagId => investmentTags.includes(tagId));
              if (!hasAllTags) {
                return false;
              }
            }
            break;

          // Handle KPI filters (numeric ranges)
          default:
            if (value.numberRange) {
              const kpiValue = kpiData[investment.id]?.[columnKey];
              if (kpiValue === undefined) {
                return false; // Skip if KPI data not loaded
              }
              
              if (value.numberRange.min !== undefined && kpiValue < value.numberRange.min) {
                return false;
              }
              if (value.numberRange.max !== undefined && kpiValue > value.numberRange.max) {
                return false;
              }
            }
            break;
        }
      }

      return true;
    });
  }, [investments, activeFilters, kpiData, tags, parseDate]);
}