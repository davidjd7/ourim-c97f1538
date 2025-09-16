import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { colDbg } from '@/lib/columnDebug';
export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  align?: 'left' | 'right';
  type?: 'currency' | 'percentage' | 'text' | 'date';
  order?: number;
  required?: boolean; // Colonne obligatoire, ne peut pas être masquée
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Nom', visible: true, sortable: true, align: 'left', type: 'text', order: 0, required: true },
  { key: 'type', label: 'Type', visible: true, sortable: true, align: 'left', type: 'text', order: 1 },
  { key: 'dateInvestment', label: "Date d'investissement", visible: true, sortable: true, align: 'left', type: 'date', order: 2 },
  { key: 'tags', label: 'Tags', visible: true, sortable: false, align: 'left', type: 'text', order: 3 },
  { key: 'fondPropre', label: 'Fond Propre', visible: true, sortable: true, align: 'right', type: 'currency', order: 4 },
  { key: 'totalReturn', label: 'Total Return', visible: true, sortable: true, align: 'right', type: 'percentage', order: 5 },
  { key: 'xirr', label: 'XIRR glissant', visible: true, sortable: true, align: 'right', type: 'percentage', order: 6 },
  // Nouvelles colonnes (masquées par défaut)
  { key: 'coc', label: 'COC', visible: false, sortable: true, align: 'right', type: 'percentage', order: 7 },
  { key: 'totalCfni', label: 'Total CFNI', visible: false, sortable: true, align: 'right', type: 'currency', order: 8 },
  { key: 'totalVarValeur', label: 'Total Var valeur', visible: false, sortable: true, align: 'right', type: 'currency', order: 9 },
  { key: 'lastVarValeur', label: 'Last Var. Valeur', visible: false, sortable: true, align: 'right', type: 'currency', order: 10 },
  { key: 'lastCfni', label: 'Last CFNI', visible: false, sortable: true, align: 'right', type: 'currency', order: 11 },
  { key: 'gain1', label: 'Last gain', visible: false, sortable: true, align: 'right', type: 'currency', order: 12 },
  { key: 'ltv', label: 'LTV', visible: false, sortable: true, align: 'right', type: 'percentage', order: 13 },
  { key: 'crd', label: 'CRD', visible: false, sortable: true, align: 'right', type: 'currency', order: 14 },
  { key: 'noi', label: 'NOI', visible: false, sortable: true, align: 'right', type: 'currency', order: 15 },
  { key: 'loyer', label: 'Loyer', visible: false, sortable: true, align: 'right', type: 'currency', order: 16 },
  { key: 'rendementNet', label: 'Rendement Net', visible: false, sortable: true, align: 'right', type: 'percentage', order: 17 },
];

// Clé de base, sera suffixée avec l'ID utilisateur
const BASE_STORAGE_KEY = 'investment-table-columns';

interface ColumnVisibilityContextValue {
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  hiddenColumns: ColumnConfig[];
  updateColumnVisibility: (key: string, visible: boolean) => void;
  reorderColumns: (oldIndex: number, newIndex: number) => void;
  isInitialized: boolean;
}

const ColumnVisibilityContext = createContext<ColumnVisibilityContextValue | undefined>(undefined);

export function ColumnVisibilityProvider({ children }: { children: ReactNode }) {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);

// Load once from localStorage and merge with defaults
useEffect(() => {
  const initializeColumns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const primaryKey = user ? `${BASE_STORAGE_KEY}-${user.id}` : BASE_STORAGE_KEY;
      const fallbackKey = BASE_STORAGE_KEY;
      setStorageKey(primaryKey);
      colDbg.log('init.start', { userId: user?.id ?? null, primaryKey, fallbackKey });

      let usedKey = primaryKey;
      let storedRaw = localStorage.getItem(primaryKey);

      // If logged-in but nothing under user key, try base key (migration)
      if (!storedRaw && user) {
        const baseRaw = localStorage.getItem(fallbackKey);
        if (baseRaw) {
          storedRaw = baseRaw;
          usedKey = fallbackKey;
          colDbg.log('init.migrate.fromBase', { from: fallbackKey, to: primaryKey });
        }
      }

      if (storedRaw) {
        try {
          const storedColumns: ColumnConfig[] = JSON.parse(storedRaw);
          const mergedColumns = DEFAULT_COLUMNS.map((defaultCol) => {
            const storedCol = storedColumns.find((c) => c.key === defaultCol.key);
            return storedCol ? { ...defaultCol, visible: storedCol.visible, order: storedCol.order ?? defaultCol.order } : defaultCol;
          });
          // Sort by order
          mergedColumns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          setColumns(mergedColumns);
          colDbg.log('init.loaded', { usedKey, count: mergedColumns.length, snapshot: colDbg.snap(mergedColumns) });

          // If we migrated from base to user key, persist under primary key
          if (usedKey === fallbackKey && user) {
            try {
              localStorage.setItem(primaryKey, JSON.stringify(mergedColumns));
              colDbg.log('init.migrated.persisted', { to: primaryKey });
            } catch (mErr) {
              console.error('Error migrating columns to user key:', mErr);
            }
          }
        } catch (parseErr) {
          console.error('Error parsing stored columns:', parseErr);
          colDbg.log('init.parseError', { usedKey, error: String(parseErr) });
        }
      } else {
        colDbg.log('init.noStored', { key: primaryKey });
      }
    } catch (e) {
      console.error('Error loading column visibility:', e);
      colDbg.log('init.error', { error: String(e) });
    } finally {
      setIsInitialized(true);
    }
  };

  initializeColumns();
}, []);

// Centralized persistence - save to localStorage when columns change
useEffect(() => {
  if (isInitialized && storageKey && columns.length > 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(columns));
      colDbg.log('persist.save', { key: storageKey, snapshot: colDbg.snap(columns) });
    } catch (error) {
      console.error('Error saving columns to localStorage:', error);
    }
  }
}, [columns, isInitialized, storageKey]);

const updateColumnVisibility = useCallback((key: string, visible: boolean) => {
  setColumns((current) => {
    // Empêcher la modification des colonnes obligatoires
    const column = current.find(col => col.key === key);
    if (column?.required) {
      colDbg.log('visibility.blocked.required', { key });
      return current; // Ne pas modifier les colonnes obligatoires
    }
    const updated = current.map((col) => (col.key === key ? { ...col, visible } : col));
    colDbg.log('visibility.update', { key, visible, before: colDbg.snap(current), after: colDbg.snap(updated) });
    return updated;
  });
}, []);

const reorderColumns = useCallback((oldIndex: number, newIndex: number) => {
  setColumns((current) => {
    const before = colDbg.snap(current);
    const newColumns = [...current];
    const [reorderedColumn] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, reorderedColumn);
    
    // Update order values
    const updatedColumns = newColumns.map((col, index) => ({ ...col, order: index }));
    colDbg.log('order.reorder', { oldIndex, newIndex, moved: reorderedColumn?.key, before, after: colDbg.snap(updatedColumns) });
    return updatedColumns;
  });
}, []);

  const value: ColumnVisibilityContextValue = useMemo(() => {
    // Create immutable sorted copies to avoid mutation during render
    const sortedColumns = [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const sortedVisible = sortedColumns.filter((c) => c.visible);
    const sortedHidden = sortedColumns.filter((c) => !c.visible);

    return {
      columns: sortedColumns,
      visibleColumns: sortedVisible,
      hiddenColumns: sortedHidden,
      updateColumnVisibility,
      reorderColumns,
      isInitialized,
    };
  }, [columns, updateColumnVisibility, reorderColumns, isInitialized]);

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
