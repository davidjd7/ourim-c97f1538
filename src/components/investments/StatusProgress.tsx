import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

type InvestmentStatus = 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';

interface StatusProgressProps {
  currentStatus: InvestmentStatus;
  className?: string;
}

const statusConfig = {
  RECU: { label: 'Reçu', step: 1, className: 'status-recu' },
  DUE_DIL: { label: 'Due Dil', step: 2, className: 'status-due-dil' },
  INVESTI: { label: 'Investi', step: 3, className: 'status-investi' },
  VENDU: { label: 'Vendu', step: 4, className: 'status-vendu' },
  DROP: { label: 'Drop', step: 0, className: 'status-drop' }
};

const statusOrder: InvestmentStatus[] = ['RECU', 'DUE_DIL', 'INVESTI', 'VENDU'];

export function StatusProgress({ currentStatus, className }: StatusProgressProps) {
  const currentStep = statusConfig[currentStatus].step;
  const progress = currentStatus === 'DROP' ? 0 : (currentStep / 4) * 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">Progression du statut</h3>
        <Badge variant="outline" className={statusConfig[currentStatus].className}>
          {statusConfig[currentStatus].label}
        </Badge>
      </div>
      
      {currentStatus !== 'DROP' && (
        <>
          <Progress value={progress} className="mb-4" />
          <div className="flex justify-between text-xs text-muted-foreground">
            {statusOrder.map((status) => (
              <span
                key={status}
                className={`${
                  statusConfig[status].step <= currentStep
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {statusConfig[status].label}
              </span>
            ))}
          </div>
        </>
      )}
      
      {currentStatus === 'DROP' && (
        <div className="text-center py-2">
          <span className="text-destructive text-sm">Investissement abandonné</span>
        </div>
      )}
    </div>
  );
}