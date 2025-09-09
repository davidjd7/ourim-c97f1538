import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Plus, Trash2, Edit, Save } from 'lucide-react';

interface CashflowRow {
  date: string;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
}

interface PerformanceData {
  currentValue: number;
  initialValue: number;
  totalReturn: number;
  returnPercentage: number;
  tri: number;
  cashflows: CashflowRow[];
}

interface PerformanceTabProps {
  investmentId: string;
  isEditMode?: boolean;
}

const mockPerformanceData: PerformanceData = {
  currentValue: 2170000,
  initialValue: 2100000,
  totalReturn: 70000,
  returnPercentage: 3.33,
  tri: 6.8,
  cashflows: [
    {
      date: '2023-03-15',
      rex: 0,
      retraitAmort: 0,
      retraitAutres: 2100000
    },
    {
      date: '2023-06-15',
      rex: 15000,
      retraitAmort: 0,
      retraitAutres: 0
    },
    {
      date: '2023-09-15',
      rex: 15500,
      retraitAmort: 0,
      retraitAutres: 0
    },
    {
      date: '2023-12-15',
      rex: 16000,
      retraitAmort: 0,
      retraitAutres: 0
    }
  ]
};

export function PerformanceTab({ investmentId }: PerformanceTabProps) {
  const [data] = useState<PerformanceData>(mockPerformanceData);
  const [cashflows, setCashflows] = useState<CashflowRow[]>(data.cashflows);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<CashflowRow | null>(null);

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

  const addCashflowRow = () => {
    const newRow: CashflowRow = {
      date: new Date().toISOString().split('T')[0],
      rex: 0,
      retraitAmort: 0,
      retraitAutres: 0
    };
    const newCashflows = [...cashflows, newRow];
    setCashflows(newCashflows);
    // Mettre la nouvelle ligne en mode édition
    setEditingIndex(newCashflows.length - 1);
    setEditingRow(newRow);
  };

  const deleteCashflowRow = (index: number) => {
    const newCashflows = cashflows.filter((_, i) => i !== index);
    setCashflows(newCashflows);
    // Si on supprime la ligne en cours d'édition, sortir du mode édition
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingRow(null);
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingRow({ ...cashflows[index] });
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingRow) {
      const newCashflows = [...cashflows];
      newCashflows[editingIndex] = editingRow;
      setCashflows(newCashflows);
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