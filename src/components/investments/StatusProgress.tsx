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

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">Progression du statut</h3>
        <Badge variant="outline" className={statusConfig[currentStatus].className}>
          {statusConfig[currentStatus].label}
        </Badge>
      </div>
      
      {currentStatus !== 'DROP' && (
        <div className="relative">
          {/* Barre de progression de fond */}
          <div className="w-full h-2 bg-muted rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          
          {/* Points d'étapes */}
          <div className="flex justify-between relative -mt-1">
            {statusOrder.map((status, index) => (
              <div key={status} className="flex flex-col items-center">
                <div 
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                    statusConfig[status].step <= currentStep
                      ? 'bg-primary border-primary shadow-md' 
                      : 'bg-background border-muted-foreground/30'
                  }`}
                />
                <span 
                  className={`text-xs mt-2 transition-colors duration-300 ${
                    statusConfig[status].step <= currentStep
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {statusConfig[status].label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {currentStatus === 'DROP' && (
        <div className="text-center py-4">
          <div className="w-full h-2 bg-destructive/20 rounded-full mb-4">
            <div className="h-2 bg-destructive rounded-full w-full" />
          </div>
          <span className="text-destructive text-sm font-medium">Investissement abandonné</span>
        </div>
      )}
    </div>
  );
}