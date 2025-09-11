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
import { ExternalLink, Building, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { useInvestments } from '@/contexts/InvestmentContext';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import { ColumnSelector } from './ColumnSelector';

// Component for displaying KPI values for each investment
function InvestmentKPIRow({ 
  investment, 
  onKpisLoaded,
  visibleColumns,
  isSelected,
  onSelect
}: { 
  investment: any; 
  onKpisLoaded?: (id: string, data: any) => void;
  visibleColumns: Array<{ key: string; label: string; align?: 'left' | 'right'; type?: string }>;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  const { kpis, loading } = usePerformanceKPIs(investment.id);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  useEffect(() => {
    if (!loading && kpis) {
      const data = {
        fondPropre: Number(kpis.fondPropre ?? 0),
        coc: Number(kpis.coc ?? 0),
        totalCfni: Number(kpis.xirrDetails?.totalCfni ?? 0),
        xirr: Number(kpis.xirr ?? 0),
        // Nouvelles valeurs
        totalVarValeur: Number(kpis.xirrDetails?.deltaValeur ?? 0),
        lastVarValeur: Number(kpis.xirrDetails?.variationValeurDerniereAnnee ?? 0),
        lastCfni: Number(kpis.xirrDetails?.cfniDerniereAnnee ?? 0),
        ltv: Number(kpis.fondPropreDetails?.ltv ?? 0),
        crd: Number(kpis.fondPropreDetails?.crd ?? 0),
        noi: Number(kpis.rendementNetDetails?.noi ?? 0),
        loyer: Number(kpis.rendementNetDetails?.loyer ?? 0),
        rendementNet: Number(kpis.rendementNet ?? 0),
      };
      onKpisLoaded?.(investment.id, data);
    }
  }, [loading, kpis, investment.id, onKpisLoaded]);
  
  const navigate = useNavigate();

  const getCellValue = (columnKey: string) => {
    if (loading) return '...';

    switch (columnKey) {
      case 'name':
        return (
          <div className="flex items-center gap-2">
            {investment.type === 'IMMO' ? (
              <Building className="h-4 w-4 text-muted-foreground" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{investment.name}</span>
          </div>
        );
      case 'type':
        return (
          <Badge variant="outline">
            {investment.type === 'IMMO' ? 'Immobilier' : 'Private Equity'}
          </Badge>
        );
      case 'dateInvestment':
        return investment.dateInvestment ? 
          new Date(investment.dateInvestment).toLocaleDateString('fr-FR') : 
          '-';
      case 'fondPropre':
        return formatCurrency(kpis.fondPropre);
      case 'coc':
        return (
          <>
            {kpis.coc >= 0 ? '+' : ''}
            {formatPercentage(kpis.coc)}
          </>
        );
      case 'totalCfni':
        return (
          <>
            {kpis.xirrDetails?.totalCfni >= 0 ? '+' : ''}
            {formatCurrency(kpis.xirrDetails?.totalCfni || 0)}
          </>
        );
      case 'xirr':
        return (
          <>
            {kpis.xirr >= 0 ? '+' : ''}
            {formatPercentage(kpis.xirr)}
          </>
        );
      case 'totalVarValeur':
        return (
          <>
            {kpis.xirrDetails?.deltaValeur >= 0 ? '+' : ''}
            {formatCurrency(kpis.xirrDetails?.deltaValeur || 0)}
          </>
        );
      case 'lastVarValeur':
        return (
          <>
            {kpis.xirrDetails?.variationValeurDerniereAnnee >= 0 ? '+' : ''}
            {formatCurrency(kpis.xirrDetails?.variationValeurDerniereAnnee || 0)}
          </>
        );
      case 'lastCfni':
        return (
          <>
            {kpis.xirrDetails?.cfniDerniereAnnee >= 0 ? '+' : ''}
            {formatCurrency(kpis.xirrDetails?.cfniDerniereAnnee || 0)}
          </>
        );
      case 'ltv':
        return formatPercentage(kpis.fondPropreDetails?.ltv || 0);
      case 'crd':
        return formatCurrency(kpis.fondPropreDetails?.crd || 0);
      case 'noi':
        return formatCurrency(kpis.rendementNetDetails?.noi || 0);
      case 'loyer':
        return formatCurrency(kpis.rendementNetDetails?.loyer || 0);
      case 'rendementNet':
        return (
          <>
            {kpis.rendementNet >= 0 ? '+' : ''}
            {formatPercentage(kpis.rendementNet)}
          </>
        );
      default:
        return '-';
    }
  };

  const getCellClass = (columnKey: string, columnType?: string, columnAlign?: string) => {
    let baseClass = '';
    
    if (columnAlign === 'right') {
      baseClass += 'text-right ';
    }
    
    if (columnType === 'currency' || columnType === 'percentage') {
      baseClass += 'financial-value ';
    }

    // Add color classes for financial values
    if (!loading && (columnType === 'currency' || columnType === 'percentage')) {
      let value = 0;
      switch (columnKey) {
        case 'coc':
          value = kpis.coc || 0;
          break;
        case 'totalCfni':
          value = kpis.xirrDetails?.totalCfni || 0;
          break;
        case 'xirr':
          value = kpis.xirr || 0;
          break;
        case 'totalVarValeur':
          value = kpis.xirrDetails?.deltaValeur || 0;
          break;
        case 'lastVarValeur':
          value = kpis.xirrDetails?.variationValeurDerniereAnnee || 0;
          break;
        case 'lastCfni':
          value = kpis.xirrDetails?.cfniDerniereAnnee || 0;
          break;
        case 'rendementNet':
          value = kpis.rendementNet || 0;
          break;
        default:
          value = 0;
      }
      
      if (value > 0) {
        baseClass += 'text-success';
      } else if (value < 0) {
        baseClass += 'text-destructive';
      }
    }

    return baseClass;
  };

  return (
    <TableRow>
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Sélectionner ${investment.name}`}
        />
      </TableCell>
      {visibleColumns.map((column) => (
        <TableCell 
          key={column.key} 
          className={getCellClass(column.key, column.type, column.align)}
        >
          {getCellValue(column.key)}
        </TableCell>
      ))}
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/investissement/${investment.id}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

type SortKey = string;
type SortDirection = 'asc' | 'desc' | null;

export function InvestmentTable() {
  const { investments } = useInvestments();
  const { visibleColumns, isInitialized } = useColumnVisibility();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // KPI map for sorting by computed values - now holds all KPI data
  const [kpiMap, setKpiMap] = useState<Record<string, any>>({});

  const handleKpisLoaded = (id: string, data: any) => {
    setKpiMap((prev) => {
      const prevData = prev[id];
      // Simple comparison - if data is different, update
      if (JSON.stringify(prevData) === JSON.stringify(data)) {
        return prev;
      }
      return { ...prev, [id]: data };
    });
  };

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
    if (!sortKey || !sortDirection) return investments;

    return [...investments].sort((a, b) => {
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
  }, [investments, sortKey, sortDirection, kpiMap]);

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
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(sortedInvestments.map(inv => inv.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
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
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Investissements</h3>
            <p className="text-sm text-muted-foreground">
              Suivi et gestion des actifs investis
            </p>
          </div>
          <Button variant="outline" size="sm">
            Voir tout
          </Button>
        </div>
      </div>

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
          {sortedInvestments.map((investment) => (
            <InvestmentKPIRow
              key={investment.id}
              investment={investment} 
              onKpisLoaded={handleKpisLoaded}
              visibleColumns={visibleColumns}
              isSelected={selectedRows.has(investment.id)}
              onSelect={(checked) => handleRowSelect(investment.id, checked)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}