import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building, TrendingUp } from 'lucide-react';
import { LazyInvestmentTags } from '@/components/investments/LazyInvestmentTags';
import { formatCurrency, formatPercentage, formatCurrencyWithSign, formatPercentageWithSign } from '@/lib/formatters';
import type { InvestmentKPIs } from '@/types/kpi';

interface InvestmentKPIRowProps {
  investment: any; 
  kpis?: InvestmentKPIs;
  visibleColumns: Array<{ key: string; label: string; align?: 'left' | 'right'; type?: string }>;
  isSelected: boolean;
  onSelectionChange: (isSelected: boolean) => void;
}

// Optimized component using pre-calculated KPIs
export const InvestmentKPIRow = React.memo(({ 
  investment, 
  kpis,
  visibleColumns,
  isSelected,
  onSelectionChange
}: InvestmentKPIRowProps) => {
  const loading = !kpis;
  const navigate = useNavigate();

  // Memoized cell value calculation
  const getCellValue = useMemo(() => (columnKey: string) => {
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
      case 'tags':
        return <LazyInvestmentTags investmentId={investment.id} />;
      case 'fondPropre':
        return formatCurrency(kpis?.fondPropre || 0);
      case 'totalReturn':
        const gain1 = kpis?.xirrDetails?.gain1 || 0;
        const fondPropre = kpis?.fondPropre || 1; // Avoid division by zero
        const totalReturnYear = kpis?.totalReturnDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatPercentageWithSign(gain1 / fondPropre * 100)}
            </span>
            {totalReturnYear && <span className="text-xs text-muted-foreground">({totalReturnYear})</span>}
          </div>
        );
      case 'totalCfni':
        return formatCurrencyWithSign(kpis?.xirrDetails?.totalCfni || 0);
      case 'xirr':
        return formatPercentageWithSign(kpis?.xirr || 0);
      case 'totalVarValeur':
        return formatCurrencyWithSign(kpis?.xirrDetails?.deltaValeur || 0);
      case 'lastVarValeur':
        const lastVarValeurYear = kpis?.xirrDetails?.lastVarValeurYear;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatCurrencyWithSign(kpis?.xirrDetails?.variationValeurDerniereAnnee || 0)}
            </span>
            {lastVarValeurYear && <span className="text-xs text-muted-foreground">({lastVarValeurYear})</span>}
          </div>
        );
      case 'lastCfni':
        const lastCfniYear = kpis?.xirrDetails?.lastCfniYear;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatCurrencyWithSign(kpis?.xirrDetails?.cfniDerniereAnnee || 0)}
            </span>
            {lastCfniYear && <span className="text-xs text-muted-foreground">({lastCfniYear})</span>}
          </div>
        );
      case 'ltv':
        return formatPercentage(kpis?.fondPropreDetails?.ltv || 0);
      case 'crd':
        const crdYear = kpis?.fondPropreDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis?.fondPropreDetails?.crd || 0)}</span>
            {crdYear && <span className="text-xs text-muted-foreground">({crdYear})</span>}
          </div>
        );
      case 'noi':
        const noiYear = kpis?.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis?.rendementNetDetails?.noi || 0)}</span>
            {noiYear && <span className="text-xs text-muted-foreground">({noiYear})</span>}
          </div>
        );
      case 'loyer':
        const loyerYear = kpis?.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis?.rendementNetDetails?.loyer || 0)}</span>
            {loyerYear && <span className="text-xs text-muted-foreground">({loyerYear})</span>}
          </div>
        );
      case 'rendementNet':
        const rendementNetYear = kpis?.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatPercentageWithSign(kpis?.rendementNet || 0)}
            </span>
            {rendementNetYear && <span className="text-xs text-muted-foreground">({rendementNetYear})</span>}
          </div>
        );
      case 'gain1':
        const gain1Year = kpis?.xirrDetails?.gain1Year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatCurrencyWithSign(kpis?.xirrDetails?.gain1 || 0)}
            </span>
            {gain1Year && <span className="text-xs text-muted-foreground">({gain1Year})</span>}
          </div>
        );
      case 'coc':
        const cocYear = kpis?.totalReturnDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {formatPercentageWithSign(kpis?.totalReturnDetails?.cocNet || 0)}
            </span>
            {cocYear && <span className="text-xs text-muted-foreground">({cocYear})</span>}
          </div>
        );
      case 'cf':
        const cfValue = kpis?.xirrDetails?.latestCf || 0;
        const cfYear = kpis?.xirrDetails?.latestCfYear || 0;
        return (
          <div className="flex flex-col items-end">
            <span className={cfValue >= 0 ? "text-success" : "text-destructive"}>
              {formatCurrencyWithSign(cfValue)}
            </span>
            {cfYear && <span className="text-xs text-muted-foreground">({cfYear})</span>}
          </div>
        );
      default:
        return '-';
    }
  }, [loading, investment, kpis]);

  // Memoized cell class calculation
  const getCellClass = useMemo(() => (columnKey: string, columnType?: string, columnAlign?: string) => {
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
        case 'totalReturn':
          const gain1Value = kpis?.xirrDetails?.gain1 || 0;
          const fondPropreValue = kpis?.fondPropre || 1;
          value = (gain1Value / fondPropreValue * 100);
          break;
        case 'totalCfni':
          value = kpis?.xirrDetails?.totalCfni || 0;
          break;
        case 'xirr':
          value = kpis?.xirr || 0;
          break;
        case 'totalVarValeur':
          value = kpis?.xirrDetails?.deltaValeur || 0;
          break;
        case 'lastVarValeur':
          value = kpis?.xirrDetails?.variationValeurDerniereAnnee || 0;
          break;
        case 'lastCfni':
          value = kpis?.xirrDetails?.cfniDerniereAnnee || 0;
          break;
        case 'rendementNet':
          value = kpis?.rendementNet || 0;
          break;
        case 'gain1':
          value = kpis?.xirrDetails?.gain1 || 0;
          break;
        case 'coc':
          value = kpis?.totalReturnDetails?.cocNet || 0;
          break;
        case 'cf':
          value = kpis?.xirrDetails?.latestCf || 0;
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
  }, [loading, kpis]);

  return (
    <TableRow>
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onSelectionChange}
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
});