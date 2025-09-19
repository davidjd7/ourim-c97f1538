import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink, Building, TrendingUp } from 'lucide-react';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import { InvestmentTags } from '@/components/investments/InvestmentTags';

// Extracted component for displaying KPI values for each investment
export function InvestmentKPIRow({ 
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
        totalReturn: Number(kpis.totalReturn ?? 0),
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
        gain1: Number(kpis.xirrDetails?.gain1 ?? 0),
        totalReturnCalculated: Number(kpis.xirrDetails?.gain1 ?? 0) / Number(kpis.fondPropre || 1) * 100,
        // Year information for Last columns
        lastVarValeurYear: kpis.xirrDetails?.lastVarValeurYear ?? 0,
        lastCfniYear: kpis.xirrDetails?.lastCfniYear ?? 0,
        gain1Year: kpis.xirrDetails?.gain1Year ?? 0,
        // Year information for NOI, Rendement Net, Total Return
        noiYear: kpis.rendementNetDetails?.year ?? 0,
        rendementNetYear: kpis.rendementNetDetails?.year ?? 0,
        totalReturnYear: kpis.totalReturnDetails?.year ?? 0,
        // COC net value
        cocNet: Number(kpis.totalReturnDetails?.cocNet ?? 0),
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
      case 'tags':
        return <InvestmentTags investmentId={investment.id} />;
      case 'fondPropre':
        return formatCurrency(kpis.fondPropre);
      case 'totalReturn':
        const gain1 = kpis.xirrDetails?.gain1 || 0;
        const fondPropre = kpis.fondPropre || 1; // Avoid division by zero
        const totalReturnYear = kpis.totalReturnDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {(gain1 / fondPropre * 100) >= 0 ? '+' : ''}
              {((gain1 / fondPropre * 100).toFixed(1))}%
            </span>
            {totalReturnYear && <span className="text-xs text-muted-foreground">({totalReturnYear})</span>}
          </div>
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
        const lastVarValeurYear = kpis.xirrDetails?.lastVarValeurYear;
        return (
          <div className="flex flex-col items-end">
            <span>
              {kpis.xirrDetails?.variationValeurDerniereAnnee >= 0 ? '+' : ''}
              {formatCurrency(kpis.xirrDetails?.variationValeurDerniereAnnee || 0)}
            </span>
            {lastVarValeurYear && <span className="text-xs text-muted-foreground">({lastVarValeurYear})</span>}
          </div>
        );
      case 'lastCfni':
        const lastCfniYear = kpis.xirrDetails?.lastCfniYear;
        return (
          <div className="flex flex-col items-end">
            <span>
              {kpis.xirrDetails?.cfniDerniereAnnee >= 0 ? '+' : ''}
              {formatCurrency(kpis.xirrDetails?.cfniDerniereAnnee || 0)}
            </span>
            {lastCfniYear && <span className="text-xs text-muted-foreground">({lastCfniYear})</span>}
          </div>
        );
      case 'ltv':
        return formatPercentage(kpis.fondPropreDetails?.ltv || 0);
      case 'crd':
        const crdYear = kpis.fondPropreDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis.fondPropreDetails?.crd || 0)}</span>
            {crdYear && <span className="text-xs text-muted-foreground">({crdYear})</span>}
          </div>
        );
      case 'noi':
        const noiYear = kpis.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis.rendementNetDetails?.noi || 0)}</span>
            {noiYear && <span className="text-xs text-muted-foreground">({noiYear})</span>}
          </div>
        );
      case 'loyer':
        const loyerYear = kpis.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(kpis.rendementNetDetails?.loyer || 0)}</span>
            {loyerYear && <span className="text-xs text-muted-foreground">({loyerYear})</span>}
          </div>
        );
      case 'rendementNet':
        const rendementNetYear = kpis.rendementNetDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {kpis.rendementNet >= 0 ? '+' : ''}
              {formatPercentage(kpis.rendementNet)}
            </span>
            {rendementNetYear && <span className="text-xs text-muted-foreground">({rendementNetYear})</span>}
          </div>
        );
      case 'gain1':
        const gain1Year = kpis.xirrDetails?.gain1Year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {kpis.xirrDetails?.gain1 >= 0 ? '+' : ''}
              {formatCurrency(kpis.xirrDetails?.gain1 || 0)}
            </span>
            {gain1Year && <span className="text-xs text-muted-foreground">({gain1Year})</span>}
          </div>
        );
      case 'coc':
        const cocYear = kpis.totalReturnDetails?.year;
        return (
          <div className="flex flex-col items-end">
            <span>
              {kpis.totalReturnDetails?.cocNet >= 0 ? '+' : ''}
              {formatPercentage(kpis.totalReturnDetails?.cocNet || 0)}
            </span>
            {cocYear && <span className="text-xs text-muted-foreground">({cocYear})</span>}
          </div>
        );
      case 'cf':
        const cfValue = kpis.xirrDetails?.latestCf || 0;
        const cfYear = kpis.xirrDetails?.latestCfYear || 0;
        return (
          <div className="flex flex-col items-end">
            <span className={cfValue >= 0 ? "text-success" : "text-destructive"}>
              {cfValue >= 0 ? '+' : ''}
              {formatCurrency(cfValue)}
            </span>
            {cfYear && <span className="text-xs text-muted-foreground">({cfYear})</span>}
          </div>
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
        case 'totalReturn':
          const gain1Value = kpis.xirrDetails?.gain1 || 0;
          const fondPropreValue = kpis.fondPropre || 1;
          value = (gain1Value / fondPropreValue * 100);
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
        case 'gain1':
          value = kpis.xirrDetails?.gain1 || 0;
          break;
        case 'coc':
          value = kpis.totalReturnDetails?.cocNet || 0;
          break;
        case 'cf':
          value = kpis.xirrDetails?.latestCf || 0;
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