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
import { useInvestments } from '@/contexts/InvestmentContext';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Calendar, Plus, Trash2, Edit, Save, CreditCard, BarChart3, TrendingDown as TrendIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { YearPicker } from '@/components/ui/year-picker';
interface CashflowRow {
  id?: string;
  date: string;
  loyer: number;
  rex: number;
  retraitAmort: number;
  retraitAutres: number;
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
interface DebtCharacteristics {
  id?: string;
  montantInitial: number;
  dureeMois: number;
  taux: number;
  type: 'Amortissement constant' | 'Annuité constante';
  amortissementAnnuel?: number;
}
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
  const { notifyInvestmentDataChanged } = useInvestments();

  // Data arrays
  const [cashflows, setCashflows] = useState<CashflowRow[]>([]);
  const [immobilisations, setImmobilisations] = useState<ImmobilisationRow[]>([]);
  const [valorisations, setValorisations] = useState<ValorisationRow[]>([]);
  const [debtCharacteristics, setDebtCharacteristics] = useState<DebtCharacteristics>({
    montantInitial: 0,
    dureeMois: 0,
    taux: 0,
    type: 'Amortissement constant'
  });
  const [debtFlows, setDebtFlows] = useState<DebtFlowRow[]>([]);

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
      } = await supabase.from('investment_cashflows').select('*').eq('investment_id', investmentId).eq('user_id', user?.id).order('date', {
        ascending: true
      });
      if (error) throw error;
      const formattedCashflows = cashflowData?.map(cf => ({
        id: cf.id,
        date: cf.date,
        loyer: cf.loyer || 0,
        rex: cf.rex || 0,
        retraitAmort: cf.retrait_amort || 0,
        retraitAutres: cf.retrait_autres || 0
      })) || [];
      setCashflows(formattedCashflows);
    } catch (error) {
      console.error('Error loading cashflows:', error);
    }
  };
  const loadImmobilisations = async () => {
    try {
      const {
        data: immoData,
        error
      } = await supabase.from('investment_immobilisations').select('*').eq('investment_id', investmentId).eq('user_id', user?.id).order('date', {
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
      console.error('Error loading immobilisations:', error);
    }
  };
  const loadValorisations = async () => {
    try {
      const {
        data: valoData,
        error
      } = await supabase.from('investment_valorisations').select('*').eq('investment_id', investmentId).eq('user_id', user?.id).order('date', {
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
      console.error('Error loading valorisations:', error);
    }
  };
  const loadDebtCharacteristics = async () => {
    try {
      const {
        data: debtData,
        error
      } = await supabase.from('investment_debt_characteristics').select('*').eq('investment_id', investmentId).eq('user_id', user?.id).maybeSingle();
      if (error) throw error;
      if (debtData) {
        setDebtCharacteristics({
          id: debtData.id,
          montantInitial: debtData.montant_initial || 0,
          dureeMois: debtData.duree_mois || 0,
          taux: debtData.taux || 0,
          type: debtData.type as 'Amortissement constant' | 'Annuité constante' || 'Amortissement constant',
          amortissementAnnuel: debtData.amortissement_annuel || undefined
        });
      }
    } catch (error) {
      console.error('Error loading debt characteristics:', error);
    }
  };
  const loadDebtFlows = async () => {
    try {
      const {
        data: flowData,
        error
      } = await supabase.from('investment_debt_flows').select('*').eq('investment_id', investmentId).eq('user_id', user?.id).order('date', {
        ascending: true
      });
      if (error) throw error;
      const formattedFlows = flowData?.map(flow => ({
        id: flow.id,
        date: flow.date,
        capitalDebut: flow.capital_debut || 0,
        rmbtCapital: flow.rmbt_capital || 0,
        rmbtInteret: flow.rmbt_interet || 0
      })) || [];
      setDebtFlows(formattedFlows);
    } catch (error) {
      console.error('Error loading debt flows:', error);
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
      retraitAutres: 0
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
        const { error } = await supabase.from('investment_cashflows').update({
          date: row.date,
          loyer: row.loyer,
          rex: row.rex,
          retrait_amort: row.retraitAmort,
          retrait_autres: row.retraitAutres
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_cashflows').insert({
          investment_id: investmentId,
          user_id: user?.id,
          date: row.date,
          loyer: row.loyer,
          rex: row.rex,
          retrait_amort: row.retraitAmort,
          retrait_autres: row.retraitAutres
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
        const { error } = await supabase.from('investment_cashflows').delete().eq('id', row.id);
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
        const { error } = await supabase.from('investment_immobilisations').update({
          date: row.date,
          montant: row.montant,
          note: row.note
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_immobilisations').insert({
          investment_id: investmentId,
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
        const { error } = await supabase.from('investment_immobilisations').delete().eq('id', row.id);
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
        const { error } = await supabase.from('investment_valorisations').update({
          date: row.date,
          valeur: row.valeur,
          note: row.note
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_valorisations').insert({
          investment_id: investmentId,
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
        const { error } = await supabase.from('investment_valorisations').delete().eq('id', row.id);
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
        const { error } = await supabase.from('investment_debt_characteristics').update({
          montant_initial: debtCharacteristics.montantInitial,
          duree_mois: debtCharacteristics.dureeMois,
          taux: debtCharacteristics.taux,
          type: debtCharacteristics.type,
          amortissement_annuel: debtCharacteristics.amortissementAnnuel
        }).eq('id', debtCharacteristics.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_debt_characteristics').insert({
          investment_id: investmentId,
          user_id: user?.id,
          montant_initial: debtCharacteristics.montantInitial,
          duree_mois: debtCharacteristics.dureeMois,
          taux: debtCharacteristics.taux,
          type: debtCharacteristics.type,
          amortissement_annuel: debtCharacteristics.amortissementAnnuel
        });
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
        const { error } = await supabase.from('investment_debt_flows').update({
          date: row.date,
          capital_debut: row.capitalDebut,
          rmbt_capital: row.rmbtCapital,
          rmbt_interet: row.rmbtInteret
        }).eq('id', row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('investment_debt_flows').insert({
          investment_id: investmentId,
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
        const { error } = await supabase.from('investment_debt_flows').delete().eq('id', row.id);
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

  return <div className="space-y-6">
      
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
              {/* Graphique en premier sur mobile */}
              <div className="mb-6">
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

              {/* Tableau en dessous sur mobile */}
              <div className="w-full">
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
                           <TableHead className="text-xs text-center min-w-[80px]">XIRR glissant</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                          {getSyntheseData().map((row, index) => {
                             // ... keep existing code
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
                               <TableCell className={`financial-value font-medium text-xs text-center ${gain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                                 {gain1 >= 0 ? '+' : ''}{formatCurrency(gain1)}
                               </TableCell>
                               <TableCell className={`financial-value font-medium text-xs text-center ${gain2 >= 0 ? 'text-success' : 'text-destructive'}`}>
                                 {gain2 >= 0 ? '+' : ''}{formatCurrency(gain2)}
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
            </div>

            {/* Version desktop - côte à côte */}
            <div className="hidden lg:flex lg:items-start lg:gap-4">
              {/* Graphique - 40% de la largeur */}
              <div className="w-2/5 flex-shrink-0">
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

              {/* Tableau - 60% de la largeur */}
              <div className="w-3/5 flex-shrink-0">
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
                                  <p>NOI ajusté après interet</p>
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
                           <TableCell className={`financial-value text-xs text-center ${gain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {gain1 >= 0 ? '+' : ''}{formatCurrency(gain1)}
                           </TableCell>
                           <TableCell className={`financial-value text-xs text-center ${gain2 >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {gain2 >= 0 ? '+' : ''}{formatCurrency(gain2)}
                           </TableCell>
                           <TableCell className={`financial-value text-xs text-center ${xirrGlissant >= 0 ? 'text-success' : 'text-destructive'}`}>
                             {xirrGlissant.toFixed(1)}%
                           </TableCell>
                         </TableRow>
                       })}
                       {getSyntheseData().length === 0 && <TableRow>
                           <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-xs">
                             Aucune donnée disponible pour la synthèse
                           </TableCell>
                         </TableRow>}
                       {/* Ligne Total */}
                       {getSyntheseData().length > 0 && (() => {
                         const syntheseData = getSyntheseData();
                         
                         // Calculer les totaux pour NOI ajusté, CFNI, CF, Gain1 et Gain2
                         let totalNoi = 0;
                         let totalCfni = 0;
                         let totalCf = 0;
                         let totalGain1 = 0;
                         let totalGain2 = 0;
                         
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
                           
                           totalNoi += ebitda;
                           totalCfni += cfni;
                           totalCf += cf;
                           totalGain1 += gain1;
                           totalGain2 += gain2;
                         });
                         
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
                             <TableCell className="financial-value text-xs text-center">
                               {/* Pas de total pour le rendement net */}
                             </TableCell>
                             <TableCell className={`financial-value font-bold text-xs text-center ${totalCfni >= 0 ? 'text-success' : 'text-destructive'}`}>
                               {totalCfni >= 0 ? '+' : ''}{formatCurrency(totalCfni)}
                             </TableCell>
                             <TableCell className="financial-value text-xs text-center">
                               {/* Pas de total pour le COC net */}
                             </TableCell>
                             <TableCell className={`financial-value font-bold text-xs text-center ${totalCf >= 0 ? 'text-success' : 'text-destructive'}`}>
                               {totalCf >= 0 ? '+' : ''}{formatCurrency(totalCf)}
                             </TableCell>
                             <TableCell className={`financial-value font-bold text-xs text-center ${totalGain1 >= 0 ? 'text-success' : 'text-destructive'}`}>
                               {totalGain1 >= 0 ? '+' : ''}{formatCurrency(totalGain1)}
                             </TableCell>
                             <TableCell className={`financial-value font-bold text-xs text-center ${totalGain2 >= 0 ? 'text-success' : 'text-destructive'}`}>
                               {totalGain2 >= 0 ? '+' : ''}{formatCurrency(totalGain2)}
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
                  <TableHead>Note</TableHead>
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
                  })} className="min-h-[60px]" /> : <div className="max-w-xs truncate">{valo.note}</div>}
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
              {editingDebtCharacteristics ? <Button onClick={saveDebtCharacteristics} size="sm" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </Button> : <Button onClick={() => setEditingDebtCharacteristics(true)} size="sm" variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Montant Initial (€)</label>
                {editingDebtCharacteristics ? <Input type="number" value={debtCharacteristics.montantInitial} onChange={e => setDebtCharacteristics({
                ...debtCharacteristics,
                montantInitial: parseFloat(e.target.value) || 0
              })} /> : <div className="financial-value font-medium text-lg">
                    {formatCurrency(debtCharacteristics.montantInitial)}
                  </div>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Durée (mois)</label>
                {editingDebtCharacteristics ? <Input type="number" value={debtCharacteristics.dureeMois} onChange={e => setDebtCharacteristics({
                ...debtCharacteristics,
                dureeMois: parseInt(e.target.value) || 0
              })} /> : <div className="font-medium text-lg">
                    {debtCharacteristics.dureeMois} mois
                  </div>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Taux (%)</label>
                {editingDebtCharacteristics ? <Input type="number" step="0.01" value={debtCharacteristics.taux} onChange={e => setDebtCharacteristics({
                ...debtCharacteristics,
                taux: parseFloat(e.target.value) || 0
              })} /> : <div className="font-medium text-lg">
                    {formatPercentage(debtCharacteristics.taux)}
                  </div>}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                {editingDebtCharacteristics ? <Select value={debtCharacteristics.type} onValueChange={(value: 'Amortissement constant' | 'Annuité constante') => setDebtCharacteristics({
                ...debtCharacteristics,
                type: value,
                amortissementAnnuel: value === 'Amortissement constant' ? debtCharacteristics.amortissementAnnuel : undefined
              })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Amortissement constant">Amortissement constant</SelectItem>
                      <SelectItem value="Annuité constante">Annuité constante</SelectItem>
                    </SelectContent>
                  </Select> : <div className="font-medium text-lg">
                    {debtCharacteristics.type}
                  </div>}
              </div>
              
              {debtCharacteristics.type === 'Amortissement constant' && <div className="space-y-2">
                  <label className="text-sm font-medium">Amortissement annuel (%)</label>
                  {editingDebtCharacteristics ? <Input type="number" step="0.01" value={debtCharacteristics.amortissementAnnuel || 0} onChange={e => setDebtCharacteristics({
                ...debtCharacteristics,
                amortissementAnnuel: parseFloat(e.target.value) || 0
              })} /> : <div className="font-medium text-lg">
                      {formatPercentage(debtCharacteristics.amortissementAnnuel || 0)}
                    </div>}
                </div>}
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
    </div>;
}