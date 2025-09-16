import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  isInitialized: boolean;
}

const ColumnFiltersContext = createContext<ColumnFiltersContextValue | undefined>(undefined);

// Fonction pour sérialiser les filtres (gérer les dates)
const serializeFilters = (filters: Record<string, ColumnFilter>): string => {
  return JSON.stringify(filters, (key, value) => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  });
};

// Fonction pour désérialiser les filtres (reconstruire les dates)
const deserializeFilters = (serialized: string): Record<string, ColumnFilter> => {
  return JSON.parse(serialized, (key, value) => {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  });
};

export function ColumnFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Record<string, ColumnFilter>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);

  // Charger les filtres depuis localStorage au démarrage
  useEffect(() => {
    const initializeFilters = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const key = user ? `investment-table-filters-${user.id}` : 'investment-table-filters';
        setStorageKey(key);

        const stored = localStorage.getItem(key);
        if (stored) {
          const deserializedFilters = deserializeFilters(stored);
          setFilters(deserializedFilters);
        }
      } catch (error) {
        console.error('Error loading column filters:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeFilters();
  }, []);

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

      const newFilters = {
        ...prev,
        [key]: {
          key,
          value,
          active: true,
        }
      };

      // Sauvegarder dans localStorage si initialisé
      if (isInitialized && storageKey) {
        try {
          localStorage.setItem(storageKey, serializeFilters(newFilters));
        } catch (error) {
          console.error('Error saving column filters:', error);
        }
      }

      return newFilters;
    });
  }, [isInitialized, storageKey]);

  const clearColumnFilter = useCallback((key: string) => {
    setFilters(prev => {
      const { [key]: removed, ...rest } = prev;
      
      // Sauvegarder dans localStorage si initialisé
      if (isInitialized && storageKey) {
        try {
          localStorage.setItem(storageKey, serializeFilters(rest));
        } catch (error) {
          console.error('Error saving column filters:', error);
        }
      }

      return rest;
    });
  }, [isInitialized, storageKey]);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    
    // Sauvegarder dans localStorage si initialisé
    if (isInitialized && storageKey) {
      try {
        localStorage.setItem(storageKey, serializeFilters({}));
      } catch (error) {
        console.error('Error saving column filters:', error);
      }
    }
  }, [isInitialized, storageKey]);

  const value: ColumnFiltersContextValue = useMemo(() => ({
    filters,
    setColumnFilter,
    clearColumnFilter,
    clearAllFilters,
    hasActiveFilters: Object.keys(filters).length > 0,
    getFilterValue: (key: string) => filters[key]?.value || {},
    isFilterActive: (key: string) => Boolean(filters[key]?.active),
    isInitialized,
  }), [filters, setColumnFilter, clearColumnFilter, clearAllFilters, isInitialized]);

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