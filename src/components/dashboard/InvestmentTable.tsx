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


export function InvestmentTable() {
  const { investments } = useInvestments();
  
  // Show all assets since they're all invested now
  const investedAssets = investments;

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
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date d'investissement</TableHead>
            <TableHead className="text-right">Fond Propre</TableHead>
            <TableHead className="text-right">COC</TableHead>
            <TableHead className="text-right">Total CFNI</TableHead>
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