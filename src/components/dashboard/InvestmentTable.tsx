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

interface Investment {
  id: string;
  name: string;
  type: 'IMMO' | 'PE';
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  dateInvestment?: string;
  lastValue: number;
  lastTRI: number;
  lastCashflow: number;
  lastVariation: {
    value: number;
    percentage: number;
  };
}

const mockInvestments: Investment[] = [
  {
    id: '1',
    name: 'Faisanderie Paris',
    type: 'IMMO',
    status: 'INVESTI',
    dateInvestment: '2023-03-15',
    lastValue: 2170000,
    lastTRI: 6.8,
    lastCashflow: 98084,
    lastVariation: { value: 50000, percentage: 2.4 }
  },
  {
    id: '2',
    name: 'Robespierre Bagnolet',
    type: 'IMMO',
    status: 'INVESTI',
    dateInvestment: '2023-01-20',
    lastValue: 1090000,
    lastTRI: 7.2,
    lastCashflow: 70443,
    lastVariation: { value: -15000, percentage: -1.4 }
  },
  {
    id: '3',
    name: 'Général Leclerc Rosny',
    type: 'IMMO',
    status: 'INVESTI',
    dateInvestment: '2022-11-10',
    lastValue: 1690000,
    lastTRI: 8.1,
    lastCashflow: 112692,
    lastVariation: { value: 80000, percentage: 5.0 }
  }
];

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Drop', className: 'status-drop' }
};

export function InvestmentTable() {
  const navigate = useNavigate();
  
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
            <TableHead className="text-right">Dernière valeur</TableHead>
            <TableHead className="text-right">TRI</TableHead>
            <TableHead className="text-right">Dernier cashflow</TableHead>
            <TableHead className="text-right">Variation</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockInvestments.map((investment) => (
            <TableRow key={investment.id}>
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
                <Badge variant="outline" className={statusConfig[investment.status].className}>
                  {statusConfig[investment.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                {investment.dateInvestment ? 
                  new Date(investment.dateInvestment).toLocaleDateString('fr-FR') : 
                  '-'
                }
              </TableCell>
              <TableCell className="text-right financial-value">
                {formatCurrency(investment.lastValue)}
              </TableCell>
              <TableCell className="text-right financial-value">
                {formatPercentage(investment.lastTRI)}
              </TableCell>
              <TableCell className="text-right financial-value">
                {formatCurrency(investment.lastCashflow)}
              </TableCell>
              <TableCell className="text-right">
                <div className={`financial-value ${
                  investment.lastVariation.percentage >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  <div>{formatCurrency(investment.lastVariation.value)}</div>
                  <div className="text-xs">
                    ({investment.lastVariation.percentage >= 0 ? '+' : ''}
                    {formatPercentage(investment.lastVariation.percentage)})
                  </div>
                </div>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}