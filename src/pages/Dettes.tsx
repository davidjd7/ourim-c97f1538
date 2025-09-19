import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebtsList } from '@/hooks/useDebtsList';
import { useBatchPerformanceKPIs } from '@/hooks/useBatchPerformanceKPIs';

function DebtRowWithLTV({ debt }: { debt: any }) {
  const { batchKPIs, loading } = useBatchPerformanceKPIs([debt.asset_id]);
  const navigate = useNavigate();

  const kpis = batchKPIs[debt.asset_id];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getLTVBadgeVariant = (ltv: number) => {
    if (ltv < 70) return 'default';
    if (ltv < 80) return 'secondary';
    return 'destructive';
  };

  return (
    <TableRow>
      <TableCell>
        <span className="font-medium">{debt.asset_name}</span>
      </TableCell>
      <TableCell>{debt.banque || 'N/A'}</TableCell>
      <TableCell>{debt.type_credit || 'N/A'}</TableCell>
      <TableCell className="text-right">{formatCurrency(debt.montant_initial)}</TableCell>
      <TableCell className="text-right">{formatCurrency(debt.capital_restant)}</TableCell>
      <TableCell className="text-right">
        {loading ? (
          <Skeleton className="h-6 w-16 ml-auto" />
        ) : kpis?.fondPropreDetails?.ltv !== undefined ? (
          <Badge variant={getLTVBadgeVariant(kpis.fondPropreDetails.ltv)}>
            {kpis.fondPropreDetails.ltv.toFixed(1)}%
          </Badge>
        ) : (
          'N/A'
        )}
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(`/investissement/${debt.asset_id}`)}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function Dettes() {
  const { debts, loading, error } = useDebtsList();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dettes</h1>
            <p className="text-lg text-muted-foreground">
              Vue consolidée des emprunts par actif
            </p>
          </div>
        </div>

        <div className="card-financial">
          <div className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dettes</h1>
            <p className="text-lg text-muted-foreground">
              Vue consolidée des emprunts par actif
            </p>
          </div>
        </div>

        <div className="card-financial">
          <div className="p-6">
            <div className="text-center py-12 text-destructive">
              <p>Erreur lors du chargement des dettes</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dettes</h1>
          <p className="text-lg text-muted-foreground">
            Vue consolidée des emprunts par actif
          </p>
        </div>
      </div>

      {/* Debts Table */}
      {debts.length === 0 ? (
        <div className="card-financial">
          <div className="p-6">
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune dette trouvée</p>
              <p className="text-sm mt-2">Les dettes sont liées aux actifs dans leurs détails respectifs</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-financial">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de l'actif</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Type de crédit</TableHead>
                <TableHead className="text-right">Montant Initial</TableHead>
                <TableHead className="text-right">Capital Restant Dû</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <DebtRowWithLTV key={debt.id} debt={debt} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}