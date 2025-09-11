import { useState, useEffect } from 'react';

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
  { key: 'dateInvestment', label: 'Date d\'investissement', visible: true, sortable: true, align: 'left', type: 'date' },
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

export function useColumnVisibility() {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const storedColumns = JSON.parse(stored);
        // Merge with defaults to handle new columns
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const storedCol = storedColumns.find((col: ColumnConfig) => col.key === defaultCol.key);
          return storedCol ? { ...defaultCol, visible: storedCol.visible } : defaultCol;
        });
        setColumns(mergedColumns);
      } catch (error) {
        console.error('Error loading column visibility:', error);
      }
    }
  }, []);

  // Save to localStorage when columns change
  const updateColumnVisibility = (key: string, visible: boolean) => {
    const updatedColumns = columns.map(col => 
      col.key === key ? { ...col, visible } : col
    );
    setColumns(updatedColumns);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedColumns));
  };

  const visibleColumns = columns.filter(col => col.visible);
  const hiddenColumns = columns.filter(col => !col.visible);

  return {
    columns,
    visibleColumns,
    hiddenColumns,
    updateColumnVisibility,
  };
}