import React, { useMemo } from 'react';
import { useInvestments } from '@/contexts/InvestmentContext';
import { usePerformanceKPIs } from '@/hooks/usePerformanceKPIs';
import { KPICard } from './KPICard';
import { InvestmentChart } from './InvestmentChart';
import { TrendingUp, Euro, Percent, BarChart3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ConsolidatedKPIViewProps {
  selectedInvestments: Set<string>;
}

interface ConsolidatedData {
  fondPropre: number;
  rendementNet: number;
  coc: number;
  xirr: number;
  chartData: Array<{
    date: string;
    fondPropre: number;
    noi: number;
    rendementNet: number;
    cfni: number;
    cocNet: number;
    cashFlow: number;
  }>;
}

function InvestmentKPIData({ investmentId, onDataLoaded }: { investmentId: string; onDataLoaded: (data: any) => void }) {
  const { kpis, loading } = usePerformanceKPIs(investmentId);
  
  React.useEffect(() => {
    if (!loading && kpis) {
      onDataLoaded({
        fondPropre: Number(kpis.fondPropre ?? 0),
        rendementNet: Number(kpis.rendementNet ?? 0),
        coc: Number(kpis.coc ?? 0),
        xirr: Number(kpis.xirr ?? 0),
        noi: Number(kpis.rendementNetDetails?.noi ?? 0),
        cfni: Number(kpis.xirrDetails?.totalCfni ?? 0),
      });
    }
  }, [loading, kpis, onDataLoaded]);
  
  return null;
}

export function ConsolidatedKPIView({ selectedInvestments }: ConsolidatedKPIViewProps) {
  const { investments } = useInvestments();
  const [kpiData, setKpiData] = React.useState<Record<string, any>>({});
  
  const selectedInvestmentsList = useMemo(() => {
    return investments.filter(inv => selectedInvestments.has(inv.id));
  }, [investments, selectedInvestments]);

  const handleKPIDataLoaded = React.useCallback((investmentId: string, data: any) => {
    setKpiData(prev => ({ ...prev, [investmentId]: data }));
  }, []);

  const consolidatedData = useMemo((): ConsolidatedData => {
    const selectedKPIs = Array.from(selectedInvestments).map(id => kpiData[id]).filter(Boolean);
    
    if (selectedKPIs.length === 0) {
      return {
        fondPropre: 0,
        rendementNet: 0,
        coc: 0,
        xirr: 0,
        chartData: []
      };
    }

    const totalFondPropre = selectedKPIs.reduce((sum, kpi) => sum + (kpi.fondPropre || 0), 0);
    const totalNOI = selectedKPIs.reduce((sum, kpi) => sum + (kpi.noi || 0), 0);
    const totalCFNI = selectedKPIs.reduce((sum, kpi) => sum + (kpi.cfni || 0), 0);
    
    // Moyennes pondérées pour les pourcentages
    const avgRendementNet = totalFondPropre > 0 ? (totalNOI / totalFondPropre) * 100 : 0;
    const avgCOC = selectedKPIs.reduce((sum, kpi) => sum + (kpi.coc || 0), 0) / selectedKPIs.length;
    const avgXIRR = selectedKPIs.reduce((sum, kpi) => sum + (kpi.xirr || 0), 0) / selectedKPIs.length;

    // Données pour le tableau synthèse (années 2022-2024)
    const years = ['2022', '2023', '2024'];
    const chartData = years.map(year => ({
      date: `31/12/${year}`,
      fondPropre: totalFondPropre,
      noi: totalNOI,
      rendementNet: avgRendementNet,
      cfni: totalCFNI,
      cocNet: avgCOC,
      cashFlow: totalCFNI
    }));

    return {
      fondPropre: totalFondPropre,
      rendementNet: avgRendementNet,
      coc: avgCOC,
      xirr: avgXIRR,
      chartData
    };
  }, [selectedInvestments, kpiData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (selectedInvestments.size === 0) {
    return (
      <div className="card-financial">
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Aucun investissement sélectionné
          </h3>
          <p className="text-sm text-muted-foreground">
            Veuillez sélectionner au moins un investissement dans la vue tableau pour voir les KPI consolidés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charger les données KPI pour chaque investissement sélectionné */}
      {Array.from(selectedInvestments).map(investmentId => (
        <InvestmentKPIData
          key={investmentId}
          investmentId={investmentId}
          onDataLoaded={(data) => handleKPIDataLoaded(investmentId, data)}
        />
      ))}

      {/* En-tête avec informations consolidées */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vue KPI Consolidée</h2>
          <p className="text-sm text-muted-foreground">
            {selectedInvestments.size} investissement{selectedInvestments.size > 1 ? 's' : ''} sélectionné{selectedInvestments.size > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Fond Propre (2024)"
          value={formatCurrency(consolidatedData.fondPropre)}
          subtitle={`Total consolidé`}
          icon={Euro}
        />
        <KPICard
          title="Rendement Net (2024)"
          value={formatPercentage(consolidatedData.rendementNet)}
          subtitle={`Moyenne pondérée`}
          icon={Percent}
          variant={consolidatedData.rendementNet > 0 ? 'success' : 'default'}
        />
        <KPICard
          title="COC (2024)"
          value={formatPercentage(consolidatedData.coc)}
          subtitle={`Moyenne`}
          icon={TrendingUp}
          variant={consolidatedData.coc > 0 ? 'success' : 'default'}
        />
        <KPICard
          title="XIRR (3Y)"
          value={formatPercentage(consolidatedData.xirr)}
          subtitle={`Moyenne`}
          icon={BarChart3}
          variant={consolidatedData.xirr > 0 ? 'success' : 'default'}
        />
      </div>

      {/* Section Synthèse */}
      <div className="card-financial">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📊 Synthèse Consolidée
          </h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Graphique */}
          <div className="h-64">
            <InvestmentChart />
          </div>
          
          {/* Tableau synthèse */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">FP</TableHead>
                  <TableHead className="text-right">NOI ajusté</TableHead>
                  <TableHead className="text-right">Rendement net</TableHead>
                  <TableHead className="text-right">CFNI</TableHead>
                  <TableHead className="text-right">COC net</TableHead>
                  <TableHead className="text-right">CF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consolidatedData.chartData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.fondPropre)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.noi)}</TableCell>
                    <TableCell className="text-right">{formatPercentage(row.rendementNet)}</TableCell>
                    <TableCell className="text-right financial-value">
                      {row.cfni >= 0 ? '+' : ''}{formatCurrency(row.cfni)}
                    </TableCell>
                    <TableCell className="text-right">{formatPercentage(row.cocNet)}</TableCell>
                    <TableCell className="text-right financial-value">
                      {row.cashFlow >= 0 ? '+' : ''}{formatCurrency(row.cashFlow)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold bg-muted/30">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{formatCurrency(consolidatedData.fondPropre)}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right financial-value">
                    {consolidatedData.chartData.reduce((sum, row) => sum + row.cfni, 0) >= 0 ? '+' : ''}
                    {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cfni, 0))}
                  </TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right financial-value">
                    {consolidatedData.chartData.reduce((sum, row) => sum + row.cashFlow, 0) >= 0 ? '+' : ''}
                    {formatCurrency(consolidatedData.chartData.reduce((sum, row) => sum + row.cashFlow, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}