import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvestmentCardProps {
  investment: {
    id: string;
    name: string;
    type: 'IMMO' | 'PE';
    investmentAmount?: number;
    lastCashflow?: number;
    lastVariation?: {
      value: number;
      percentage: number;
    };
  };
}

export function InvestmentCard({ investment }: InvestmentCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleClick = (e: React.MouseEvent) => {
    navigate(`/investissement/${investment.id}`);
  };

  return (
    <Card 
      className="card-financial transition-all duration-200 cursor-pointer hover:shadow-md"
      onClick={handleClick}
    >
      <CardHeader className="pb-2 px-3 pt-3">
        <div className="flex items-center gap-2">
          {investment.type === 'IMMO' ? (
            <Building className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          ) : (
            <TrendingUp className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          <CardTitle className="text-sm font-bold leading-tight line-clamp-2">
            {investment.name}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pb-3 space-y-1">
        {investment.investmentAmount && investment.investmentAmount > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Montant Investi: </span>
            <span className="financial-value">{formatCurrency(investment.investmentAmount)}</span>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Cashflow: </span>
          <span className="financial-value">
            {formatCurrency(investment.lastCashflow || 0)}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Variation: </span>
          <span className={`font-semibold ${(investment.lastVariation?.percentage || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatPercentage(investment.lastVariation?.percentage || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}