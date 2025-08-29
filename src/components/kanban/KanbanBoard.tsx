import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { Badge } from '@/components/ui/badge';

interface KanbanColumn {
  id: string;
  title: string;
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  investments: any[];
  color: string;
}

const mockInvestments = [
  {
    id: '1',
    name: 'Faisanderie Paris',
    type: 'IMMO' as const,
    status: 'RECU' as const,
    address: '12 rue de la Faisanderie, Paris 16e',
    surface: 156,
    rentAmount: 120000,
    priceNV: 2500000,
  },
  {
    id: '2',
    name: 'Robespierre Bagnolet',
    type: 'IMMO' as const,
    status: 'DUE_DIL' as const,
    address: 'Avenue Robespierre, Bagnolet',
    surface: 231,
    rentAmount: 80000,
    priceNV: 1090000,
  },
  {
    id: '3',
    name: 'Général Leclerc Rosny',
    type: 'IMMO' as const,
    status: 'INVESTI' as const,
    address: 'Avenue du Général Leclerc, Rosny',
    surface: 626,
    rentAmount: 124000,
    priceNV: 1690000,
    tri: 8.1,
    lastValue: 1690000,
  },
  {
    id: '4',
    name: 'Commercial Montreuil',
    type: 'IMMO' as const,
    status: 'VENDU' as const,
    address: 'Centre commercial, Montreuil',
    surface: 450,
    rentAmount: 95000,
    priceNV: 1200000,
    tri: 12.5,
  },
  {
    id: '5',
    name: 'Bureaux La Défense',
    type: 'IMMO' as const,
    status: 'DROP' as const,
    address: 'Tour CB21, La Défense',
    surface: 2100,
    rentAmount: 280000,
    priceNV: 4500000,
  },
];

const columns: KanbanColumn[] = [
  {
    id: 'recu',
    title: 'Reçu',
    status: 'RECU',
    investments: mockInvestments.filter(inv => inv.status === 'RECU'),
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'due-dil',
    title: 'Due Diligence',
    status: 'DUE_DIL',
    investments: mockInvestments.filter(inv => inv.status === 'DUE_DIL'),
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'investi',
    title: 'Investi',
    status: 'INVESTI',
    investments: mockInvestments.filter(inv => inv.status === 'INVESTI'),
    color: 'bg-success-lighter border-success-light'
  },
  {
    id: 'vendu',
    title: 'Vendu',
    status: 'VENDU',
    investments: mockInvestments.filter(inv => inv.status === 'VENDU'),
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'drop',
    title: 'Abandonné',
    status: 'DROP',
    investments: mockInvestments.filter(inv => inv.status === 'DROP'),
    color: 'bg-red-50 border-red-200'
  }
];

interface KanbanBoardProps {
  title: string;
  type: 'IMMO' | 'PE';
}

export function KanbanBoard({ title, type }: KanbanBoardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          Gestion du pipeline d'investissements {type === 'IMMO' ? 'immobiliers' : 'Private Equity'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-[600px]">
        {columns.map((column) => (
          <Card key={column.id} className={`${column.color} h-fit`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {column.investments.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {column.investments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun investissement
                </div>
              ) : (
                column.investments.map((investment) => (
                  <InvestmentCard
                    key={investment.id}
                    investment={investment}
                  />
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}