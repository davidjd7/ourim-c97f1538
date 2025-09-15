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

// Configuration centralisée des champs
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean | ((formData: any) => boolean);
  defaultValue?: string;
  step?: string;
  placeholder?: string;
  format?: 'currency' | 'percentage';
  condition?: (formData: any) => boolean;
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'type_credit',
    label: 'Type de crédit',
    type: 'select',
    options: [
      { value: 'Hypothécaire', label: 'Hypothécaire' },
      { value: 'Lombard', label: 'Lombard' },
      { value: 'Autre', label: 'Autre' }
    ],
    required: true,
    defaultValue: 'Hypothécaire'
  },
  {
    key: 'banque',
    label: 'Banque',
    type: 'text',
    placeholder: 'Nom de la banque'
  },
  {
    key: 'echeance',
    label: 'Échéance',
    type: 'select',
    options: [
      { value: 'Mensuelle', label: 'Mensuelle' },
      { value: 'Trimestrielle', label: 'Trimestrielle' },
      { value: 'Semestrielle', label: 'Semestrielle' },
      { value: 'Annuelle', label: 'Annuelle' }
    ]
  },
  {
    key: 'type',
    label: 'Type d\'amortissement',
    type: 'select',
    options: [
      { value: 'Amortissement constant', label: 'Amortissement constant' },
      { value: 'Annuité constante', label: 'Annuité constante' },
      { value: 'In fine', label: 'In fine' }
    ],
    required: true,
    defaultValue: 'Amortissement constant'
  },
  {
    key: 'base',
    label: 'Base',
    type: 'select',
    options: [
      { value: '360', label: '360' },
      { value: '365', label: '365' }
    ]
  },
  {
    key: 'amortissement_annuel',
    label: 'Amortissement annuel (%)',
    type: 'number',
    step: '0.01',
    placeholder: '0',
    format: 'percentage'
  },
  {
    key: 'montant_initial',
    label: 'Montant Tiré (€)',
    type: 'number',
    step: '0.01',
    placeholder: '0',
    required: true,
    format: 'currency'
  },
  {
    key: 'marge',
    label: 'Marge (%)',
    type: 'number',
    step: '0.01',
    placeholder: '0',
    format: 'percentage'
  },
  {
    key: 'taux',
    label: 'Taux (%)',
    type: 'number',
    step: '0.01',
    placeholder: '0.00',
    required: true,
    format: 'percentage'
  },
  {
    key: 'type_taux',
    label: 'Type de taux',
    type: 'select',
    options: [
      { value: 'Fixe', label: 'Fixe' },
      { value: 'Variable', label: 'Variable' }
    ],
    defaultValue: 'Fixe'
  },
  {
    key: 'indice_base',
    label: 'Indice de base',
    type: 'text',
    placeholder: 'Ex: EURIBOR 3M',
    condition: (formData: any) => formData.type_taux === 'Variable'
  },
  {
    key: 'duree_mois',
    label: 'Durée (mois)',
    type: 'number',
    placeholder: '0',
    required: true
  },
  {
    key: 'montant_tirable',
    label: 'Montant Tirable (€)',
    type: 'number',
    step: '0.01',
    placeholder: '0',
    format: 'currency',
    condition: (formData: any) => formData.type_credit === 'Lombard',
    required: (formData: any) => formData.type_credit === 'Lombard'
  },
  {
    key: 'couverture_ltv',
    label: 'Couverture LTV (%)',
    type: 'number',
    step: '0.01',
    placeholder: '0',
    format: 'percentage',
    condition: (formData: any) => formData.type_credit === 'Lombard'
  },
  {
    key: 'clause_arrosage',
    label: 'Clause d\'arrosage',
    type: 'text',
    placeholder: 'Description de la clause'
  }
];

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

  const formatFieldValue = (field: FieldConfig, value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    
    switch (field.format) {
      case 'currency':
        return formatCurrency(Number(value));
      case 'percentage':
        return formatPercentage(Number(value));
      default:
        return String(value);
    }
  };

  const shouldShowField = (field: FieldConfig, formData: any) => {
    return !field.condition || field.condition(formData);
  };

  const isFieldRequired = (field: FieldConfig, formData: any) => {
    if (typeof field.required === 'function') {
      return field.required(formData);
    }
    return field.required || false;
  };

  const renderFormField = (field: FieldConfig) => {
    if (!shouldShowField(field, newDebt)) return null;

    const value = (newDebt as any)[field.key] || '';
    const isRequired = isFieldRequired(field, newDebt);

    return (
      <div key={field.key}>
        <Label htmlFor={field.key}>
          {field.label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
        {field.type === 'select' ? (
          <Select 
            value={value} 
            onValueChange={(newValue) => setNewDebt({ ...newDebt, [field.key]: newValue })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field.key}
            type={field.type}
            step={field.step}
            value={value}
            onChange={(e) => setNewDebt({ ...newDebt, [field.key]: e.target.value })}
            placeholder={field.placeholder}
          />
        )}
      </div>
    );
  };

  const renderDisplayField = (field: FieldConfig, debt: DebtCharacteristics) => {
    if (!shouldShowField(field, debt)) return null;

    const value = (debt as any)[field.key];

    return (
      <div key={field.key}>
        <p className="text-sm text-muted-foreground">{field.label}</p>
        <p className="font-medium">{formatFieldValue(field, value)}</p>
      </div>
    );
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
                {/* Render form fields in 3-column grid */}
                <div className="grid grid-cols-3 gap-4">
                  {FIELD_CONFIG.map((field) => renderFormField(field))}
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
                        {FIELD_CONFIG.map((field) => renderDisplayField(field, debt))}
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