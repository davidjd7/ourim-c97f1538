import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvestmentCardProps {
  investment: {
    id: string;
    name: string;
    type: 'IMMO' | 'PE';
    surface?: number;
    bailLoyerHT?: number;
    bailCNR?: number;
    lastValue?: number;
    price?: number;
    investmentAmount?: number;
    notaryFees?: number;
    netVendeur?: number;
    agent?: number;
    honoNotaire?: number;
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

  const calculateRendementAllIn = () => {
    // Utiliser la même formule que dans la section Présentation Vente
    if (investment.bailLoyerHT && investment.netVendeur && 
        investment.netVendeur > 0 &&
        (investment.agent !== undefined) && 
        (investment.honoNotaire !== undefined)) {
      
      const loyerNet = investment.bailLoyerHT - (investment.bailCNR || 0);
      const prixAllIn = investment.netVendeur * (1 + investment.agent + investment.honoNotaire);
      
      if (prixAllIn > 0) {
        return (loyerNet / prixAllIn) * 100;
      }
    }
    
    return null;
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
        {investment.bailLoyerHT && investment.bailLoyerHT > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Loyer HT: </span>
            <span className="financial-value">{formatCurrency(investment.bailLoyerHT)}</span>
          </div>
        )}
        
        {(() => {
          // Calculer le prix all-in si les données sont disponibles
          let displayValue = investment.lastValue;
          
          if (!displayValue && investment.netVendeur && 
              investment.netVendeur > 0 &&
              (investment.agent !== undefined) && 
              (investment.honoNotaire !== undefined)) {
            displayValue = investment.netVendeur * (1 + investment.agent + investment.honoNotaire);
          }
          
          if (!displayValue && investment.price && investment.price > 0) {
            displayValue = investment.price;
          }
          
          return displayValue && displayValue > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Prix All In: </span>
              <span className="financial-value">
                {formatCurrency(displayValue)}
              </span>
            </div>
          );
        })()}
        
        {(() => {
          const rendement = calculateRendementAllIn();
          return rendement !== null && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Rdmt All in: </span>
              <span className={`font-semibold ${rendement >= 5 ? 'text-success' : rendement >= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                {formatPercentage(rendement)}
              </span>
            </div>
          );
        })()}
        
        {investment.surface && investment.surface > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Surface: </span>
            <span>{investment.surface} m²</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}