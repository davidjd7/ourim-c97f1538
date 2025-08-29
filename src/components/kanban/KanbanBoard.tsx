import React, { useState } from 'react';
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

interface KanbanBoardProps {
  title: string;
  type: 'IMMO' | 'PE';
}

export function KanbanBoard({ title, type }: KanbanBoardProps) {
  const { investments, updateInvestment } = useInvestments();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
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

  const handleDragStart = (e: React.DragEvent, investmentId: string) => {
    setDraggedItem(investmentId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const investmentId = e.dataTransfer.getData('text/plain');
    
    if (investmentId && targetStatus) {
      updateInvestment(investmentId, {
        status: targetStatus as 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP'
      });
    }
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          Gestion du pipeline d'investissements {type === 'IMMO' ? 'immobiliers' : 'Private Equity'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2">
        {columns.map((column) => (
          <Card 
            key={column.id} 
            className={`${column.color} min-h-[500px] flex flex-col`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {column.investments.length}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 flex-1 flex flex-col">
              <div className="space-y-3">
                {column.investments.map((investment) => (
                  <InvestmentCard 
                    key={investment.id} 
                    investment={investment}
                    onDragStart={handleDragStart}
                  />
                ))}
                {column.investments.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Aucun investissement
                  </div>
                )}
              </div>
              
              {/* Zone de drop en bas */}
              <div 
                className={`mt-auto w-full h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${
                  draggedItem 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-muted-foreground/30 text-muted-foreground'
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <span className="text-xs font-medium">
                  {draggedItem ? `Déposer ici pour ${column.title}` : 'Zone de dépôt'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}