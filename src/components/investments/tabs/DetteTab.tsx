import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Calendar, TrendingDown, AlertCircle, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface Debt {
  id: string;
  bankName: string;
  loanType: 'mortgage' | 'bridge' | 'personal';
  initialAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'paid' | 'pending';
}

interface DetteTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

const mockDebts: Debt[] = [
  {
    id: '1',
    bankName: 'BNP Paribas',
    loanType: 'mortgage',
    initialAmount: 1500000,
    remainingAmount: 1350000,
    interestRate: 2.8,
    monthlyPayment: 6250,
    startDate: '2023-03-15',
    endDate: '2043-03-15',
    status: 'active'
  },
  {
    id: '2',
    bankName: 'Crédit Agricole',
    loanType: 'bridge',
    initialAmount: 200000,
    remainingAmount: 0,
    interestRate: 3.5,
    monthlyPayment: 2100,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'paid'
  }
];

const loanTypeConfig = {
  mortgage: { label: 'Prêt immobilier', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  bridge: { label: 'Prêt relais', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  personal: { label: 'Prêt personnel', className: 'bg-purple-50 text-purple-700 border-purple-200' }
};

const statusConfig = {
  active: { label: 'Actif', className: 'status-investi' },
  paid: { label: 'Remboursé', className: 'status-vendu' },
  pending: { label: 'En attente', className: 'status-due-dil' }
};

export function DetteTab({ investmentId }: DetteTabProps) {
  const { canEdit } = useUserRole();
  const [debts] = useState<Debt[]>(mockDebts);

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

  const calculateProgress = (initial: number, remaining: number) => {
    return ((initial - remaining) / initial) * 100;
  };

  const totalInitialDebt = debts.reduce((sum, debt) => sum + debt.initialAmount, 0);
  const totalRemainingDebt = debts.filter(d => d.status === 'active').reduce((sum, debt) => sum + debt.remainingAmount, 0);
  const totalMonthlyPayments = debts.filter(d => d.status === 'active').reduce((sum, debt) => sum + debt.monthlyPayment, 0);

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
                <p className="text-sm text-muted-foreground">Mensualités totales</p>
                <p className="text-xl font-bold financial-value">
                  {formatCurrency(totalMonthlyPayments)}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Emprunts
          </CardTitle>
          {canEdit && (
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debts.map((debt) => {
              const progress = calculateProgress(debt.initialAmount, debt.remainingAmount);
              const remainingMonths = debt.status === 'active' ? 
                Math.ceil((new Date(debt.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;

              return (
                <div key={debt.id} className="border rounded-lg p-4 hover:bg-accent/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{debt.bankName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={loanTypeConfig[debt.loanType].className}>
                            {loanTypeConfig[debt.loanType].label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig[debt.status].className}>
                            {statusConfig[debt.status].label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold financial-value">
                        {formatCurrency(debt.remainingAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        sur {formatCurrency(debt.initialAmount)}
                      </p>
                    </div>
                  </div>

                  {debt.status === 'active' && (
                    <>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression du remboursement</span>
                          <span>{progress.toFixed(1)}% remboursé</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Taux d'intérêt</p>
                          <p className="font-medium">{formatPercentage(debt.interestRate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mensualité</p>
                          <p className="font-medium financial-value">{formatCurrency(debt.monthlyPayment)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Échéance</p>
                          <p className="font-medium">
                            {new Date(debt.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mois restants</p>
                          <p className="font-medium">{remainingMonths} mois</p>
                        </div>
                      </div>
                    </>
                  )}

                  {debt.status === 'paid' && (
                    <div className="flex items-center gap-2 mt-2 text-success">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Prêt entièrement remboursé</span>
                    </div>
                  )}
                </div>
              );
            })}

            {debts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucun emprunt enregistré
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debt Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse de l'endettement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-accent/20 rounded-lg">
              <h4 className="font-medium mb-2">Ratio d'endettement</h4>
              <p className="text-2xl font-bold text-primary">
                {totalRemainingDebt > 0 ? ((totalRemainingDebt / 2170000) * 100).toFixed(1) : '0.0'}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                de la valeur actuelle de l'investissement
              </p>
            </div>
            <div className="p-4 bg-accent/20 rounded-lg">
              <h4 className="font-medium mb-2">Coût total des intérêts</h4>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(45000)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                estimation sur la durée restante
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}