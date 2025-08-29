import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building, TrendingUp, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusProgress } from '@/components/investments/StatusProgress';
import { DocumentsTab } from '@/components/investments/tabs/DocumentsTab';
import { NotesTab } from '@/components/investments/tabs/NotesTab';
import { GeneralTab } from '@/components/investments/tabs/GeneralTab';
import { PerformanceTab } from '@/components/investments/tabs/PerformanceTab';
import { DetteTab } from '@/components/investments/tabs/DetteTab';
import { HistoriqueTab } from '@/components/investments/tabs/HistoriqueTab';
import { useUserRole } from '@/hooks/useUserRole';

export default function InvestissementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canEdit, isLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('general');

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

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
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

        {canEdit && (
          <Button className="flex items-center gap-2">
            <Edit2 className="h-4 w-4" />
            Mode édition
          </Button>
        )}
      </div>

      {/* Status Progress */}
      <StatusProgress currentStatus={investment.status} className="mb-6" />

      {/* Performance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">Dernière valeur</label>
            <p className="font-medium financial-value text-xl">
              {formatCurrency(investment.lastValue)}
            </p>
          </div>
        </div>
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">TRI</label>
            <p className="font-medium financial-value text-xl">
              {formatPercentage(investment.lastTRI)}
            </p>
          </div>
        </div>
        <div className="card-financial">
          <div className="p-4">
            <label className="text-sm text-muted-foreground">Variation</label>
            <p className={`font-medium financial-value text-xl ${
              investment.lastVariation.percentage >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {investment.lastVariation.percentage >= 0 ? '+' : ''}
              {formatPercentage(investment.lastVariation.percentage)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents & IA</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="dette">Dette</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralTab investmentId={id || ''} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab investmentId={id || ''} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentsTab investmentId={id || ''} />
        </TabsContent>

        <TabsContent value="notes" className="mt-6">
          <NotesTab investmentId={id || ''} />
        </TabsContent>

        <TabsContent value="dette" className="mt-6">
          <DetteTab investmentId={id || ''} />
        </TabsContent>

        <TabsContent value="historique" className="mt-6">
          <HistoriqueTab investmentId={id || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}