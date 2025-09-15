import { useMemo } from 'react';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { useTags } from '@/hooks/useTags';

interface Investment {
  id: string;
  name: string;
  type: string;
  dateInvestment?: string;
  [key: string]: any;
}

interface KPIData {
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

  return useMemo(() => {
    return investments.filter(investment => {
      // Apply each column filter
      for (const [columnKey, filter] of Object.entries(filters)) {
        if (!filter.active) continue;

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
              const investmentDate = new Date(investment.dateInvestment);
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
              const hasMatchingTag = value.tags.some(tagId => investmentTags.includes(tagId));
              if (!hasMatchingTag) {
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
  }, [investments, filters, kpiData, tags, allTags]);
}