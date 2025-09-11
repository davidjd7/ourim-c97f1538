import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
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

// Component for displaying KPI values for each investment
function InvestmentKPIRow({ investment }: { investment: any }) {
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

  const navigate = useNavigate();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {investment.type === 'IMMO' ? (
            <Building className="h-4 w-4 text-muted-foreground" />
          ) : (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{investment.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {investment.type === 'IMMO' ? 'Immobilier' : 'Private Equity'}
        </Badge>
      </TableCell>
      <TableCell>
        {investment.dateInvestment ? 
          new Date(investment.dateInvestment).toLocaleDateString('fr-FR') : 
          '-'
        }
      </TableCell>
      <TableCell className="text-right financial-value">
        {loading ? '...' : formatCurrency(kpis.fondPropre)}
      </TableCell>
      <TableCell className={`text-right financial-value ${
        loading || !kpis.cocDetails ? 'text-muted-foreground' : (kpis.coc >= 0 ? 'text-success' : 'text-destructive')
      }`}>
        {loading ? '...' : (
          <>
            {kpis.coc >= 0 ? '+' : ''}
            {formatPercentage(kpis.coc)}
          </>
        )}
      </TableCell>
      <TableCell className={`text-right financial-value ${
        loading || !kpis.xirrDetails ? 'text-muted-foreground' : (kpis.xirrDetails.totalCfni >= 0 ? 'text-success' : 'text-destructive')
      }`}>
        {loading ? '...' : (
          <>
            {kpis.xirrDetails.totalCfni >= 0 ? '+' : ''}
            {formatCurrency(kpis.xirrDetails.totalCfni)}
          </>
        )}
      </TableCell>
      <TableCell className={`text-right financial-value ${
        kpis.xirr >= 0 ? 'text-success' : 'text-destructive'
      }`}>
        {loading ? '...' : (
          <>
            {kpis.xirr >= 0 ? '+' : ''}
            {formatPercentage(kpis.xirr)}
          </>
        )}
      </TableCell>
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


type SortKey = 'name' | 'type' | 'dateInvestment' | 'fondPropre' | 'coc' | 'totalCfni' | 'xirr';
type SortDirection = 'asc' | 'desc' | null;

export function InvestmentTable() {
  const { investments } = useInvestments();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Show all assets since they're all invested now
  const investedAssets = investments;

  const handleSort = (key: SortKey) => {
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
    if (!sortKey || !sortDirection) return investedAssets;

    return [...investedAssets].sort((a, b) => {
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
        // Pour les KPIs, nous utiliserons les valeurs par défaut car nous ne pouvons pas accéder aux hooks ici
        case 'fondPropre':
        case 'coc':
        case 'totalCfni':
        case 'xirr':
          // Ces valeurs seront triées côté rendu pour éviter les problèmes avec les hooks
          return 0;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [investedAssets, sortKey, sortDirection]);

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    if (sortDirection === 'desc') return <ChevronDown className="h-4 w-4" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4" />;
    return null;
  };

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
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">
                Nom
                {getSortIcon('name')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center gap-1">
                Type
                {getSortIcon('type')}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('dateInvestment')}
            >
              <div className="flex items-center gap-1">
                Date d'investissement
                {getSortIcon('dateInvestment')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('fondPropre')}
            >
              <div className="flex items-center justify-end gap-1">
                Fond Propre
                {getSortIcon('fondPropre')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('coc')}
            >
              <div className="flex items-center justify-end gap-1">
                COC
                {getSortIcon('coc')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('totalCfni')}
            >
              <div className="flex items-center justify-end gap-1">
                Total CFNI
                {getSortIcon('totalCfni')}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer hover:bg-muted/50 select-none"
              onClick={() => handleSort('xirr')}
            >
              <div className="flex items-center justify-end gap-1">
                XIRR
                {getSortIcon('xirr')}
              </div>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvestments.map((investment) => (
            <InvestmentKPIRow key={investment.id} investment={investment} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}