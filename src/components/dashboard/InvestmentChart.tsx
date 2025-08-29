import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Mock chart component - in real app would use Chart.js or similar
export function InvestmentChart() {
  return (
    <Card className="card-financial">
      <CardHeader>
        <CardTitle>Évolution des Valeurs</CardTitle>
        <CardDescription>
          Valeur agrégée du portefeuille dans le temps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Graphique des valeurs</p>
            <p className="text-xs mt-1">Chart.js à intégrer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CashflowChart() {
  return (
    <Card className="card-financial">
      <CardHeader>
        <CardTitle>Cashflows par Année</CardTitle>
        <CardDescription>
          Historique des flux de trésorerie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Histogramme des cashflows</p>
            <p className="text-xs mt-1">Chart.js à intégrer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}