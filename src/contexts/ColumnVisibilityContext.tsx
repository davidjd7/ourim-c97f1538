import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  align?: 'left' | 'right';
  type?: 'currency' | 'percentage' | 'text' | 'date';
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Nom', visible: true, sortable: true, align: 'left', type: 'text' },
  { key: 'type', label: 'Type', visible: true, sortable: true, align: 'left', type: 'text' },
  { key: 'dateInvestment', label: "Date d'investissement", visible: true, sortable: true, align: 'left', type: 'date' },
  { key: 'fondPropre', label: 'Fond Propre', visible: true, sortable: true, align: 'right', type: 'currency' },
  { key: 'coc', label: 'COC', visible: true, sortable: true, align: 'right', type: 'percentage' },
  { key: 'totalCfni', label: 'Total CFNI', visible: true, sortable: true, align: 'right', type: 'currency' },
  { key: 'xirr', label: 'XIRR', visible: true, sortable: true, align: 'right', type: 'percentage' },
  // Nouvelles colonnes (masquées par défaut)
  { key: 'totalVarValeur', label: 'Total Var valeur', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'lastVarValeur', label: 'Last Var. Valeur', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'lastCfni', label: 'Last CFNI', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'ltv', label: 'LTV', visible: false, sortable: true, align: 'right', type: 'percentage' },
  { key: 'crd', label: 'CRD', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'noi', label: 'NOI', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'loyer', label: 'Loyer', visible: false, sortable: true, align: 'right', type: 'currency' },
  { key: 'rendementNet', label: 'Rendement Net', visible: false, sortable: true, align: 'right', type: 'percentage' },
];

const STORAGE_KEY = 'investment-table-columns';

interface ColumnVisibilityContextValue {
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  hiddenColumns: ColumnConfig[];
  updateColumnVisibility: (key: string, visible: boolean) => void;
  isInitialized: boolean;
}

const ColumnVisibilityContext = createContext<ColumnVisibilityContextValue | undefined>(undefined);

export function ColumnVisibilityProvider({ children }: { children: ReactNode }) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load once from localStorage and merge with defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedColumns: ColumnConfig[] = JSON.parse(stored);
        const mergedColumns = DEFAULT_COLUMNS.map((defaultCol) => {
          const storedCol = storedColumns.find((c) => c.key === defaultCol.key);
          return storedCol ? { ...defaultCol, visible: storedCol.visible } : defaultCol;
        });
        setColumns(mergedColumns);
      }
    } catch (e) {
      console.error('Error loading column visibility:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const updateColumnVisibility = useCallback((key: string, visible: boolean) => {
    setColumns((current) => {
      const updated = current.map((col) => (col.key === key ? { ...col, visible } : col));
      if (isInitialized) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, [isInitialized]);

  const value: ColumnVisibilityContextValue = useMemo(() => ({
    columns,
    visibleColumns: columns.filter((c) => c.visible),
    hiddenColumns: columns.filter((c) => !c.visible),
    updateColumnVisibility,
    isInitialized,
  }), [columns, updateColumnVisibility, isInitialized]);

  return (
    <ColumnVisibilityContext.Provider value={value}>
      {children}
    </ColumnVisibilityContext.Provider>
  );
}

export function useColumnVisibility(): ColumnVisibilityContextValue {
  const ctx = useContext(ColumnVisibilityContext);
  if (!ctx) {
    throw new Error('useColumnVisibility must be used within a ColumnVisibilityProvider');
  }
  return ctx;
}
