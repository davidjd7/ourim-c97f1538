import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building, TrendingUp, ChevronUp, ChevronDown, X } from 'lucide-react';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { useColumnVisibility } from '@/contexts/ColumnVisibilityContext';
import { useColumnFilters } from '@/contexts/ColumnFiltersContext';
import { useFilteredInvestments } from '@/hooks/useFilteredInvestments';
import { useInvestmentTags } from '@/hooks/useInvestmentTags';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';
import { ColumnSelector } from './ColumnSelector';
import { InvestmentTags } from '@/components/investments/InvestmentTags';
import { FilterIcon } from './filters/FilterIcon';
import { InvestmentKPIRowSkeleton } from './InvestmentKPIRowSkeleton';
import { InvestmentKPIRow } from './InvestmentKPIRow';


type SortKey = string;
type SortDirection = 'asc' | 'desc' | null;

export function InvestmentTable({ 
  selectedRows, 
  onSelectedRowsChange, 
  filteredInvestments 
}: { 
  selectedRows: Set<string>;
  onSelectedRowsChange?: (selectedRows: Set<string>) => void; 
  filteredInvestments?: any[];
}) {
  const { investments, loading } = useInvestments();
  const baseInvestments = filteredInvestments || investments;
  const { visibleColumns, isInitialized } = useColumnVisibility();
  const { hasActiveFilters, clearAllFilters } = useColumnFilters();
  const { investmentTags } = useInvestmentTags();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Get investment IDs for batch loading
  const investmentIds = baseInvestments.map(inv => inv.id);
  const { batchKPIs, loading: kpisLoading } = useBatchPerformanceKPIs(investmentIds);
  
  // Convert batch KPIs to legacy format for filtering with memoization
  const kpiMap: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    Object.entries(batchKPIs).forEach(([id, kpis]) => {
      map[id] = {
        fondPropre: kpis.fondPropre,
        totalReturn: kpis.totalReturn,
        totalCfni: kpis.xirrDetails.totalCfni,
        xirr: kpis.xirr,
        totalVarValeur: kpis.xirrDetails.deltaValeur,
        lastVarValeur: kpis.xirrDetails.variationValeurDerniereAnnee,
        lastCfni: kpis.xirrDetails.cfniDerniereAnnee,
        ltv: kpis.fondPropreDetails.ltv,
        crd: kpis.fondPropreDetails.crd,
        noi: kpis.rendementNetDetails.noi,
        loyer: kpis.rendementNetDetails.loyer,
        rendementNet: kpis.rendementNet,
        gain1: kpis.xirrDetails.gain1,
        totalReturnCalculated: (kpis.xirrDetails.gain1 / (kpis.fondPropre || 1)) * 100,
        lastVarValeurYear: kpis.xirrDetails.lastVarValeurYear,
        lastCfniYear: kpis.xirrDetails.lastCfniYear,
        gain1Year: kpis.xirrDetails.gain1Year,
        noiYear: kpis.rendementNetDetails.year,
        rendementNetYear: kpis.rendementNetDetails.year,
        totalReturnYear: kpis.totalReturnDetails.year,
        cocNet: kpis.totalReturnDetails.cocNet,
        coc: kpis.totalReturnDetails.cocNet, // Alias pour le tri de la colonne COC
        cf: kpis.xirrDetails.totalCfni, // Valeur pour le tri de la colonne CF
      };
    });
    return map;
  }, [batchKPIs]);
  
  // Apply column filters to investments using the custom hook
  const columnFilteredInvestments = useFilteredInvestments(baseInvestments, kpiMap, investmentTags);
  const investmentsToUse = columnFilteredInvestments;

  const handleSort = (key: SortKey) => {
    // Check if column is sortable
    const column = visibleColumns.find(col => col.key === key);
    if (!column?.sortable) return;

    if (sortKey === key) {
      // Si même colonne, alterner: null -> desc -> asc -> null
      if (sortDirection === null) {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      // Nouvelle colonne, commencer par décroissant
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const sortedInvestments = useMemo(() => {
    if (!sortKey || !sortDirection) return investmentsToUse;

    return [...investmentsToUse].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortKey) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'dateInvestment':
          aValue = a.dateInvestment ? new Date(a.dateInvestment) : new Date(0);
          bValue = b.dateInvestment ? new Date(b.dateInvestment) : new Date(0);
          break;
        // Pour les KPIs, utiliser les données collectées depuis les lignes
        default:
          aValue = kpiMap[a.id]?.[sortKey] ?? Number.NEGATIVE_INFINITY;
          bValue = kpiMap[b.id]?.[sortKey] ?? Number.NEGATIVE_INFINITY;
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [investmentsToUse, sortKey, sortDirection, kpiMap]);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    return null;
  };

  const handleRowSelect = (investmentId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(investmentId);
    } else {
      newSelected.delete(investmentId);
    }
    onSelectedRowsChange?.(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelected = checked ? new Set(sortedInvestments.map(inv => inv.id)) : new Set<string>();
    onSelectedRowsChange?.(newSelected);
  };

  const isAllSelected = sortedInvestments.length > 0 && selectedRows.size === sortedInvestments.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < sortedInvestments.length;

  if (!isInitialized) {
    return (
      <div className="card-financial">
        <div className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Chargement...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-financial">
      {hasActiveFilters && (
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Filtres actifs
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-1 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Effacer tous les filtres
            </Button>
          </div>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Sélectionner tout"
              />
            </TableHead>
            {visibleColumns.map((column) => (
              <TableHead 
                key={column.key}
                className={`${column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''} select-none ${
                  column.align === 'right' ? 'text-right' : ''
                }`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={`flex items-center gap-1 ${
                  column.align === 'right' ? 'justify-end' : ''
                }`}>
                  {column.label}
                  <FilterIcon column={column} />
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[50px]">
              <div className="flex justify-center">
                <ColumnSelector />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(loading || kpisLoading) ? (
            // Show skeleton rows while loading
            Array.from({ length: 5 }, (_, index) => (
              <InvestmentKPIRowSkeleton key={`skeleton-${index}`} visibleColumns={visibleColumns} />
            ))
          ) : (
            sortedInvestments.map((investment) => (
              <InvestmentKPIRow
                key={investment.id}
                investment={investment} 
                kpis={batchKPIs[investment.id]}
                visibleColumns={visibleColumns}
                isSelected={selectedRows.has(investment.id)}
                onSelectionChange={(isSelected) => handleRowSelect(investment.id, isSelected)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}