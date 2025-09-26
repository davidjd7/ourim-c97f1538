import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useInvestments } from '@/contexts/ImmobilierContext';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit, Save, CreditCard, BarChart3, TrendingDown as TrendIcon, Upload, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { YearPicker } from '@/components/ui/year-picker';
import { FIELD_CONFIG, type DebtCharacteristics as FieldConfigDebtCharacteristics } from './debt/fieldConfig';
import { logError } from '@/lib/errorHandler';
interface CashflowRow {
  id?: string;
  date: string;
  loyer: number;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
  note: string;
}
interface ImmobilisationRow {
  id?: string;
  date: string;
  montant: number;
  note: string;
}
interface ValorisationRow {
  id?: string;
  date: string;
  valeur: number;
  note: string;
}
type DebtCharacteristics = FieldConfigDebtCharacteristics;
interface DebtFlowRow {
  id?: string;
  date: string;
  capitalDebut: number;
  rmbtCapital: number;
  rmbtInteret: number;
}
interface SyntheseRow {
  date: string;
  flux: number;
  valeur: number;
  crd: number;
  fp: number;
}
interface PerformanceTabProps {
  investmentId: string;
  isEditMode?: boolean;
}
export function PerformanceTab({
  investmentId
}: PerformanceTabProps) {
  const { user } = useAuth();
  const { canEdit } = useUserRole();
  const { notifyInvestmentDataChanged } = useInvestments();
  const { toast: toastHook } = useToast();

  // Data arrays
  const [cashflows, setCashflows] = useState<CashflowRow[]>([]);
  const [immobilisations, setImmobilisations] = useState<ImmobilisationRow[]>([]);
  const [valorisations, setValorisations] = useState<ValorisationRow[]>([]);
  const [debtCharacteristics, setDebtCharacteristics] = useState<DebtCharacteristics>({
    montantInitial: 0,
    dureeMois: 0,
    taux: 0,
    type: 'Annuité constante',
    typeCredit: 'Hypothécaire',
    typeTaux: 'Fixe'
  });
  const [debtFlows, setDebtFlows] = useState<DebtFlowRow[]>([]);
  const [debtDocument, setDebtDocument] = useState<{
    id: string;
    name: string;
    file_path: string;
  } | null>(null);

  // Editing states
  const [editingCashflow, setEditingCashflow] = useState<{
    index: number;
    row: CashflowRow;
  } | null>(null);
  const [editingImmo, setEditingImmo] = useState<{
    index: number;
    row: ImmobilisationRow;
  } | null>(null);
  const [editingValo, setEditingValo] = useState<{
    index: number;
    row: ValorisationRow;
  } | null>(null);
  const [editingDebtFlow, setEditingDebtFlow] = useState<{
    index: number;
    row: DebtFlowRow;
  } | null>(null);
  const [editingDebtCharacteristics, setEditingDebtCharacteristics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingDebtFile, setUploadingDebtFile] = useState(false);
  useEffect(() => {
    if (user && investmentId) {
      Promise.all([loadCashflows(), loadImmobilisations(), loadValorisations(), loadDebtCharacteristics(), loadDebtFlows()]).finally(() => setLoading(false));
    }
  }, [user, investmentId]);

  // Load functions

  const loadCashflows = async () => {
    try {
      const {
        data: cashflowData,
        error
      } = await supabase.from('immobilier_cashflows').select('*').eq('immobilier_id', investmentId).eq('user_id', user?.id).order('date', {
        ascending: true
      });
      if (error) throw error;
      const formattedCashflows = cashflowData?.map(cf => ({
        id: cf.id,
        date: cf.date,
        loyer: cf.loyer || 0,
        rex: cf.rex || 0,
        retraitAmort: cf.retrait_amort || 0,
        retraitAutres: cf.retrait_autres || 0,
        note: cf.note || ''
      })) || [];
      setCashflows(formattedCashflows);
    } catch (error) {
      logError(error, { component: 'PerformanceTab', function: 'loadCashflows', investmentId });
    }
  };
  const loadImmobilisations = async () => {
    try {
      const {
        data: immoData,
        error
      } = await supabase.from('immobilier_immobilisations').select('*').eq('immobilier_id', investmentId).eq('user_id', user?.id).order('date', {
        ascending: true
      });
      if (error) throw error;
      const formattedImmos = immoData?.map(immo => ({
        id: immo.id,
        date: immo.date,
        montant: immo.montant || 0,
        note: immo.note || ''
      })) || [];
      setImmobilisations(formattedImmos);
    } catch (error) {
      logError(error, { component: 'PerformanceTab', function: 'loadImmobilisations', investmentId });
    }
  };
  const loadValorisations = async () => {
    try {
      const {
        data: valoData,
        error
      } = await supabase.from('immobilier_valorisations').select('*').eq('immobilier_id', investmentId).eq('user_id', user?.id).order('date', {
        ascending: true
      });
      if (error) throw error;
      const formattedValos = valoData?.map(valo => ({
        id: valo.id,
        date: valo.date,
        valeur: valo.valeur || 0,
        note: valo.note || ''
      })) || [];
      setValorisations(formattedValos);
    } catch (error) {
      logError(error, { component: 'PerformanceTab', function: 'loadValorisations', investmentId });
    }
  };
  const loadDebtCharacteristics = async () => {
    try {
      const {
        data: debtData,
        error
      } = await supabase.from('debt_characteristics').select('*, documents(id, name, file_path)').eq('asset_id', investmentId).eq('user_id', user?.id).maybeSingle();
      if (error) throw error;
      if (debtData) {
        const d: any = debtData;
        setDebtCharacteristics({
          id: debtData.id,
          montantInitial: debtData.montant_initial || 0,
          dureeMois: debtData.duree_mois || 0,
          taux: debtData.taux || 0,
          type: (debtData.type as 'Amortissement constant' | 'Annuité constante') || 'Annuité constante',
          amortissementAnnuel: debtData.amortissement_annuel || undefined,
          typeCredit: (d?.type_credit as 'Hypothécaire' | 'Lombard') ?? 'Hypothécaire',
          typeTaux: (d?.type_taux as 'Fixe' | 'Variable') ?? 'Fixe',
          marge: typeof d?.marge === 'number' ? d.marge : undefined,
          indiceBase: typeof d?.indice_base === 'string' ? d.indice_base : undefined,
          banque: d?.banque || undefined,
          echeance: (d?.echeance as 'Fixe' | 'Découvert') || undefined,
          base: (d?.base as 'OAT 10 ANS' | 'EURIBOR 3M' | 'EURIBOR 6M' | 'Fixe (0%)') || undefined,
          couvertureLtv: typeof d?.couverture_ltv === 'number' ? d.couverture_ltv : undefined,
          clauseArrosage: (d?.clause_arrosage as 'Oui' | 'Non') || undefined
        });
        
        // Load associated document if exists
        if (debtData.debt_document_id) {
          const { data: docData, error: docError } = await supabase
            .from('documents')
            .select('id, name, file_path')
            .eq('id', debtData.debt_document_id)
            .single();
            
          if (!docError && docData) {
            setDebtDocument(docData);
          }
        } else {
          setDebtDocument(null);
        }
      }
    } catch (error) {
      logError(error, { component: 'PerformanceTab', function: 'loadDebtCharacteristics', investmentId });
    }
  };
  const loadDebtFlows = async () => {
    try {
      // First get debt characteristics to get the debt_characteristics_id
      const debtCharacteristicsRes = await supabase.from('debt_characteristics').select('id').eq('asset_id', investmentId).eq('user_id', user?.id);
      
      if (debtCharacteristicsRes.error) throw debtCharacteristicsRes.error;
      
      let formattedFlows: DebtFlowRow[] = [];
      
      if (debtCharacteristicsRes.data && debtCharacteristicsRes.data.length > 0) {
        const debtCharacteristicsIds = debtCharacteristicsRes.data.map(dc => dc.id);
        
        const {
          data: flowData,
          error
        } = await supabase.from('debt_flows').select('*').in('debt_characteristics_id', debtCharacteristicsIds).eq('user_id', user?.id).order('date', {
          ascending: true
        });
        
        if (error) throw error;
        
        formattedFlows = flowData?.map(flow => ({
          id: flow.id,
          date: flow.date,
          capitalDebut: flow.capital_debut || 0,
          rmbtCapital: flow.rmbt_capital || 0,
          rmbtInteret: flow.rmbt_interet || 0
        })) || [];
      }
      
      setDebtFlows(formattedFlows);
    } catch (error) {
      logError(error, { component: 'PerformanceTab', function: 'loadDebtFlows', investmentId });
    }
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Helper functions for unified debt field handling
  const shouldShowField = (fieldConfig: typeof FIELD_CONFIG[0], data: DebtCharacteristics) => {
    return !fieldConfig.condition || fieldConfig.condition(data);
  };

  const formatFieldValue = (fieldConfig: typeof FIELD_CONFIG[0], value: any) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (fieldConfig.format) {
      return fieldConfig.format(value);
    }
    return String(value);
  };

  const renderEditField = (fieldConfig: typeof FIELD_CONFIG[0], value: any, onChange: (value: any) => void) => {
    switch (fieldConfig.type) {
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {fieldConfig.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'number':
      case 'percentage':
        return (
          <Input
            type="number"
            step={fieldConfig.step || '1'}
            placeholder={fieldConfig.placeholder || '0'}
            value={value || ''}
            onChange={e => onChange(fieldConfig.type === 'number' ? 
              (fieldConfig.key === 'dureeMois' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0) : 
              parseFloat(e.target.value) || 0
            )}
          />
        );
      case 'text':
        return (
          <Input
            type="text"
            placeholder={fieldConfig.placeholder || ''}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          />
        );
      default:
        return null;
    }
  };

  const renderDisplayField = (fieldConfig: typeof FIELD_CONFIG[0], value: any) => {
    return (
      <div className="font-medium text-lg">
        {formatFieldValue(fieldConfig, value)}
      </div>
    );
  };
  const calculateEBITDA = (cashflow: CashflowRow) => {
    return cashflow.rex + cashflow.retraitAmort + cashflow.retraitAutres;
  };
  const calculateCapitalFin = (flow: DebtFlowRow) => {
    return flow.capitalDebut - flow.rmbtCapital;
  };
  const calculateFlux = (flow: DebtFlowRow) => {
    return flow.rmbtCapital + flow.rmbtInteret;
  };

  // Calculate synthesis data by grouping all data by date
  const getSyntheseData = (): SyntheseRow[] => {
    const dateMap = new Map<string, SyntheseRow>();

    // Initialize all dates
    const allDates = new Set<string>();
    cashflows.forEach(cf => allDates.add(cf.date));
    immobilisations.forEach(immo => allDates.add(immo.date));
    debtFlows.forEach(df => allDates.add(df.date));
    valorisations.forEach(valo => allDates.add(valo.date));

    // Initialize all dates in map
    allDates.forEach(date => {
      dateMap.set(date, {
        date,
        flux: 0,
        valeur: 0,
        crd: 0,
        fp: 0
      });
    });

    // Add EBITDA from cashflows
    cashflows.forEach(cf => {
      const existing = dateMap.get(cf.date);
      if (existing) {
        existing.flux += calculateEBITDA(cf);
      }
    });

    // Add immobilisation amounts (subtract)
    immobilisations.forEach(immo => {
      const existing = dateMap.get(immo.date);
      if (existing) {
        existing.flux -= immo.montant;
      }
    });

    // Add debt flows and CRD (subtract debt flows)
    debtFlows.forEach(df => {
      const existing = dateMap.get(df.date);
      if (existing) {
        existing.flux -= calculateFlux(df);
        existing.crd = calculateCapitalFin(df);
      }
    });

    // Add valorisations
    valorisations.forEach(valo => {
      const existing = dateMap.get(valo.date);
      if (existing) {
        existing.valeur = valo.valeur;
      }
    });

    // Calculate FP = Valeur - CRD
    dateMap.forEach(row => {
      row.fp = row.valeur - row.crd;
    });
    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Get chart data grouped by year
  const getChartData = () => {
    const syntheseData = getSyntheseData();
    const yearMap = new Map<number, { year: number; cfni: number; valeur: number; varValeur: number; gain: number; fp: number }>();

    // First pass: Group data by year and calculate totals
    syntheseData.forEach((row) => {
      const year = new Date(row.date).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, { year, cfni: 0, valeur: 0, varValeur: 0, gain: 0, fp: 0 });
      }
      const yearData = yearMap.get(year)!;
      
      // Calculate CFNI for this row
      const cashflowDate = cashflows.find(cf => cf.date === row.date);
      const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
      const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
      const immobilisationAmount = immobilisationDate?.montant || 0;
      const noiAjuste = ebitda - immobilisationAmount;
      const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
      const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
      const cfni = noiAjuste - rmbtInteret;
      
      yearData.cfni += cfni;
      yearData.valeur = row.valeur; // Take the latest value for the year
      yearData.fp = row.fp; // Take the latest FP for the year
    });

    // Convert to array and sort by year
    const yearArray = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

    // Exclude the oldest year (first year in the sorted array)
    const filteredYearArray = yearArray.length > 1 ? yearArray.slice(1) : yearArray;

    // Second pass: Calculate varValeur and gain (Gain 1 = variationFP + CF)
    filteredYearArray.forEach((yearData, index) => {
      if (index > 0) {
        yearData.varValeur = yearData.valeur - filteredYearArray[index - 1].valeur;
        // Calculate CF (CFNI - rmbt capital) and Gain 1 = variationFP + CF
        const variationFP = yearData.fp - filteredYearArray[index - 1].fp;
        
        // Calculate CF for this year (sum of all CF for the year)
        let yearCF = 0;
        const yearDataFromSynthese = syntheseData.filter(row => new Date(row.date).getFullYear() === yearData.year);
        yearDataFromSynthese.forEach(row => {
          const cashflowDate = cashflows.find(cf => cf.date === row.date);
          const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
          const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
          const immobilisationAmount = immobilisationDate?.montant || 0;
          const noiAjuste = ebitda - immobilisationAmount;
          const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
          const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
          const rmbtCapital = debtFlowDate?.rmbtCapital || 0;
          const cfni = noiAjuste - rmbtInteret;
          const cf = cfni - rmbtCapital;
          yearCF += cf;
        });
        
        yearData.gain = variationFP + yearCF; // Gain 1 = Delta FP + CF
      } else if (yearArray.length > 1) {
        // For the first year in filtered array, compare with the excluded oldest year
        yearData.varValeur = yearData.valeur - yearArray[0].valeur;
        const variationFP = yearData.fp - yearArray[0].fp;
        
        // Calculate CF for this year
        let yearCF = 0;
        const yearDataFromSynthese = syntheseData.filter(row => new Date(row.date).getFullYear() === yearData.year);
        yearDataFromSynthese.forEach(row => {
          const cashflowDate = cashflows.find(cf => cf.date === row.date);
          const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
          const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
          const immobilisationAmount = immobilisationDate?.montant || 0;
          const noiAjuste = ebitda - immobilisationAmount;
          const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
          const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
          const rmbtCapital = debtFlowDate?.rmbtCapital || 0;
          const cfni = noiAjuste - rmbtInteret;
          const cf = cfni - rmbtCapital;
          yearCF += cf;
        });
        
        yearData.gain = variationFP + yearCF; // Gain 1 = Delta FP + CF
      } else {
        yearData.varValeur = 0;
        yearData.gain = 0;
      }
    });

    return filteredYearArray;
  };

  const chartConfig = {
    cfni: {
      label: "CFNI",
      color: "#2563eb", // Blue color for bars
    },
    varValeur: {
      label: "Var Valeur",
      color: "#ea580c", // Orange color for bars
    },
    gain: {
      label: "Gain", 
      color: "#06b6d4", // Cyan color for line
    },
    valeur: {
      label: "Valeur",
      color: "#10b981", // Green color for value line
    },
  };

  // CRUD functions for cashflows
  const addCashflow = () => {
    const currentYear = new Date().getFullYear();
    const newRow: CashflowRow = {
      date: `${currentYear}-12-31`,
      loyer: 0,
      rex: 0,
      retraitAmort: 0,
      retraitAutres: 0,
      note: ''
    };
    const newIndex = cashflows.length;
    setCashflows([...cashflows, newRow]);
    setEditingCashflow({
      index: newIndex,
      row: newRow
    });
  };
  const saveCashflow = async (row: CashflowRow) => {
    try {
      if (row.id) {
        const { error } = await supabase.from('immobilier_cashflows').update({
          date: row.date,
          loyer: row.loyer,
          rex: row.rex,
          retrait_amort: row.retraitAmort,
          retrait_autres: row.retraitAutres,
          note: row.note
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('immobilier_cashflows').insert({
          immobilier_id: investmentId,
          user_id: user?.id,
          date: row.date,
          loyer: row.loyer,
          rex: row.rex,
          retrait_amort: row.retraitAmort,
          retrait_autres: row.retraitAutres,
          note: row.note
        });
        if (error) throw error;
      }
      await loadCashflows();
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      setEditingCashflow(null);
      toast.success('Flux sauvegardé');
    } catch (error) {
      console.error('Error saving cashflow:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };
  const deleteCashflow = async (index: number) => {
    const row = cashflows[index];
    if (row.id) {
      try {
        const { error } = await supabase.from('immobilier_cashflows').delete().eq('id', row.id);
        if (error) throw error;
        await loadCashflows();
        notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
        toast.success('Flux supprimé');
      } catch (error) {
        console.error('Error deleting cashflow:', error);
        toast.error('Erreur lors de la suppression');
      }
    } else {
      setCashflows(cashflows.filter((_, i) => i !== index));
    }
    if (editingCashflow && editingCashflow.index === index) {
      setEditingCashflow(null);
    }
  };

  // CRUD functions for immobilisations
  const addImmobilisation = () => {
    const currentYear = new Date().getFullYear();
    const newRow: ImmobilisationRow = {
      date: `${currentYear}-12-31`,
      montant: 0,
      note: ''
    };
    const newIndex = immobilisations.length;
    setImmobilisations([...immobilisations, newRow]);
    setEditingImmo({
      index: newIndex,
      row: newRow
    });
  };
  const saveImmobilisation = async (row: ImmobilisationRow) => {
    try {
      if (row.id) {
        const { error } = await supabase.from('immobilier_immobilisations').update({
          date: row.date,
          montant: row.montant,
          note: row.note
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('immobilier_immobilisations').insert({
          immobilier_id: investmentId,
          user_id: user?.id,
          date: row.date,
          montant: row.montant,
          note: row.note
        });
        if (error) throw error;
      }
      await loadImmobilisations();
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      setEditingImmo(null);
      toast.success('Immobilisation sauvegardée');
    } catch (error) {
      console.error('Error saving immobilisation:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };
  const deleteImmobilisation = async (index: number) => {
    const row = immobilisations[index];
    if (row.id) {
      try {
        const { error } = await supabase.from('immobilier_immobilisations').delete().eq('id', row.id);
        if (error) throw error;
        await loadImmobilisations();
        notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
        toast.success('Immobilisation supprimée');
      } catch (error) {
        console.error('Error deleting immobilisation:', error);
        toast.error('Erreur lors de la suppression');
      }
    } else {
      setImmobilisations(immobilisations.filter((_, i) => i !== index));
    }
    if (editingImmo && editingImmo.index === index) {
      setEditingImmo(null);
    }
  };

  // CRUD functions for valorisations
  const addValorisation = () => {
    const currentYear = new Date().getFullYear();
    const newRow: ValorisationRow = {
      date: `${currentYear}-12-31`,
      valeur: 0,
      note: ''
    };
    const newIndex = valorisations.length;
    setValorisations([...valorisations, newRow]);
    setEditingValo({
      index: newIndex,
      row: newRow
    });
  };
  const saveValorisation = async (row: ValorisationRow) => {
    try {
      if (row.id) {
        const { error } = await supabase.from('immobilier_valorisations').update({
          date: row.date,
          valeur: row.valeur,
          note: row.note
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('immobilier_valorisations').insert({
          immobilier_id: investmentId,
          user_id: user?.id,
          date: row.date,
          valeur: row.valeur,
          note: row.note
        });
        if (error) throw error;
      }
      await loadValorisations();
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      setEditingValo(null);
      toast.success('Valorisation sauvegardée');
    } catch (error) {
      console.error('Error saving valorisation:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };
  const deleteValorisation = async (index: number) => {
    const row = valorisations[index];
    if (row.id) {
      try {
        const { error } = await supabase.from('immobilier_valorisations').delete().eq('id', row.id);
        if (error) throw error;
        await loadValorisations();
        notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
        toast.success('Valorisation supprimée');
      } catch (error) {
        console.error('Error deleting valorisation:', error);
        toast.error('Erreur lors de la suppression');
      }
    } else {
      setValorisations(valorisations.filter((_, i) => i !== index));
    }
    if (editingValo && editingValo.index === index) {
      setEditingValo(null);
    }
  };

  // CRUD functions for debt characteristics
  const saveDebtCharacteristics = async () => {
    try {
      if (debtCharacteristics.id) {
        const payload: any = {
          montant_initial: debtCharacteristics.montantInitial,
          duree_mois: debtCharacteristics.dureeMois,
          taux: debtCharacteristics.taux,
          type: debtCharacteristics.type,
          amortissement_annuel: debtCharacteristics.amortissementAnnuel,
          type_credit: debtCharacteristics.typeCredit,
          type_taux: debtCharacteristics.typeTaux,
          marge: debtCharacteristics.marge,
          indice_base: debtCharacteristics.indiceBase,
          banque: debtCharacteristics.banque,
          echeance: debtCharacteristics.echeance,
          base: debtCharacteristics.base,
          couverture_ltv: debtCharacteristics.couvertureLtv,
          clause_arrosage: debtCharacteristics.clauseArrosage
        };
        const { error } = await supabase
          .from('debt_characteristics')
          .update(payload)
          .eq('id', debtCharacteristics.id);
        if (error) throw error;
      } else {
        const payload: any = {
          asset_id: investmentId,
          asset_type: 'immobilier',
          user_id: user?.id,
          montant_initial: debtCharacteristics.montantInitial,
          duree_mois: debtCharacteristics.dureeMois,
          taux: debtCharacteristics.taux,
          type: debtCharacteristics.type,
          amortissement_annuel: debtCharacteristics.amortissementAnnuel,
          type_credit: debtCharacteristics.typeCredit,
          type_taux: debtCharacteristics.typeTaux,
          marge: debtCharacteristics.marge,
          indice_base: debtCharacteristics.indiceBase,
          banque: debtCharacteristics.banque,
          echeance: debtCharacteristics.echeance,
          base: debtCharacteristics.base,
          couverture_ltv: debtCharacteristics.couvertureLtv,
          clause_arrosage: debtCharacteristics.clauseArrosage
        };
        const { error } = await supabase
          .from('debt_characteristics')
          .insert(payload);
        if (error) throw error;
      }
      await loadDebtCharacteristics();
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      setEditingDebtCharacteristics(false);
      toast.success('Caractéristiques de dette sauvegardées');
    } catch (error) {
      console.error('Error saving debt characteristics:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const deleteDebtCharacteristics = async () => {
    if (!debtCharacteristics.id || !user) return;

    try {
      // First delete all associated debt flows
      const { error: flowsError } = await supabase
        .from('debt_flows')
        .delete()
        .eq('debt_characteristics_id', debtCharacteristics.id)
        .eq('user_id', user.id);

      if (flowsError) throw flowsError;

      // Then delete the debt characteristics
      const { error: debtError } = await supabase
        .from('debt_characteristics')
        .delete()
        .eq('id', debtCharacteristics.id)
        .eq('user_id', user.id);

      if (debtError) throw debtError;

      // Reset local state
      setDebtCharacteristics({
        montantInitial: 0,
        dureeMois: 0,
        taux: 0,
        type: 'Amortissement constant'
      });
      setDebtFlows([]);
      setEditingDebtCharacteristics(false);
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      
      toast.success('Dette supprimée avec succès');
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Erreur lors de la suppression de la dette');
    }
  };

  // CRUD functions for debt flows
  const addDebtFlow = () => {
    const currentYear = new Date().getFullYear();
    const newRow: DebtFlowRow = {
      date: `${currentYear}-12-31`,
      capitalDebut: 0,
      rmbtCapital: 0,
      rmbtInteret: 0
    };
    const newIndex = debtFlows.length;
    setDebtFlows([...debtFlows, newRow]);
    setEditingDebtFlow({
      index: newIndex,
      row: newRow
    });
  };
  const saveDebtFlow = async (row: DebtFlowRow) => {
    try {
      if (row.id) {
        const { error } = await supabase.from('debt_flows').update({
          date: row.date,
          capital_debut: row.capitalDebut,
          rmbt_capital: row.rmbtCapital,
          rmbt_interet: row.rmbtInteret
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        // Get debt characteristics ID first
        const debtCharacteristicsRes = await supabase.from('debt_characteristics').select('id').eq('asset_id', investmentId).eq('user_id', user?.id).maybeSingle();
        
        if (debtCharacteristicsRes.error) throw debtCharacteristicsRes.error;
        if (!debtCharacteristicsRes.data) {
          toast.error('Vous devez d\'abord sauvegarder les caractéristiques de dette');
          return;
        }
        
        const { error } = await supabase.from('debt_flows').insert({
          debt_characteristics_id: debtCharacteristicsRes.data.id,
          user_id: user?.id,
          date: row.date,
          capital_debut: row.capitalDebut,
          rmbt_capital: row.rmbtCapital,
          rmbt_interet: row.rmbtInteret
        });
        if (error) throw error;
      }
      await loadDebtFlows();
      notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
      setEditingDebtFlow(null);
      toast.success('Flux de dette sauvegardé');
    } catch (error) {
      console.error('Error saving debt flow:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };
  const deleteDebtFlow = async (index: number) => {
    const row = debtFlows[index];
    if (row.id) {
      try {
        const { error } = await supabase.from('debt_flows').delete().eq('id', row.id);
        if (error) throw error;
        await loadDebtFlows();
        notifyInvestmentDataChanged(investmentId); // Notify KPI refresh
        toast.success('Flux de dette supprimé');
      } catch (error) {
        console.error('Error deleting debt flow:', error);
        toast.error('Erreur lors de la suppression');
      }
    } else {
      setDebtFlows(debtFlows.filter((_, i) => i !== index));
    }
    if (editingDebtFlow && editingDebtFlow.index === index) {
      setEditingDebtFlow(null);
    }
  };

  // Debt document upload function
  const handleAddDebtDocument = () => {
    if (!user || !canEdit || !debtCharacteristics.id) return;

    // Create a hidden file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png';
    input.multiple = false; // Only allow single file
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      const file = files[0];
      setUploadingDebtFile(true);

      try {
        // Generate unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${user.id}/${investmentId}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('investment-documents')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
        }

        // Save metadata to database with 'debt' type
        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert({
            user_id: user.id,
            immobilier_id: investmentId,
            name: file.name,
            type: 'debt',
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          // Clean up uploaded file if database insert fails
          await supabase.storage
            .from('investment-documents')
            .remove([filePath]);
          throw new Error(`Erreur lors de l'enregistrement: ${dbError.message}`);
        }

        // Associate document with debt characteristics
        const { error: updateError } = await supabase
          .from('debt_characteristics')
          .update({ debt_document_id: document.id })
          .eq('id', debtCharacteristics.id);

        if (updateError) {
          console.error('Error updating debt characteristics:', updateError);
          // Clean up uploaded file and document if association fails
          await supabase.storage
            .from('investment-documents')
            .remove([filePath]);
          await supabase
            .from('documents')
            .delete()
            .eq('id', document.id);
          throw new Error(`Erreur lors de l'association: ${updateError.message}`);
        }

        // Update local state
        setDebtDocument({
          id: document.id,
          name: document.name,
          file_path: document.file_path
        });
        
        toastHook({
          title: "Document associé",
          description: `Le document "${file.name}" a été associé à la dette.`,
        });
      } catch (error) {
        console.error('Error uploading debt document:', error);
        toastHook({
          title: "Erreur",
          description: error instanceof Error ? error.message : "Erreur lors de l'ajout du document de dette.",
          variant: "destructive",
        });
      } finally {
        setUploadingDebtFile(false);
      }
    };
    
    input.click();
  };

  // Download debt document function
  const handleDownloadDebtDocument = async () => {
    if (!debtDocument) return;

    try {
      const { data, error } = await supabase.storage
        .from('investment-documents')
        .download(debtDocument.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = debtDocument.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toastHook({
        title: "Erreur",
        description: "Erreur lors du téléchargement du document.",
        variant: "destructive",
      });
    }
  };

  // Delete debt document function
  const handleDeleteDebtDocument = async () => {
    if (!debtDocument || !debtCharacteristics.id) return;

    try {
      // Remove association from debt characteristics
      const { error: updateError } = await supabase
        .from('debt_characteristics')
        .update({ debt_document_id: null })
        .eq('id', debtCharacteristics.id);

      if (updateError) throw updateError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('investment-documents')
        .remove([debtDocument.file_path]);

      if (storageError) console.error('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', debtDocument.id);

      if (dbError) throw dbError;

      // Update local state
      setDebtDocument(null);
      
      toastHook({
        title: "Document supprimé",
        description: "Le document a été supprimé avec succès.",
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toastHook({
        title: "Erreur",
        description: "Erreur lors de la suppression du document.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des données de performance...</p>
        </div>
      </div>;
  }

  // XIRR calculation function - Following Excel TRI.PAIEMENT structure
  const calculateXIRR = (syntheseData: SyntheseRow[]) => {
    if (syntheseData.length < 2) return 0;

    // Sort by date to ensure chronological order
    const sortedData = [...syntheseData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build cash flows following Excel TRI.PAIEMENT structure:
    // 1. Initial value: -FP (negative for investment) for oldest date
    // 2. Intermediate values: flux (cash flows)
    // 3. Final value: last flux + last FP (final cash flow + final value)
    const cashFlows: Array<{
      date: Date;
      value: number;
    }> = [];
    for (let i = 0; i < sortedData.length; i++) {
      const row = sortedData[i];
      const date = new Date(row.date + 'T00:00:00');
      if (i === 0) {
        // Initial investment: -FP (negative because it's an outflow)
        cashFlows.push({
          date,
          value: -row.fp
        });
      } else if (i === sortedData.length - 1) {
        // Final period: flux + FP (cash flow + final value)
        cashFlows.push({
          date,
          value: row.flux + row.fp
        });
      } else {
        // Intermediate periods: just the flux
        cashFlows.push({
          date,
          value: row.flux
        });
      }
    }

    // Newton-Raphson method for IRR calculation
    let rate = 0.1; // Initial guess 10%
    const maxIterations = 100;
    const tolerance = 0.0001;
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;
      const baseDate = cashFlows[0].date;
      for (const flow of cashFlows) {
        const years = (flow.date.getTime() - baseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        const factor = Math.pow(1 + rate, years);
        npv += flow.value / factor;
        dnpv -= flow.value * years / (factor * (1 + rate));
      }
      if (Math.abs(npv) < tolerance) {
        return rate * 100; // Return as percentage
      }
      if (Math.abs(dnpv) < tolerance) {
        break; // Avoid division by zero
      }
      const newRate = rate - npv / dnpv;
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate * 100;
      }
      rate = newRate;
    }
    return 0; // Return 0 if convergence fails
  };

  // Calculate KPI values from Synthèse data
  const syntheseData = getSyntheseData();
  const latestSynthese = syntheseData[syntheseData.length - 1];
  const oldestSynthese = syntheseData[0];

  // KPI calculations
  const fondPropre = latestSynthese?.fp || 0;
  const coc = latestSynthese?.fp && latestSynthese.fp > 0 ? latestSynthese.flux / latestSynthese.fp * 100 : 0;
  const ltv = latestSynthese?.valeur && latestSynthese.valeur > 0 ? latestSynthese.crd / latestSynthese.valeur * 100 : 0;

  // Calculate XIRR using the corrected Excel TRI.PAIEMENT formula
  const xirr = syntheseData.length > 1 ? calculateXIRR(syntheseData) : 0;

  // Calculate additional KPIs
  const latestCashflow = cashflows[cashflows.length - 1];
  const latestDebtFlow = debtFlows[debtFlows.length - 1];

  // Yield = flux / CRD à la date la plus récente
  const yield_ = latestSynthese?.crd && latestSynthese.crd !== 0 ? latestSynthese.flux / latestSynthese.crd * 100 : 0;

  // Cap Rate = flux / Valeur à la date la plus récente  
  const capRate = latestSynthese?.valeur && latestSynthese.valeur !== 0 ? latestSynthese.flux / latestSynthese.valeur * 100 : 0;

  // ICR = EBITDA le plus récent / Rmbt Intérêt le plus récent
  const latestEBITDA = latestCashflow ? calculateEBITDA(latestCashflow) : 0;
  const latestRmbtInteret = latestDebtFlow?.rmbtInteret || 0;
  const icr = latestRmbtInteret > 0 ? latestEBITDA / latestRmbtInteret : 0;

  // Total Gain Valeur = Valeur la plus récente - Valeur la plus ancienne
  const totalGainValeur = (latestSynthese?.valeur || 0) - (oldestSynthese?.valeur || 0);

  // Total Flux = Somme des flux
  const totalFlux = syntheseData.reduce((sum, item) => sum + (item.flux || 0), 0);

  // Total Earning = Total Gain Valeur + Total Flux
  const totalEarning = totalGainValeur + totalFlux;

  return (
    <div className="space-y-6">
      
      {/* Chart and Synthesis Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Synthèse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Version mobile/tablette - Stack vertical */}
            <div className="block lg:hidden">
              {/* Tableau en premier sur mobile */}
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <TooltipProvider delayDuration={0}>
                    <Table className="min-w-full text-xs">
                      <TableHeader>
                         <TableRow>
                           <TableHead className="text-xs text-center min-w-[80px]">Date</TableHead>
                           <TableHead className="text-xs text-center min-w-[80px]">Valeur</TableHead>
                           <TableHead className="text-xs text-center min-w-[70px]">FP</TableHead>
                            <TableHead className="text-xs text-center min-w-[90px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">NOI</TooltipTrigger>
                                <TooltipContent>
                                  <p>Net Operating Income</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                           <TableHead className="text-xs text-center min-w-[90px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Rend. net</TooltipTrigger>
                                <TooltipContent>
                                  <p>NOI / valeur</p>
                                </TooltipContent>
                              </Tooltip>
                           </TableHead>
                           <TableHead className="text-xs text-center min-w-[70px]">
                             <Tooltip>
                               <TooltipTrigger className="cursor-help">CFNI</TooltipTrigger>
                               <TooltipContent>
                                 <p>NOI ajusté après interet</p>
                               </TooltipContent>
                             </Tooltip>
                           </TableHead>
                           <TableHead className="text-xs text-center min-w-[80px]">
                             <Tooltip>
                               <TooltipTrigger className="cursor-help">COC net</TooltipTrigger>
                               <TooltipContent>
                                 <p>CFNI / FP</p>
                               </TooltipContent>
                             </Tooltip>
                           </TableHead>
                            <TableHead className="text-xs text-center min-w-[60px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">CF</TooltipTrigger>
                                <TooltipContent>
                                  <p>Cashflow</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center min-w-[70px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Δ Valeur</TooltipTrigger>
                                <TooltipContent>
                                  <p>Variation de valeur (n vs n-1)</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center min-w-[70px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Gain 1</TooltipTrigger>
                                <TooltipContent>
                                  <p>Delta FP + CF</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center min-w-[70px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Gain 2</TooltipTrigger>
                                <TooltipContent>
                                  <p>Delta valeur + CFNI</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center min-w-[80px]">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">Total Return</TooltipTrigger>
                                <TooltipContent>
                                  <p>Gain 1 / FP</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center min-w-[80px]">XIRR glissant</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getSyntheseData().map((row, index) => {
                             const syntheseData = getSyntheseData();
                             
                             // Calculs pour NOI ajusté (EBITDA - immobilisation)
                             const cashflowDate = cashflows.find(cf => cf.date === row.date);
                             const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
                             
                             const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
                             const immobilisationAmount = immobilisationDate?.montant || 0;
                             
                             const noiAjuste = ebitda - immobilisationAmount;
                             
                             // Calculs pour les autres métriques
                              const rendementNet = row.valeur > 0 ? (ebitda / row.valeur) * 100 : 0;
                             
                             const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
                             const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
                             const rmbtCapital = debtFlowDate?.rmbtCapital || 0;
                             
                             const cfni = noiAjuste - rmbtInteret;
                             const cocNet = row.fp > 0 ? (cfni / row.fp) * 100 : 0;
                             const cf = cfni - rmbtCapital;
                             
                             // Calculs pour les gains (variations par rapport à la ligne précédente)
                             const previousRow = index > 0 ? syntheseData[index - 1] : null;
                             const variationFP = previousRow ? row.fp - previousRow.fp : 0;
                             const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                             const gain1 = variationFP + cf; // Variation de FP + CF
                             const gain2 = variationValeur + cfni; // Variation de valeur + CFNI
                             
                           // Calcul XIRR glissant (depuis le début jusqu'à cette ligne)
                           const xirrGlissant = index > 0 ? calculateXIRR(syntheseData.slice(0, index + 1)) : 0;
                              
                              // Calcul Total Return = Gain 1 / FP
                              const totalReturn = row.fp > 0 ? (gain1 / row.fp) * 100 : 0;
                             
                             return <TableRow key={index}>
                               <TableCell className="font-medium text-xs text-center">
                                 {new Date(row.date).toLocaleDateString('fr-FR')}
                               </TableCell>
                               <TableCell className="financial-value font-medium text-xs text-center">
                                 {formatCurrency(row.valeur)}
                               </TableCell>
                               <TableCell className="financial-value font-medium text-xs text-center">
                                 {formatCurrency(row.fp)}
                               </TableCell>
                                <TableCell className={`financial-value font-medium text-xs text-center ${ebitda >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {ebitda >= 0 ? '+' : ''}{formatCurrency(ebitda)}
                               </TableCell>
                               <TableCell className="financial-value font-medium text-xs text-center">
                                 {formatPercentage(rendementNet)}
                               </TableCell>
                               <TableCell className={`financial-value font-medium text-xs text-center ${cfni >= 0 ? 'text-success' : 'text-destructive'}`}>
                                 {cfni >= 0 ? '+' : ''}{formatCurrency(cfni)}
                               </TableCell>
                               <TableCell className="financial-value font-medium text-xs text-center">
                                 {formatPercentage(cocNet)}
                               </TableCell>
                                <TableCell className={`financial-value font-medium text-xs text-center ${cf >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {cf >= 0 ? '+' : ''}{formatCurrency(cf)}
                                </TableCell>
                                <TableCell className={`financial-value text-xs text-center ${variationValeur >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {variationValeur >= 0 ? '+' : ''}{formatCurrency(variationValeur)}
                                </TableCell>
                                <TableCell className={`financial-value font-medium text-xs text-center ${gain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {gain1 >= 0 ? '+' : ''}{formatCurrency(gain1)}
                                </TableCell>
                                <TableCell className={`financial-value font-medium text-xs text-center ${gain2 >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {gain2 >= 0 ? '+' : ''}{formatCurrency(gain2)}
                                </TableCell>
                                <TableCell className={`financial-value text-xs text-center ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {totalReturn.toFixed(1)}%
                                </TableCell>
                                <TableCell className="financial-value font-medium text-xs text-center">
                                  {xirrGlissant.toFixed(1)}%
                                </TableCell>
                             </TableRow>;
                          })}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              </div>

              {/* Graphique en dessous sur mobile */}
              <div className="w-full">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={getChartData()}
                      margin={{
                        top: 20,
                        right: 5,
                        left: 10,
                        bottom: 80,
                      }}
                    >
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 9 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis 
                        yAxisId="bars"
                        orientation="left"
                        tick={{ fontSize: 9 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                        width={35}
                      />
                      <YAxis 
                        yAxisId="valeur"
                        orientation="right"
                        tick={{ fontSize: 9 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                        width={35}
                      />
                       <ChartTooltip 
                         content={
                           <ChartTooltipContent 
                             formatter={(value, name) => [
                               `${formatCurrency(Number(value))}`,
                               <span className="font-bold">
                                 {name === 'cfni' ? 'CFNI' : 
                                  name === 'varValeur' ? 'Var Valeur' : 
                                  name === 'gain' ? 'Gain' : 
                                  name === 'valeur' ? 'Valeur' : name}
                               </span>
                             ]}
                             labelFormatter={(label) => `Année ${label}`}
                           />
                         }
                       />
                      <Legend 
                        align="center" 
                        verticalAlign="bottom" 
                        layout="horizontal"
                        wrapperStyle={{ paddingTop: '10px', fontSize: '9px' }}
                      />
                      <Bar 
                        yAxisId="bars"
                        dataKey="cfni" 
                        fill="#2563eb"
                        name="CFNI"
                      />
                      <Bar 
                        yAxisId="bars"
                        dataKey="varValeur" 
                        fill="#ea580c"
                        name="Var Valeur"
                      />
                      <Line 
                        yAxisId="bars"
                        type="monotone" 
                        dataKey="gain" 
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ fill: "#06b6d4", strokeWidth: 1, r: 3 }}
                        name="Gain"
                      />
                      <Line 
                        yAxisId="valeur"
                        type="monotone" 
                        dataKey="valeur" 
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 1, r: 3 }}
                        name="Valeur"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>

            {/* Version desktop - stack vertical */}
            <div className="hidden lg:block">
              {/* Tableau en premier */}
              <div className="mb-6">
                <div className="max-h-[400px] overflow-y-auto">
                  <TooltipProvider delayDuration={0}>
                    <Table>
                       <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs text-center">Date</TableHead>
                            <TableHead className="text-xs text-center">Valeur</TableHead>
                            <TableHead className="text-xs text-center">FP</TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">NOI</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Net Operating Income</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                            <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">Rendement net</TooltipTrigger>
                                 <TooltipContent>
                                   <p>NOI / valeur</p>
                                 </TooltipContent>
                               </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">CFNI</TooltipTrigger>
                                <TooltipContent>
                                   <p>NOI net des immos et interet</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                            <TableHead className="text-xs text-center">
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">COC net</TooltipTrigger>
                                <TooltipContent>
                                  <p>CFNI / FP</p>
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">CF</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Cashflow</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">Δ Valeur</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Variation de valeur (n vs n-1)</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">Gain 1</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Delta FP + CF</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">Gain 2</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Delta valeur + CFNI</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                             <TableHead className="text-xs text-center">
                               <Tooltip>
                                 <TooltipTrigger className="cursor-help">Total Return</TooltipTrigger>
                                 <TooltipContent>
                                   <p>Gain 1 / FP</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TableHead>
                             <TableHead className="text-xs text-center">XIRR glissant</TableHead>
                          </TableRow>
                       </TableHeader>
                  <TableBody>
                      {getSyntheseData().map((row, index) => {
                         const syntheseData = getSyntheseData();
                         
                         // Calculs pour NOI ajusté (EBITDA - immobilisation)
                         const cashflowDate = cashflows.find(cf => cf.date === row.date);
                         const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
                         
                         const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
                         const immobilisationAmount = immobilisationDate?.montant || 0;
                         
                         const noiAjuste = ebitda - immobilisationAmount;
                         
                         // Calculs pour les autres métriques
                         const rendementNet = row.valeur > 0 ? (ebitda / row.valeur) * 100 : 0;
                         
                         const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
                         const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
                         const rmbtCapital = debtFlowDate?.rmbtCapital || 0;
                         
                         const cfni = noiAjuste - rmbtInteret;
                         const cocNet = row.fp > 0 ? (cfni / row.fp) * 100 : 0;
                         const cf = cfni - rmbtCapital;
                         
                         // Calculs pour les gains (variations par rapport à la ligne précédente)
                         const previousRow = index > 0 ? syntheseData[index - 1] : null;
                         const variationFP = previousRow ? row.fp - previousRow.fp : 0;
                         const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                         const gain1 = variationFP + cf; // Variation de FP + CF
                         const gain2 = variationValeur + cfni; // Variation de valeur + CFNI
                         
                          // Calcul XIRR glissant (depuis le début jusqu'à cette ligne)
                          const xirrGlissant = index > 0 ? calculateXIRR(syntheseData.slice(0, index + 1)) : 0;
                          
                          // Calcul Total Return = Gain 1 / FP
                          const totalReturn = row.fp > 0 ? (gain1 / row.fp) * 100 : 0;
                         
                         return <TableRow key={index}>
                           <TableCell className="font-medium text-xs text-center">
                             {new Date(row.date).toLocaleDateString('fr-FR')}
                           </TableCell>
                           <TableCell className="financial-value font-medium text-xs text-center">
                             {formatCurrency(row.valeur)}
                           </TableCell>
                           <TableCell className="financial-value font-medium text-xs text-center">
                             {formatCurrency(row.fp)}
                           </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${ebitda >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {ebitda >= 0 ? '+' : ''}{formatCurrency(ebitda)}
                           </TableCell>
                           <TableCell className={`financial-value text-xs text-center ${rendementNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {rendementNet.toFixed(1)}%
                           </TableCell>
                           <TableCell className={`financial-value text-xs text-center ${cfni >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {cfni >= 0 ? '+' : ''}{formatCurrency(cfni)}
                           </TableCell>
                           <TableCell className={`financial-value text-xs text-center ${cocNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {cocNet.toFixed(1)}%
                           </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${cf >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {cf >= 0 ? '+' : ''}{formatCurrency(cf)}
                            </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${variationValeur >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {variationValeur >= 0 ? '+' : ''}{formatCurrency(variationValeur)}
                            </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${gain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {gain1 >= 0 ? '+' : ''}{formatCurrency(gain1)}
                            </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${gain2 >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {gain2 >= 0 ? '+' : ''}{formatCurrency(gain2)}
                            </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {totalReturn.toFixed(1)}%
                            </TableCell>
                            <TableCell className={`financial-value text-xs text-center ${xirrGlissant >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {xirrGlissant.toFixed(1)}%
                            </TableCell>
                         </TableRow>
                       })}
                       {getSyntheseData().length === 0 && <TableRow>
                            <TableCell colSpan={13} className="text-center py-8 text-muted-foreground text-xs">
                              Aucune donnée disponible pour la synthèse
                            </TableCell>
                         </TableRow>}
                       {/* Ligne Total */}
                       {getSyntheseData().length > 0 && (() => {
                         const syntheseData = getSyntheseData();
                         
                          // Calculer les totaux pour NOI ajusté, CFNI, CF, Gain1 et Gain2
                           // Et les moyennes pour Rendement net, COC net et Total Return
                           // Et la somme pour Δ Valeur
                           let totalNoi = 0;
                           let totalCfni = 0;
                           let totalCf = 0;
                           let totalGain1 = 0;
                           let totalGain2 = 0;
                           let totalVariationValeur = 0;
                           let sumRendementNet = 0;
                           let sumCocNet = 0;
                           let sumTotalReturn = 0;
                           let countRendementNet = 0;
                           let countCocNet = 0;
                           let countTotalReturn = 0;
                         
                          syntheseData.forEach((row, index) => {
                            // Calculs pour NOI ajusté (EBITDA - immobilisation)
                            const cashflowDate = cashflows.find(cf => cf.date === row.date);
                            const ebitda = cashflowDate ? calculateEBITDA(cashflowDate) : 0;
                            
                            const immobilisationDate = immobilisations.find(immo => immo.date === row.date);
                            const immobilisationAmount = immobilisationDate?.montant || 0;
                            
                            const noiAjuste = ebitda - immobilisationAmount;
                            
                            const debtFlowDate = debtFlows.find(debt => debt.date === row.date);
                            const rmbtInteret = debtFlowDate?.rmbtInteret || 0;
                            const rmbtCapital = debtFlowDate?.rmbtCapital || 0;
                            
                            const cfni = noiAjuste - rmbtInteret;
                            const cf = cfni - rmbtCapital;
                            
                            // Calculs pour les gains
                            const previousRow = index > 0 ? syntheseData[index - 1] : null;
                            const variationFP = previousRow ? row.fp - previousRow.fp : 0;
                            const variationValeur = previousRow ? row.valeur - previousRow.valeur : 0;
                            const gain1 = variationFP + cf;
                            const gain2 = variationValeur + cfni;
                            
                            // Calculs pour les moyennes
                            const rendementNet = row.valeur > 0 ? (ebitda / row.valeur) * 100 : 0;
                            const cocNet = row.fp > 0 ? (cfni / row.fp) * 100 : 0;
                            const totalReturn = row.fp > 0 ? (gain1 / row.fp) * 100 : 0;
                            
                            totalNoi += ebitda;
                            totalCfni += cfni;
                            totalCf += cf;
                             totalGain1 += gain1;
                             totalGain2 += gain2;
                             totalVariationValeur += variationValeur;
                             
                             // Ajouter aux moyennes seulement si la valeur n'est pas 0
                             if (rendementNet !== 0) {
                               sumRendementNet += rendementNet;
                               countRendementNet++;
                             }
                             if (cocNet !== 0) {
                               sumCocNet += cocNet;
                               countCocNet++;
                             }
                             if (totalReturn !== 0) {
                               sumTotalReturn += totalReturn;
                               countTotalReturn++;
                             }
                          });
                          
                           // Calculer les moyennes en excluant les valeurs à 0
                           const avgRendementNet = countRendementNet > 0 ? sumRendementNet / countRendementNet : 0;
                           const avgCocNet = countCocNet > 0 ? sumCocNet / countCocNet : 0;
                           const avgTotalReturn = countTotalReturn > 0 ? sumTotalReturn / countTotalReturn : 0;
                          
                          return (
                            <TableRow className="border-t-2 border-border bg-muted/30">
                              <TableCell className="font-bold text-xs text-center">
                                Total
                              </TableCell>
                              <TableCell className="financial-value text-xs text-center">
                                {/* Pas de total pour la Valeur */}
                              </TableCell>
                              <TableCell className="financial-value text-xs text-center">
                                {/* Pas de total pour le FP */}
                              </TableCell>
                               <TableCell className={`financial-value font-bold text-xs text-center ${totalNoi >= 0 ? 'text-success' : 'text-destructive'}`}>
                                 {totalNoi >= 0 ? '+' : ''}{formatCurrency(totalNoi)}
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${avgRendementNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {avgRendementNet.toFixed(1)}%
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${totalCfni >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {totalCfni >= 0 ? '+' : ''}{formatCurrency(totalCfni)}
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${avgCocNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {avgCocNet.toFixed(1)}%
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${totalCf >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {totalCf >= 0 ? '+' : ''}{formatCurrency(totalCf)}
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${totalVariationValeur >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {totalVariationValeur >= 0 ? '+' : ''}{formatCurrency(totalVariationValeur)}
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${totalGain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {totalGain1 >= 0 ? '+' : ''}{formatCurrency(totalGain1)}
                              </TableCell>
                              <TableCell className="financial-value text-xs text-center">
                                {/* Rien pour Gain 2 */}
                              </TableCell>
                              <TableCell className={`financial-value font-bold text-xs text-center ${avgTotalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {avgTotalReturn.toFixed(1)}%
                              </TableCell>
                              <TableCell className="financial-value text-xs text-center">
                                {/* Pas de total pour le XIRR glissant */}
                              </TableCell>
                            </TableRow>
                          );
                      })()}
                   </TableBody>
                     </Table>
                   </TooltipProvider>
                 </div>
               </div>

              {/* Graphique en dessous - pleine largeur */}
              <div className="w-full">
                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={getChartData()}
                      margin={{
                        top: 20,
                        right: 0,
                        left: 15,
                        bottom: 80,
                      }}
                    >
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 10 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis 
                        yAxisId="bars"
                        orientation="left"
                        tick={{ fontSize: 10 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                        width={40}
                      />
                      <YAxis 
                        yAxisId="valeur"
                        orientation="right"
                        tick={{ fontSize: 10 }}
                        tickLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`}
                        width={40}
                      />
                       <ChartTooltip 
                         content={
                           <ChartTooltipContent 
                             formatter={(value, name) => [
                               `${formatCurrency(Number(value))}`,
                               <span className="font-bold">
                                 {name === 'cfni' ? 'CFNI' : 
                                  name === 'varValeur' ? 'Var Valeur' : 
                                  name === 'gain' ? 'Gain' : 
                                  name === 'valeur' ? 'Valeur' : name}
                               </span>
                             ]}
                             labelFormatter={(label) => `Année ${label}`}
                           />
                         }
                       />
                      <Legend 
                        align="center" 
                        verticalAlign="bottom" 
                        layout="horizontal"
                        wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }}
                      />
                      <Bar 
                        yAxisId="bars"
                        dataKey="cfni" 
                        fill="#2563eb"
                        name="CFNI"
                      />
                      <Bar 
                        yAxisId="bars"
                        dataKey="varValeur" 
                        fill="#ea580c"
                        name="Var Valeur"
                      />
                      <Line 
                        yAxisId="bars"
                        type="monotone" 
                        dataKey="gain" 
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ fill: "#06b6d4", strokeWidth: 1, r: 3 }}
                        name="Gain"
                      />
                      <Line 
                        yAxisId="valeur"
                        type="monotone" 
                        dataKey="valeur" 
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 1, r: 3 }}
                        name="Valeur"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historique Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Section 1: Compte de Résultat */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Compte de Résultat</h3>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Loyer</TableHead>
                   <TableHead>REX</TableHead>
                   <TableHead>Retrait Amort</TableHead>
                   <TableHead>Retrait Autres</TableHead>
                   <TableHead>NOI</TableHead>
                   <TableHead>NOI sur loyer</TableHead>
                   <TableHead>Commentaire</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashflows.map((cashflow, index) => <TableRow key={index}>
                    <TableCell>
                       {editingCashflow && editingCashflow.index === index ? <YearPicker value={editingCashflow.row.date} onChange={(date) => setEditingCashflow({
                    ...editingCashflow,
                    row: {
                      ...editingCashflow.row,
                      date: date
                    }
                   })} /> : new Date(cashflow.date).toLocaleDateString('fr-FR')}
                     </TableCell>
                     <TableCell>
                       {editingCashflow && editingCashflow.index === index ? <Input type="number" value={editingCashflow.row.loyer} onChange={e => setEditingCashflow({
                     ...editingCashflow,
                     row: {
                       ...editingCashflow.row,
                       loyer: parseFloat(e.target.value) || 0
                     }
                   })} /> : formatCurrency(cashflow.loyer)}
                     </TableCell>
                     <TableCell>
                       {editingCashflow && editingCashflow.index === index ? <Input type="number" value={editingCashflow.row.rex} onChange={e => setEditingCashflow({
                    ...editingCashflow,
                    row: {
                      ...editingCashflow.row,
                      rex: parseFloat(e.target.value) || 0
                    }
                  })} /> : formatCurrency(cashflow.rex)}
                    </TableCell>
                    <TableCell>
                      {editingCashflow && editingCashflow.index === index ? <Input type="number" value={editingCashflow.row.retraitAmort} onChange={e => setEditingCashflow({
                    ...editingCashflow,
                    row: {
                      ...editingCashflow.row,
                      retraitAmort: parseFloat(e.target.value) || 0
                    }
                  })} /> : formatCurrency(cashflow.retraitAmort)}
                    </TableCell>
                    <TableCell>
                      {editingCashflow && editingCashflow.index === index ? <Input type="number" value={editingCashflow.row.retraitAutres} onChange={e => setEditingCashflow({
                    ...editingCashflow,
                    row: {
                      ...editingCashflow.row,
                      retraitAutres: parseFloat(e.target.value) || 0
                    }
                  })} /> : formatCurrency(cashflow.retraitAutres)}
                     </TableCell>
                     <TableCell className={`financial-value font-medium ${calculateEBITDA(editingCashflow && editingCashflow.index === index ? editingCashflow.row : cashflow) >= 0 ? 'text-success' : 'text-destructive'}`}>
                       {calculateEBITDA(editingCashflow && editingCashflow.index === index ? editingCashflow.row : cashflow) >= 0 ? '+' : ''}
                       {formatCurrency(calculateEBITDA(editingCashflow && editingCashflow.index === index ? editingCashflow.row : cashflow))}
                     </TableCell>
                      <TableCell className="financial-value font-medium">
                        {cashflow.loyer && cashflow.loyer > 0 
                          ? `${((calculateEBITDA(editingCashflow && editingCashflow.index === index ? editingCashflow.row : cashflow) / cashflow.loyer) * 100).toFixed(1)}%` 
                          : 'N/A'}
                       </TableCell>
                     <TableCell>
                       {editingCashflow && editingCashflow.index === index ? 
                         <Input 
                           type="text" 
                           value={editingCashflow.row.note} 
                           onChange={e => setEditingCashflow({
                             ...editingCashflow,
                             row: {
                               ...editingCashflow.row,
                               note: e.target.value
                             }
                           })} 
                           placeholder="Commentaire..."
                         /> : 
                         <span className="text-muted-foreground">{cashflow.note || '-'}</span>
                       }
                     </TableCell>
                     <TableCell>
                      <div className="flex items-center gap-2">
                        {editingCashflow && editingCashflow.index === index ? <Button size="sm" variant="ghost" onClick={() => saveCashflow(editingCashflow.row)} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4 text-success" />
                          </Button> : <Button size="sm" variant="ghost" onClick={() => setEditingCashflow({
                      index,
                      row: {
                        ...cashflow
                      }
                    })} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteCashflow(index)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
              <Button onClick={addCashflow} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
          </div>

          <Separator />

          {/* Section 2: Immobilisation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Immobilisation</h3>
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Montant</TableHead>
                   <TableHead>Commentaire</TableHead>
                   <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {immobilisations.map((immo, index) => <TableRow key={index}>
                    <TableCell>
                       {editingImmo && editingImmo.index === index ? <YearPicker value={editingImmo.row.date} onChange={(date) => setEditingImmo({
                    ...editingImmo,
                    row: {
                      ...editingImmo.row,
                      date: date
                    }
                   })} /> : new Date(immo.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {editingImmo && editingImmo.index === index ? <Input type="number" value={editingImmo.row.montant} onChange={e => setEditingImmo({
                    ...editingImmo,
                    row: {
                      ...editingImmo.row,
                      montant: parseFloat(e.target.value) || 0
                    }
                  })} /> : formatCurrency(immo.montant)}
                    </TableCell>
                    <TableCell>
                      {editingImmo && editingImmo.index === index ? <Textarea value={editingImmo.row.note} onChange={e => setEditingImmo({
                    ...editingImmo,
                    row: {
                      ...editingImmo.row,
                      note: e.target.value
                    }
                  })} className="min-h-[60px]" /> : <div className="max-w-xs truncate">{immo.note}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingImmo && editingImmo.index === index ? <Button size="sm" variant="ghost" onClick={() => saveImmobilisation(editingImmo.row)} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4 text-success" />
                          </Button> : <Button size="sm" variant="ghost" onClick={() => setEditingImmo({
                      index,
                      row: {
                        ...immo
                      }
                    })} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteImmobilisation(index)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
              <Button onClick={addImmobilisation} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
          </div>

          <Separator />

          {/* Section 3: Valorisation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Valorisation</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valorisations.map((valo, index) => <TableRow key={index}>
                    <TableCell>
                       {editingValo && editingValo.index === index ? <YearPicker value={editingValo.row.date} onChange={(date) => setEditingValo({
                    ...editingValo,
                    row: {
                      ...editingValo.row,
                      date: date
                    }
                   })} /> : new Date(valo.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {editingValo && editingValo.index === index ? <Input type="number" value={editingValo.row.valeur} onChange={e => setEditingValo({
                    ...editingValo,
                    row: {
                      ...editingValo.row,
                      valeur: parseFloat(e.target.value) || 0
                    }
                  })} /> : formatCurrency(valo.valeur)}
                    </TableCell>
                    <TableCell>
                      {editingValo && editingValo.index === index ? <Textarea value={editingValo.row.note} onChange={e => setEditingValo({
                    ...editingValo,
                    row: {
                      ...editingValo.row,
                      note: e.target.value
                    }
                  })} className="min-h-[60px]" /> : <div className="text-sm leading-tight line-clamp-2">{valo.note}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {editingValo && editingValo.index === index ? <Button size="sm" variant="ghost" onClick={() => saveValorisation(editingValo.row)} className="h-8 w-8 p-0">
                            <Save className="h-4 w-4 text-success" />
                          </Button> : <Button size="sm" variant="ghost" onClick={() => setEditingValo({
                      index,
                      row: {
                        ...valo
                      }
                    })} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>}
                        <Button size="sm" variant="ghost" onClick={() => deleteValorisation(index)} className="h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-center">
              <Button onClick={addValorisation} variant="outline" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
          </div>

          <Separator />
        </CardContent>
      </Card>

      {/* Section Dette */}
      {debtCharacteristics.id ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dette
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Section 1: Caractéristiques */}
            <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Caractéristiques</h3>
              <div className="flex items-center gap-2">
                {editingDebtCharacteristics ? (
                  <Button onClick={saveDebtCharacteristics} size="sm" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Sauvegarder
                  </Button>
                ) : (
                  <>
                    {canEdit && (
                      debtDocument ? (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-2" 
                            onClick={handleDownloadDebtDocument}
                          >
                            <FileText className="h-4 w-4" />
                            {debtDocument.name}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex items-center gap-2 text-destructive hover:text-destructive" 
                            onClick={handleDeleteDebtDocument}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-2" 
                          onClick={handleAddDebtDocument}
                          disabled={uploadingDebtFile}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadingDebtFile ? 'Upload...' : 'Associer fichier'}
                        </Button>
                      )
                    )}
                    <Button onClick={() => setEditingDebtCharacteristics(true)} size="sm" variant="outline" className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                    <Button onClick={deleteDebtCharacteristics} size="sm" variant="destructive" className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </>
                )}
              </div>
            </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {FIELD_CONFIG.filter(fieldConfig => shouldShowField(fieldConfig, debtCharacteristics)).map(fieldConfig => (
                  <div key={fieldConfig.key} className="space-y-2">
                    <label className="text-sm font-medium">{fieldConfig.label}</label>
                    {editingDebtCharacteristics ? 
                      renderEditField(fieldConfig, (debtCharacteristics as any)[fieldConfig.key], (value) => 
                        setDebtCharacteristics(prev => ({
                          ...prev,
                          [fieldConfig.key]: value,
                          // Handle special cases for dependent fields
                          ...(fieldConfig.key === 'type' && value !== 'Amortissement constant' ? { amortissementAnnuel: undefined } : {}),
                        }))
                      ) : 
                      renderDisplayField(fieldConfig, (debtCharacteristics as any)[fieldConfig.key])
                    }
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Section 2: Flux */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Flux</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Capital Début</TableHead>
                    <TableHead>Rmbt Capital</TableHead>
                    <TableHead>Rmbt Intérêt</TableHead>
                    <TableHead>Flux</TableHead>
                    <TableHead>Capital Fin</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtFlows.map((flow, index) => <TableRow key={index}>
                      <TableCell>
                         {editingDebtFlow && editingDebtFlow.index === index ? <YearPicker value={editingDebtFlow.row.date} onChange={(date) => setEditingDebtFlow({
                      ...editingDebtFlow,
                      row: {
                        ...editingDebtFlow.row,
                        date: date
                      }
                     })} /> : new Date(flow.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {editingDebtFlow && editingDebtFlow.index === index ? <Input type="number" value={editingDebtFlow.row.capitalDebut} onChange={e => setEditingDebtFlow({
                      ...editingDebtFlow,
                      row: {
                        ...editingDebtFlow.row,
                        capitalDebut: parseFloat(e.target.value) || 0
                      }
                    })} /> : formatCurrency(flow.capitalDebut)}
                      </TableCell>
                      <TableCell>
                        {editingDebtFlow && editingDebtFlow.index === index ? <Input type="number" value={editingDebtFlow.row.rmbtCapital} onChange={e => setEditingDebtFlow({
                      ...editingDebtFlow,
                      row: {
                        ...editingDebtFlow.row,
                        rmbtCapital: parseFloat(e.target.value) || 0
                      }
                    })} /> : formatCurrency(flow.rmbtCapital)}
                      </TableCell>
                      <TableCell>
                        {editingDebtFlow && editingDebtFlow.index === index ? <Input type="number" value={editingDebtFlow.row.rmbtInteret} onChange={e => setEditingDebtFlow({
                      ...editingDebtFlow,
                      row: {
                        ...editingDebtFlow.row,
                        rmbtInteret: parseFloat(e.target.value) || 0
                      }
                    })} /> : formatCurrency(flow.rmbtInteret)}
                      </TableCell>
                      <TableCell className="financial-value font-medium">
                        {formatCurrency(calculateFlux(editingDebtFlow && editingDebtFlow.index === index ? editingDebtFlow.row : flow))}
                      </TableCell>
                      <TableCell className="financial-value font-medium">
                        {formatCurrency(calculateCapitalFin(editingDebtFlow && editingDebtFlow.index === index ? editingDebtFlow.row : flow))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {editingDebtFlow && editingDebtFlow.index === index ? <Button size="sm" variant="ghost" onClick={() => saveDebtFlow(editingDebtFlow.row)} className="h-8 w-8 p-0">
                              <Save className="h-4 w-4 text-success" />
                            </Button> : <Button size="sm" variant="ghost" onClick={() => setEditingDebtFlow({
                        index,
                        row: {
                          ...flow
                        }
                      })} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>}
                          <Button size="sm" variant="ghost" onClick={() => deleteDebtFlow(index)} className="h-8 w-8 p-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-center">
                <Button onClick={addDebtFlow} variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter une ligne
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Dette
            </CardTitle>
            {canEdit && (
              <Button 
                size="sm" 
                onClick={() => setEditingDebtCharacteristics(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Configurer
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {editingDebtCharacteristics ? (
              <div className="p-4 border rounded-lg bg-accent/20">
                <h3 className="text-lg font-semibold mb-4">Configuration de la dette</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {FIELD_CONFIG.filter(fieldConfig => shouldShowField(fieldConfig, debtCharacteristics)).map(fieldConfig => (
                      <div key={fieldConfig.key} className="space-y-2">
                        <label className="text-sm font-medium">{fieldConfig.label}</label>
                        {renderEditField(fieldConfig, (debtCharacteristics as any)[fieldConfig.key], (value) => 
                          setDebtCharacteristics(prev => ({
                            ...prev,
                            [fieldConfig.key]: value,
                            // Handle special cases for dependent fields
                            ...(fieldConfig.key === 'type' && value !== 'Amortissement constant' ? { amortissementAnnuel: undefined } : {}),
                          }))
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                 <div className="flex gap-2 mt-6">
                   <Button onClick={saveDebtCharacteristics} size="sm" className="flex items-center gap-2">
                     <Save className="h-4 w-4" />
                     Sauvegarder
                   </Button>
                   <Button onClick={() => setEditingDebtCharacteristics(false)} size="sm" variant="outline">
                     Annuler
                   </Button>
                 </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune dette configurée</p>
                <p className="text-sm mt-2">Configurez les caractéristiques de dette pour ce bien</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}