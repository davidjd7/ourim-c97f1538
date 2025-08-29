import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target } from 'lucide-react';

interface PerformanceData {
  currentValue: number;
  initialValue: number;
  totalReturn: number;
  returnPercentage: number;
  tri: number;
  cashflows: Array<{
    date: string;
    amount: number;
    type: 'in' | 'out';
    description: string;
  }>;
  benchmarks: {
    market: number;
    sector: number;
  }
}

interface PerformanceTabProps {
  investmentId: string;
}

const mockPerformanceData: PerformanceData = {
  currentValue: 2170000,
  initialValue: 2100000,
  totalReturn: 70000,
  returnPercentage: 3.33,
  tri: 6.8,
  cashflows: [
    {
      date: '2023-03-15',
      amount: -2100000,
      type: 'out',
      description: 'Acquisition initiale'
    },
    {
      date: '2023-06-15',
      amount: 15000,
      type: 'in',
      description: 'Loyers T2 2023'
    },
    {
      date: '2023-09-15',
      amount: 15500,
      type: 'in',
      description: 'Loyers T3 2023'
    },
    {
      date: '2023-12-15',
      amount: 16000,
      type: 'in',
      description: 'Loyers T4 2023'
    }
  ],
  benchmarks: {
    market: 4.2,
    sector: 5.1
  }
};

export function PerformanceTab({ investmentId }: PerformanceTabProps) {
  const [data] = useState<PerformanceData>(mockPerformanceData);

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
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur actuelle</p>
                <p className="text-2xl font-bold financial-value">
                  {formatCurrency(data.currentValue)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plus-value</p>
                <p className={`text-2xl font-bold financial-value ${
                  data.totalReturn >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {data.totalReturn >= 0 ? '+' : ''}
                  {formatCurrency(data.totalReturn)}
                </p>
              </div>
              {data.totalReturn >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rendement</p>
                <p className={`text-2xl font-bold financial-value ${
                  data.returnPercentage >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {data.returnPercentage >= 0 ? '+' : ''}
                  {formatPercentage(data.returnPercentage)}
                </p>
              </div>
              <Target className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">TRI</p>
                <p className="text-2xl font-bold financial-value text-primary">
                  {formatPercentage(data.tri)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmarks Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparaison avec les benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
              <span className="font-medium">Performance de l'investissement</span>
              <Badge variant="default" className="bg-primary">
                {formatPercentage(data.tri)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-muted-foreground">Marché immobilier Paris</span>
              <Badge variant="outline">
                {formatPercentage(data.benchmarks.market)}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-muted-foreground">Secteur 16ème arrondissement</span>
              <Badge variant="outline">
                {formatPercentage(data.benchmarks.sector)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashflows History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique des flux de trésorerie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.cashflows.map((cashflow, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    cashflow.type === 'in' ? 'bg-success' : 'bg-destructive'
                  }`} />
                  <div>
                    <p className="font-medium">{cashflow.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(cashflow.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium financial-value ${
                    cashflow.type === 'in' ? 'text-success' : 'text-destructive'
                  }`}>
                    {cashflow.type === 'in' ? '+' : ''}
                    {formatCurrency(cashflow.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de la performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Graphique de performance (à implémenter)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}