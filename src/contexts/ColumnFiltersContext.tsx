import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';

export interface FilterValue {
  text?: string;
  numberRange?: { min?: number; max?: number };
  dateRange?: { from?: Date; to?: Date };
  select?: string[];
  tags?: string[];
}

export interface ColumnFilter {
  key: string;
  value: FilterValue;
  active: boolean;
}

interface ColumnFiltersContextValue {
  filters: Record<string, ColumnFilter>;
  setColumnFilter: (key: string, value: FilterValue) => void;
  clearColumnFilter: (key: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  getFilterValue: (key: string) => FilterValue;
  isFilterActive: (key: string) => boolean;
}

const ColumnFiltersContext = createContext<ColumnFiltersContextValue | undefined>(undefined);

export function ColumnFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({});

  const setColumnFilter = useCallback((key: string, value: FilterValue) => {
    setFilters(prev => {
      const hasValue = (
        (value.text && value.text.length > 0) ||
        (value.numberRange && (value.numberRange.min !== undefined || value.numberRange.max !== undefined)) ||
        (value.dateRange && (value.dateRange.from || value.dateRange.to)) ||
        (value.select && value.select.length > 0) ||
        (value.tags && value.tags.length > 0)
      );

      if (!hasValue) {
        const { [key]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [key]: {
          key,
          value,
          active: true,
        }
      };
    });
  }, []);

  const clearColumnFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const value: ColumnFiltersContextValue = useMemo(() => ({
    filters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    hasActiveFilters: Object.keys(filters).length > 0,
    getFilterValue: (key: string) => filters[key]?.value || {},
    isFilterActive: (key: string) => Boolean(filters[key]?.active),
  }), [filters, setColumnFilter, clearColumnFilter, clearAllFilters]);

  return (
    <ColumnFiltersContext.Provider value={value}>
      {children}
    </ColumnFiltersContext.Provider>
  );
}

export function useColumnFilters(): ColumnFiltersContextValue {
  const context = useContext(ColumnFiltersContext);
  if (!context) {
    throw new Error('useColumnFilters must be used within a ColumnFiltersProvider');
  }
  return context;
}