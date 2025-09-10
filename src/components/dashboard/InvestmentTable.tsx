import React from 'react';
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
import { ExternalLink, Building, TrendingUp } from 'lucide-react';
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
        <Badge variant="outline" className="status-investi">
          Investi
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
        kpis.coc >= 0 ? 'text-success' : 'text-destructive'
      }`}>
        {loading ? '...' : (
          <>
            {kpis.coc >= 0 ? '+' : ''}
            {formatPercentage(kpis.coc)}
          </>
        )}
      </TableCell>
      <TableCell className={`text-right financial-value ${
        kpis.totalEarning >= 0 ? 'text-success' : 'text-destructive'
      }`}>
        {loading ? '...' : (
          <>
            {kpis.totalEarning >= 0 ? '+' : ''}
            {formatCurrency(kpis.totalEarning)}
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

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function InvestmentTable() {
  const { investments } = useInvestments();
  
  // Filter to show only invested assets (not pipeline)
  const investedAssets = investments.filter(inv => inv.status === 'INVESTI');

  return (
    <div className="card-financial">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Investissements</h3>
            <p className="text-sm text-muted-foreground">
              Vue d'ensemble des actifs investis
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
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date d'investissement</TableHead>
            <TableHead className="text-right">Fond Propre</TableHead>
            <TableHead className="text-right">COC</TableHead>
            <TableHead className="text-right">Total Earning</TableHead>
            <TableHead className="text-right">XIRR</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investedAssets.map((investment) => (
            <InvestmentKPIRow key={investment.id} investment={investment} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}