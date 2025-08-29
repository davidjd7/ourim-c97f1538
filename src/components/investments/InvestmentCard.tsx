import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Building, TrendingUp, MapPin, Euro, Percent, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvestmentCardProps {
  investment: {
    id: string;
    name: string;
    type: 'IMMO' | 'PE';
    status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
    address?: string;
    surface?: number;
    rentAmount?: number;
    priceNV?: number;
    tri?: number;
    lastValue?: number;
  };
  onStatusChange?: (id: string, newStatus: string) => void;
  isDragging?: boolean;
}

const statusConfig = {
  RECU: { label: 'Reçu', className: 'status-recu' },
  DUE_DIL: { label: 'Due Diligence', className: 'status-due-dil' },
  INVESTI: { label: 'Investi', className: 'status-investi' },
  VENDU: { label: 'Vendu', className: 'status-vendu' },
  DROP: { label: 'Abandonné', className: 'status-drop' }
};

export function InvestmentCard({ investment, onStatusChange, isDragging }: InvestmentCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatSurface = (surface: number) => {
    return `${surface.toLocaleString('fr-FR')} m²`;
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md cursor-move",
      isDragging && "opacity-50 rotate-2 scale-105"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {investment.type === 'IMMO' ? (
              <Building className="h-4 w-4 text-primary" />
            ) : (
              <TrendingUp className="h-4 w-4 text-primary" />
            )}
            <h3 className="font-semibold text-sm leading-tight">{investment.name}</h3>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-xs", statusConfig[investment.status].className)}
          >
            {statusConfig[investment.status].label}
          </Badge>
        </div>
        
        {investment.address && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {investment.address}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {investment.type === 'IMMO' && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {investment.surface && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Surface:</span>
                <span className="font-medium">{formatSurface(investment.surface)}</span>
              </div>
            )}
            {investment.rentAmount && (
              <div className="flex items-center gap-1">
                <Euro className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium financial-value">
                  {formatCurrency(investment.rentAmount)}
                </span>
              </div>
            )}
          </div>
        )}

        {investment.priceNV && (
          <div className="text-sm">
            <span className="text-muted-foreground">Prix NV: </span>
            <span className="font-semibold financial-value">
              {formatCurrency(investment.priceNV)}
            </span>
          </div>
        )}

        {investment.tri && (
          <div className="flex items-center gap-1 text-sm">
            <Percent className="h-3 w-3 text-success" />
            <span className="text-muted-foreground">TRI: </span>
            <span className="font-semibold text-success">
              {investment.tri.toFixed(1)}%
            </span>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}