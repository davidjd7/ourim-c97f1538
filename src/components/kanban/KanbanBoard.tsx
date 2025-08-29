import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvestmentCard } from '@/components/investments/InvestmentCard';
import { useInvestments } from '@/contexts/InvestmentContext';

interface KanbanColumn {
  id: string;
  title: string;
  status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
  investments: any[];
  color: string;
}

// Remove old mock data and columns since we now use the global context

interface KanbanBoardProps {
  title: string;
  type: 'IMMO' | 'PE';
}

export function KanbanBoard({ title, type }: KanbanBoardProps) {
  const { investments } = useInvestments();
  
  // Filter investments by type and pipeline statuses
  const pipelineStatuses = ['RECU', 'DUE_DIL'];
  const pipelineInvestments = investments.filter(inv => 
    inv.type === type && pipelineStatuses.includes(inv.status)
  );

  // Update columns to use real data
  const columns = [
    {
      id: 'recu',
      title: 'Reçu',
      status: 'RECU' as const,
      investments: pipelineInvestments.filter(inv => inv.status === 'RECU'),
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'due-dil',
      title: 'Due Diligence',
      status: 'DUE_DIL' as const,
      investments: pipelineInvestments.filter(inv => inv.status === 'DUE_DIL'),
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'investi',
      title: 'Investi',
      status: 'INVESTI' as const,
      investments: investments.filter(inv => inv.type === type && inv.status === 'INVESTI'),
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'vendu',
      title: 'Vendu',
      status: 'VENDU' as const,
      investments: investments.filter(inv => inv.type === type && inv.status === 'VENDU'),
      color: 'bg-purple-50 border-purple-200'
    },
    {
      id: 'drop',
      title: 'Drop',
      status: 'DROP' as const,
      investments: investments.filter(inv => inv.type === type && inv.status === 'DROP'),
      color: 'bg-red-50 border-red-200'
    }
  ];

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