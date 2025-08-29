import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, TrendingUp, MapPin, DollarSign, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useInvestments } from '@/contexts/InvestmentContext';

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
  currentStatus?: string;
}

export function InvestmentCard({ investment, currentStatus }: InvestmentCardProps) {
  const navigate = useNavigate();
  const { updateInvestment } = useInvestments();
  const [showMoveOptions, setShowMoveOptions] = useState(false);

  const statusOptions = [
    { value: 'RECU', label: 'Reçu' },
    { value: 'DUE_DIL', label: 'Due Diligence' },
    { value: 'INVESTI', label: 'Investi' },
    { value: 'VENDU', label: 'Vendu' },
    { value: 'DROP', label: 'Drop' }
  ].filter(option => option.value !== currentStatus);

  const handleStatusChange = (newStatus: string) => {
    updateInvestment(investment.id, { 
      status: newStatus as 'RECU' | 'DUE_DIL' | 'INVESTI' | 'VENDU' | 'DROP'
    });
    setShowMoveOptions(false);
  };

  return (
    <Card className="card-financial hover:shadow-md transition-shadow group relative animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1" 
            onClick={() => navigate(`/investissement/${investment.id}`)}
          >
            {investment.type === 'IMMO' ? (
              <Building className="h-4 w-4 text-muted-foreground" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm font-medium">{investment.name}</CardTitle>
          </div>
          
          <div className="relative">
            {!showMoveOptions ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoveOptions(true);
                }}
              >
                <ArrowRightLeft className="h-3 w-3" />
              </Button>
            ) : (
              <div className="flex items-center gap-1 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <Select onValueChange={handleStatusChange}>
                  <SelectTrigger className="h-6 w-24 text-xs">
                    <SelectValue placeholder="Vers..." />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMoveOptions(false);
                  }}
                >
                  ×
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent 
        className="space-y-3 cursor-pointer" 
        onClick={() => navigate(`/investissement/${investment.id}`)}
      >
        {investment.address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{investment.address}</span>
          </div>
        )}
        
        {investment.surface && (
          <div className="text-xs">
            <span className="text-muted-foreground">Surface: </span>
            <span className="font-medium">{investment.surface} m²</span>
          </div>
        )}
        
        {investment.rentAmount && (
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Loyer: </span>
            <span className="font-medium financial-value">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(investment.rentAmount)}
            </span>
          </div>
        )}
        
        {investment.priceNV && (
          <div className="text-xs">
            <span className="text-muted-foreground">Prix NV: </span>
            <span className="font-medium financial-value">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(investment.priceNV)}
            </span>
          </div>
        )}
        
        {investment.tri && (
          <div className="text-xs">
            <span className="text-muted-foreground">TRI: </span>
            <span className="font-medium text-success">{investment.tri}%</span>
          </div>
        )}
        
        {investment.lastValue && (
          <div className="text-xs">
            <span className="text-muted-foreground">Valeur: </span>
            <span className="font-medium financial-value">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
              }).format(investment.lastValue)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}