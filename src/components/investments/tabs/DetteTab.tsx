import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Calendar, TrendingDown, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  
  // Debt form state (same pattern as Notes)
  const [isAddingDebt, setIsAddingDebt] = useState(false);
  const [editingDebt, setEditingDebt] = useState<string | null>(null);
  const [newDebt, setNewDebt] = useState({
    montant_initial: '',
    duree_mois: '',
    taux: '',
    type: 'Amortissement constant',
    amortissement_annuel: ''
  });

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

  const handleAddDebt = async () => {
    if (!user) return;

    try {
      const debtData = {
        asset_id: investmentId,
        asset_type: 'immobilier',
        user_id: user.id,
        montant_initial: newDebt.montant_initial ? parseFloat(newDebt.montant_initial) : 0,
        duree_mois: newDebt.duree_mois ? parseInt(newDebt.duree_mois) : 0,
        taux: newDebt.taux ? parseFloat(newDebt.taux) : 0,
        type: newDebt.type,
        amortissement_annuel: newDebt.amortissement_annuel ? parseFloat(newDebt.amortissement_annuel) : null
      };

      const { data, error } = await supabase
        .from('debt_characteristics')
        .insert([debtData])
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setDebtCharacteristics([data, ...debtCharacteristics]);
        setNewDebt({
          montant_initial: '',
          duree_mois: '',
          taux: '',
          type: 'Amortissement constant',
          amortissement_annuel: ''
        });
        setIsAddingDebt(false);
        toast.success('Dette ajoutée avec succès');
      }
    } catch (error) {
      console.error('Error adding debt:', error);
      toast.error('Erreur lors de l\'ajout de la dette');
    }
  };

  const handleEditDebt = (debtId: string) => {
    const debtToEdit = debtCharacteristics.find(debt => debt.id === debtId);
    if (debtToEdit) {
      setNewDebt({
        montant_initial: debtToEdit.montant_initial?.toString() || '',
        duree_mois: debtToEdit.duree_mois?.toString() || '',
        taux: debtToEdit.taux?.toString() || '',
        type: debtToEdit.type || 'Amortissement constant',
        amortissement_annuel: debtToEdit.amortissement_annuel?.toString() || ''
      });
      setEditingDebt(debtId);
      setIsAddingDebt(true);
    }
  };

  const handleUpdateDebt = async () => {
    if (!user || !editingDebt) return;

    try {
      const updateData = {
        montant_initial: newDebt.montant_initial ? parseFloat(newDebt.montant_initial) : 0,
        duree_mois: newDebt.duree_mois ? parseInt(newDebt.duree_mois) : 0,
        taux: newDebt.taux ? parseFloat(newDebt.taux) : 0,
        type: newDebt.type,
        amortissement_annuel: newDebt.amortissement_annuel ? parseFloat(newDebt.amortissement_annuel) : null
      };

      const { data, error } = await supabase
        .from('debt_characteristics')
        .update(updateData)
        .eq('id', editingDebt)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        setDebtCharacteristics(debtCharacteristics.map(debt => 
          debt.id === editingDebt ? data : debt
        ));
        setNewDebt({
          montant_initial: '',
          duree_mois: '',
          taux: '',
          type: 'Amortissement constant',
          amortissement_annuel: ''
        });
        setEditingDebt(null);
        setIsAddingDebt(false);
        toast.success('Dette modifiée avec succès');
      }
    } catch (error) {
      console.error('Error updating debt:', error);
      toast.error('Erreur lors de la modification de la dette');
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('debt_characteristics')
        .delete()
        .eq('id', debtId)
        .eq('user_id', user.id);

      if (error) throw error;

      setDebtCharacteristics(debtCharacteristics.filter(debt => debt.id !== debtId));
      toast.success('Dette supprimée avec succès');
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Erreur lors de la suppression de la dette');
    }
  };

  const handleCancelEdit = () => {
    setIsAddingDebt(false);
    setEditingDebt(null);
    setNewDebt({
      montant_initial: '',
      duree_mois: '',
      taux: '',
      type: 'Amortissement constant',
      amortissement_annuel: ''
    });
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
      {/* Debt List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Emprunts
          </CardTitle>
          {canEdit && investmentId !== 'nouveau' && (
            <Button 
              size="sm" 
              onClick={() => setIsAddingDebt(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Add Debt Form */}
          {isAddingDebt && (
            <div className="mb-6 p-4 border rounded-lg bg-accent/20">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montant_initial">Montant initial (€)</Label>
                    <Input
                      id="montant_initial"
                      type="number"
                      step="0.01"
                      value={newDebt.montant_initial}
                      onChange={(e) => setNewDebt({ ...newDebt, montant_initial: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duree_mois">Durée (mois)</Label>
                    <Input
                      id="duree_mois"
                      type="number"
                      value={newDebt.duree_mois}
                      onChange={(e) => setNewDebt({ ...newDebt, duree_mois: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taux">Taux (%)</Label>
                    <Input
                      id="taux"
                      type="number"
                      step="0.01"
                      value={newDebt.taux}
                      onChange={(e) => setNewDebt({ ...newDebt, taux: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type d'amortissement</Label>
                    <Select value={newDebt.type} onValueChange={(value) => setNewDebt({ ...newDebt, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amortissement constant">Amortissement constant</SelectItem>
                        <SelectItem value="Échéance constante">Échéance constante</SelectItem>
                        <SelectItem value="In fine">In fine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newDebt.type === 'Amortissement constant' && (
                  <div>
                    <Label htmlFor="amortissement_annuel">Amortissement annuel (€)</Label>
                    <Input
                      id="amortissement_annuel"
                      type="number"
                      step="0.01"
                      value={newDebt.amortissement_annuel}
                      onChange={(e) => setNewDebt({ ...newDebt, amortissement_annuel: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={editingDebt ? handleUpdateDebt : handleAddDebt}
                  >
                    {editingDebt ? 'Modifier' : 'Ajouter'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Debts List */}
          <div className="space-y-4">
            {loading ? (
              <p className="text-muted-foreground">Chargement des dettes...</p>
            ) : debtCharacteristics.length === 0 ? (
              <p className="text-muted-foreground italic">Aucune dette enregistrée</p>
            ) : (
              <>
                {/* Overview Cards - only show when there are debts */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
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

                {/* Individual debt items */}
                {debtCharacteristics.map((debt) => {
                  const currentDebt = calculateCurrentDebt(debt);
                  const progress = calculateProgress(debt.montant_initial, currentDebt);
                  
                  return (
                    <div key={debt.id} className="border rounded-lg p-4 bg-card">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{debt.type}</Badge>
                          <div className="text-sm text-muted-foreground">
                            <p>{formatPercentage(debt.taux)} • {debt.duree_mois} mois</p>
                            <p className="font-medium">Montant: {formatCurrency(debt.montant_initial)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Capital restant</p>
                            <p className="font-semibold financial-value text-destructive">
                              {formatCurrency(currentDebt)}
                            </p>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditDebt(debt.id)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteDebt(debt.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Remboursé: {formatPercentage(progress)}</span>
                          <span>Reste à rembourser: {formatCurrency(currentDebt)}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}