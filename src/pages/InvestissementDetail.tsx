import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function InvestissementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - en attendant la vraie intégration
  const investment = {
    id: id,
    name: 'Faisanderie Paris',
    type: 'IMMO' as const,
    status: 'INVESTI' as const,
    dateInvestment: '2023-03-15',
    lastValue: 2170000,
    lastTRI: 6.8,
    lastCashflow: 98084,
    lastVariation: { value: 50000, percentage: 2.4 },
    address: '12 rue de la Faisanderie, 75016 Paris',
    surface: 250
  };

  const statusConfig = {
    RECU: { label: 'Reçu', className: 'status-recu' },
    DUE_DIL: { label: 'Due Dil', className: 'status-due-dil' },
    INVESTI: { label: 'Investi', className: 'status-investi' },
    VENDU: { label: 'Vendu', className: 'status-vendu' },
    DROP: { label: 'Drop', className: 'status-drop' }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          {investment.type === 'IMMO' ? (
            <Building className="h-6 w-6 text-muted-foreground" />
          ) : (
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{investment.name}</h1>
            <p className="text-muted-foreground">
              {investment.type === 'IMMO' ? 'Investissement Immobilier' : 'Private Equity'}
            </p>
          </div>
          <Badge variant="outline" className={statusConfig[investment.status].className}>
            {statusConfig[investment.status].label}
          </Badge>
        </div>
      </div>

      {/* Investment details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Info */}
        <div className="card-financial">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informations générales</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Date d'investissement</label>
                <p className="font-medium">
                  {investment.dateInvestment ? 
                    new Date(investment.dateInvestment).toLocaleDateString('fr-FR') : 
                    '-'
                  }
                </p>
              </div>
              {investment.type === 'IMMO' && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Adresse</label>
                    <p className="font-medium">{investment.address}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Surface</label>
                    <p className="font-medium">{investment.surface} m²</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Financial Performance */}
        <div className="card-financial">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Dernière valeur</label>
                <p className="font-medium financial-value text-lg">
                  {formatCurrency(investment.lastValue)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">TRI</label>
                <p className="font-medium financial-value text-lg">
                  {formatPercentage(investment.lastTRI)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Dernier cashflow</label>
                <p className="font-medium financial-value">
                  {formatCurrency(investment.lastCashflow)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Variation */}
        <div className="card-financial">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dernière variation</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Variation en valeur</label>
                <p className={`font-medium financial-value text-lg ${
                  investment.lastVariation.value >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {investment.lastVariation.value >= 0 ? '+' : ''}
                  {formatCurrency(investment.lastVariation.value)}
                </p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Variation en %</label>
                <p className={`font-medium financial-value text-lg ${
                  investment.lastVariation.percentage >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {investment.lastVariation.percentage >= 0 ? '+' : ''}
                  {formatPercentage(investment.lastVariation.percentage)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections placeholder */}
      <div className="card-financial">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Détails avancés</h3>
          <p className="text-muted-foreground">
            Cette section contiendra les détails avancés de l'investissement (documents, notes, historique, etc.)
          </p>
        </div>
      </div>
    </div>
  );
}