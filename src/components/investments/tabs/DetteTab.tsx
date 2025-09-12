import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, TrendingDown, AlertCircle, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddDebtDialog } from './AddDebtDialog';

interface DebtCharacteristics {
  id: string;
  asset_id: string;
  asset_type: string;
  montant_initial: number;
  duree_mois: number;
  taux: number;
  type: string;
  amortissement_annuel?: number;
  created_at: string;
}

interface DebtFlow {
  id: string;
  debt_characteristics_id: string;
  date: string;
  capital_debut: number;
  rmbt_capital: number;
  rmbt_interet: number;
}

interface DetteTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

export function DetteTab({ investmentId }: DetteTabProps) {
  const { canEdit } = useUserRole();
  const { user } = useAuth();
  const [debtCharacteristics, setDebtCharacteristics] = useState<DebtCharacteristics[]>([]);
  const [debtFlows, setDebtFlows] = useState<DebtFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && investmentId) {
      loadDebtData();
    }
  }, [user, investmentId]);

  const loadDebtData = async () => {
    try {
      setLoading(true);
      
      // Load debt characteristics for this investment
      const { data: characteristicsData, error: characteristicsError } = await supabase
        .from('debt_characteristics')
        .select('*')
        .eq('asset_id', investmentId)
        .eq('user_id', user?.id);
      
      if (characteristicsError) throw characteristicsError;
      
      setDebtCharacteristics(characteristicsData || []);
      
      // Load debt flows for these characteristics
      if (characteristicsData && characteristicsData.length > 0) {
        const debtIds = characteristicsData.map(dc => dc.id);
        const { data: flowsData, error: flowsError } = await supabase
          .from('debt_flows')
          .select('*')
          .in('debt_characteristics_id', debtIds)
          .eq('user_id', user?.id)
          .order('date', { ascending: false });
          
        if (flowsError) throw flowsError;
        setDebtFlows(flowsData || []);
      } else {
        setDebtFlows([]);
      }
    } catch (error) {
      console.error('Error loading debt data:', error);
      toast.error('Erreur lors du chargement des dettes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateCurrentDebt = (characteristics: DebtCharacteristics) => {
    const relatedFlows = debtFlows
      .filter(flow => flow.debt_characteristics_id === characteristics.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (relatedFlows.length > 0) {
      const latestFlow = relatedFlows[0];
      return latestFlow.capital_debut - latestFlow.rmbt_capital;
    }
    
    return characteristics.montant_initial;
  };

  const calculateProgress = (initial: number, remaining: number) => {
    return ((initial - remaining) / initial) * 100;
  };

  const totalInitialDebt = debtCharacteristics.reduce((sum, debt) => sum + debt.montant_initial, 0);
  const totalRemainingDebt = debtCharacteristics.reduce((sum, debt) => sum + calculateCurrentDebt(debt), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-accent/20 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debt Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dette totale initiale</p>
                <p className="text-xl font-bold financial-value">
                  {formatCurrency(totalInitialDebt)}
                </p>
              </div>
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dette restante</p>
                <p className="text-xl font-bold financial-value text-destructive">
                  {formatCurrency(totalRemainingDebt)}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nombre d'emprunts</p>
                <p className="text-xl font-bold financial-value">
                  {debtCharacteristics.length}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Emprunts
            </div>
            {canEdit && <AddDebtDialog investmentId={investmentId} onDebtAdded={loadDebtData} />}
          </CardTitle>
          <CardDescription>
            Gestion des emprunts et financements de cet investissement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debtCharacteristics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune dette enregistrée</p>
                <p className="text-sm mt-2">Commencez par ajouter un emprunt</p>
                {canEdit && (
                  <div className="mt-4">
                    <AddDebtDialog investmentId={investmentId} onDebtAdded={loadDebtData} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {debtCharacteristics.map((debt) => {
                  const currentDebt = calculateCurrentDebt(debt);
                  const progress = calculateProgress(debt.montant_initial, currentDebt);
                  
                  return (
                    <Card key={debt.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{debt.type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatPercentage(debt.taux)} - {debt.duree_mois} mois
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Capital restant</p>
                          <p className="font-semibold financial-value text-destructive">
                            {formatCurrency(currentDebt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Montant initial: {formatCurrency(debt.montant_initial)}</span>
                          <span>Remboursé: {formatPercentage(progress)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}