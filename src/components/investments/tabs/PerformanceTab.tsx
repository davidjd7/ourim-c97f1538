import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Plus, Trash2, Edit, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CashflowRow {
  id?: string;
  date: string;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
}

interface PerformanceData {
  id?: string;
  currentValue: number;
  initialValue: number;
  totalReturn: number;
  returnPercentage: number;
  tri: number;
}

interface PerformanceTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

export function PerformanceTab({ investmentId }: PerformanceTabProps) {
  const { user } = useAuth();
  const [data, setData] = useState<PerformanceData>({
    currentValue: 0,
    initialValue: 0,
    totalReturn: 0,
    returnPercentage: 0,
    tri: 0
  });
  const [cashflows, setCashflows] = useState<CashflowRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<CashflowRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && investmentId) {
      loadPerformanceData();
      loadCashflows();
    }
  }, [user, investmentId]);

  const loadPerformanceData = async () => {
    try {
      const { data: performanceData, error } = await supabase
        .from('investment_performance')
        .select('*')
        .eq('investment_id', investmentId)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading performance data:', error);
        return;
      }

      if (performanceData) {
        setData({
          id: performanceData.id,
          currentValue: performanceData.current_value || 0,
          initialValue: performanceData.initial_value || 0,
          totalReturn: performanceData.total_return || 0,
          returnPercentage: performanceData.return_percentage || 0,
          tri: performanceData.tri || 0
        });
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Erreur lors du chargement des données de performance');
    }
  };

  const loadCashflows = async () => {
    try {
      setLoading(true);
      const { data: cashflowData, error } = await supabase
        .from('investment_cashflows')
        .select('*')
        .eq('investment_id', investmentId)
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading cashflows:', error);
        toast.error('Erreur lors du chargement des flux de trésorerie');
        return;
      }

      const formattedCashflows = cashflowData?.map(cf => ({
        id: cf.id,
        date: cf.date,
        rex: cf.rex || 0,
        retraitAmort: cf.retrait_amort || 0,
        retraitAutres: cf.retrait_autres || 0
      })) || [];

      setCashflows(formattedCashflows);
    } catch (error) {
      console.error('Error loading cashflows:', error);
      toast.error('Erreur lors du chargement des flux de trésorerie');
    } finally {
      setLoading(false);
    }
  };

  const saveCashflow = async (cashflow: CashflowRow) => {
    try {
      if (cashflow.id) {
        // Update existing cashflow
        const { error } = await supabase
          .from('investment_cashflows')
          .update({
            date: cashflow.date,
            rex: cashflow.rex,
            retrait_amort: cashflow.retraitAmort,
            retrait_autres: cashflow.retraitAutres
          })
          .eq('id', cashflow.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        // Create new cashflow
        const { error } = await supabase
          .from('investment_cashflows')
          .insert({
            investment_id: investmentId,
            user_id: user?.id,
            date: cashflow.date,
            rex: cashflow.rex,
            retrait_amort: cashflow.retraitAmort,
            retrait_autres: cashflow.retraitAutres
          });

        if (error) throw error;
      }

      await loadCashflows(); // Reload data
      toast.success('Flux de trésorerie sauvegardé');
    } catch (error) {
      console.error('Error saving cashflow:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const deleteCashflowFromDB = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investment_cashflows')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadCashflows(); // Reload data
      toast.success('Flux de trésorerie supprimé');
    } catch (error) {
      console.error('Error deleting cashflow:', error);
      toast.error('Erreur lors de la suppression');
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
    return `${value.toFixed(1)}%`;
  };

  const calculateCashIn = (cashflow: CashflowRow) => {
    return cashflow.rex - cashflow.retraitAmort - cashflow.retraitAutres;
  };

  const addCashflowRow = async () => {
    const newRow: CashflowRow = {
      date: new Date().toISOString().split('T')[0],
      rex: 0,
      retraitAmort: 0,
      retraitAutres: 0
    };
    
    // Add to local state immediately for editing
    const newCashflows = [...cashflows, newRow];
    setCashflows(newCashflows);
    
    // Set editing mode for the new row
    setEditingIndex(newCashflows.length - 1);
    setEditingRow(newRow);
  };

  const deleteCashflowRow = async (index: number) => {
    const cashflow = cashflows[index];
    if (cashflow.id) {
      await deleteCashflowFromDB(cashflow.id);
    } else {
      // If it's a new row without ID, just remove from local state
      const newCashflows = cashflows.filter((_, i) => i !== index);
      setCashflows(newCashflows);
    }
    
    // Exit editing mode if we're deleting the row being edited
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingRow(null);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingRow({ ...cashflows[index] });
  };

  const saveEdit = async () => {
    if (editingIndex !== null && editingRow) {
      await saveCashflow(editingRow);
      setEditingIndex(null);
      setEditingRow(null);
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingRow(null);
  };

  const updateEditingField = (field: keyof CashflowRow, value: string | number) => {
    if (editingRow) {
      setEditingRow({
        ...editingRow,
        [field]: value
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des données de performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valeur actuelle</p>
                <p className="text-2xl font-bold financial-value">
                  {formatCurrency(data.currentValue)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plus-value</p>
                <p className={`text-2xl font-bold financial-value ${
                  data.totalReturn >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {data.totalReturn >= 0 ? '+' : ''}
                  {formatCurrency(data.totalReturn)}
                </p>
              </div>
              {data.totalReturn >= 0 ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-destructive" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rendement</p>
                <p className={`text-2xl font-bold financial-value ${
                  data.returnPercentage >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {data.returnPercentage >= 0 ? '+' : ''}
                  {formatPercentage(data.returnPercentage)}
                </p>
              </div>
              <Target className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">TRI</p>
                <p className="text-2xl font-bold financial-value text-primary">
                  {formatPercentage(data.tri)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cashflows History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>REX</TableHead>
                <TableHead>Retrait Amort</TableHead>
                <TableHead>Retrait Autres</TableHead>
                <TableHead>Cash In avant Levier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashflows.map((cashflow, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {editingIndex === index ? (
                      <Input
                        type="date"
                        value={editingRow?.date || ''}
                        onChange={(e) => updateEditingField('date', e.target.value)}
                        className="w-full"
                      />
                    ) : (
                      new Date(cashflow.date).toLocaleDateString('fr-FR')
                    )}
                  </TableCell>
                  <TableCell className="financial-value">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        value={editingRow?.rex || 0}
                        onChange={(e) => updateEditingField('rex', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    ) : (
                      formatCurrency(cashflow.rex)
                    )}
                  </TableCell>
                  <TableCell className="financial-value">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        value={editingRow?.retraitAmort || 0}
                        onChange={(e) => updateEditingField('retraitAmort', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    ) : (
                      formatCurrency(cashflow.retraitAmort)
                    )}
                  </TableCell>
                  <TableCell className="financial-value">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        value={editingRow?.retraitAutres || 0}
                        onChange={(e) => updateEditingField('retraitAutres', parseFloat(e.target.value) || 0)}
                        className="w-full"
                      />
                    ) : (
                      formatCurrency(cashflow.retraitAutres)
                    )}
                  </TableCell>
                  <TableCell className={`financial-value font-medium ${
                    calculateCashIn(editingIndex === index ? editingRow! : cashflow) >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {calculateCashIn(editingIndex === index ? editingRow! : cashflow) >= 0 ? '+' : ''}
                    {formatCurrency(calculateCashIn(editingIndex === index ? editingRow! : cashflow))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingIndex === index ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={saveEdit}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4 text-success" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCashflowRow(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={addCashflowRow}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une ligne
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution de la performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-accent/20 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Graphique de performance (à implémenter)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}