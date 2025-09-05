import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvestmentCardProps {
  investment: {
    id: string;
    name: string;
    type: 'IMMO' | 'PE';
    status: 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP';
    surface?: number;
    bailLoyerHT?: number;
    lastValue?: number;
    price?: number;
    investmentAmount?: number;
    notaryFees?: number;
  };
  onDragStart?: (e: React.DragEvent, investmentId: string) => void;
}

export function InvestmentCard({ investment, onDragStart }: InvestmentCardProps) {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

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
    // Pour calculer le rendement All In, on a besoin du loyer annuel et du montant investi total
    const loyerAnnuel = investment.bailLoyerHT ? investment.bailLoyerHT * 12 : 0;
    
    // Montant total investi = prix d'achat + frais de notaire (si disponibles)
    // Sinon on utilise investmentAmount + notaryFees pour les investissements confirmés
    let montantTotal = 0;
    
    if (investment.investmentAmount && investment.notaryFees) {
      // Pour les investissements confirmés (statut INVESTI)
      montantTotal = investment.investmentAmount + investment.notaryFees;
    } else if (investment.price) {
      // Pour les opportunités en pipeline, on estime avec 8% de frais
      montantTotal = investment.price * 1.08;
    }
    
    if (loyerAnnuel > 0 && montantTotal > 0) {
      return (loyerAnnuel / montantTotal) * 100;
    }
    
    return null;
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', investment.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(e, investment.id);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not in the middle of a drag
    if (!isDragging) {
      navigate(`/investissement/${investment.id}`);
    }
  };

  return (
    <Card 
      className={`card-financial transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95 rotate-3' : ''
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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
        
        {((investment.lastValue && investment.lastValue > 0) || (investment.price && investment.price > 0)) && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Valeur: </span>
            <span className="financial-value">
              {formatCurrency(investment.lastValue || investment.price || 0)}
            </span>
          </div>
        )}
        
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