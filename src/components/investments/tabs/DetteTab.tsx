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
  type_credit?: string;
  montant_tirable?: number;
  banque?: string;
  base?: string;
  echeance?: string;
  marge?: number;
  couverture_ltv?: number;
  type_taux?: string;
  indice_base?: string;
  clause_arrosage?: string;
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
    amortissement_annuel: '',
    type_credit: 'Hypothécaire',
    montant_tirable: '',
    banque: '',
    base: '',
    echeance: '',
    marge: '',
    couverture_ltv: '',
    type_taux: 'Fixe',
    indice_base: '',
    clause_arrosage: ''
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
    if (!initial || initial <= 0) return 0;
    const v = ((initial - remaining) / initial) * 100;
    if (isNaN(v) || !isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
  };

  const safeFormatPercentage = (value?: number | null) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '-';
    return `${Number(value).toFixed(2)}%`;
  };

  const validateDebt = () => {
    const mi = parseFloat(newDebt.montant_initial || '0');
    const dm = parseInt(newDebt.duree_mois || '0');
    const tx = parseFloat(newDebt.taux || '0');
    if (mi <= 0 || dm <= 0 || isNaN(mi) || isNaN(dm)) {
      toast.error('Veuillez renseigner un Montant Tiré (>0) et une Durée (mois) (>0).');
      return false;
    }
    if (isNaN(tx)) {
      toast.error('Veuillez renseigner un Taux valide.');
      return false;
    }
    if (newDebt.type_credit === 'Lombard') {
      const mt = parseFloat(newDebt.montant_tirable || '0');
      if (mt <= 0 || isNaN(mt)) {
        toast.error('Pour un crédit Lombard, renseignez le Montant Tirable (>0).');
        return false;
      }
    }
    return true;
  };
  const handleAddDebt = async () => {
    if (!user) return;

    try {
      if (!validateDebt()) return;
      const debtData = {
        asset_id: investmentId,
        asset_type: 'immobilier',
        user_id: user.id,
        montant_initial: newDebt.montant_initial ? parseFloat(newDebt.montant_initial) : 0,
        duree_mois: newDebt.duree_mois ? parseInt(newDebt.duree_mois) : 0,
        taux: newDebt.taux ? parseFloat(newDebt.taux) : 0,
        type: newDebt.type,
        amortissement_annuel: newDebt.amortissement_annuel ? parseFloat(newDebt.amortissement_annuel) : null,
        type_credit: newDebt.type_credit,
        montant_tirable: newDebt.montant_tirable ? parseFloat(newDebt.montant_tirable) : null,
        banque: newDebt.banque || null,
        base: newDebt.base || null,
        echeance: newDebt.echeance || null,
        marge: newDebt.marge ? parseFloat(newDebt.marge) : null,
        couverture_ltv: newDebt.couverture_ltv ? parseFloat(newDebt.couverture_ltv) : null,
        type_taux: newDebt.type_taux || 'Fixe',
        indice_base: newDebt.indice_base || null,
        clause_arrosage: newDebt.clause_arrosage || null
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
          amortissement_annuel: '',
          type_credit: 'Hypothécaire',
          montant_tirable: '',
          banque: '',
          base: '',
          echeance: '',
          marge: '',
          couverture_ltv: '',
          type_taux: 'Fixe',
          indice_base: '',
          clause_arrosage: ''
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
        amortissement_annuel: debtToEdit.amortissement_annuel?.toString() || '',
        type_credit: debtToEdit.type_credit || 'Hypothécaire',
        montant_tirable: debtToEdit.montant_tirable?.toString() || '',
        banque: debtToEdit.banque || '',
        base: debtToEdit.base || '',
        echeance: debtToEdit.echeance || '',
        marge: debtToEdit.marge?.toString() || '',
        couverture_ltv: debtToEdit.couverture_ltv?.toString() || '',
        type_taux: debtToEdit.type_taux || 'Fixe',
        indice_base: debtToEdit.indice_base || '',
        clause_arrosage: debtToEdit.clause_arrosage || ''
      });
      setEditingDebt(debtId);
      setIsAddingDebt(true);
    }
  };

  const handleUpdateDebt = async () => {
    if (!user || !editingDebt) return;

    try {
      if (!validateDebt()) return;
      const updateData = {
        montant_initial: newDebt.montant_initial ? parseFloat(newDebt.montant_initial) : 0,
        duree_mois: newDebt.duree_mois ? parseInt(newDebt.duree_mois) : 0,
        taux: newDebt.taux ? parseFloat(newDebt.taux) : 0,
        type: newDebt.type,
        amortissement_annuel: newDebt.amortissement_annuel ? parseFloat(newDebt.amortissement_annuel) : null,
        type_credit: newDebt.type_credit,
        montant_tirable: newDebt.montant_tirable ? parseFloat(newDebt.montant_tirable) : null,
        banque: newDebt.banque || null,
        base: newDebt.base || null,
        echeance: newDebt.echeance || null,
        marge: newDebt.marge ? parseFloat(newDebt.marge) : null,
        couverture_ltv: newDebt.couverture_ltv ? parseFloat(newDebt.couverture_ltv) : null,
        type_taux: newDebt.type_taux || 'Fixe',
        indice_base: newDebt.indice_base || null,
        clause_arrosage: newDebt.clause_arrosage || null
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
          amortissement_annuel: '',
          type_credit: 'Hypothécaire',
          montant_tirable: '',
          banque: '',
          base: '',
          echeance: '',
          marge: '',
          couverture_ltv: '',
          type_taux: 'Fixe',
          indice_base: '',
          clause_arrosage: ''
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
      amortissement_annuel: '',
      type_credit: 'Hypothécaire',
      montant_tirable: '',
      banque: '',
      base: '',
      echeance: '',
      marge: '',
      couverture_ltv: '',
      type_taux: 'Fixe',
      indice_base: '',
      clause_arrosage: ''
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
              <h3 className="font-medium mb-4">Configuration de la dette</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type_credit">Type de crédit</Label>
                    <Select value={newDebt.type_credit} onValueChange={(value) => setNewDebt({ ...newDebt, type_credit: value, montant_tirable: value === 'Lombard' ? newDebt.montant_tirable : '' })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hypothécaire">Hypothécaire</SelectItem>
                        <SelectItem value="Lombard">Lombard</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="echeance">Échéance</Label>
                    <Select value={newDebt.echeance || ''} onValueChange={(value) => setNewDebt({ ...newDebt, echeance: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensuelle">Mensuelle</SelectItem>
                        <SelectItem value="Trimestrielle">Trimestrielle</SelectItem>
                        <SelectItem value="Semestrielle">Semestrielle</SelectItem>
                        <SelectItem value="Annuelle">Annuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type d'amortissement</Label>
                    <Select value={newDebt.type} onValueChange={(value) => setNewDebt({ ...newDebt, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Amortissement constant">Amortissement constant</SelectItem>
                        <SelectItem value="Annuité constante">Annuité constante</SelectItem>
                        <SelectItem value="In fine">In fine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="banque">Banque</Label>
                    <Input
                      id="banque"
                      value={newDebt.banque || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, banque: e.target.value })}
                      placeholder="Nom de la banque"
                    />
                  </div>
                  <div>
                    <Label htmlFor="base">Base</Label>
                    <Select value={newDebt.base || ''} onValueChange={(value) => setNewDebt({ ...newDebt, base: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="360">360</SelectItem>
                        <SelectItem value="365">365</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amortissement_annuel">Amortissement annuel (%)</Label>
                    <Input
                      id="amortissement_annuel"
                      type="number"
                      step="0.01"
                      value={newDebt.amortissement_annuel}
                      onChange={(e) => setNewDebt({ ...newDebt, amortissement_annuel: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="montant_initial">Montant Tiré (€)</Label>
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
                    <Label htmlFor="marge">Marge (%)</Label>
                    <Input
                      id="marge"
                      type="number"
                      step="0.01"
                      value={newDebt.marge || ''}
                      onChange={(e) => setNewDebt({ ...newDebt, marge: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                {newDebt.type_credit === 'Lombard' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="montant_tirable">Montant Tirable (€)</Label>
                      <Input
                        id="montant_tirable"
                        type="number"
                        step="0.01"
                        value={newDebt.montant_tirable}
                        onChange={(e) => setNewDebt({ ...newDebt, montant_tirable: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="couverture_ltv">Couverture LTV (%)</Label>
                      <Input
                        id="couverture_ltv"
                        type="number"
                        step="0.01"
                        value={newDebt.couverture_ltv || ''}
                        onChange={(e) => setNewDebt({ ...newDebt, couverture_ltv: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
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
                    <Label htmlFor="type_taux">Type de taux</Label>
                    <Select value={newDebt.type_taux || 'Fixe'} onValueChange={(value) => setNewDebt({ ...newDebt, type_taux: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixe">Fixe</SelectItem>
                        <SelectItem value="Variable">Variable</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={editingDebt ? handleUpdateDebt : handleAddDebt}
                  >
                    {editingDebt ? 'Modifier' : 'Sauvegarder'}
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
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">Caractéristiques</h4>
                            {canEdit && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditDebt(debt.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteDebt(debt.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Montant Tiré (€)</p>
                          <p className="font-medium">{formatCurrency(debt.montant_initial)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Durée (mois)</p>
                          <p className="font-medium">{debt.duree_mois} mois</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Taux (%)</p>
                          <p className="font-medium">{safeFormatPercentage(debt.taux as any)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{debt.type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amortissement annuel (%)</p>
                          <p className="font-medium">{debt.amortissement_annuel ? formatPercentage(debt.amortissement_annuel) : '-'}</p>
                        </div>
                      </div>

                      {/* Détails additionnels, même mise en page que le formulaire */}
                      <div className="border-t pt-4 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Type de crédit</p>
                            <p className="font-medium">{debt.type_credit || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Banque</p>
                            <p className="font-medium">{debt.banque || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Marge (%)</p>
                            <p className="font-medium">{safeFormatPercentage(debt.marge as any)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Type de taux</p>
                            <p className="font-medium">{debt.type_taux || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Échéance</p>
                            <p className="font-medium">{debt.echeance || '-'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Base</p>
                            <p className="font-medium">{debt.base || '-'}</p>
                          </div>
                        </div>
                        {debt.type_credit === 'Lombard' && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Montant Tirable (€)</p>
                              <p className="font-medium">{debt.montant_tirable !== null && debt.montant_tirable !== undefined ? formatCurrency(debt.montant_tirable) : '-'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Couverture LTV (%)</p>
                              <p className="font-medium">{safeFormatPercentage(debt.couverture_ltv as any)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-muted-foreground">Capital restant</p>
                          <p className="font-semibold financial-value text-destructive">
                            {formatCurrency(currentDebt)}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Remboursé: {formatPercentage(progress)}</span>
                            <span>Reste à rembourser: {formatCurrency(currentDebt)}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
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